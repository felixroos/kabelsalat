import { persistentAtom } from "@nanostores/persistent";
import { useStore } from "@nanostores/solid";

const defaultSettings = {
  keybindings: "codemirror",
};

export const $settings = persistentAtom(
  "kabel-salat-settings",
  defaultSettings,
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  },
);

export const updateSettings = (key, value) =>
  $settings.set({ ...$settings.get(), [key]: value });

export function Settings() {
  const settings = useStore($settings);
  const keybindings = () => settings().keybindings;
  return (
    <div class="grid gap-2">
      <label>Keybindings</label>
      <ButtonGroup
        items={{
          vim: "Vim",
          emacs: "Emacs",
          vscode: "VSCode",
          codemirror: "Codemirror",
        }}
        onChange={(key) => {
          updateSettings("keybindings", key);
        }}
        value={keybindings}
      />
    </div>
  );
}

function ButtonGroup({ items, value, onChange }) {
  return (
    <div className="flex max-w-lg ">
      {Object.entries(items).map(([key, label]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          data-selected={value === key}
          class={
            "px-2 border-b h-8 whitespace-nowrap " +
            (value() === key ? "border-foreground" : "border-transparent")
          }
        >
          {label.toLowerCase()}
        </button>
      ))}
    </div>
  );
}
