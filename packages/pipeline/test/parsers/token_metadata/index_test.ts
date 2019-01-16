import * as chai from 'chai';
import 'mocha';

import { MetamaskTrustedTokenMeta, ZeroExTrustedTokenMeta } from '../../../src/data_sources/trusted_tokens';
import { TokenMetadata } from '../../../src/entities';
import { parseMetamaskTrustedTokens, parseZeroExTrustedTokens } from '../../../src/parsers/token_metadata';
import { chaiSetup } from '../../utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

const ZEROEX_CONTRACT_ADDRESS = '0xE41d2489571d322189246DaFA5ebDe1F4699F498';

const ZRX_DECIMALS = 18;

const metamaskTrustedToken: MetamaskTrustedTokenMeta = {
    address: ZEROEX_CONTRACT_ADDRESS,
    name: '0x',
    erc20: true,
    symbol: 'ZRX',
    decimals: ZRX_DECIMALS,
};

const zeroexTrustedToken: ZeroExTrustedTokenMeta = {
    address: ZEROEX_CONTRACT_ADDRESS,
    name: '0x',
    symbol: 'ZRX',
    decimals: ZRX_DECIMALS,
};

describe('Token metadata parser', () => {
    it('should parse token metadata from Metamask', () => {
        const tokenMetadatas: TokenMetadata[] = parseMetamaskTrustedTokens({
            [ZEROEX_CONTRACT_ADDRESS]: metamaskTrustedToken,
        });
        expect(tokenMetadatas[0].address).to.equal(ZEROEX_CONTRACT_ADDRESS);
        expect(tokenMetadatas[0].decimals).to.bignumber.equal(ZRX_DECIMALS);
        expect(tokenMetadatas[0].symbol).to.equal('ZRX');
        expect(tokenMetadatas[0].name).to.equal('0x');
        expect(tokenMetadatas[0].authority).to.equal('metamask');
    });

    it('should parse token metadata from 0x', () => {
        const tokenMetadatas: TokenMetadata[] = parseZeroExTrustedTokens([zeroexTrustedToken]);
        expect(tokenMetadatas[0].address).to.equal(ZEROEX_CONTRACT_ADDRESS);
        expect(tokenMetadatas[0].decimals).to.bignumber.equal(ZRX_DECIMALS);
        expect(tokenMetadatas[0].symbol).to.equal('ZRX');
        expect(tokenMetadatas[0].name).to.equal('0x');
        expect(tokenMetadatas[0].authority).to.equal('0x');
    });
});
