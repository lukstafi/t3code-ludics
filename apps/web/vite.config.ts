import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { defineConfig } from "vite";
import pkg from "./package.json" with { type: "json" };

const port = Number(process.env.PORT ?? 5733);
const sourcemapEnv = process.env.T3CODE_WEB_SOURCEMAP?.trim().toLowerCase();

const buildSourcemap =
  sourcemapEnv === "0" || sourcemapEnv === "false"
    ? false
    : sourcemapEnv === "hidden"
      ? "hidden"
      : true;

export default defineConfig({
  plugins: [
    tanstackRouter(),
    react(),
    babel({
      // We need to be explicit about the parser options after moving to @vitejs/plugin-react v6.0.0
      // This is because the babel plugin only automatically parses typescript and jsx based on relative paths (e.g. "**/*.ts")
      // whereas the previous version of the plugin parsed all files with a .ts extension.
      // This is causing our packages/ directory to fail to parse, as they are not relative to the CWD.
      parserOpts: { plugins: ["typescript", "jsx"] },
      presets: [reactCompilerPreset()],
    }),
    tailwindcss(),
  ],
  optimizeDeps: {
    include: ["@pierre/diffs", "@pierre/diffs/react", "@pierre/diffs/worker/worker.js"],
  },
  define: {
    // In dev mode, tell the web app where the WebSocket server lives
    "import.meta.env.VITE_WS_URL": JSON.stringify(process.env.VITE_WS_URL ?? ""),
    "import.meta.env.APP_VERSION": JSON.stringify(pkg.version),
    // ludics-fork: ports for return-navigation links
    "import.meta.env.VITE_LUDICS_DASHBOARD_PORT": JSON.stringify(
      process.env.VITE_LUDICS_DASHBOARD_PORT ?? "7678",
    ),
    "import.meta.env.VITE_LUDICS_TTYD_PORT": JSON.stringify(
      process.env.VITE_LUDICS_TTYD_PORT ?? "7679",
    ),
    // ludics-fork: ntfy.sh topic for dashboard health alerts
    "import.meta.env.VITE_NTFY_SERVER": JSON.stringify(
      process.env.VITE_NTFY_SERVER ?? "https://ntfy.sh",
    ),
    "import.meta.env.VITE_NTFY_TOPIC": JSON.stringify(
      process.env.VITE_NTFY_TOPIC ?? "lukstafi-to-Mag",
    ),
  },
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    port,
    strictPort: true,
    hmr: {
      // Explicit config so Vite's HMR WebSocket connects reliably
      // inside Electron's BrowserWindow. Vite 8 uses console.debug for
      // connection logs — enable "Verbose" in DevTools to see them.
      protocol: "ws",
      host: "localhost",
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: buildSourcemap,
  },
});
