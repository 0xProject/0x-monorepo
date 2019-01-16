import * as chai from 'chai';
import 'mocha';

import {
    getMetamaskTrustedTokensAsync,
    getZeroExTrustedTokensAsync,
    MetamaskTrustedTokens,
    ZeroExTrustedTokens,
} from '../../../src/data_sources/trusted_tokens';
import { chaiSetup } from '../../utils/chai_setup';

const METAMASK_TRUSTED_TOKENS_URL =
    'https://raw.githubusercontent.com/MetaMask/eth-contract-metadata/d45916c533116510cc8e9e048a8b5fc3732a6b6d/contract-map.json';

const ZEROEX_TRUSTED_TOKENS_URL = 'https://website-api.0xproject.com/tokens';

const ZEROEX_CONTRACT_ADDRESS = '0xE41d2489571d322189246DaFA5ebDe1F4699F498';

const ZRX_DECIMALS = 18;

chaiSetup.configure();
const expect = chai.expect;

describe('Trusted tokens', () => {
    it('from Metamask should include ZRX', async () => {
        const tokens: MetamaskTrustedTokens = await getMetamaskTrustedTokensAsync(METAMASK_TRUSTED_TOKENS_URL);
        expect(ZEROEX_CONTRACT_ADDRESS in tokens).to.be.true();
        const zrxToken = tokens[ZEROEX_CONTRACT_ADDRESS];
        expect(zrxToken.name).to.equal('0x');
        expect(zrxToken.symbol).to.equal('ZRX');
        expect(zrxToken.decimals).to.equal(ZRX_DECIMALS);
        expect(zrxToken.erc20).to.be.true();
    });
    it('from 0x should include ZRX', async () => {
        const tokens: ZeroExTrustedTokens = await getZeroExTrustedTokensAsync(ZEROEX_TRUSTED_TOKENS_URL);
        const zrxToken = tokens.find(token => token.address === ZEROEX_CONTRACT_ADDRESS.toLowerCase());
        expect(zrxToken).to.not.be.undefined();
        if (zrxToken === undefined) {
            // without this check tsc complains that later statements could have zrxToken undefined
            throw new Error('wtf');
        }
        expect(zrxToken.name).to.equal('0x');
        expect(zrxToken.symbol).to.equal('ZRX');
        expect(zrxToken.decimals).to.equal(ZRX_DECIMALS);
    });
});
