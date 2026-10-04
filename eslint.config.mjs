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
    "backend/.venv/**",
    "backend/models/**",
    "next-env.d.ts",
    // Local agent tooling and installed skills, not part of the app.
    ".claude/**",
  ]),
]);

export default eslintConfig;
