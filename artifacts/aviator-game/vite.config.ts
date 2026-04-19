import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const isBuild = process.env.NODE_ENV === "production" || process.argv.includes("build");

const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 5173;

if (!isBuild && rawPort && (Number.isNaN(port) || port <= 0)) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH ?? "/";

const devPlugins: any[] = [];
if (!isBuild && process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined) {
  // Replit-specific plugins loaded lazily to avoid errors outside Replit
  try {
    const runtimeErrorOverlay = await import("@replit/vite-plugin-runtime-error-modal").then(m => m.default);
    devPlugins.push(runtimeErrorOverlay());
    const cartographer = await import("@replit/vite-plugin-cartographer").then(m => m.cartographer);
    devPlugins.push(cartographer({ root: path.resolve(import.meta.dirname, "..") }));
    const devBanner = await import("@replit/vite-plugin-dev-banner").then(m => m.devBanner);
    devPlugins.push(devBanner());
  } catch {
    // Outside Replit — skip
  }
}

export default defineConfig({
  base: basePath,
  plugins: [react(), tailwindcss(), ...devPlugins],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: isBuild ? 5173 : port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port: isBuild ? 5173 : port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
