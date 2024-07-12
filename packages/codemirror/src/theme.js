import { EditorView } from "codemirror";
import { tags } from "@lezer/highlight";
import { HighlightStyle } from "@codemirror/language";
import { syntaxHighlighting } from "@codemirror/language";

let colors = {
  teal600: "#0d9488",
  teal400: "#2dd4bf",
  amber: "#d97706",
  violet400: "#a78bfa",
  violet300: "#c4b5fd",
  indigo300: "#a5b4fc",
  indigo400: "#818cf8",
  fuchsia400: "#e879f9",
  fuchsia300: "#f0abfc",
  fuchsia200: "#f5d0fe",
  whitish: "#ddd",
  stone400: "#a8a29e",
  stone500: "#78716c",
};

let theme = EditorView.theme(
  {
    "&": {
      color: colors.teal600,
      overflow: "hidden",
      backgroundColor: "transparent",
      fontSize: "16px",
      height: "100%",
    },
    ".cm-cursor": {
      "border-left-color": "#d9770696",
      "border-left-width": "11px",
    },
    ".cm-activeLine": {
      backgroundColor: "#ddd",
    },
    ".cm-cursorLayer": {
      // "animation-name": "inherit !important;", // disables blinking
    },
  },
  { dark: true }
);

const highlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: colors.fuchsia300 },
  { tag: tags.literal, color: colors.whitish },
  { tag: tags.squareBracket, color: colors.amber },
  { tag: tags.punctuation, color: colors.fuchsia300 },
  { tag: tags.operator, color: colors.fuchsia300 },
  { tag: tags.comment, color: colors.stone500, fontStyle: "italic" },
]);

export let kabelsalatTheme = [theme, syntaxHighlighting(highlightStyle)];
