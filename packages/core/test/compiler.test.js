import { node } from "../src/index";
import * as api from "../src/lib";
import { describe, expect, it } from "vitest";
Object.assign(globalThis, api);

describe("compiler", () => {
  it("empty", () => {
    expect(node("exit").compile().src).toStrictEqual(
      "return [(0*lvl), (0*lvl)]"
    );
  });
  it("sine", () => {
    const unit = sine(200).out().exit().compile();
    expect(unit.src).toStrictEqual(
      `const n2 = nodes[0].update(200, 0, 0); /* sine */
return [(n2*lvl), (n2*lvl)]`
    );
    console.log("unit", unit);
    expect(unit.ugens).toStrictEqual(["SineOsc"]);
  });
});
