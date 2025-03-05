require("dotenv").config({ path: "../.env" });
const { defineConfig } = require("@vue/cli-service");
const { EnvironmentPlugin } = require("webpack");

module.exports = defineConfig({
  transpileDependencies: ["vuetify"],
  configureWebpack: {
    plugins: [
      new EnvironmentPlugin([
        "NODE_ENV",
        "QLGP_USE_BACKEND",
      ]),
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
