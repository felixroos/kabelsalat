import { assert, lerp } from "./utils.js";
import * as UGENS from "./ugens.js";

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

    // Stateful audio processing nodes, indexed by nodeId
    this.nodes = [];

    this.generators = [];

    this.fadeTime = 0.1;
  }

  fadeOut(generator = this.generators[this.generators.length - 1]) {
    if (!generator) {
      return;
    }
    const fadeStart = this.playPos;
    const fadeEnd = this.playPos + this.fadeTime;
    const fadeFrom = generator.getLevel();
    generator.getLevel = () =>
      lerp((this.playPos - fadeStart) / (fadeEnd - fadeStart), fadeFrom, 0);
  }

  fadeIn(generator) {
    const fadeStart = this.playPos;
    const fadeEnd = this.playPos + this.fadeTime;
    generator.getLevel = () =>
      lerp((this.playPos - fadeStart) / (fadeEnd - fadeStart), 0, 0.3);
  }

  stop() {
    this.fadeOut();
    this.send({
      type: "STOP",
      fadeTime: this.fadeTime,
    });
  }

  /**
   * Update the audio graph given a new compiled unit
   */
  newUnit(unit) {
    // Note that we don't delete any nodes, even if existing nodes are
    // currently not listed in the compiled unit, because currently
    // disconnected nodes may get reconnected, and deleting things like
    // delay lines would lose their current state.
    // All nodes get garbage collected when the playback is stopped.
    const types = unit.ugens;
    for (let i in types) {
      if (types[i] in UGENS) {
        const nodeClass = UGENS[types[i]];
        const index = Number(i) + Number(unit.ugenOffset);
        // TODO node reuse / graph diffing whatever / only create nodes that are not already created..
        this.nodes[index] = new nodeClass(
          index,
          {},
          this.sampleRate,
          this.send
        );
        // console.log("node", this.nodes[i]);
      } else {
        console.warn(`unknown ugen "${types[i]}"`);
      }
    }
    console.log(
      `${types.length} ugens spawned, ${Object.keys(this.nodes).length} total`
    );

    if (this.generators.length > 0) {
      this.fadeOut();
    }

    // create and fade in new generator
    const generator = new Function("time", "nodes", "input", "lvl", unit.src);
    this.fadeIn(generator);

    // filter out finished generators
    this.generators = this.generators.filter((gen) => gen.getLevel() > 0);
    // console.log("generators", this.generators.length);
    this.generators.push(generator);
  }

  /**
   * Parse a message from the main thread
   */
  parseMsg(msg) {
    let node = "nodeId" in msg ? this.nodes[msg.nodeId] : null;

    switch (msg.type) {
      case "NEW_UNIT":
        this.newUnit(msg.unit);
        break;

      case "SET_STATE":
        node.setState(msg.state);
        break;

      case "NOTE_ON":
        this.noteOn(msg);
        break;

      case "CC":
        this.midiCC(msg);
        break;

      case "FADE_TIME":
        this.fadeTime = Number(msg.fadeTime);
        break;

      case "STOP":
        this.stop();
        break;

      default:
        throw new TypeError(`unknown message type ${msg.type}`);
    }
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

  /**
   * Generate one [left, right] pair of audio samples
   */
  genSample(inputs) {
    if (!this.generators.length) return [0, 0];
    this.playPos += 1 / 44100;

    const sum = [0, 0];
    for (let i = 0; i < this.generators.length; i++) {
      const gen = this.generators[i];
      const lvl = gen.getLevel();
      const channels = gen(this.playPos, this.nodes, inputs, lvl);
      sum[0] += channels[0];
      sum[1] += channels[1];
    }
    return sum;
  }
}
