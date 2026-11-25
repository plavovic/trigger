import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "backend/dist/**",
    "backend/node_modules/**",
  ]),
  {
    files: ["**/*.cjs", "frame-sequence.test.js", "lib/frameSequence.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  {
    files: ["backend/**/*.ts"],
    rules: { "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }] },
  },
]);

export default eslintConfig;
