'use strict';

Object.defineProperty(exports, '__esModule', {value: true});

const startTime = process.hrtime();
let nuxtConfig;
const loaders = [
    {name: 'jiti', args: []},
    {
        name: 'esm',
        args: [
            module,
            {
                cjs: {
                    dedefault: true,
                },
            },
        ],
    },
];
for (const {name, args} of loaders) {
    try {
        const load = require(name)(...args);
        const config = load('./nuxt.config.js');
        nuxtConfig = config.default || config;
        break;
    } catch (err) {
        if (name === 'esm') {
            throw new Error(`Could not load Nuxt configuration. Make sure all dependencies are listed in package.json dependencies or in serverFiles within builder options:
 ${err}`);
        }
    }
}
const {Nuxt} = require('@nuxt/core');
const nuxt = new Nuxt({
    _start: true,
    ...nuxtConfig,
});
let isReady = false;
const readyPromise = nuxt
    .ready()
    .then(() => {
        isReady = true;
        const hrTime = process.hrtime(startTime);
        const hrTimeMs = (hrTime[0] * 1e9 + hrTime[1]) / 1e6;
        console.log(`\u03BB Cold start took: ${hrTimeMs}ms`);
    })
    .catch((error) => {
        console.error('\u03BB Error while initializing nuxt:', error);
        process.exit(1);
    });
const {Server} = require('http');
const {Bridge} = require('./vercel__bridge.js');
const requestListener = async (req, res) => {
    if (!isReady) {
        await readyPromise;
    }
    nuxt.server.app(req, res);
};
const server = new Server(requestListener);
const bridge = new Bridge(server);
bridge.listen();
{
    const internalServer = new Server(requestListener);
    internalServer.listen(3e3, '127.0.0.1');
}
const launcher = bridge.launcher;

exports.default = launcher;
