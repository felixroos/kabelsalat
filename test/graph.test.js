import * as core from "@kabelsalat/core";
import * as lib from "@kabelsalat/lib";
import { describe, expect, it, test } from "vitest";

Object.assign(globalThis, core);
Object.assign(globalThis, lib);

describe("Node", () => {
  it("creates a node", () => {
    expect(node("test")).toStrictEqual(new Node("test"));
    expect(node("test").toObject()).toStrictEqual({ type: "test", ins: [] });
  });
  test("n", () => {
    expect(n(1).toObject()).toStrictEqual({ type: "n", value: 1, ins: [] });
    expect(n(n(1))).toStrictEqual(n(1));
  });
  test("register", () => {
    const id = register("id", (input) => input);
    expect(id(1)).toStrictEqual(1);
    expect(id(n(1))).toStrictEqual(n(1));
    expect(n(1).id()).toStrictEqual(n(1));
  });
  test("loopsToMe", () => {
    const fb = n(1);
    expect(fb.loopsToMe(fb)).toStrictEqual(true);
    let inner;
    let fb2 = add((x) => {
      inner = x.mul(1);
      return inner;
    });
    expect(fb2.loopsToMe(inner)).toStrictEqual(true);
    let fb3 = add((x) => x);
    expect(fb3.loopsToMe(fb3)).toStrictEqual(true);
  });
  test("dagify", () => {
    const fb = add((x) => x).exit();
    expect(fb.dagify().flatten()).toStrictEqual([
      // 0
      {
        type: "exit",
        ins: ["1", "2"],
      },
      // 1
      {
        type: "feedback_write",
        ins: ["2"],
        to: 3,
      },
      // 2
      {
        type: "add",
        ins: ["3"],
      },
      // 3
      {
        type: "feedback_read",
        ins: [],
      },
    ]);
  });
  test("evaluate", () => {
    const node = evaluate("sine(200).out()");
    expect(node.toObject()).toStrictEqual({
      type: "exit", // <- this is the node all connect to (to make feedback_write nodes discoverable)
      ins: [
        {
          type: "dac", // <- this is the node that only sound generators connect to
          ins: [
            {
              type: "sine",
              ins: [
                {
                  type: "n",
                  value: 200,
                  ins: [],
                },
              ],
            },
          ],
        },
      ],
    });
  });
});
