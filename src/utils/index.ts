import fs from 'fs-extra';
import {exec} from 'child_process';
import path from 'path';

export const projectRoot = path.resolve();
export const outputDir = '.vercel/output';
export const staticDir = `${outputDir}/static`;
export const functionsDir = `${outputDir}/functions`;

async function buildNuxt() {
    return new Promise((resolve, reject) => {
        const process = exec('nuxt build --standalone --no-lock');

        process.on('error', (error) => {
            reject(error);
        });

        process.on('close', (code) => {
            resolve(code);
        });
    });
}

export async function prepare() {
    console.info('Cleaning up before run');
    await fs.rm(outputDir, {recursive: true});

    console.info('Creating /dist');
    fs.mkdirSync(`${projectRoot}/dist`);

    console.info('Building nuxt');
    await buildNuxt();
}

//esmodule get absolute path
import {fileURLToPath} from 'url';
import {dirname} from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
console.log(__dirname);
