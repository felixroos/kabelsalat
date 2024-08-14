import { Eventable } from "./eventable";

export class MIDI extends Eventable {
  constructor(_navigator = navigator) {
    super();

    this.midiAccess = null;

    // Try to get MIDI access
    this.getMIDIAccess(_navigator);
  }

  // Try to get MIDI access from the browser
  async getMIDIAccess(_navigator) {
    // If MIDI is not supported by this browser
    if (!("requestMIDIAccess" in _navigator)) return;

    this.midiAccess = await _navigator.requestMIDIAccess({ sysex: false });

    console.log("got MIDI access");

    // For each MIDI input
    for (let input of this.midiAccess.inputs.values()) {
      if (input.state != "connected") continue;

      input.onmidimessage = (e) =>
        this.trigger("midimessage", input.id, e.data);
    }

    // Detect new devices being connected
    this.midiAccess.onstatechange = (evt) => {
      if (evt.port.type == "input" && evt.port.state == "connected") {
        console.log(
          "MIDI device connected:",
          evt.port.name,
          "PORT:",
          evt.port.id,
        );

        evt.port.onmidimessage = (e) =>
          this.trigger("midimessage", evt.port.id, e.data);
      }
    };
  }

  // Send a message to all MIDI devices
  broadcast(msg, timestamp) {
    if (!midi) return;

    for (let output of this.midiAccess.outputs.values())
      output.send(msg, timestamp);
  }
}

export function parseMidiMessage(msg) {
  let msgType = msg[0] & 0xf0;
  let channel = (msg[0] & 0x0f) + 1;

  // MIDI control change
  if (msgType == 0xb0 && msg.length == 3) {
    let cc = msg[1];
    let val = msg[2];
    let value = (val / 127) * 2 - 1; // to bipolar
    return { type: "CC", channel, cc, value };
  }

  // MIDI pitch bend
  if (msgType == 0xe0 && msg.length == 3) {
    let lsb = msg[1];
    let msb = msg[2];
    let val = (msb << 7) | lsb;
    let value = (val / 16383) * 2 - 1; // to bipolar
    return { type: "PITCHBEND", channel, value };
  }
  // Note on
  if (msgType == 0x90 && msg.length == 3) {
    let note = msg[1];
    let velocity = msg[2];
    return { type: "NOTE_ON", channel, note, velocity };
  }

  // Note off
  if (msgType == 0x80 && msg.length == 3) {
    let note = msg[1];
    return { type: "NOTE_ON", channel, note, velocity: 0 };
  }
}
