import 'reflect-metadata';
import { Connection, ConnectionOptions, createConnection } from 'typeorm';

import { MetamaskTrustedTokenMeta, TrustedTokenSource, ZeroExTrustedTokenMeta } from '../data_sources/trusted_tokens';
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
    await getMetamaskTrustedTokensAsync();
    await getZeroExTrustedTokensAsync();
    process.exit(0);
})().catch(handleError);

async function getMetamaskTrustedTokensAsync(): Promise<void> {
    // tslint:disable-next-line:no-console
    console.log('Getting latest metamask trusted tokens list ...');
    const trustedTokensRepository = connection.getRepository(TokenMetadata);
    const trustedTokensSource = new TrustedTokenSource<Map<string, MetamaskTrustedTokenMeta>>(
        METAMASK_TRUSTED_TOKENS_URL,
    );
    const resp = await trustedTokensSource.getTrustedTokenMetaAsync();
    const trustedTokens = parseMetamaskTrustedTokens(resp);
    // tslint:disable-next-line:no-console
    console.log('Saving metamask trusted tokens list');
    await trustedTokensRepository.save(trustedTokens);
    // tslint:disable-next-line:no-console
    console.log('Done saving metamask trusted tokens.');
}

async function getZeroExTrustedTokensAsync(): Promise<void> {
    // tslint:disable-next-line:no-console
    console.log('Getting latest 0x trusted tokens list ...');
    const trustedTokensRepository = connection.getRepository(TokenMetadata);
    const trustedTokensSource = new TrustedTokenSource<ZeroExTrustedTokenMeta[]>(ZEROEX_TRUSTED_TOKENS_URL);
    const resp = await trustedTokensSource.getTrustedTokenMetaAsync();
    const trustedTokens = parseZeroExTrustedTokens(resp);
    // tslint:disable-next-line:no-console
    console.log('Saving metamask trusted tokens list');
    await trustedTokensRepository.save(trustedTokens);
    // tslint:disable-next-line:no-console
    console.log('Done saving metamask trusted tokens.');
}
