import { MiniRepl } from "../components/MiniRepl";
import { For, createSignal } from "solid-js";
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
const tags = Array.from(new Set(items.map((item) => item[1].tags).flat()));

export function Reference() {
  const [selectedTags, setSelectedTags] = createSignal([]);
  const toggleTag = (tag) => {
    let next;
    console.log("tag", tag);
    if (selectedTags().includes(tag)) {
      next = selectedTags().filter((t) => t !== tag);
    } else {
      next = selectedTags().concat([tag]);
    }
    console.log("next", next);
    setSelectedTags(next);
  };
  const filtered = () =>
    selectedTags().length === 0
      ? items
      : items.filter((item) =>
          selectedTags().reduce(
            (acc, tag) => acc && item[1].tags?.includes(tag),
            true
          )
        );
  return (
    <div>
      <div>
        <h4>Tags</h4>
        <For each={tags}>
          {(tag) => (
            <>
              <a
                class={
                  "cursor-pointer " +
                  (selectedTags().includes(tag) ? "bg-teal-500" : "")
                }
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </a>{" "}
            </>
          )}
        </For>
        <h4>Functions</h4>
        <For each={filtered()}>
          {([name, schema]) => (
            <>
              <a href={`#${name}`}>{name}</a>{" "}
            </>
          )}
        </For>
      </div>
      <For each={filtered()}>
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
              {(example) => <MiniRepl code={example} hideGraph />}
            </For>
          </div>
        )}
      </For>
    </div>
  );
}
