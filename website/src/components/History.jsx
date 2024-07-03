import { persistentAtom } from "@nanostores/persistent";
import { useStore } from "@nanostores/solid";

export const $history = persistentAtom("history", [], {
  encode: JSON.stringify,
  decode: JSON.parse,
});

function getFormattedDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const formattedDate = `${year}-${String(month).padStart(2, "0")}-${String(
    day
  ).padStart(2, "0")}`;
  const formattedTime = `${String(hours).padStart(2, "0")}:${String(
    minutes
  ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return { formattedDate, formattedTime, date: now };
}

export function addToHistory(code) {
  const currentHistory = JSON.parse(JSON.stringify($history.get()));
  if (currentHistory[0]?.code === code) {
    return; // don't add if no change..
  }
  const { formattedTime, date } = getFormattedDate();

  const firstLine = code.split("\n")[0].slice(0, 30);
  const newHistory = [
    { code, label: `[${formattedTime}] ${firstLine}`, timestamp: Date.now() },
    ...currentHistory,
  ];
  $history.set(newHistory);
}
function downloadHistory() {
  const currentHistory = JSON.parse(JSON.stringify($history.get()));
  const blob = new Blob([JSON.stringify(currentHistory)], {
    type: "application/json",
  });
  const downloadLink = document.createElement("a");
  downloadLink.href = window.URL.createObjectURL(blob);
  const date = new Date().toISOString().split("T")[0];
  downloadLink.download = `kabelsalat_history_${date}.json`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

export function History(props) {
  const history = useStore($history);
  return (
    <>
      <div class="flex justify-start items-baseline space-x-4">
        <h2 class="text-xl text-white pb-4 pt-6">history</h2>
        <Show when={history().length > 0}>
          <div class="text-sm flex space-x-2 text-stone-400">
            <button class="hover:opacity-50" onClick={() => $history.set([])}>
              clear
            </button>
            <button class="hover:opacity-50" onClick={() => downloadHistory()}>
              download
            </button>
          </div>
        </Show>
      </div>
      <Show when={history().length === 0}>
        <span class="text-sm">Run some code to fill your history..</span>
      </Show>
      <For each={history().slice(0, 25)}>
        {(evaluation) => (
          <div class="not-prose">
            <a
              class={`text-teal-600 cursor-pointer hover:opacity-50${
                props.code === evaluation.code
                  ? " border-b border-teal-600"
                  : ""
              }`}
              onClick={() => props.run(evaluation.code)}
            >
              {evaluation.label}
            </a>
          </div>
        )}
      </For>
    </>
  );
}
