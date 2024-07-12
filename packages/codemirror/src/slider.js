import { WidgetType } from "@codemirror/view";
import { clamp } from "./widgets.js";

const pixelRatio = window.devicePixelRatio;

export class SliderWidget extends WidgetType {
  constructor({ value, view, from, to, min, max, step, type }) {
    super();
    this.type = type;
    this.min = min ?? 0;
    this.max = max ?? 1;
    this.step = step ?? 0;
    this.valueString = value;
    this.value = clamp(Number(value), this.min, this.max);
    this.view = view;
    this.id = from;
    this.from = from; // will be changed from the outside..
    this.to = to;
    this.render(this.value);
  }

  render(value) {
    if (!this.canvas) {
      return;
    }
    value = isNaN(value) ? 0 : value;
    value = clamp(value, this.min, this.max);
    value = (value - this.min) / (this.max - this.min);
    this.ctx.fillStyle = "#1c1917";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    const color = "#0d9488"; //"#d97706";
    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = color;
    const strokeWidth = 3;
    const paddingBottom = 4;
    this.ctx.lineWidth = strokeWidth;
    this.ctx.fillRect(
      value * (this.canvas.width - strokeWidth),
      0,
      strokeWidth,
      this.canvas.height - paddingBottom
    );
    this.ctx.fillRect(
      0,
      this.canvas.height / 2 - strokeWidth / 2 - paddingBottom / 2,
      this.canvas.width,
      strokeWidth
    );
  }

  updateValue(value, e) {
    // console.log("updateValue", value);
    value = clamp(value, this.min, this.max);

    this.render(value);
    e?.stopPropagation();
    e?.stopImmediatePropagation();
    e?.preventDefault();
    window.postMessage({ type: "KABELSALAT_SET_CONTROL", value, id: this.id });
  }

  replaceNumber(value) {
    const from = this.from + 2; // skip "_("
    const to = from + this.valueString.length;
    this.valueString = Number(value).toFixed(2);
    let change = { from, to, insert: this.valueString };
    this.view.dispatch({ changes: change });
  }

  eq(other) {
    return false;
  }

  getValue(unipolar) {
    unipolar = clamp(unipolar, 0, 1);
    const scaled = unipolar * (this.max - this.min) + this.min;
    return scaled;
  }

  handleEventOffset(e) {
    let canvasX;
    if (e.clientX !== undefined) {
      canvasX = e.clientX - this.canvas.offsetLeft;
    } else {
      canvasX = e.layerX;
    }
    const value = this.getValue((canvasX / this.canvas.width) * pixelRatio);
    this.updateValue(value, e);
    this.replaceNumber(value);
  }

  handleMove(e) {
    // console.log("mousemove", this.mouseDown);
    if (this.mouseDown) {
      this.handleEventOffset(e);
    }
  }
  handleDown(e) {
    // console.log("mousedown");
    this.mouseDown = true;
    this.handleEventOffset(e);
  }
  handleUp(e) {
    // console.log("mouseup");
    this.mouseDown = false;
  }

  attachListeners() {
    this.canvas.addEventListener("mousedown", this.handleDown.bind(this));
    this.canvas.addEventListener("touchstart", this.handleDown.bind(this));
    this.canvas.addEventListener("touchend", this.handleUp.bind(this));
    document.addEventListener("mouseup", this.handleUp.bind(this));
    document.addEventListener("mousemove", this.handleMove.bind(this));
    document.addEventListener("touchmove", this.handleMove.bind(this));
  }
  detachListeners() {
    this.canvas.removeEventListener("mousedown", this.handleDown);
    this.canvas.removeEventListener("touchstart", this.handleDown);
    this.canvas.removeEventListener("touchend", this.handleUp);
    document.removeEventListener("mouseup", this.handleUp);
    document.removeEventListener("mousemove", this.handleMove);
    document.removeEventListener("touchmove", this.handleMove);
  }

  toDOM() {
    let canvas = document.createElement("canvas");
    canvas.style.imageRendering = "pixelated";
    canvas.className = "ks-slider";
    canvas.width = 64 * pixelRatio;
    canvas.height = 16 * pixelRatio;
    canvas.style = [
      `height:${canvas.height / pixelRatio}px`,
      `width:${canvas.width / pixelRatio}px`,
      `display:inline`,
      `cursor:pointer`,
      `padding-bottom:0px`,
      `margin-right:-10px`,
      `z-index:100`,
      `position:relative`,
    ].join(";");
    const ctx = canvas.getContext("2d");
    this.ctx = ctx;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.canvas = canvas;
    this.attachListeners();
    // this.updateValue(this.value);
    this.render(this.value);
    return canvas;
  }

  ignoreEvent() {
    return false;
  }
  destroy() {
    this.detachListeners();
  }
}
