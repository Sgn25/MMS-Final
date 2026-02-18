const { getDefaultConfig } = require("@expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const exclusionList = require('metro-config/src/defaults/exclusionList');

const config = getDefaultConfig(__dirname);

// Robust exclusion for Windows: ignore deep native directories
config.resolver.blacklistRE = exclusionList([
    /.*\/android\/.*/,
    /.*\/ios\/.*/,
    /.*\.git\/.*/
]);

module.exports = withNativeWind(config, { input: "./global.css" });
