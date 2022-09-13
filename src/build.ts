import {prepare} from './utils/index';
import {prepareClient} from './utils/client';
import {prepareServer} from './utils/server';

export const build = async () => {
    await prepare();

    await prepareClient();

    await prepareServer();
};
