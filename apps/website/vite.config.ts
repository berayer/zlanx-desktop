import { defineConfig, loadEnv, lazyPlugins } from "vite-plus";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

/**
 * website dev server 的地址与 electron 主进程共用工作区根目录的 .env，
 * 这里用其中的 ELECTRON_RENDERER_URL 决定 server 的 host / port，
 * 保证两边始终指向同一个地址。
 */
export default defineConfig(({ command, mode }) => {
  // 只有 dev server 需要这个地址，构建时不需要。
  if (command !== "serve") return {};

  const devServerUrl = loadEnv(mode, "../..", "")["ELECTRON_RENDERER_URL"];
  if (!devServerUrl) {
    throw new Error("ELECTRON_RENDERER_URL is missing from the workspace root .env");
  }

  const { hostname, port } = new URL(devServerUrl);

  return {
    server: {
      host: hostname,
      port: Number(port),
      // 端口必须与 .env 中声明的一致，否则 electron 会连不上。
      strictPort: true,
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },
    lint: {
      plugins: ["react", "typescript", "oxc"],
    },
    plugins: lazyPlugins(() => [
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
      }),
      react(),
      tailwindcss(),
    ]),
  };
});
