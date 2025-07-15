import { assert, lerp } from "./utils.js";
import * as ugens from "./ugens.js";

const UGENS = new Map(Object.entries(ugens));

/**
 * Stateful graph that generates audio samples
 */
export class AudioGraph {
  constructor(sampleRate, send) {
    assert(sampleRate == 44100);
    this.sampleRate = sampleRate;

    // Current playback position in seconds
    this.playPos = 0;

    // Method to send messages to the main thread
    this.send = send;
    this.units = [];
    this.unitID = 0;
    this.fadeTime = 0.5;
    this.maxUnits = 1;
    this.q = []; // scheduler queue
  }

  fadeOutUnit(unit) {
    unit.fadeOut(this.playPos, this.fadeTime);
    this.freeUnit(unit.id, this.fadeTime);
  }
  fadeOutUnitById(id) {
    const unit = this.units.find((unit) => unit.id === id);
    if (unit) {
      this.fadeOutUnit(unit);
    }
  }
  fadeOutAllUnits() {
    this.units.forEach((unit) => this.fadeOutUnit(unit));
  }
  fadeOutOldUnits() {
    const activeUnits = this.units.filter((unit) => unit.active);
    const toCut = activeUnits.length - this.maxUnits;
    if (toCut <= 0) {
      return;
    }
    activeUnits.slice(0, toCut).forEach((unit) => this.fadeOutUnit(unit));
  }

  stop() {
    this.fadeOutAllUnits();
    this.send({
      type: "STOP",
      fadeTime: this.fadeTime,
    });
  }

  /**
   * Update the audio graph given a new compiled unit
   */
  spawnUnit(schema, duration) {
    // create and fade in new unit sample generator
    const unit = new Unit(this.unitID++, schema, this.sampleRate, this.send);
    this.units.push(unit);
    unit.fadeIn(this.playPos, this.fadeTime);

    this.fadeOutOldUnits();
    // with ${schema.ugens.length} ugens
    console.log(`spawn unit ${unit.id}, units alive: ${this.units.length}`);
    if (duration) {
      this.scheduleMessage({
        msg: { type: "FADE_OUT_UNIT", id: unit.id },
        time: duration,
      });
    }
  }

  freeUnit(id, timeout) {
    if (timeout) {
      this.scheduleMessage({
        msg: { type: "FREE_UNIT", id },
        time: timeout,
      });
      return;
    }
    const lenBefore = this.units.length;
    this.units = this.units.filter((unit) => unit.id !== id);
    if (lenBefore > this.units.length) {
      console.log(`free unit ${id}, units alive: ${this.units.length}`);
    }
  }

  /**
   * Parse a message from the main thread
   */
  parseMsg(msg) {
    // let node = "nodeId" in msg ? this.nodes[msg.nodeId] : null;

    switch (msg.type) {
      case "SPAWN_UNIT":
        this.spawnUnit(msg.unit, msg.duration);
        break;
      case "FREE_UNIT":
        this.freeUnit(msg.id);
        break;
      case "FADE_OUT_UNIT":
        this.fadeOutUnitById(msg.id);
        break;
      case "NOTE_ON":
        this.noteOn(msg);
        break;
      case "CC":
        this.midiCC(msg);
        break;
      case "SET_CONTROL":
        this.setControl(msg);
        break;
      case "FADE_TIME":
        this.fadeTime = Number(msg.fadeTime);
        break;
      case "MAX_UNITS":
        this.maxUnits = Number(msg.maxUnits);
        break;
      case "STOP":
        this.stop();
        break;
      case "SET_UGEN":
        this.addUgen(msg.className, msg.ugen);
        break;
      case "SCHEDULE_MSG":
        this.scheduleMessage(msg);
        break;
      case "BATCH_MSG":
        msg.messages.forEach((msg) => this.parseMsg(msg));
        break;
      default:
        throw new TypeError(`unknown message type ${msg.type}`);
    }
  }

  noteOn(msg) {
    this.units.forEach((unit) => unit.noteOn(msg));
  }

  midiCC(msg) {
    this.units.forEach((unit) => unit.midiCC(msg));
  }

  setControl(msg) {
    this.units.forEach((unit) => unit.setControl(msg));
  }

  // scheduledMessage: {msg, time}
  scheduleMessage(msg) {
    msg.time = this.playPos + msg.time;
    if (!this.q.length) {
      // if empty, just push
      this.q.push(msg);
      return;
    }
    // not empty
    // find index where msg.time fits in
    let i = 0;
    while (i < this.q.length && this.q[i].time < msg.time) {
      i++;
    }
    // this ensures q stays sorted by time, so we only need to check q[0]
    this.q.splice(i, 0, msg);
  }

  /**
   * Generate one [left, right] pair of audio samples
   */
  genSample(inputs) {
    while (this.q.length > 0 && this.q[0].time <= this.playPos) {
      // trigger due messages. q is sorted, so we only need to check q[0]
      this.parseMsg(this.q[0].msg);
      this.q.shift();
    }

    if (!this.units.length) return [0, 0];

    const sum = [0, 0];
    for (let i = 0; i < this.units.length; i++) {
      const unit = this.units[i];
      const lvl = unit.getLevel(this.playPos);
      unit.genSample(
        this.playPos,
        unit.nodes,
        inputs,
        unit.registers,
        unit.outputs,
        unit.sources
      );
      sum[0] += unit.outputs[0] * lvl;
      sum[1] += unit.outputs[1] * lvl;
    }
    this.playPos += 1 / 44100;
    return sum;
  }
  addUgen(className, implementation) {
    const nodeClass = new Function(`${implementation};return ${className}`)();
    UGENS.set(className, nodeClass);
  }
}

class Unit {
  constructor(id, schema, sampleRate, send) {
    this.id = id;
    this.sampleRate = sampleRate;
    this.send = send;
    this.nodes = [];
    this.active = true;

    for (let i in schema.ugens) { // TODO: for in is slow?
      const ugen = schema.ugens[i];
      if (UGENS.has(ugen.type)) {
        const nodeClass = UGENS.get(ugen.type);
        const index = Number(i);
        // TODO node reuse / graph diffing whatever / only create nodes that are not already created..
        this.nodes[index] = new nodeClass(
          index,
          ugen,
          this.sampleRate,
          this.send
        );
      } else {
        console.warn(`unknown ugen "${ugen.type}"`);
      }
    }

    // could potentially warn about outputs that have no corresponding inputs and ignore them?
    // initialize empty registers
    this.registers = new Array(schema.registers).fill(0);
    let channels = 16;
    this.outputs = new Array(channels).fill(0);
    this.sources = new Array(channels).fill(0);
    // reset outputs before each sample
    schema.src = "o.fill(0); // reset outputs\n" + schema.src;

    this.genSample = new Function(
      "time",
      "nodes",
      "input",
      "r", // registers
      "o", // outputs
      "s", // sources
      schema.src
    );
  }

  noteOn(msg) {
    const { channel, note, velocity } = msg;
    const midifreqs = this.nodes.filter(
      (node) =>
        node.type === "midifreq" &&
        (node.channel === -1 || node.channel === channel)
    );
    const midigates = this.nodes.filter(
      (node) =>
        node.type === "midigate" &&
        (node.channel === -1 || node.channel === channel)
    );

    if (velocity > 0) {
      // get free voice or steal one
      let freqNode = midifreqs.find((node) => node.isFree()) || midifreqs[0];
      let gateNode = midigates.find((node) => node.isFree()) || midigates[0];
      freqNode?.noteOn(note, velocity);
      gateNode?.noteOn(note, velocity);
    } else {
      midifreqs.find((node) => node.note === note)?.noteOff();
      midigates.find((node) => node.note === note)?.noteOff();
    }
  }

  midiCC(msg) {
    const { channel, cc, value } = msg;
    this.nodes.forEach((node) => {
      if (
        node.type === "midicc" &&
        (node.channel === -1 || node.channel === channel) &&
        node.ccnumber === cc
      ) {
        node.setValue(value);
      }
    });
  }

  setControl(msg) {
    const { value, id } = msg;
    const match = this.nodes.find(
      (node) => node.type === "cc" && node.id === id
    );
    if (match) {
      match.setValue(value);
    }
  }
  getLevel(t) {
    if (this.fadeStart === undefined) {
      return 0;
    }
    if (this.active) {
      return lerp((t - this.fadeStart) / this.fadeTime, 0, 0.3);
    }
    return lerp((t - this.fadeStart) / this.fadeTime, this.fadeFrom, 0);
  }
  fadeIn(time, fadeTime) {
    this.fadeStart = time;
    this.fadeTime = fadeTime;
  }

  fadeOut(time, fadeTime) {
    this.fadeTime = fadeTime;
    this.fadeFrom = this.getLevel(time);
    this.active = false;
    this.fadeStart = time;
  }
  isDone(time) {
    return !this.active && this.getLevel(time) === 0;
  }
}
