import { defineConfig, type UserConfig } from "tsdown";

const entryPoints: Record<string, string> = {
  bundle: "src/index.ts",
  fimbul: "src/fimbul.ts",
  "fimbul-async": "src/fimbul-async.ts",
};

const commonConfig: UserConfig = {
  platform: "neutral",
  format: ["esm"],
  target: "es2022",
  dts: true,
  treeshake: true,
  outDir: "bundles",
  inputOptions: {
    experimental: {
      attachDebugInfo: "none",
    },
  },
};

export default defineConfig(
  Object.entries(entryPoints).map(([key, entry]) => ({
    entry: {
      [key]: entry,
    },
    ...commonConfig,
  })),
);
