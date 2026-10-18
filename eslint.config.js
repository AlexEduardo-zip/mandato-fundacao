import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  { ignores: ["**/dist/**", "**/node_modules/**", "**/coverage/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    // the engine must stay pure and deterministic
    files: ["packages/engine/src/**/*.ts"],
    ignores: ["**/*.test.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[object.name='Math'][property.name='random']",
          message: "Use the seeded Rng, not Math.random.",
        },
        {
          selector: "MemberExpression[object.name='Date']",
          message: "The engine cannot read the clock.",
        },
        {
          selector: "NewExpression[callee.name='Date']",
          message: "The engine cannot read the clock.",
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["node:*", "fs", "path", "os", "child_process", "http", "https"],
              message: "The engine cannot do I/O.",
            },
          ],
        },
      ],
    },
  },
);
