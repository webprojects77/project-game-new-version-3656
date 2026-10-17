const { getDefaultConfig } = require("expo/metro-config");
const { resolve } = require("path");

const config = getDefaultConfig(__dirname);

const workspaceRoot = resolve(__dirname, "../..");

config.watchFolders = [workspaceRoot];
config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [resolve(__dirname, "node_modules"), resolve(workspaceRoot, "node_modules")],
};

module.exports = config;
