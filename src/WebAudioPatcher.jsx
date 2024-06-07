import { createSignal, onMount } from "solid-js";
import { Patcher } from "./Patcher";

export function WebAudioPatcher(props) {
  const [started, setStarted] = createSignal(false);
  let port2node = (portId) => portId.split(":").slice(0, 2).join(":");
  let ctx,
    audioOutput,
    instances = {};
  onMount(() => {
    ctx = new AudioContext();
    if (ctx) {
      audioOutput = ctx.createGain();
      audioOutput.connect(ctx.destination);
    }
  });

  function setNodeInlet(inlet, value) {
    const [a, b, c] = inlet.split(":");
    const node = `${a}:${b}`;
    const inletName = c;
    const instance = instances[node];
    if (instance?.[inletName]) {
      instance[inletName].value = value;
      // console.log("set", inletName, value);
    } else {
      console.warn(`instance ${instance} has no inlet ${inletName}`);
    }
  }

  function Slider(props) {
    const [value, setValue] = createSignal(props.initialValue ?? 0);
    return (
      <div class="items-end flex flex-col p-2">
        <input
          type="range"
          value={value()}
          onInput={(e) => {
            const next = Number(e.target.value);
            setValue(next);
            const inlet = props.getOutletTarget("n");
            setNodeInlet(inlet, next * 1200);
          }}
          min={props.min ?? 0}
          max={props.max ?? 1}
          step={props.step ?? 0.01}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
        />
        <div>{value().toFixed(2)}</div>
      </div>
    );
  }

  function NumberInput(props) {
    // console.log("Number input", props);
    const [value, setValue] = createSignal(props.state ?? 0);
    const update = (v) => {
      setValue(v);
      const inlet = props.getOutletTarget("n");
      props.onChange(v);
      if (inlet) {
        setNodeInlet(inlet, v);
      }
    };
    return (
      <input
        type="number"
        class="text-xs w-[80px] bg-stone-800 text-white p-0.5"
        value={value()}
        onInput={(e) => update(Number(e.target.value))}
        onKeyDown={(e) => {
          e.stopPropagation();
          e.stopImmediatePropagation();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.stopImmediatePropagation();
        }}
      />
    );
  }

  /* function ConstInput(props) {
    // console.log("Number input", props);
    const [value, setValue] = createSignal(props.state ?? 0);
    const update = (v) => {
      setValue(v);
      const instance = instances[props.node.id];
      if (instance) {
        //instances[props.node.id].offset.value = v;
        instances[props.node.id].gain.value = v;
      } else {
        console.warn("instance not found", props.node.id);
      }
      // const inlet = props.getOutletTarget("n");
      props.onChange(v);
    };
    return (
      <input
        type="number"
        class="text-xs w-[80px] bg-stone-800 text-white p-0.5"
        value={value()}
        onInput={(e) => update(Number(e.target.value))}
        onKeyDown={(e) => {
          e.stopPropagation();
          e.stopImmediatePropagation();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.stopImmediatePropagation();
        }}
      />
    );
  } */

  function osc(type) {
    const osc = ctx.createOscillator();
    osc.frequency.value = 220;
    osc.detune.value = 2;
    osc.type = type;
    osc.start();
    return osc;
  }

  const oscTypes = {
    sine: "sine",
    pulse: "square",
    saw: "sawtooth",
    tri: "triangle",
  };

  function createNode(node) {
    try {
      if (Object.keys(oscTypes).includes(node.type)) {
        instances[node.id] = osc(oscTypes[node.type]);
      } else if (node.type === "gain") {
        instances[node.id] = ctx.createGain();
      } else if (node.type === "lpf") {
        instances[node.id] = ctx.createBiquadFilter();
      } /*  else if (node.type === "const") {
        instances[node.id] = ctx.createGain();
        instances[node.id].gain.value = 0;
      } */ else {
        // console.warn("unhandled node", node);
      }
    } catch (err) {
      console.log("err", err);
    }
  }
  function deleteNode(node) {
    console.log("TODO: delete", node);
  }
  function createConnection(outlet, inlet, nodeState) {
    const fromId = port2node(outlet);
    const toId = port2node(inlet);
    const inletName = inlet.split(":").slice(-1)[0];
    const sourceNode = instances[fromId];
    const isAudioOutput = toId.endsWith(":out");
    const isNumber = fromId.endsWith(":number");
    let destination;
    if (sourceNode && isAudioOutput) {
      console.log(`connect ${fromId} to destination`);
      destination = audioOutput;
      sourceNode.connect(audioOutput);
    } else if (isNumber) {
      console.log(`set ${inlet} to ${nodeState[fromId]}`);
      setNodeInlet(inlet, nodeState[fromId]);
    } else if (sourceNode) {
      destination =
        inletName === "in" ? instances[toId] : instances[toId][inletName];
      console.log("connect", sourceNode, destination);
      sourceNode.connect(destination);
    } else {
      console.warn("unhandled connection", fromId, toId);
    }
  }

  function deleteConnection([outlet, inlet]) {
    console.log("disconnect", outlet, inlet);
    const fromId = port2node(outlet);
    const toId = port2node(inlet);
    const inletName = inlet.split(":").slice(-1)[0];
    const sourceNode = instances[fromId];
    if (sourceNode) {
      sourceNode.disconnect();
    }
  }
  return (
    <Patcher
      height={props.height}
      onStart={() => {
        ctx.resume();
        setStarted(true);
      }}
      init={props.init}
      onCreateNode={createNode}
      onDeleteNode={deleteNode}
      onConnect={createConnection}
      onDisconnect={deleteConnection}
      nodeTypes={[
        {
          type: "number",
          render: NumberInput,
          outlets: [{ name: "n" }],
        },
        /* {
            type: "const",
            render: ConstInput,
            outlets: [{ name: "~" }],
          }, */
        {
          type: "sine",
          inlets: [{ name: "frequency" }, { name: "detune" }],
          outlets: [{ name: "~" }],
        },
        {
          type: "saw",
          inlets: [{ name: "frequency" }, { name: "detune" }],
          outlets: [{ name: "~" }],
        },
        {
          type: "tri",
          inlets: [{ name: "frequency" }, { name: "detune" }],
          outlets: [{ name: "~" }],
        },
        {
          type: "pulse",
          inlets: [{ name: "frequency" }, { name: "detune" }],
          outlets: [{ name: "~" }],
        },
        {
          type: "gain",
          inlets: [{ name: "in" }, { name: "gain" }],
          outlets: [{ name: "~" }],
        },
        {
          type: "lpf",
          inlets: [{ name: "in" }, { name: "frequency" }, { name: "Q" }],
          outlets: [{ name: "~" }],
        },
        {
          type: "out",
          inlets: [{ name: "destination" }],
        },
      ]}
      menu={
        <button
          class="text-white"
          onClick={() => {
            if (!started()) {
              setStarted(true);
              audioOutput.gain.value = 1;
            } else {
              setStarted(false);
              audioOutput.gain.value = 0;
            }
          }}
        >
          {started() ? "stop" : "start"}
        </button>
      }
    />
  );
}

/* noisecraft nodes:

- [ ] add
- [ ] sub
- [ ] mul
- [ ] div
- [ ] mod
- [ ] const
- [ ] equal
- [ ] greater

- [ ] adsr
- [ ] audioout

- [ ] clock
- [ ] clockdiv
- [ ] clockout

- [ ] delay
- [ ] distort
- [ ] filter
- [ ] fold

- [ ] gateseq
- [ ] monoseq

- [ ] hold
- [ ] knob
- [ ] midin
- [ ] nop
- [ ] notes

- [x] sine
- [x] saw
- [x] tri
- [x] pulse, todo: pw
- [ ] noise

- [ ] scope
- [ ] slide */
