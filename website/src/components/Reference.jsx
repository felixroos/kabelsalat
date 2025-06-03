import { createSignal, For } from "solid-js";
import { nodeRegistry } from "@kabelsalat/core";
import { MiniRepl } from "./MiniRepl.jsx";

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

const items = Array.from(nodeRegistry.entries())
  .filter(([_, schema]) => !schema.internal)
  .sort(([a], [b]) => a.localeCompare(b));
const tags = Array.from(
  new Set(items.map((item) => item[1].tags).flat())
).filter(Boolean);

const tagRefs = Object.fromEntries(
  tags.map((tag) => [
    tag,
    items.filter(([_, schema]) => schema.tags?.includes(tag)).length,
  ])
);

export function Reference() {
  const [selectedTags, setSelectedTags] = createSignal([]);
  const toggleTag = (tag) => {
    let next;
    if (selectedTags().includes(tag)) {
      next = selectedTags().filter((t) => t !== tag);
    } else {
      //next = selectedTags().concat([tag]);
      next = [tag];
    }
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
                  "not-prose cursor-pointer text-sm p-1 rounded-md select-none whitespace-nowrap " +
                  (selectedTags().includes(tag)
                    ? "bg-teal-700"
                    : "bg-stone-700")
                }
                onClick={() => toggleTag(tag)}>
                {tag} ({tagRefs[tag]})
              </a>{" "}
            </>
          )}
        </For>
        <h4>Functions</h4>
        <For each={filtered()}>
          {([name, schema]) => (
            <>
              <a
                // href={`#${name}`} // breaks code in hash..
                // code in hash is the only way due to https://github.com/felixroos/kabelsalat/issues/19
                // it feels a bit wrong but let's just do it to make it work:
                class="cursor-pointer"
                onClick={() => {
                  const el = document.getElementById(`doc-${name}`);
                  const container = document.getElementById("scroll-container");
                  const pos = el.offsetTop - container.offsetTop - 10;
                  container.scrollTo(0, pos);
                }}>
                {name}
              </a>{" "}
            </>
          )}
        </For>
      </div>
      <For each={filtered()}>
        {([name, schema]) => (
          <div>
            <div class="flex not-prose justify-start space-x-4 pt-12 items-center">
              <h2 class="text-2xl font-bold" id={`doc-${name}`}>
                {name}
              </h2>
              <div class="flex space-x-2 items-center">
                <For each={schema.tags}>
                  {(tag) => (
                    <div class="bg-stone-700 p-1 text-xs rounded-md">{tag}</div>
                  )}
                </For>
              </div>
            </div>
            <p>{schema.description}</p>
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
              {(example) => (
                <MiniRepl code={example} hideGraph={!schema.graph} />
              )}
            </For>
          </div>
        )}
      </For>
    </div>
  );
}
