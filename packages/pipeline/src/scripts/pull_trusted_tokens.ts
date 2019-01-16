import 'reflect-metadata';
import { Connection, ConnectionOptions, createConnection } from 'typeorm';

import { logUtils } from '@0x/utils';

import { getMetamaskTrustedTokensAsync, getZeroExTrustedTokensAsync } from '../data_sources/trusted_tokens';
import { TokenMetadata } from '../entities';
import * as ormConfig from '../ormconfig';
import { parseMetamaskTrustedTokens, parseZeroExTrustedTokens } from '../parsers/token_metadata';
import { handleError } from '../utils';

const METAMASK_TRUSTED_TOKENS_URL =
    'https://raw.githubusercontent.com/MetaMask/eth-contract-metadata/d45916c533116510cc8e9e048a8b5fc3732a6b6d/contract-map.json';

const ZEROEX_TRUSTED_TOKENS_URL = 'https://website-api.0xproject.com/tokens';

let connection: Connection;

(async () => {
    connection = await createConnection(ormConfig as ConnectionOptions);
    await getAndSaveMetamaskTrustedTokensAsync();
    await getAndSaveZeroExTrustedTokensAsync();
    process.exit(0);
})().catch(handleError);

async function getAndSaveMetamaskTrustedTokensAsync(): Promise<void> {
    logUtils.log('Getting latest metamask trusted tokens list ...');
    const trustedTokensRepository = connection.getRepository(TokenMetadata);
    const metamaskTrustedTokens = await getMetamaskTrustedTokensAsync(METAMASK_TRUSTED_TOKENS_URL);
    const trustedTokens = parseMetamaskTrustedTokens(metamaskTrustedTokens);
    logUtils.log('Saving metamask trusted tokens list');
    await trustedTokensRepository.save(trustedTokens);
    logUtils.log('Done saving metamask trusted tokens.');
}

async function getAndSaveZeroExTrustedTokensAsync(): Promise<void> {
    logUtils.log('Getting latest 0x trusted tokens list ...');
    const trustedTokensRepository = connection.getRepository(TokenMetadata);
    const zeroexTrustedTokens = await getZeroExTrustedTokensAsync(ZEROEX_TRUSTED_TOKENS_URL);
    const trustedTokens = parseZeroExTrustedTokens(zeroexTrustedTokens);
    logUtils.log('Saving metamask trusted tokens list');
    await trustedTokensRepository.save(trustedTokens);
    logUtils.log('Done saving metamask trusted tokens.');
}
