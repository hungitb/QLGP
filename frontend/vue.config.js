require("dotenv").config({ path: ["../.env", "../default.env"] });
const { defineConfig } = require("@vue/cli-service");
const { EnvironmentPlugin, DefinePlugin } = require("webpack");
module.exports = defineConfig({
  transpileDependencies: ["vuetify"],
  configureWebpack: {
    plugins: [
      new EnvironmentPlugin([
        "NODE_ENV",
        "GENERATE_FAKE_DATA",
        "QLGP_REQUIRE_LOGIN",
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
