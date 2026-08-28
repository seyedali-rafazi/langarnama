// vite.config.ts
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, loadEnv } from "file:///D:/web%20project/langarnama/lng/node_modules/vite/dist/node/index.js";
import react from "file:///D:/web%20project/langarnama/lng/node_modules/@vitejs/plugin-react/dist/index.js";
var __vite_injected_original_dirname = "D:\\web project\\langarnama\\lng";
var SITEMAP_ROUTES = ["/", "/ship"];
function seoSitemapPlugin(siteUrl) {
  return {
    name: "seo-sitemap",
    closeBundle() {
      const base = siteUrl.replace(/\/$/, "");
      const urls = SITEMAP_ROUTES.map(
        (route) => `  <url>
    <loc>${base}${route === "/" ? "/" : route}</loc>
    <changefreq>weekly</changefreq>
    <priority>${route === "/" ? "1.0" : "0.8"}</priority>
  </url>`
      ).join("\n");
      writeFileSync(
        resolve(__vite_injected_original_dirname, "dist/sitemap.xml"),
        `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
      );
    }
  };
}
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const siteUrl = env.VITE_SITE_URL || "https://www.langarnama.ir";
  const backendTarget = env.VITE_BACKEND_TARGET || "http://127.0.0.1:8000";
  return {
    plugins: [react(), seoSitemapPlugin(siteUrl)],
    envPrefix: ["VITE_", "REACT_APP_"],
    resolve: {
      alias: [
        {
          find: /^maplibre-gl$/,
          replacement: resolve(__vite_injected_original_dirname, "node_modules/maplibre-gl/dist/maplibre-gl.js")
        }
      ]
    },
    optimizeDeps: {
      include: ["maplibre-gl", "react-map-gl/maplibre"]
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: backendTarget,
          changeOrigin: true,
          ws: true
        },
        "/ws": {
          target: backendTarget,
          ws: true,
          changeOrigin: true
        }
      }
    },
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("@tanstack/react-query")) {
                return "vendor-query";
              }
              if (id.includes("maplibre-gl") || id.includes("mapbox-gl") || id.includes("react-map-gl")) {
                return "vendor-maplibre";
              }
              if (id.includes("@deck.gl") || id.includes("@loaders.gl")) {
                return "vendor-deckgl";
              }
              if (id.includes("@mui") || id.includes("@emotion")) {
                return "vendor-mui";
              }
            }
          }
        }
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFx3ZWIgcHJvamVjdFxcXFxsYW5nYXJuYW1hXFxcXGxuZ1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcd2ViIHByb2plY3RcXFxcbGFuZ2FybmFtYVxcXFxsbmdcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L3dlYiUyMHByb2plY3QvbGFuZ2FybmFtYS9sbmcvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyB3cml0ZUZpbGVTeW5jIH0gZnJvbSAnbm9kZTpmcydcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdub2RlOnBhdGgnXG5pbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuXG5jb25zdCBTSVRFTUFQX1JPVVRFUyA9IFsnLycsICcvc2hpcCddXG5cbmZ1bmN0aW9uIHNlb1NpdGVtYXBQbHVnaW4oc2l0ZVVybDogc3RyaW5nKSB7XG4gIHJldHVybiB7XG4gICAgbmFtZTogJ3Nlby1zaXRlbWFwJyxcbiAgICBjbG9zZUJ1bmRsZSgpIHtcbiAgICAgIGNvbnN0IGJhc2UgPSBzaXRlVXJsLnJlcGxhY2UoL1xcLyQvLCAnJylcbiAgICAgIGNvbnN0IHVybHMgPSBTSVRFTUFQX1JPVVRFUy5tYXAoXG4gICAgICAgIChyb3V0ZSkgPT4gYCAgPHVybD5cXG4gICAgPGxvYz4ke2Jhc2V9JHtyb3V0ZSA9PT0gJy8nID8gJy8nIDogcm91dGV9PC9sb2M+XFxuICAgIDxjaGFuZ2VmcmVxPndlZWtseTwvY2hhbmdlZnJlcT5cXG4gICAgPHByaW9yaXR5PiR7cm91dGUgPT09ICcvJyA/ICcxLjAnIDogJzAuOCd9PC9wcmlvcml0eT5cXG4gIDwvdXJsPmBcbiAgICAgICkuam9pbignXFxuJylcblxuICAgICAgd3JpdGVGaWxlU3luYyhcbiAgICAgICAgcmVzb2x2ZShfX2Rpcm5hbWUsICdkaXN0L3NpdGVtYXAueG1sJyksXG4gICAgICAgIGA8P3htbCB2ZXJzaW9uPVwiMS4wXCIgZW5jb2Rpbmc9XCJVVEYtOFwiPz5cXG48dXJsc2V0IHhtbG5zPVwiaHR0cDovL3d3dy5zaXRlbWFwcy5vcmcvc2NoZW1hcy9zaXRlbWFwLzAuOVwiPlxcbiR7dXJsc31cXG48L3VybHNldD5cXG5gXG4gICAgICApXG4gICAgfSxcbiAgfVxufVxuXG4vLyBodHRwczovL3ZpdGUuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCBwcm9jZXNzLmN3ZCgpLCAnJylcbiAgY29uc3Qgc2l0ZVVybCA9IGVudi5WSVRFX1NJVEVfVVJMIHx8ICdodHRwczovL3d3dy5sYW5nYXJuYW1hLmlyJ1xuICBjb25zdCBiYWNrZW5kVGFyZ2V0ID0gZW52LlZJVEVfQkFDS0VORF9UQVJHRVQgfHwgJ2h0dHA6Ly8xMjcuMC4wLjE6ODAwMCdcblxuICByZXR1cm4ge1xuICAgIHBsdWdpbnM6IFtyZWFjdCgpLCBzZW9TaXRlbWFwUGx1Z2luKHNpdGVVcmwpXSxcbiAgICBlbnZQcmVmaXg6IFsnVklURV8nLCAnUkVBQ1RfQVBQXyddLFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBmaW5kOiAvXm1hcGxpYnJlLWdsJC8sXG4gICAgICAgICAgcmVwbGFjZW1lbnQ6IHJlc29sdmUoX19kaXJuYW1lLCAnbm9kZV9tb2R1bGVzL21hcGxpYnJlLWdsL2Rpc3QvbWFwbGlicmUtZ2wuanMnKSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgICBvcHRpbWl6ZURlcHM6IHtcbiAgICAgIGluY2x1ZGU6IFsnbWFwbGlicmUtZ2wnLCAncmVhY3QtbWFwLWdsL21hcGxpYnJlJ10sXG4gICAgfSxcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIHBvcnQ6IDUxNzMsXG4gICAgICBwcm94eToge1xuICAgICAgICAnL2FwaSc6IHtcbiAgICAgICAgICB0YXJnZXQ6IGJhY2tlbmRUYXJnZXQsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICAgIHdzOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICAnL3dzJzoge1xuICAgICAgICAgIHRhcmdldDogYmFja2VuZFRhcmdldCxcbiAgICAgICAgICB3czogdHJ1ZSxcbiAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gICAgYnVpbGQ6IHtcbiAgICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTIwMCxcbiAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgb3V0cHV0OiB7XG4gICAgICAgICAgbWFudWFsQ2h1bmtzKGlkKSB7XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcycpKSB7XG4gICAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5JykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ3ZlbmRvci1xdWVyeSdcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ21hcGxpYnJlLWdsJykgfHwgaWQuaW5jbHVkZXMoJ21hcGJveC1nbCcpIHx8IGlkLmluY2x1ZGVzKCdyZWFjdC1tYXAtZ2wnKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAndmVuZG9yLW1hcGxpYnJlJ1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnQGRlY2suZ2wnKSB8fCBpZC5pbmNsdWRlcygnQGxvYWRlcnMuZ2wnKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAndmVuZG9yLWRlY2tnbCdcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ0BtdWknKSB8fCBpZC5pbmNsdWRlcygnQGVtb3Rpb24nKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAndmVuZG9yLW11aSdcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gIH1cbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQW1SLFNBQVMscUJBQXFCO0FBQ2pULFNBQVMsZUFBZTtBQUN4QixTQUFTLGNBQWMsZUFBZTtBQUN0QyxPQUFPLFdBQVc7QUFIbEIsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTSxpQkFBaUIsQ0FBQyxLQUFLLE9BQU87QUFFcEMsU0FBUyxpQkFBaUIsU0FBaUI7QUFDekMsU0FBTztBQUFBLElBQ0wsTUFBTTtBQUFBLElBQ04sY0FBYztBQUNaLFlBQU0sT0FBTyxRQUFRLFFBQVEsT0FBTyxFQUFFO0FBQ3RDLFlBQU0sT0FBTyxlQUFlO0FBQUEsUUFDMUIsQ0FBQyxVQUFVO0FBQUEsV0FBcUIsSUFBSSxHQUFHLFVBQVUsTUFBTSxNQUFNLEtBQUs7QUFBQTtBQUFBLGdCQUE4RCxVQUFVLE1BQU0sUUFBUSxLQUFLO0FBQUE7QUFBQSxNQUMvSixFQUFFLEtBQUssSUFBSTtBQUVYO0FBQUEsUUFDRSxRQUFRLGtDQUFXLGtCQUFrQjtBQUFBLFFBQ3JDO0FBQUE7QUFBQSxFQUF5RyxJQUFJO0FBQUE7QUFBQTtBQUFBLE1BQy9HO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRjtBQUdBLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBQ3hDLFFBQU0sTUFBTSxRQUFRLE1BQU0sUUFBUSxJQUFJLEdBQUcsRUFBRTtBQUMzQyxRQUFNLFVBQVUsSUFBSSxpQkFBaUI7QUFDckMsUUFBTSxnQkFBZ0IsSUFBSSx1QkFBdUI7QUFFakQsU0FBTztBQUFBLElBQ0wsU0FBUyxDQUFDLE1BQU0sR0FBRyxpQkFBaUIsT0FBTyxDQUFDO0FBQUEsSUFDNUMsV0FBVyxDQUFDLFNBQVMsWUFBWTtBQUFBLElBQ2pDLFNBQVM7QUFBQSxNQUNQLE9BQU87QUFBQSxRQUNMO0FBQUEsVUFDRSxNQUFNO0FBQUEsVUFDTixhQUFhLFFBQVEsa0NBQVcsOENBQThDO0FBQUEsUUFDaEY7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsY0FBYztBQUFBLE1BQ1osU0FBUyxDQUFDLGVBQWUsdUJBQXVCO0FBQUEsSUFDbEQ7QUFBQSxJQUNBLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE9BQU87QUFBQSxRQUNMLFFBQVE7QUFBQSxVQUNOLFFBQVE7QUFBQSxVQUNSLGNBQWM7QUFBQSxVQUNkLElBQUk7QUFBQSxRQUNOO0FBQUEsUUFDQSxPQUFPO0FBQUEsVUFDTCxRQUFRO0FBQUEsVUFDUixJQUFJO0FBQUEsVUFDSixjQUFjO0FBQUEsUUFDaEI7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsT0FBTztBQUFBLE1BQ0wsdUJBQXVCO0FBQUEsTUFDdkIsZUFBZTtBQUFBLFFBQ2IsUUFBUTtBQUFBLFVBQ04sYUFBYSxJQUFJO0FBQ2YsZ0JBQUksR0FBRyxTQUFTLGNBQWMsR0FBRztBQUMvQixrQkFBSSxHQUFHLFNBQVMsdUJBQXVCLEdBQUc7QUFDeEMsdUJBQU87QUFBQSxjQUNUO0FBQ0Esa0JBQUksR0FBRyxTQUFTLGFBQWEsS0FBSyxHQUFHLFNBQVMsV0FBVyxLQUFLLEdBQUcsU0FBUyxjQUFjLEdBQUc7QUFDekYsdUJBQU87QUFBQSxjQUNUO0FBQ0Esa0JBQUksR0FBRyxTQUFTLFVBQVUsS0FBSyxHQUFHLFNBQVMsYUFBYSxHQUFHO0FBQ3pELHVCQUFPO0FBQUEsY0FDVDtBQUNBLGtCQUFJLEdBQUcsU0FBUyxNQUFNLEtBQUssR0FBRyxTQUFTLFVBQVUsR0FBRztBQUNsRCx1QkFBTztBQUFBLGNBQ1Q7QUFBQSxZQUNGO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
