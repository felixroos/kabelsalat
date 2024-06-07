import { createSignal, onCleanup, onMount, createEffect, For } from "solid-js";

export function Patcher(props) {
  /**
   * state
   */
  const [showStart, setShowStart] = createSignal(true);
  const [showDialog, setShowDialog] = createSignal(false);
  const [nodes, setNodes] = createSignal([]);
  const [connections, setConnections] = createSignal([]);
  const [selectedNode, setSelectedNode] = createSignal();
  const [mouseDown, setMouseDown] = createSignal(false);
  const [activePort, setActivePort] = createSignal();
  const isPatching = () => !!activePort();
  const [mousePosition, setMousePosition] = createSignal();
  const state = () => ({
    //activePort: activePort(),
    nodes: nodes().map(({ id, type }) => {
      const [x, y] = nodePositions()[id];
      const state = nodeState()[id];
      return { id, /* type, */ x, y, state };
    }),
    connections: connections(),
  });
  const [nodePositions, setNodePositions] = createSignal({});
  const [nodeState, setNodeState] = createSignal({});
  const getPortId = (node, port) => `${node.id}:${port.name}`;
  let dragPos, nodeContainer;
  const getPortCenter = (portId) => {
    const el = nodeContainer.querySelector(`[data-port="${portId}"]`);
    const { x: xa, y: ya, width, height } = el.getBoundingClientRect();
    const { x: xo, y: yo } = nodeContainer.getBoundingClientRect();
    return [xa - xo + width / 2, ya - yo + height / 2];
  };
  const cables = () => {
    // console.log("render cables");
    let _cables = [];
    if (activePort() && mousePosition()) {
      const [x1, y1] = getPortCenter(activePort());
      const [x2, y2] = mousePosition();
      _cables.push([x1, y1, x2, y2]);
    }
    nodePositions(); // call to update
    connections().forEach((connection) => {
      console.log("connection[0]", connection[0]);
      const [x1, y1] = getPortCenter(connection[0]);
      const [x2, y2] = getPortCenter(connection[1]);
      _cables.push([x1, y1, x2, y2]);
    });
    return _cables;
  };
  createEffect(() => {
    //console.log("call onChangeGraph");
    props.onChangeNodeState?.(nodeState());
  });
  /**
   * actions
   */
  const createNode = (type, [x, y], _id, state) => {
    const template = props.nodeTypes.find((n) => n.type === type);
    const id = _id || `${Date.now()}:${type}`;
    const pos = [x, y];
    const node = { ...template, id };
    setNodePositions({ ...nodePositions(), [id]: pos });
    setNodeState({ ...nodeState(), [id]: state });
    setNodes([...nodes(), node]);
    setShowDialog(false);
    props.onCreateNode?.(node, state);
  };
  const deleteNode = (toDelete) => {
    setSelectedNode(); // unselect
    // unplug all connections from or to the node
    // console.log("delete node");
    setConnections(
      connections().filter((con) => {
        const keep = !con.find((p) => p.startsWith(`${toDelete}:`));
        if (!keep) {
          props.onDisconnect?.(con);
        }
        return keep;
      })
    );
    // delete node
    setNodes(nodes().filter((node) => node.id !== toDelete));
    delete nodePositions()[toDelete];
    setNodePositions({ ...nodePositions() });
    props.onCreateNode?.(toDelete);
  };
  const activatePort = (id, isInlet) => {
    const connection = connections().find((con) => con.includes(id));
    if (isInlet && connection) {
      // break connection when already patched inlet is clicked
      setConnections(
        connections().filter((con) => {
          const keep = !con.includes(id);
          if (!keep) {
            props.onDisconnect?.(con);
          }
          return keep;
        })
      );
      const nodeId = id.split(":")[0];
      const outPort = connection.find((p) => !p.startsWith(nodeId));
      outPort && setActivePort(outPort);
    } else {
      setActivePort(id);
    }
    setSelectedNode();
  };
  const connect = (a, b) => {
    const aNode = nodes().find((node) => a.startsWith(node.id));
    const aPort = a.split(":")[2];
    // make sure first item is outlet and second item is inlet
    const isInlet = !!aNode.inlets?.find((inlet) => inlet.name === aPort);
    if (isInlet) {
      [a, b] = [b, a];
    }
    const con = [a, b];
    if (!connections().find((c) => c.join("=") === con.join("="))) {
      // connect only if not already connected
      setConnections(connections().concat([con]));
    }
    props.onConnect?.(a, b, nodeState());
  };
  let initialState = {};
  // init patch
  onMount(() => {
    if (props.init) {
      props.init.nodes?.forEach((node) => {
        // console.log("init", node);
        const type = node.id.split(":").slice(1)[0];
        initialState[node.id] = node.state;
        createNode(type, [node.x, node.y], node.id, node.state);
      });
      setTimeout(() => {
        setConnections(props.init.connections);
        props.init.connections.forEach(([a, b]) =>
          props.onConnect?.(a, b, nodeState())
        );
      });
    }
    // console.log("initialState", initialState);
  });

  /**
   * mouse & key events
   */
  const getRelativeMousePosition = (e, el) => {
    const { x, y } = el.getBoundingClientRect();
    const { clientX, clientY } = e;
    return [clientX - x, clientY - y];
  };
  const handleMouseUp = (e) => {
    setMouseDown(false);
    setActivePort();
  };
  const handleKeyDown = (e) => {
    if (e.key === "Backspace" && !!selectedNode()) {
      deleteNode(selectedNode());
    } else if (e.key === "Escape" && showDialog()) {
      setShowDialog(false);
    } else if (e.key === "Escape" && activePort()) {
      setActivePort();
      setSelectedNode();
    } else if (e.key === "Escape" && selectedNode()) {
      setSelectedNode();
    }
  };
  onMount(() => {
    document?.addEventListener("mouseup", handleMouseUp);
    document?.addEventListener("keydown", handleKeyDown);
  });
  onCleanup(() => {
    document?.removeEventListener("mouseup", handleMouseUp);
    document?.removeEventListener("keydown", handleKeyDown);
  });

  const handlePortMouseDown = ([node, port, isInlet], e) => {
    const id = getPortId(node, port);
    if (activePort()) {
      connect(activePort(), id);
    } else {
      activatePort(id, isInlet);
    }
    setMouseDown(true);
    e.stopImmediatePropagation();
    e.stopPropagation();
  };
  const handlePortMouseUp = ([node, port, isInlet], e) => {
    const from = activePort();
    const to = getPortId(node, port);
    if (from === to) {
      activatePort(from, isInlet);
    } else if (activePort()) {
      connect(from, to);
      setActivePort();
    }
    setMouseDown(false);
    e.stopImmediatePropagation();
    e.stopPropagation();
  };
  const handleNodeContainerMouseUp = (e) => {
    if (!mouseDown() && !isPatching() && e.target === e.currentTarget) {
      setShowDialog(true);
    }
  };
  const handleNodeContainerMouseMove = (e) => {
    const [x, y] = getRelativeMousePosition(e, e.currentTarget);
    setMousePosition([x, y]);
    if (mouseDown() && selectedNode() && !isPatching()) {
      e.stopPropagation();
      setNodePositions({
        ...nodePositions(),
        [selectedNode()]: [x - dragPos[0], y - dragPos[1]],
      });
    }
  };
  const handleNodeMouseDown = (node, e) => {
    const { offsetX, offsetY } = e;
    dragPos = [offsetX, offsetY];
    setMouseDown(true); // <- this is problematic...
    setSelectedNode(node.id);
    e.stopPropagation();
  };
  /**
   * UI
   */

  return (
    <div
      class="relative bg-stone-800 w-full not-prose select-none font-sans h-full"
      onMouseMove={handleNodeContainerMouseMove}
    >
      {showStart() && (
        <div
          class="absolute w-full h-full z-10 p-4 flex justify-center items-center"
          onClick={() => {
            setShowStart(false);
            props.onStart?.(nodes(), connections());
          }}
        >
          <button class="bg-white rounded-md text-black h-16 w-32">
            click to start
          </button>
        </div>
      )}
      {/* dialog */}
      {showDialog() && (
        <div
          class="absolute w-full h-full z-10 bg-[#00000010] p-4 flex justify-center"
          onClick={() => setShowDialog(false)}
          onMouseMove={(e) => e.stopImmediatePropagation()}
        >
          <div
            class="w-[200px] h-[200px] overflow-auto absolute bg-stone-600 p-2 border-2 border-slate-900 flex-col space-y-2 text-white"
            onClick={(e) => e.stopPropagation()}
            style={`left: ${mousePosition()[0] - 100}px; top: ${
              mousePosition()[1] - 100
            }px`}
          >
            <div class="flex justify-center">
              <h2>Create Node</h2>
            </div>
            <div class="grid grid-cols-2 gap-1">
              {props.nodeTypes.map((node) => (
                <div
                  class="cursor-pointer border-2 border-slate-900 text-center"
                  onClick={() => createNode(node.type, mousePosition())}
                >
                  {node.type}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* node container */}
      <div
        class="w-full h-full relative"
        ref={(el) => {
          nodeContainer = el;
        }}
        onMouseUp={handleNodeContainerMouseUp}
      >
        {/* nodes */}
        <For each={nodes()}>
          {(node) => (
            <div
              style={`left: ${nodePositions()[node.id][0]}px; top: ${
                nodePositions()[node.id][1]
              }px`}
              class={`bg-stone-600 text-white absolute border-2 ${
                selectedNode() === node.id
                  ? "border-red-600"
                  : "border-stone-500"
              }`}
              data-node={node.id}
              onMouseDown={[handleNodeMouseDown, node]}
              onClick={(e) => e.stopPropagation()}
            >
              <div class="w-full text-center text-sm">{node.type}</div>
              {/* node components */}
              {node.render &&
                node.render({
                  node,
                  state: initialState[node.id], // use static version to not trigger rerender
                  // state: nodeState()[node.id],
                  //connections: connections(),
                  getOutletTarget: (outlet) => {
                    const outletId = `${node.id}:${outlet}`;
                    const con = connections().find(
                      (con) => con[0] === outletId
                    );
                    return con[1];
                  },
                  onChange: (state) => {
                    const _state = { ...nodeState(), [node.id]: state };
                    setNodeState(_state);
                  },
                })}
              {/* node ports */}
              <div class="flex space-x-4 text-xs justify-between">
                <div>
                  {node.inlets?.map((port) => (
                    <div
                      class="flex items-center -mx-1.5 space-x-1 group"
                      onMouseUp={[handlePortMouseUp, [node, port, true]]}
                      onMouseDown={[handlePortMouseDown, [node, port, true]]}
                    >
                      <div
                        data-port={getPortId(node, port)}
                        class="port w-3 h-3 bg-yellow-200 border-stone-500 group-hover:bg-red-500 rounded-full"
                      />
                      <div>{port.name}</div>
                    </div>
                  ))}
                </div>
                <div>
                  {node.outlets?.map((port) => (
                    <div
                      class="flex items-center -mx-1.5 space-x-1 group"
                      onMouseUp={[handlePortMouseUp, [node, port]]}
                      onMouseDown={[handlePortMouseDown, [node, port]]}
                    >
                      <div>{port.name}</div>
                      <div
                        data-port={getPortId(node, port)}
                        class="port w-3 h-3 bg-yellow-200 group-hover:bg-red-500 rounded-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </For>
        {/* cables */}
        <svg class="w-full h-full pointer-events-none z-[1000]">
          {cables().map(([x1, y1, x2, y2]) => (
            <line
              {...{ x1, y1, x2, y2 }}
              style="stroke: white; stroke-width: 2;"
            />
          ))}
        </svg>
        <div class="absolute left-2 top-0 flex flex-col">
          {props.menu}
          <button
            class=" text-white"
            onClick={() => {
              console.log(JSON.stringify(state(), null, 2));
            }}
          >
            log
          </button>
        </div>
      </div>
      {/* state */}
    </div>
  );
}
