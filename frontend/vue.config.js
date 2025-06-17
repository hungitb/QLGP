require("dotenv").config({ path: "../.env" });
const { defineConfig } = require("@vue/cli-service");
const { EnvironmentPlugin } = require("webpack");

const USED_ENV_VARS = {
  NODE_ENV: "production",
  QLGP_USE_BACKEND: "true",
  QLGP_FRONTEND_GEN_FAKE_DATA: "false",
};

Object.entries(USED_ENV_VARS).forEach(([k, v]) => {
  process.env[k] = process.env[k] || v;
});

module.exports = defineConfig({
  transpileDependencies: ["vuetify"],
  configureWebpack: {
    plugins: [new EnvironmentPlugin(Object.keys(USED_ENV_VARS))],
  },
  ...(process.env.QLGP_USE_BACKEND == "true"
    ? {
        devServer: {
          proxy: {
            "/api": {
              target: "http://localhost:" + process.env.QLGP_BACKEND_PORT,
              changeOrigin: true,
              pathRewrite: { "^/api": "/api" },
            },
            "/images": {
              target: "http://localhost:" + process.env.QLGP_BACKEND_PORT,
              changeOrigin: true,
              pathRewrite: { "^/images": "/images" },
            },
          },
        },
      }
    : {}),
});
