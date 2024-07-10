import { parse } from "acorn";
import escodegen from "escodegen";
import { walk } from "estree-walker";

let widgetMethods = [];
export function registerWidgetType(type) {
  widgetMethods.push(type);
}

export function transpiler(input, options = {}) {
  const { wrapAsync = false, enableWidgets = true } = options;

  let ast = parse(input, {
    ecmaVersion: 2022,
    allowAwaitOutsideFunction: true,
    locations: true,
  });

  let widgets = [];

  walk(ast, {
    enter(node, parent /* , prop, index */) {
      if (enableWidgets && isWidgetMethod(node)) {
        const type = node.callee.name;
        const index = widgets.filter((w) => w.type === type).length;
        const widgetConfig = {
          from: node.start,
          to: node.end,
          index,
          type,
          value: node.arguments[0]?.raw,
        };
        widgets.push(widgetConfig);
        return this.replace(widgetWithLocation(node, widgetConfig));
      }
    },
    leave(node, parent, prop, index) {},
  });

  const { body } = ast;
  if (!body?.[body.length - 1]?.expression) {
    throw new Error("unexpected ast format without body expression");
  }

  let output = escodegen.generate(ast);
  if (wrapAsync) {
    output = `(async ()=>{${output}})()`;
  }
  return { output, widgets };
}

function isWidgetMethod(node) {
  return (
    node.type === "CallExpression" &&
    node.callee &&
    // widgetMethods.includes(node.callee.property?.name)
    widgetMethods.includes(node.callee.name)
  );
}

function widgetWithLocation(node, widgetConfig) {
  const id = widgetConfig.from; // this location is also deducable by codemirror
  node.callee.name = "cc";
  // add loc as identifier to first argument
  // the sliderWithID function is assumed to be sliderWithID(id, value, min?, max?)
  node.arguments.unshift({
    type: "Literal",
    value: id,
    raw: id,
  });
  return node;
}
