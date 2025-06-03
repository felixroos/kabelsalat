import { persistentAtom } from "@nanostores/persistent";
import { useStore } from "@nanostores/solid";

const defaultSettings = {
  keybindings: "codemirror",
};

export const $settings = persistentAtom(
  "kabel-salat-settings",
  defaultSettings,
  { encode: JSON.stringify, decode: JSON.parse }
);

const updateSettings = (key, value) =>
  $settings.set({ ...$settings.get(), [key]: value });

export function Settings() {
  const settings = useStore($settings);
  const keybindings = () => settings().keybindings;
  return (
    <div class="grid gap-2">
      <h4>Keybindings</h4>
      <ButtonGroup
        items={{
          vim: "Vim",
          emacs: "Emacs",
          vscode: "VSCode",
          codemirror: "Codemirror",
        }}
        value={keybindings}
        onChange={(key) => updateSettings("keybindings", key)}
      />
    </div>
  );
}

function ButtonGroup({ items, value, onChange }) {
  return (
    <div className="flex gap-2 max-w-lg ">
      {Object.entries(items).map(([key, label]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          class={
            "border-b h-8 whitespace-nowrap " +
            (value() === key ? "border-foreground" : "border-transparent")
          }>
          {label.toLowerCase()}
        </button>
      ))}
    </div>
  );
}
