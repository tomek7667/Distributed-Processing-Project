const CopyPlugin = require("copy-webpack-plugin");
const path = require("path");
const { merge } = require("webpack-merge");
const baseConfig = require("./config.base.js");

module.exports = merge(baseConfig, {
	entry: path.resolve(__dirname, "../master/app.ts"),
	mode: "development",
	output: {
		filename: "app.js",
		path: path.resolve(__dirname, "../dist/"),
	},
	plugins: [],
});
