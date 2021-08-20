"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const config_1 = require("./lib/config");
const exec_context_1 = require("./lib/exec-context");
const hash_1 = require("./lib/hash");
const paths_1 = require("./lib/paths");
function getOption(jestConfig) {
    if (!Array.isArray(jestConfig.transform))
        return {};
    for (const [, entryPoint, opts] of jestConfig.transform) {
        if (entryPoint.endsWith('graphql-let/jestTransformer.js'))
            return opts;
    }
    return {};
}
const jestTransformer = {
    getCacheKey(fileData, filename, configString) {
        return hash_1.createHash(fileData + filename + configString + 'graphql-let');
    },
    process(input, filePath, jestConfig, transformOptions) {
        const { rootDir: cwd } = jestConfig.config;
        const { configFile, subsequentTransformer } = getOption(jestConfig);
        const [config, configHash] = config_1.loadConfigSync(cwd, configFile);
        const { execContext } = exec_context_1.createExecContextSync(cwd, config, configHash);
        const { tsxFullPath } = paths_1.createPaths(execContext, path_1.relative(cwd, filePath));
        const tsxContent = fs_1.readFileSync(tsxFullPath, 'utf-8');
        // Let users customize a subsequent transformer
        if (subsequentTransformer) {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            return require(subsequentTransformer).process(tsxContent, tsxFullPath, jestConfig, transformOptions);
        }
        // "babel-jest" by default
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { createTransformer } = require('babel-jest');
        const babelTransformer = createTransformer({ cwd: cwd });
        return babelTransformer.process(tsxContent, tsxFullPath, jestConfig, transformOptions);
    },
};
exports.default = jestTransformer;
