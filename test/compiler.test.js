import * as core from "@kabelsalat/core";
import * as lib from "@kabelsalat/lib";
import { describe, expect, it } from "vitest";

Object.assign(globalThis, core);
Object.assign(globalThis, lib);

describe("compiler", () => {
  it("sine", () => {
    const unit = sine(200).out().exit().compile();
    expect(unit.src).toStrictEqual(
      `const n2 = nodes[0].update(200,0,0); /* sine */
return [(n2*lvl),(n2*lvl)]`
    );
    expect(unit.ugens.map((ugen) => ugen.type)).toStrictEqual(["SineOsc"]);
  });
  it("feedback", () => {
    const unit = sine(200)
      .add((x) => x.mul(0.8))
      .out()
      .exit()
      .compile();
    expect(unit.src).toStrictEqual(
      `const n5 = nodes[0].update(); /* feedback_read */
const n3 = nodes[1].update(200,0,0); /* sine */
const n2 = n3 + n5;
const n7 = n2 * 0.8;
const n6 = nodes[0].write(n7); /* feedback_write */
return [(n2*lvl),(n2*lvl)]`
    );
    expect(unit.ugens.map((ugen) => ugen.type)).toStrictEqual([
      "Feedback",
      "SineOsc",
    ]);
  });
});
