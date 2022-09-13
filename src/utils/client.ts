import fs from 'fs-extra';
import {staticDir} from '.';

async function extractStatic() {
    await fs.copy('.nuxt/dist/client', `${staticDir}/_nuxt`);
}

export async function prepareClient() {
    console.info('Copying client files from .nuxt');
    await extractStatic();
}
