import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const eslintConfig = [...nextVitals, ...nextTypeScript, {
  ignores: ["legacy_prototype/**", ".next/**", "node_modules/**"],
}];

export default eslintConfig;