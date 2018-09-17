import { ExchangeEvents, ZeroEx } from '0x.js';
import * as dotenv from 'dotenv';
import * as Web3 from 'web3';
dotenv.config();
const provider = new Web3.providers.HttpProvider(process.env.WEB3_PROVIDER_URL);
const web3 = new Web3(provider);
const MAINNET = 1;
const zrx = new ZeroEx(provider, {
    networkId: MAINNET,
});
export { web3, zrx };
