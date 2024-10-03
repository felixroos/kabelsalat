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
  test("output", () => {
    const node = sine(200).output(1);
    expect(node.toObject()).toStrictEqual({
      type: "output",
      ins: [
        { type: "sine", ins: [{ type: "n", value: 200, ins: [] }] },
        {
          type: "n",
          value: 1,
          ins: [],
        },
      ],
    });
  });
  test("evaluate", () => {
    const node = evaluate("sine(200).out()");
    expect(node.toObject()).toStrictEqual({
      type: "exit",
      ins: [
        {
          type: "output",
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
            {
              ins: [],
              type: "n",
              value: 0,
            },
          ],
        },
        {
          type: "output",
          ins: [
            {
              ins: [
                {
                  ins: [],
                  type: "n",
                  value: 200,
                },
              ],
              type: "sine",
            },
            {
              ins: [],
              type: "n",
              value: 1,
            },
          ],
        },
      ],
    });
  });
});
