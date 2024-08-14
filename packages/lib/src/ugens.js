import * as synth from "./synth.js";
import { assert } from "./utils.js";

const ISR = 1 / 44100;

/**
MIDI clock pulses per quarter note
*/
export const CLOCK_PPQ = 24;

/**
MIDI clock pulses per 16th note
*/
export const CLOCK_PPS = CLOCK_PPQ / 4;

/**
 * Base class for stateful audio processing nodes
 */
export class AudioNode {
  constructor(id, state, sampleRate, send) {
    this.nodeId = id;
    this.state = state;
    this.sampleRate = sampleRate;
    this.sampleTime = 1 / sampleRate;
    this.send = send;
  }

  /**
   * Set/update the entire state for this node
   */
  setState(state) {
    this.state = state;
  }
}

/**
 * ADSR envelope
 */
export class ADSRNode extends AudioNode {
  constructor(id, state, sampleRate, send) {
    super(id, state, sampleRate, send);
    this.env = new synth.ADSREnv();
  }

  update(time, gate, attack, decay, susVal, release) {
    return this.env.eval(time, gate, attack, decay, susVal, release);
  }
}

/**
 * Clock source, with tempo in BPM
 */
export class Clock extends AudioNode {
  constructor(id, state, sampleRate, send) {
    super(id, state, sampleRate, send);
    this.phase = 0;
  }

  update(bpm) {
    let freq = (CLOCK_PPQ * bpm) / 60;
    let duty = 0.5;
    this.phase += this.sampleTime * freq;
    let cyclePos = this.phase % 1;

    // Note that the clock starts high so that it will
    // trigger immediately upon starting
    return cyclePos < duty ? 1 : -1;
  }
}

/**
 * Clock signal divider
 */
export class ClockDiv extends AudioNode {
  constructor(id, state, sampleRate, send) {
    super(id, state, sampleRate, send);

    // Last clock sign at the input (positive/negative)
    this.inSgn = true;

    // Current clock sign at the output (positive/negative)
    // We start high to trigger immediately upon starting,
    // just like the Clock node
    this.outSgn = true;

    // Number of input ticks since the last output tick
    this.clockCnt = 0;
  }

  // update(clock) // <- og
  update(clock, factor) {
    // Current clock sign at the input
    let curSgn = clock > 0;

    // If the input clock sign just flipped
    if (this.inSgn != curSgn) {
      // Count all edges, both rising and falling
      this.clockCnt++;

      // If we've reached the division factor
      // if (this.clockCnt >= factor) // <- og
      if (this.clockCnt >= factor) {
        // Reset the clock count
        this.clockCnt = 0;

        // Flip the output clock sign
        this.outSgn = !this.outSgn;
      }
    }

    this.inSgn = curSgn;

    return this.outSgn ? 1 : -1;
  }
}

/**
 * Clock output node
 */
export class ClockOut extends AudioNode {
  constructor(id, state, sampleRate, send) {
    super(id, state, sampleRate, send);

    // Last clock sign at the input (positive/negative)
    this.inSgn = false;
  }

  update(time, clock) {
    // Current clock sign at the input
    let curSgn = clock > 0;

    // If the input clock sign just went positive (rising edge)
    if (curSgn && this.inSgn != curSgn) {
      // Send a clock pulse back to the main thread
      this.send({
        type: "CLOCK_PULSE",
        nodeId: this.nodeId,
        time: time,
      });
    }

    this.inSgn = curSgn;
    return 0; // <-- added this
  }
}

/**
 * Delay line node
 */
const delays = new Map();
export class Delay extends AudioNode {
  constructor(id, state, sampleRate, send) {
    super(id, state, sampleRate, send);

    const _id = state.inputs[2];
    if (_id && delays.has(_id)) {
      this.delay = delays.get(_id).clone();
    } else {
      this.delay = new synth.Delay(sampleRate);
    }
    if (_id) {
      delays.set(_id, this.delay);
    }
  }
  // og noisecraft splits nodes here, but it seems to work..
  update(input, time) {
    this.delay.write(input, time);
    return this.delay.read();
  }
}

/**
 * Overdrive-style distortion
 */
export class Distort extends AudioNode {
  constructor(id, state, sampleRate, send) {
    super(id, state, sampleRate, send);
  }

  update(input, amount) {
    return synth.distort(input, amount);
  }
}

/**
 * Sample and hold
 */
export class Hold extends AudioNode {
  constructor(id, state, sampleRate, send) {
    super(id, state, sampleRate, send);

    // Value currently being held
    this.value = 0;

    // Current trig input sign (positive/negative)
    this.trigSgn = false;
  }

  write(value, trig) {
    if (!this.trigSgn && trig > 0) this.value = value;

    this.trigSgn = trig > 0;
  }

  read() {
    return this.value;
  }

  update(input, trig) {
    // in the oh noisecraft, hold is split into 2 intermediate nodes, not sure why.. (same as delay)
    this.write(input, trig);
    return this.read();
  }
}

export class Feedback extends AudioNode {
  constructor(id, state, sampleRate, send) {
    super(id, state, sampleRate, send);
    this.value = 0;
  }
  write(value) {
    this.value = value;
    return 0;
  }

  update() {
    return this.value;
  }
}

/**
 * White noise source
 */

export class NoiseOsc {
  update() {
    return Math.random() * 2 - 1;
  }
}

/**
 * Dust
 */

export class DustOsc {
  update(density) {
    return Math.random() < density * ISR ? Math.random() : 0;
  }
}

/**
 * Brown noise source
 */

export class BrownNoiseOsc {
  constructor() {
    this.out = 0;
  }
  update() {
    let white = Math.random() * 2 - 1;
    this.out = (this.out + 0.02 * white) / 1.02;
    return this.out;
  }
}

/**
 * Pink noise source
 */

export class PinkNoise {
  constructor() {
    this.b0 = 0;
    this.b1 = 0;
    this.b2 = 0;
    this.b3 = 0;
    this.b4 = 0;
    this.b5 = 0;
    this.b6 = 0;
  }

  update() {
    const white = Math.random() * 2 - 1;

    this.b0 = 0.99886 * this.b0 + white * 0.0555179;
    this.b1 = 0.99332 * this.b1 + white * 0.0750759;
    this.b2 = 0.969 * this.b2 + white * 0.153852;
    this.b3 = 0.8665 * this.b3 + white * 0.3104856;
    this.b4 = 0.55 * this.b4 + white * 0.5329522;
    this.b5 = -0.7616 * this.b5 - white * 0.016898;

    const pink =
      this.b0 +
      this.b1 +
      this.b2 +
      this.b3 +
      this.b4 +
      this.b5 +
      this.b6 +
      white * 0.5362;
    this.b6 = white * 0.115926;

    return pink * 0.11;
  }
}

export class ImpulseOsc extends AudioNode {
  constructor(id, state, sampleRate, send) {
    super(id, state, sampleRate, send);
    this.phase = 1;
  }

  update(freq) {
    this.phase += this.sampleTime * freq;
    let v = this.phase >= 1 ? 1 : 0;
    this.phase = this.phase % 1;
    return v;
  }
}

/**
 * Pulse wave oscillator
 */
export class PulseOsc extends AudioNode {
  constructor(id, state, sampleRate, send) {
    super(id, state, sampleRate, send);

    this.phase = 0;
  }

  update(freq, duty) {
    this.phase += this.sampleTime * freq;
    let cyclePos = this.phase % 1;
    return cyclePos < duty ? 1 : -1;
  }
}

/**
 * Sawtooth wave oscillator
 */
export class SawOsc extends AudioNode {
  constructor(id, state, sampleRate, send) {
    super(id, state, sampleRate, send);

    // Current time position
    this.phase = 0;
  }

  update(freq) {
    this.phase += this.sampleTime * freq;
    return (this.phase % 1) * 2 - 1;
  }
}

/**
 * Sine wave oscillator
 */
export class SineOsc extends AudioNode {
  constructor(id, state, sampleRate, send) {
    super(id, state, sampleRate, send);

    // Current time position
    this.phase = 0;

    // Current sync input sign (positive/negative)
    this.syncSgn = false;
  }

  update(freq, sync, phaseOffset) {
    if (!this.syncSgn && sync > 0) this.phase = 0;

    this.syncSgn = sync > 0;

    let cyclePos = (this.phase + phaseOffset) % 1;
    this.phase += this.sampleTime * freq;

    return Math.sin(cyclePos * 2 * Math.PI);
  }
}

export class SidechainCompressor {
  dBToLinear(dB) {
    return Math.pow(10, dB / 20);
  }

  linearToDB(linear) {
    return 20 * Math.log10(linear);
  }

  update(input, threshold, ratio) {
    let inputDB = this.linearToDB(Math.abs(input));
    let reductionDB = 0;

    if (inputDB > threshold) {
      reductionDB = (inputDB - threshold) * (1 - 1 / ratio);
    }
    return this.dBToLinear(-reductionDB);
  }
}

/**
 * Triangle wave oscillator
 */
export class TriOsc extends AudioNode {
  constructor(id, state, sampleRate, send) {
    super(id, state, sampleRate, send);

    // Current time position
    this.phase = 0;
  }

  update(freq) {
    this.phase += this.sampleTime * freq;
    let cyclePos = this.phase % 1;

    // Compute a value between 0 and 1
    let normVal = cyclePos < 0.5 ? 2 * cyclePos : 1 - 2 * (cyclePos - 0.5);

    return normVal * 2 - 1;
  }
}

/**
 * Scope to plot incoming signals
 */
/* class Scope extends AudioNode
{
    constructor(id, state, sampleRate, send)
    {
        super(id, state, sampleRate, send);

        const SEND_SIZE = NODE_SCHEMA.Scope.sendSize;
        const SEND_RATE = NODE_SCHEMA.Scope.sendRate;

        // How often to gather samples
        this.sampleInterv = sampleRate / (SEND_SIZE * SEND_RATE);
        assert (isPosInt(this.sampleInterv));

        // Buffer of samples to be send
        this.buffer = new Array(SEND_SIZE);

        // How many samples we've seen in total
        this.numSamples = 0;

        // How many samples we have ready to send
        this.numReady = 0;
    }

    update(inVal)
    {
        if (this.numSamples % this.sampleInterv == 0)
        {
            this.buffer[this.numReady] = inVal;
            this.numReady++;

            if (this.numReady == this.buffer.length)
            {
                // Send the current step back to the main thread
                this.send({
                    type: 'SEND_SAMPLES',
                    nodeId: this.nodeId,
                    samples: this.buffer
                });

                this.numReady = 0;
            }
        }

        this.numSamples++;
    }
} */

export class Lag {
  constructor() {
    this.lagUnit = 4410; // 60dB per second (maybe?)
    // Current state
    this.s = 0;
  }

  update(input, rate) {
    // Remap so the useful range is around [0, 1]
    rate = rate * this.lagUnit;
    if (rate < 1) rate = 1;
    this.s += (1 / rate) * (input - this.s);
    return this.s;
  }
}

export class Slew {
  constructor() {
    this.last = 0;
  }

  update(input, up, dn) {
    const upStep = up * ISR;
    const downStep = dn * ISR;

    let delta = input - this.last;
    if (delta > upStep) {
      delta = upStep;
    } else if (delta < -downStep) {
      delta = -downStep;
    }
    this.last += delta;
    return this.last;
  }
}

/**
 * Slide/portamento node
 */
export class Slide extends AudioNode {
  constructor(id, state, sampleRate, send) {
    super(id, state, sampleRate, send);

    // Current state
    this.s = 0;
  }

  update(input, rate) {
    // Remap so the useful range is around [0, 1]
    rate = rate * 1000;

    if (rate < 1) rate = 1;

    this.s += (1 / rate) * (input - this.s);

    return this.s;
  }
}

/**
 * Two-pole low-pass filter
 */
export class Filter extends AudioNode {
  constructor(id, state, sampleRate, send) {
    super(id, state, sampleRate, send);

    this.filter = new synth.TwoPoleFilter();
  }

  update(input, cutoff, reso) {
    this.filter.apply(input, cutoff, reso);
    return this.filter.s1;
  }
}
export class BPF extends AudioNode {
  constructor(id, state, sampleRate, send) {
    super(id, state, sampleRate, send);
    this.filter = new synth.TwoPoleFilter();
  }

  update(input, cutoff, reso) {
    this.filter.apply(input, cutoff, reso);
    return this.filter.s0;
  }
}

/**
 * Wavefolder
 */
export class Fold extends AudioNode {
  /**
   * I create a new Wavefold node.
   *
   * @param  {Number}  id - id of this node
   * @param  {Object}  state - initial state
   * @param  {Number}  sampleRate - audio sample rate
   * @param  {Function}  send - event handler
   */
  constructor(id, state, sampleRate, send) {
    super(id, state, sampleRate, send);
    // redundant ctor
  }

  /**
   * Distort incoming audio signal by "folding".
   *
   * <blockquote style="background-color:whitesmoke">
   *  assume x is <em>[input]</em> and amp is <em>[rate]</em>
   *  <pre>
   *    f(x) = x * amp
   *    g(x) = 4(abs(0.25x+0.25-round(0.25x+0.25))-0.25)
   *    g(f(x)) => out
   *  </pre>
   * </blockquote>
   * See {@link  https://www.keithmcmillen.com/blog/simple-synthesis-part-8-wavefolding/}
   * and {@link https://jatinchowdhury18.medium.com/complex-nonlinearities-episode-6-wavefolding-9529b5fe4102}
   *
   * @param  {Sample}  input - signal
   * @param  {PositiveReal}  rate - amplitude of fold
   * @returns  {Sample}
   */
  update(input, rate) {
    // Make it so rate 0 means input unaltered because
    // NoiseCraft knobs default to the [0, 1] range
    if (rate < 0) rate = 0;
    rate = rate + 1;

    input = input * rate;
    return (
      4 *
      (Math.abs(0.25 * input + 0.25 - Math.round(0.25 * input + 0.25)) - 0.25)
    );
  }
}

export class AudioIn extends AudioNode {
  update(input) {
    return input;
  }
}

export class MidiIn extends AudioNode {
  constructor(id, state, sampleRate, send) {
    super(id, state, sampleRate, send);

    // Current note being held
    this.note = 0;

    // Frequency of the note being held
    this.freq = 0;

    // Current gate state
    this.gateState = "off";
    this.type = "midiin";
    this.channel = -1;
  }

  isFree() {
    return this.gateState === "off";
  }

  noteOn(note, velocity) {
    if (velocity > 0) {
      this.note = note;
      this.freq = 2 ** ((note - 69) / 12) * 440;
      this.gateState = "pretrig";
    } else {
      this.noteOff();
    }
  }
  noteOff() {
    this.note = 0;
    this.gateState = "off";
  }

  getGate() {
    // The pretrig state serves to force the gate to go to
    // zero for at least one cycle so that ADSR envelopes
    // can be retriggered if already active.
    switch (this.gateState) {
      case "pretrig":
        this.gateState = "on";
        return 0;

      case "on":
        return 1;

      case "off":
        return 0;

      default:
        assert(false);
    }
  }

  getFreq() {
    switch (this.gateState) {
      case "pretrig":
        this.gateState = "on";
        return 0;

      case "on":
        return this.freq;

      case "off":
        return this.freq;

      default:
        assert(false);
    }
  }
}

/**
 * Midi input node with freq and gate outputs
 */
export class MidiGate extends MidiIn {
  constructor(id, state, sampleRate, send) {
    super(id, state, sampleRate, send);
    this.type = "midigate";
  }
  update(channel) {
    this.channel = channel;
    return this.getGate();
  }
}

export class MidiFreq extends MidiIn {
  constructor(id, state, sampleRate, send) {
    super(id, state, sampleRate, send);
    this.type = "midifreq";
  }
  update(channel) {
    this.channel = channel;
    return this.getFreq();
  }
}

export class CC extends AudioNode {
  constructor(id, state, sampleRate, send) {
    super(id, state, sampleRate, send);
    this.type = "cc";
    // the following line doesn't work for strings
    // ..which is why the id is passed in update (for now?)
    // theoretically, this means control changes will be ignored before for the first audio frame
    // ..which should be negligible
    // also, using state.inputs is generally a bit ugly..
    // this.id = state.inputs[0];
    this.value = state.inputs[1] ?? 0;
  }
  setValue(value) {
    this.value = value;
  }
  update(id) {
    this.id = id;
    return this.value;
  }
}

export class MidiCC extends AudioNode {
  constructor(id, state, sampleRate, send) {
    super(id, state, sampleRate, send);
    this.type = "midicc";
    this.value = -1;
    this.channel = -1;
    this.ccnumber = -1;
  }
  setValue(value) {
    this.value = value;
  }
  update(ccnumber, channel) {
    this.ccnumber = ccnumber;
    this.channel = channel;
    return this.value;
  }
}

// removed: Sequencer, MonoSeq, GateSeq

/**
 * Sequence of Signals (new)
 */
export class Sequence extends AudioNode {
  constructor(id, state, sampleRate, send) {
    super(id, state, sampleRate, send);
    this.clockSgn = true;
    this.step = 0;
    this.first = true;
  }
  // TODO: use CLOCK_PPS to get correct tempo...
  update(clock, ...ins) {
    if (!this.clockSgn && clock > 0) {
      this.step = (this.step + 1) % ins.length;
      this.clockSgn = clock > 0;
      return 0; // set first sample to zero to retrigger gates on step change...
    }
    this.clockSgn = clock > 0;
    return ins[this.step];
  }
}
