import * as R from 'ramda';

import { RelayerResponse, RelayerResponseNetwork } from '../../data_sources/relayer-registry';
import { Relayer } from '../../entities';

export function parseRelayers(rawResp: Map<string, RelayerResponse>): Relayer[] {
    const parsedAsObject = R.mapObjIndexed(parseRelayer, rawResp);
    return R.values(parsedAsObject);
}

function parseRelayer(relayerResp: RelayerResponse, uuid: string): Relayer {
    const relayer = new Relayer();
    relayer.uuid = uuid;
    relayer.name = relayerResp.name;
    relayer.url = relayerResp.homepage_url;
    relayer.appUrl = relayerResp.app_url;
    const mainnet = getMainNetwork(relayerResp);
    if (mainnet !== undefined) {
        relayer.sraHttpEndpoint = mainnet.sra_http_endpoint || null;
        relayer.sraWsEndpoint = mainnet.sra_ws_endpoint || null;
        relayer.feeRecipientAddresses = R.path(['static_order_fields', 'fee_recipient_addresses'], mainnet) || [];
        relayer.takerAddresses = R.path(['static_order_fields', 'taker_addresses'], mainnet) || [];
    } else {
        relayer.feeRecipientAddresses = [];
        relayer.takerAddresses = [];
    }
    return relayer;
}

function getMainNetwork(relayerResp: RelayerResponse): RelayerResponseNetwork | undefined {
    return R.find(network => network.networkId === 1, relayerResp.networks);
}
