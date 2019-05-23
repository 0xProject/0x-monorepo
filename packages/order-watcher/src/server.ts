import { getContractAddressesForNetworkOrThrow } from '@0x/contract-addresses';
import { RPCSubprovider, Web3ProviderEngine } from '@0x/subproviders';
import { providerUtils } from '@0x/utils';
import * as _ from 'lodash';

import { OrderWatcherWebSocketServer } from './order_watcher/order_watcher_web_socket_server';

const GANACHE_NETWORK_ID = 50;
const DEFAULT_RPC_URL = 'http://localhost:8545';

const provider = new Web3ProviderEngine();
const jsonRpcUrl = process.env.JSON_RPC_URL || DEFAULT_RPC_URL;
const rpcSubprovider = new RPCSubprovider(jsonRpcUrl);
provider.addProvider(rpcSubprovider);
providerUtils.startProviderEngine(provider);

const networkId = process.env.NETWORK_ID !== undefined ? _.parseInt(process.env.NETWORK_ID) : GANACHE_NETWORK_ID;

const contractAddressesString = process.env.contractAddresses;
const contractAddressesIfExists =
    contractAddressesString === undefined
        ? getContractAddressesForNetworkOrThrow(networkId)
        : JSON.parse(contractAddressesString);

const orderWatcherConfig: any = {
    isVerbose: process.env.IS_VERBOSE === 'true',
};
const orderExpirationCheckingIntervalMs = process.env.ORDER_EXPIRATION_CHECKING_INTERVAL_MS;
if (orderExpirationCheckingIntervalMs !== undefined) {
    orderWatcherConfig.orderExpirationCheckingIntervalMs = _.parseInt(orderExpirationCheckingIntervalMs);
}
const eventPollingIntervalMs = process.env.EVENT_POLLING_INTERVAL_MS;
if (eventPollingIntervalMs !== undefined) {
    orderWatcherConfig.eventPollingIntervalMs = _.parseInt(eventPollingIntervalMs);
}
const expirationMarginMs = process.env.EXPIRATION_MARGIN_MS;
if (expirationMarginMs !== undefined) {
    orderWatcherConfig.expirationMarginMs = _.parseInt(expirationMarginMs);
}
const cleanupJobIntervalMs = process.env.CLEANUP_JOB_INTERVAL_MS;
if (cleanupJobIntervalMs !== undefined) {
    orderWatcherConfig.cleanupJobIntervalMs = _.parseInt(cleanupJobIntervalMs);
}
const wsServer = new OrderWatcherWebSocketServer(provider, networkId, contractAddressesIfExists, orderWatcherConfig);
wsServer.start();
