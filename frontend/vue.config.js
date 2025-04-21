require("dotenv").config({ path: "../.env" });
const { defineConfig } = require("@vue/cli-service");
const { DefinePlugin } = require("webpack");

const USED_ENVS = {
  NODE_ENV: "production",
  QLGP_USE_BACKEND: "true",
  QLGP_FRONTEND_GEN_FAKE_DATA: "false"
};

module.exports = defineConfig({
  transpileDependencies: ["vuetify"],
  configureWebpack: {
    plugins: [
      new DefinePlugin(Object.entries(USED_ENVS).reduce((result, [key, value]) => {
        result[key] = process.env[key] || value;
        return result;
      }), {}),
    ],
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
          },
        },
      }
    : {}),
});
