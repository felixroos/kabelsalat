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
    this.fadeTime = 0.1;
  }

  fadeOutLastUnit() {
    if (this.units.length) {
      this.units[this.units.length - 1].fadeOut(this.playPos, this.fadeTime);
    }
  }

  stop() {
    this.fadeOutLastUnit();
    this.send({
      type: "STOP",
      fadeTime: this.fadeTime,
    });
  }

  /**
   * Update the audio graph given a new compiled unit
   */
  newUnit(schema) {
    const unit = new Unit(schema, this.sampleRate, this.send);
    this.fadeOutLastUnit();

    // create and fade in new unit sample generator
    unit.fadeIn(this.playPos, this.fadeTime);

    // filter out finished units
    this.units = this.units.filter((unit) => unit.getLevel(this.playPos) > 0);

    this.units.push(unit);
    console.log(
      `${schema.ugens.length} ugens spawned, ${this.units.length} units alive`
    );
  }

  /**
   * Parse a message from the main thread
   */
  parseMsg(msg) {
    // let node = "nodeId" in msg ? this.nodes[msg.nodeId] : null;

    switch (msg.type) {
      case "NEW_UNIT":
        this.newUnit(msg.unit);
        break;

      /* case "SET_STATE":
        node.setState(msg.state);
        break; */

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

      case "STOP":
        this.stop();
        break;
      case "SET_UGEN":
        this.addUgen(msg.className, msg.ugen);
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

  /**
   * Generate one [left, right] pair of audio samples
   */
  genSample(inputs) {
    if (!this.units.length) return [0, 0];
    this.playPos += 1 / 44100;

    const sum = [0, 0];
    for (let i = 0; i < this.units.length; i++) {
      const unit = this.units[i];
      const lvl = unit.getLevel(this.playPos);
      const channels = unit.genSample(this.playPos, unit.nodes, inputs, lvl);
      sum[0] += channels[0];
      sum[1] += channels[1];
    }
    return sum;
  }
  addUgen(className, implementation) {
    const nodeClass = new Function(`${implementation};return ${className}`)();
    UGENS.set(className, nodeClass);
  }
}

class Unit {
  constructor(schema, sampleRate, send) {
    this.sampleRate = sampleRate;
    this.send = send;
    this.nodes = [];

    for (let i in schema.ugens) {
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
    this.genSample = new Function("time", "nodes", "input", "lvl", schema.src);
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
  fadeIn(time, fadeTime) {
    const fadeStart = time;
    const fadeEnd = time + fadeTime;
    this.getLevel = (t) =>
      lerp((t - fadeStart) / (fadeEnd - fadeStart), 0, 0.3);
  }

  fadeOut(time, fadeTime) {
    const fadeStart = time;
    const fadeEnd = time + fadeTime;
    const fadeFrom = this.getLevel(time);
    this.getLevel = (t) =>
      lerp((t - fadeStart) / (fadeEnd - fadeStart), fadeFrom, 0);
  }
}
