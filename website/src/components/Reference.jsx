import { MiniRepl } from "../components/MiniRepl";
import { For } from "solid-js";
import { nodeRegistry } from "@kabelsalat/core";

const commonInputs = {
  in: "signal input",
  freq: "frequency",
  phase: "phase offset 0 - 1",
  cutoff: "cutoff frequency",
  reso: "resonance",
  min: "minimum value",
  max: "maximum value",
  gate: "gate input",
  trig: "trigger input",
};

const items = Array.from(nodeRegistry.entries()).filter(
  ([_, schema]) => !schema.internal
);
console.log("items", items);
export function Reference() {
  return (
    <div>
      <div>
        <For each={items}>
          {([name, schema]) => (
            <>
              <a href={`#${name}`}>{name}</a>{" "}
            </>
          )}
        </For>
      </div>
      <For each={items}>
        {([name, schema]) => (
          <div>
            <h2 id={name}>{name}</h2>
            <p>{schema.description}</p>

            {/* <div class="flex space-x-2 pb-2">
              <For each={item.tags}>
                {(tag) => (
                  <div class="bg-stone-700 p-2 text-sm">
                    {tag.originalTitle}
                  </div>
                )}
              </For>
            </div> */}
            <For each={schema.ins}>
              {(input) => (
                <div class="p-2 text-sm">
                  {input.dynamic && "..."}
                  {input.name} ({input.default}):{" "}
                  {input.description || commonInputs[input.name]}
                </div>
              )}
            </For>
            <For each={schema.examples}>
              {(example) => <MiniRepl code={example} />}
            </For>
          </div>
        )}
      </For>
    </div>
  );
}
