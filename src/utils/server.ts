import fs from 'fs-extra';
import {exec} from 'child_process';

import {projectRoot, outputDir, functionsDir} from '.';

async function extractServer() {
    await fs.copy('.nuxt/dist/server', `${functionsDir}/index.func/.nuxt/dist/server`);
    // await fs.copy('assets', `${functionsDir}/index.func`);
    await fs.copyFile('nuxt.config.js', `${functionsDir}/index.func/nuxt.config.js`);
}

function createConfig() {
    const config = {
        version: 3,
        routes: [
            {
                src: '/sw.js',
                headers: {
                    'cache-control': 'no-cache',
                },
                continue: true,
            },
            {
                src: '/_nuxt/(.*)',
                headers: {
                    'cache-control': 'public,max-age=31536000,immutable',
                },
                continue: true,
            },
            {
                handle: 'filesystem',
            },
            {
                src: '^/api(/.*)?$',
                status: 404,
            },
            {
                src: '/(.*)',
                dest: '/',
            },
            {
                handle: 'error',
            },
            {
                status: 404,
                src: '^(?!/api).*$',
                dest: '/404.html',
            },
            {
                handle: 'miss',
            },
            {
                src: '^/api/(.+)(?:\\.(?:js))$',
                dest: '/api/$1',
                check: true,
            },
        ],
    };

    fs.writeFileSync(`${outputDir}/config.json`, JSON.stringify(config));
}

async function buildPackageJson() {
    const packageStr = await fs.readFile('package.json', {encoding: 'utf-8'});
    const _package = JSON.parse(packageStr);

    // # Remove unecessary properties
    const keys = Object.keys(_package);
    keys.forEach((key) => {
        // ! Add to config
        const allowed = ['private', 'license', 'scripts', 'dependencies'];
        if (!allowed.includes(key)) delete _package[key];
    });

    // # Remove nuxt form dependencies
    for (const distro of ['nuxt', 'nuxt-start']) {
        for (const suffix of ['-edge', '']) {
            delete _package.dependencies[distro + suffix];
        }
    }

    // # Add @nuxt/core & esm to dependencies
    _package.dependencies['@nuxt/core'] = '^2.15.8';
    _package.dependencies['esm'] = '^3.2.25';

    await fs.writeFile(`${functionsDir}/index.func/package.json`, JSON.stringify(_package));
}

function installPackages() {
    const yarnCachePath = `${projectRoot}/.vercel_cache/yarn`;
    return new Promise((resolve, reject) => {
        const options = {
            cwd: `${functionsDir}/index.func/`,
            // env: {
            //     NPM_ONLY_PRODUCTION: 'true',
            // },
        };
        const process = exec(`yarn --frozen-lockfile --non-interactive --production --cache-folder=${yarnCachePath}`, options);

        process.on('error', (error) => {
            reject(error);
        });

        process.on('close', (code) => {
            resolve(code);
        });
    });
}

export async function prepareServer() {
    console.info('Copying server files from .nuxt');
    await extractServer();

    console.info('Creating Lambda config');
    createConfig();

    try {
        console.info('Build package.json for Lambda');
        await buildPackageJson();
        console.info('Install dependencies for Lambda');
        await installPackages();
    } catch (error) {
        console.error(error);
    }
}
