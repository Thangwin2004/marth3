import js from "@eslint/js";
import prettier from "eslint-plugin-prettier/recommended";

export default [
  { ignores: ["dist"] },
  js.configs.recommended,
  prettier,
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        AudioContext: "readonly",
        webkitAudioContext: "readonly",
        Audio: "readonly",
        console: "readonly",
        requestAnimationFrame: "readonly",
        Promise: "readonly",
        Math: "readonly",
        localStorage: "readonly",
        navigator: "readonly",
        EventTarget: "readonly",
        HTMLMediaElement: "readonly",
        MutationObserver: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "off",
      "no-empty": "off",
    },
  },
];
