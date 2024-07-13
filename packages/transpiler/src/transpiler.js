import { parse } from "acorn";
import escodegen from "escodegen";
import { walk } from "estree-walker";

let widgetMethods = new Map();
// type = function name of input code
// functionName = function name of transpiled code
export function registerWidgetType(type, functionName) {
  widgetMethods.set(type, functionName);
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
          value: node.arguments[0]?.raw, // we need the exact string!
          min: node.arguments[1]?.value,
          max: node.arguments[2]?.value,
          step: node.arguments[3]?.value,
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
    widgetMethods.has(node.callee.name)
  );
}

function widgetWithLocation(node, widgetConfig) {
  const functionName = widgetMethods.get(node.callee.name);
  node.callee.name = functionName;

  const id = widgetConfig.from; // this location is also deducable by codemirror
  node.arguments.unshift({
    type: "Literal",
    value: id,
    raw: id,
  });
  return node;
}
