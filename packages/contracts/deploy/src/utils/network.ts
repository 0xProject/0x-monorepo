import {promisify} from '@0xproject/utils';
import {Web3Wrapper} from '@0xproject/web3-wrapper';
import * as _ from 'lodash';
import * as Web3 from 'web3';

export const network = {
    async getNetworkIdIfExistsAsync(port: number): Promise<number> {
        const url = `http://localhost:${port}`;
        const web3Provider = new Web3.providers.HttpProvider(url);
        const web3 = new Web3(web3Provider);
        const networkId = _.parseInt(await promisify<string>(web3.version.getNetwork)());
        return networkId;
    },
};
