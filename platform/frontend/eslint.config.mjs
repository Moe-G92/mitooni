import js from "@eslint/js";
import ts from "typescript-eslint";
import globals from "globals";
import refresh from "eslint-plugin-react-refresh";
import hooks from "eslint-plugin-react-hooks";
export default ts.config(js.configs.recommended, ...ts.configs.recommended, { files: ["src/**/*.{ts,tsx}"], languageOptions: { globals: globals.browser }, plugins: { "react-hooks": hooks, "react-refresh": refresh }, rules: { ...hooks.configs.recommended.rules, "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }] } });
