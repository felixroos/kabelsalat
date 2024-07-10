import { Decoration, ViewPlugin, WidgetType } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";

class SliderWidget extends WidgetType {
  constructor(id, value) {
    super();
    this.id = id;
    this.value = Number(value);
    this.ctx && this.updateValue(value);
  }

  updateValue(value, e) {
    // console.log("updateValue", value);
    value = isNaN(value) ? 0 : value;
    value = Math.min(Math.max(0, value), 1, value);
    this.ctx.fillStyle = "#1c1917";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "#d97706";
    this.ctx.strokeStyle = "#d97706";
    this.ctx.strokeWidth = 2;
    this.ctx.fillRect(0, 0, value * this.canvas.width, this.canvas.height);
    this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
    e?.stopPropagation();
    e?.stopImmediatePropagation();
    e?.preventDefault();
    window.postMessage({ type: "KABELSALAT_SET_CONTROL", value, id: this.id });
  }

  eq(other) {
    return true; //other.value === this.value;
  }

  handleMouseMove(e) {
    if (this.mouseDown) {
      const canvasX = e.clientX - this.canvas.offsetLeft;
      const value = canvasX / this.canvas.width;
      this.updateValue(value, e);
    }
  }
  handleMouseDown(e) {
    const canvasX = e.clientX - this.canvas.offsetLeft;
    const value = canvasX / this.canvas.width;
    this.mouseDown = true;
    this.updateValue(value, e);
  }
  handleMouseUp(e) {
    this.mouseDown = false;
  }

  toDOM() {
    let canvas = document.createElement("canvas");
    canvas.className = "ks-slider";
    canvas.width = 64;
    canvas.height = 14;
    canvas.style = `height:${canvas.height}px;width:${canvas.width}px;display:inline;cursor:pointer`;
    const ctx = canvas.getContext("2d");
    this.ctx = ctx;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.canvas = canvas;
    canvas.addEventListener("mousedown", this.handleMouseDown.bind(this));
    document.addEventListener("mouseup", this.handleMouseUp.bind(this));
    document.addEventListener("mousemove", this.handleMouseMove.bind(this));
    this.updateValue(this.value);
    return canvas;
  }

  ignoreEvent() {
    return false;
  }
  destroy() {
    this.canvas.removeEventListener("mousedown", this.handleMouseDown);
    document.removeEventListener("mouseup", this.handleMouseUp);
    document.removeEventListener("mousemove", this.handleMouseMove);
  }
}

let sliderType = "_";

function isSlider(node /*: SyntaxNodeRef*/, view) {
  if (node.name !== "CallExpression") {
    return false;
  }
  const child = node.node.getChild("VariableName");
  const name = child ? view.state.doc.sliceString(child.from, child.to) : "";
  return name === sliderType;
}

function sliders(view /* : EditorView */) {
  let widgets = [];
  for (let { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from,
      to,
      enter: (node) => {
        if (isSlider(node, view)) {
          const number = node.node.getChild("ArgList").getChild("Number");
          const value = number
            ? view.state.doc.sliceString(number.from, number.to)
            : 0;
          let deco = Decoration.widget({
            widget: new SliderWidget(widgets.length, value),
            side: 1,
          });
          widgets.push(deco.range(node.from));
        }
      },
    });
  }
  return Decoration.set(widgets);
}

export const sliderPlugin = ViewPlugin.fromClass(
  class {
    decorations; /* : DecorationSet */

    constructor(view /* : EditorView */) {
      this.decorations = sliders(view);
    }

    update(update /* : ViewUpdate */) {
      if (
        update.docChanged ||
        update.viewportChanged ||
        syntaxTree(update.startState) != syntaxTree(update.state)
      )
        this.decorations = sliders(update.view);
    }
  },
  {
    decorations: (v) => v.decorations,
    /* eventHandlers: {
      mousedown: (e, view) => {
        let target = e.target;
        console.log("mousedown", e, target);
        if (
          target.nodeName === "CANVAS" &&
          target.classList.contains("ks-slider")
        ) {
          const pos = view.posAtDOM(target);
          let before = view.state.doc.sliceString(pos, pos + 10);
          const decs = sliders(view);
          console.log("sliders", decs);
          console.log("down on canvas", view.posAtDOM(target), before);
        }
      },
    }, */
  }
);
