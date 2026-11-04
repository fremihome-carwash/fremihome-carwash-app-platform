import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// El .env vive en la raiz del repo, no en artifacts/<app>/.
const repoRoot = path.resolve(import.meta.dirname, "..", "..");

export default defineConfig(async ({ mode }) => {
  // Vite NO vuelca el .env a process.env, asi que para leerlo desde aca hay
  // que pedirlo explicitamente. El prefijo "" trae todas las claves, no solo
  // las VITE_*; eso no las expone al bundle, que sigue filtrando por
  // envPrefix. El env del shell pisa al archivo: asi el workflow puede forzar
  // BASE_PATH sin depender de que exista un .env en el runner.
  const env = { ...loadEnv(mode, repoRoot, ""), ...process.env };

  const rawPort = env.PORT;

  if (!rawPort) {
    throw new Error(
      "PORT environment variable is required but was not provided.",
    );
  }

  const port = Number(rawPort);

  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }

  const basePath = env.BASE_PATH;

  if (!basePath) {
    throw new Error(
      "BASE_PATH environment variable is required but was not provided. " +
        `Copia ${path.join(repoRoot, ".env.example")} a .env, o pasala por el entorno.`,
    );
  }

  return {
    base: basePath,
    plugins: [
      react(),
      tailwindcss(),
      runtimeErrorOverlay(),
      ...(env.NODE_ENV !== "production" && env.REPL_ID !== undefined
        ? [
            await import("@replit/vite-plugin-cartographer").then((m) =>
              m.cartographer({
                root: path.resolve(import.meta.dirname, ".."),
              }),
            ),
            await import("@replit/vite-plugin-dev-banner").then((m) =>
              m.devBanner(),
            ),
          ]
        : []),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
        "@assets": path.resolve(
          import.meta.dirname,
          "..",
          "..",
          "attached_assets",
        ),
      },
      dedupe: ["react", "react-dom"],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      port,
      strictPort: true,
      host: "0.0.0.0",
      allowedHosts: true,
      fs: {
        strict: true,
      },
      proxy: {
        "/api": {
          target: env.API_PROXY_TARGET ?? "http://localhost:8080",
          changeOrigin: true,
        },
        "/uploads": {
          target: env.API_PROXY_TARGET ?? "http://localhost:8080",
          changeOrigin: true,
        },
      },
    },
    preview: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
    },
  };
});
