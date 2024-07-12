import { WidgetType } from "@codemirror/view";
import { clamp } from "./widgets.js";

export class ButtonWidget extends WidgetType {
  constructor({ value, view, from, type }) {
    super();
    this.type = type;
    this.valueString = value;
    this.pressed = this.unifyValue(value) === 1;
    this.view = view;
    this.id = from;
    this.from = from; // will be changed from the outside..
    this.size = 16;
    this.sizeCanvas = this.size;
    this.size = this.sizeCanvas * window.devicePixelRatio;
    this.render(this.pressed);
  }

  unifyValue(value) {
    value = Number(value);
    value = isNaN(value) ? 0 : value;
    return Math.round(clamp(Number(value), 0, 1));
  }

  render() {
    if (!this.canvas) {
      return;
    }
    const bg = "#1c1917";
    this.ctx.fillStyle = bg;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    const color = this.pressed ? "#0d9488" : "#1c1917";
    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = "#0d9488";
    const lineWidth = 2;
    this.ctx.lineWidth = lineWidth;
    const dim = this.canvas.width - 2;
    const crossMin = lineWidth * 2;
    const crossMax = dim - lineWidth;
    if (this.pressed) {
      this.ctx.moveTo(crossMin, crossMin);
      this.ctx.lineTo(crossMax, crossMax);
      this.ctx.moveTo(crossMin, crossMax);
      this.ctx.lineTo(crossMax, crossMin);
      this.ctx.stroke();
    } else {
      this.ctx.fillRect(1, 1, dim, dim);
    }
    this.ctx.strokeRect(1, 1, dim, dim);
  }

  updateValue(e) {
    this.render();
    e?.stopPropagation();
    e?.stopImmediatePropagation();
    e?.preventDefault();
    window.postMessage({
      type: "KABELSALAT_SET_CONTROL",
      value: this.pressed ? 1 : 0,
      id: this.id,
    });
  }

  replaceNumber() {
    const from = this.from + 2; // skip "B("
    const to = from + this.valueString.length;
    this.valueString = this.pressed ? "1" : "0";
    let change = { from, to, insert: this.valueString };
    this.view.dispatch({ changes: change });
  }

  eq(other) {
    return false;
  }

  handleMouseDown(e) {
    this.pressed = !this.pressed;
    this.updateValue(e);
    this.replaceNumber();
  }

  attachListeners() {
    this.canvas.addEventListener("mousedown", this.handleMouseDown.bind(this));
  }
  detachListeners() {
    this.canvas.removeEventListener("mousedown", this.handleMouseDown);
  }

  toDOM() {
    let canvas = document.createElement("canvas");
    canvas.style.imageRendering = "pixelated";
    canvas.className = "ks-button";
    canvas.width = this.size;
    canvas.height = this.size;
    canvas.style = [
      `height:${this.sizeCanvas}px`,
      `width:${this.sizeCanvas}px`,
      `display:inline`,
      `cursor:pointer`,
      `padding-bottom:0px`,
      `margin-right:-10px`,
      `z-index:100`,
      `position:relative`,
      "vertical-align: middle",
      "margin-top:-3px",
    ].join(";");
    const ctx = canvas.getContext("2d");
    this.ctx = ctx;
    this.canvas = canvas;
    this.attachListeners();
    this.render(this.pressed);
    return canvas;
  }

  ignoreEvent() {
    return false;
  }
  destroy() {
    this.detachListeners();
  }
}
