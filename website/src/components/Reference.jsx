import { MiniRepl } from "../components/MiniRepl";
import jsdoc from "../../../doc.json";
import { For } from "solid-js";

const items = jsdoc.docs.filter((item) => !!item.tags);

export function Reference() {
  return (
    <div>
      <div class="space-x-2">
        <For each={items}>
          {(item) => <a href={`#${item.longname}`}>{item.longname}</a>}
        </For>
      </div>
      <For each={items}>
        {(item) => (
          <div>
            <h2 id={item.longname}>{item.longname}</h2>
            <p>{item.description}</p>

            {/* <div class="flex space-x-2 pb-2">
              <For each={item.tags}>
                {(tag) => (
                  <div class="bg-stone-700 p-2 text-sm">
                    {tag.originalTitle}
                  </div>
                )}
              </For>
            </div> */}
            <For each={item.params}>
              {(param) => (
                <div class="p-2 text-sm">
                  {param.name}: {param.description}
                </div>
              )}
            </For>
            <For each={item.examples}>
              {(example) => <MiniRepl code={example} />}
            </For>
          </div>
        )}
      </For>
    </div>
  );
}
