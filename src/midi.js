import { assert } from "./utils.js";

export class Eventable {
  constructor() {
    this._events = {};
  }

  on(eventName, handler) {
    if (!this._events[eventName]) {
      this._events[eventName] = [];
    }

    let handlers = this._events[eventName];
    assert(handlers.indexOf(handler) == -1);
    handlers.push(handler);
  }

  removeListener(eventName, handler) {
    let handlers = this._events[eventName];
    let idx = handlers.indexOf(handler);

    if (idx != -1) {
      handlers.splice(idx, 1);
      //console.log('spliced listener', handler.name)
      //console.log('handlers.length=', handlers.length)
    }
  }

  trigger(eventName, ...eventArgs) {
    let handlers = this._events[eventName] || [];

    for (let i = 0; i < handlers.length; i++) {
      handlers[i].apply(null, eventArgs);
    }
  }
}

export class MIDI extends Eventable {
  constructor() {
    super();

    this.midiAccess = null;

    // Try to get MIDI access
    this.getMIDIAccess();
  }

  // Try to get MIDI access from the browser
  async getMIDIAccess() {
    // If MIDI is not supported by this browser
    if (!("requestMIDIAccess" in navigator)) return;

    this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });

    console.log("got MIDI access");

    // For each MIDI input
    for (let input of this.midiAccess.inputs.values()) {
      if (input.state != "connected") continue;

      console.log(input.name);

      input.onmidimessage = this.makeMessageCb(input.id);
    }

    // Detect new devices being connected
    this.midiAccess.onstatechange = (evt) => {
      if (evt.port.type == "input" && evt.port.state == "connected") {
        console.log(
          "new device connected:",
          evt.port.name,
          "PORT:",
          evt.port.id
        );

        evt.port.onmidimessage = this.makeMessageCb(evt.port.id);
      }
    };
  }

  // Create an onmidimessage callback for an input port
  makeMessageCb(deviceId) {
    // Callback when a MIDI message is received
    function onMidiMessage(evt) {
      var str = "";
      for (var i = 0; i < evt.data.length; i++) {
        str += "0x" + evt.data[i].toString(16) + " ";
      }
      // console.log(str);

      // Send the device name and the data to callbacks
      this.trigger("midimessage", deviceId, evt.data);
    }

    return onMidiMessage.bind(this);
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
  let inChan = (msg[0] & 0x0f) + 1;

  // Note on
  if (msgType == 0x90 && msg.length == 3) {
    let noteNo = msg[1];
    let vel = msg[2];
    return [inChan, noteNo, vel];
  }

  // Note off
  if (msgType == 0x80 && msg.length == 3) {
    let noteNo = msg[1];
    return [inChan, noteNo, 0];
  }
}
