// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react-swc";
// import path from "path";
// import { componentTagger } from "lovable-tagger";

// // https://vitejs.dev/config/
// export default defineConfig(({ mode }) => ({
//   server: {
//     host: "::",
//     port: 8080,
//     hmr: {
//       overlay: false,
//     },
//   },
//   plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
//   resolve: {
//     alias: {
//       "@": path.resolve(__dirname, "./src"),
//     },
//   },
// }));

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: true,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "prompt",
      injectRegister: null,
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      includeAssets: ["favicon.ico", "robots.txt"],
      manifest: {
        name: "Fynlo",
        short_name: "Fynlo",
        description: "Financial management for your business",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        scope: "/",
        categories: ["finance", "business", "productivity"],
        icons: [
          {
            src: "https://file.aiquickdraw.com/imgcompressed/img/compressed_c913ea40964229321e07863e249ca8e5.webp",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "https://downloadr2.apkmirror.com/wp-content/uploads/2018/08/5b63527fabbb1.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
        shortcuts: [
          {
            name: "Add Expense",
            short_name: "Expense",
            url: "/expenses/add",
            description: "Record a new expense",
          },
          {
            name: "Add Income",
            short_name: "Income",
            url: "/income/add",
            description: "Record a new income",
          },
        ],
      },
      injectManifest: {
        injectionPoint: "self.__WB_MANIFEST",
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));