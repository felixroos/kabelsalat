import { assert } from "./util.js";

// taken / slightly modified from noisecraft
// https://github.com/maximecb/noisecraft
// LICENSE: GPL-2.0

export class AudioGraph {
  constructor(sampleRate, send) {
    this.sampleRate = sampleRate;

    // Current playback position in seconds
    this.playPos = 0;

    // Compiled code to generate audio samples
    this._genSample = null;

    // Method to send messages to the main thread
    this.send = send;

    // Stateful audio processing nodes, indexed by nodeId
    this.nodes = [];
  }

  /**
   * Parse a message from the main thread
   */
  parseMsg(msg) {
    // console.log("msg", msg);
    switch (msg.type) {
      case "NEW_UNIT":
        this.newUnit(msg.unit);
        break;
    }
  }
  newUnit(unit) {
    for (let nodeId in unit.nodes) {
      let nodeState = unit.nodes[nodeId];

      let nodeClass =
        nodeState.type in NODE_CLASSES
          ? NODE_CLASSES[nodeState.type]
          : AudioNode;
      // If a node with this nodeId is already mapped
      if (this.nodes[nodeId]) {
        let node = this.nodes[nodeId];

        // The existing node must have the same type
        assert(node instanceof nodeClass);

        // Update the node's state
        node.setState(nodeState);
      } else {
        // Create a new audio node
        this.nodes[nodeId] = new nodeClass(
          nodeId,
          nodeState,
          this.sampleRate,
          this.send
        );
      }
    }
    console.log("compiled code");
    console.log(unit.src);
    // Create the sample generation function
    this._genSample = new Function("time", "nodes", unit.src);
  }
  /**
   * Generate one [left, right] pair of audio samples
   */
  genSample() {
    if (!this._genSample) return [0, 0];

    this.playPos += 1 / 44100;
    return this._genSample(this.playPos, this.nodes);
  }
}

/**
 * Base class for stateful audio processing nodes
 */
class AudioNode {
  constructor(id, state, sampleRate, send) {
    this.nodeId = id;
    this.state = state;
    this.params = state.params;
    this.sampleRate = sampleRate;
    this.sampleTime = 1 / sampleRate;
    this.send = send;
  }

  /**
   * Set a parameter value on a given node
   */
  setParam(paramName, value) {
    assert(paramName in this.params);
    this.params[paramName] = value;
  }

  /**
   * Set/update the entire state for this node
   */
  setState(state) {
    this.state = state;
    this.params = state.params;
  }
}

/**
 * Sawtooth wave oscillator
 */
class SawOsc extends AudioNode {
  constructor(id, state, sampleRate, send) {
    super(id, state, sampleRate, send);

    // Current time position
    this.phase = 0;
  }

  update(freq) {
    /* let minVal = this.params.minVal;
    let maxVal = this.params.maxVal; */

    let minVal = -0.5;
    let maxVal = 0.5;
    this.phase += this.sampleTime * freq;
    let cyclePos = this.phase % 1;
    return minVal + cyclePos * (maxVal - minVal);
  }
}

/**
 * Sine wave oscillator
 */
class SineOsc extends AudioNode {
  constructor(id, state, sampleRate, send) {
    super(id, state, sampleRate, send);

    // Current time position
    this.phase = 0;
  }

  update(freq) {
    /* let minVal = this.params.minVal;
    let maxVal = this.params.maxVal; */
    let minVal = -0.5;
    let maxVal = 0.5;

    this.phase += this.sampleTime * freq * 2 * Math.PI;
    let cyclePos = Math.sin(this.phase);
    return minVal + cyclePos * (maxVal - minVal);
  }
}

/**
 * Map of node types to classes
 */
let NODE_CLASSES = {
  /* ADSR: ADSRNode,
  Clock: Clock,
  ClockDiv: ClockDiv,
  ClockOut: ClockOut,
  Delay: Delay,
  Distort: Distort,
  Hold: Hold,
  Noise: NoiseOsc,
  Pulse: PulseOsc, */
  sine: SineOsc,
  saw: SawOsc,
  /* Sine: SineOsc,
  Tri: TriOsc,
  Scope: Scope,
  Slide: Slide,
  Filter: Filter,
  Fold: Fold,
  MidiIn: MidiIn,
  MonoSeq: MonoSeq,
  GateSeq: GateSeq, */
};
