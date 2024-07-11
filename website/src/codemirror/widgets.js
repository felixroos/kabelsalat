import { Decoration, ViewPlugin } from "@codemirror/view";
import { StateEffect } from "@codemirror/state";
import { SliderWidget } from "./slider.js";

export const clamp = (num, min, max) => {
  [min, max] = [Math.min(min, max), Math.max(min, max)];
  return Math.min(Math.max(num, min), max);
};

export const addWidget = StateEffect.define({
  map: ({ from, to }, change) => {
    return { from: change.mapPos(from), to: change.mapPos(to) };
  },
});

export const updateWidgets = (view, widgets) => {
  view.dispatch({ effects: addWidget.of(widgets) });
};

let widgetClasses = {
  _: SliderWidget,
  T: SliderWidget,
};

export const widgetPlugin = ViewPlugin.fromClass(
  class {
    decorations; /* : DecorationSet */

    constructor(view /* : EditorView */) {
      // this.decorations = sliders(view);
      this.decorations = Decoration.set([]);
      this.view = view;
    }

    update(update /* : ViewUpdate */) {
      update.transactions.forEach((tr) => {
        if (tr.docChanged) {
          this.decorations = this.decorations.map(tr.changes);
          const iterator = this.decorations.iter();
          while (iterator.value) {
            iterator.value.widget.from = iterator.from;
            iterator.next();
          }
        }
        for (let e of tr.effects) {
          if (e.is(addWidget)) {
            const widgets = e.value.map(({ type, from, ...args }) => {
              const widgetClass = widgetClasses[type];
              return Decoration.widget({
                widget: new widgetClass({
                  view: this.view,
                  type,
                  from,
                  ...args,
                }),
                side: 1,
              }).range(from);
            });
            this.decorations = Decoration.set(widgets);
          }
        }
      });
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);
