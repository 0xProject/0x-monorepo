import promisify = require('es6-promisify');
import * as Web3 from 'web3';

import {Web3Wrapper} from './web3_wrapper';

export const network = {
    async getNetworkIdIfExistsAsync(port: number): Promise<number> {
        const url = `http://localhost:${port}`;
        const web3Provider = new Web3.providers.HttpProvider(url);
        const defaults = {};
        const web3Wrapper = new Web3Wrapper(web3Provider, defaults);
        const networkIdIfExists = await web3Wrapper.getNetworkIdIfExistsAsync();
        return networkIdIfExists;
    },
};
