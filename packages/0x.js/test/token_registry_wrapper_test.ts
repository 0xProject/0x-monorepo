import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { schemas, SchemaValidator } from '@0xproject/json-schemas';
import * as chai from 'chai';
import * as _ from 'lodash';
import 'mocha';

import { Token, ZeroEx } from '../src';

import { chaiSetup } from './utils/chai_setup';
import { constants } from './utils/constants';
import { web3Factory } from './utils/web3_factory';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(constants.RPC_URL);

const TOKEN_REGISTRY_SIZE_AFTER_MIGRATION = 7;

describe('TokenRegistryWrapper', () => {
    let zeroEx: ZeroEx;
    let tokens: Token[];
    const tokenAddressBySymbol: { [symbol: string]: string } = {};
    const tokenAddressByName: { [symbol: string]: string } = {};
    const tokenBySymbol: { [symbol: string]: Token } = {};
    const tokenByName: { [symbol: string]: Token } = {};
    const registeredSymbol = 'ZRX';
    const registeredName = '0x Protocol Token';
    const unregisteredSymbol = 'MAL';
    const unregisteredName = 'Malicious Token';
    const config = {
        networkId: constants.TESTRPC_NETWORK_ID,
    };
    before(async () => {
        const web3 = web3Factory.create();
        zeroEx = new ZeroEx(web3.currentProvider, config);
        tokens = await zeroEx.tokenRegistry.getTokensAsync();
        _.map(tokens, token => {
            tokenAddressBySymbol[token.symbol] = token.address;
            tokenAddressByName[token.name] = token.address;
            tokenBySymbol[token.symbol] = token;
            tokenByName[token.name] = token;
        });
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('#getTokensAsync', () => {
        it('should return all the tokens added to the tokenRegistry during the migration', async () => {
            expect(tokens).to.have.lengthOf(TOKEN_REGISTRY_SIZE_AFTER_MIGRATION);

            const schemaValidator = new SchemaValidator();
            _.each(tokens, token => {
                const validationResult = schemaValidator.validate(token, schemas.tokenSchema);
                expect(validationResult.errors).to.have.lengthOf(0);
            });
        });
    });
    describe('#getTokenAddressesAsync', () => {
        it('should return all the token addresses added to the tokenRegistry during the migration', async () => {
            const tokenAddresses = await zeroEx.tokenRegistry.getTokenAddressesAsync();
            expect(tokenAddresses).to.have.lengthOf(TOKEN_REGISTRY_SIZE_AFTER_MIGRATION);

            const schemaValidator = new SchemaValidator();
            _.each(tokenAddresses, tokenAddress => {
                const validationResult = schemaValidator.validate(tokenAddress, schemas.addressSchema);
                expect(validationResult.errors).to.have.lengthOf(0);
                expect(tokenAddress).to.not.be.equal(ZeroEx.NULL_ADDRESS);
            });
        });
    });
    describe('#getTokenAddressBySymbol', () => {
        it('should return correct address for a token in the registry', async () => {
            const tokenAddress = await zeroEx.tokenRegistry.getTokenAddressBySymbolIfExistsAsync(registeredSymbol);
            expect(tokenAddress).to.be.equal(tokenAddressBySymbol[registeredSymbol]);
        });
        it('should return undefined for a token out of registry', async () => {
            const tokenAddress = await zeroEx.tokenRegistry.getTokenAddressBySymbolIfExistsAsync(unregisteredSymbol);
            expect(tokenAddress).to.be.undefined();
        });
    });
    describe('#getTokenAddressByName', () => {
        it('should return correct address for a token in the registry', async () => {
            const tokenAddress = await zeroEx.tokenRegistry.getTokenAddressByNameIfExistsAsync(registeredName);
            expect(tokenAddress).to.be.equal(tokenAddressByName[registeredName]);
        });
        it('should return undefined for a token out of registry', async () => {
            const tokenAddress = await zeroEx.tokenRegistry.getTokenAddressByNameIfExistsAsync(unregisteredName);
            expect(tokenAddress).to.be.undefined();
        });
    });
    describe('#getTokenBySymbol', () => {
        it('should return correct token for a token in the registry', async () => {
            const token = await zeroEx.tokenRegistry.getTokenBySymbolIfExistsAsync(registeredSymbol);
            expect(token).to.be.deep.equal(tokenBySymbol[registeredSymbol]);
        });
        it('should return undefined for a token out of registry', async () => {
            const token = await zeroEx.tokenRegistry.getTokenBySymbolIfExistsAsync(unregisteredSymbol);
            expect(token).to.be.undefined();
        });
    });
    describe('#getTokenByName', () => {
        it('should return correct token for a token in the registry', async () => {
            const token = await zeroEx.tokenRegistry.getTokenByNameIfExistsAsync(registeredName);
            expect(token).to.be.deep.equal(tokenByName[registeredName]);
        });
        it('should return undefined for a token out of registry', async () => {
            const token = await zeroEx.tokenRegistry.getTokenByNameIfExistsAsync(unregisteredName);
            expect(token).to.be.undefined();
        });
    });
    describe('#getTokenIfExistsAsync', () => {
        it('should return the token added to the tokenRegistry during the migration', async () => {
            const aToken = tokens[0];

            const token = await zeroEx.tokenRegistry.getTokenIfExistsAsync(aToken.address);
            const schemaValidator = new SchemaValidator();
            const validationResult = schemaValidator.validate(token, schemas.tokenSchema);
            expect(validationResult.errors).to.have.lengthOf(0);
        });
        it('should return return undefined when passed a token address not in the tokenRegistry', async () => {
            const unregisteredTokenAddress = '0x5409ed021d9299bf6814279a6a1411a7e866a631';
            const tokenIfExists = await zeroEx.tokenRegistry.getTokenIfExistsAsync(unregisteredTokenAddress);
            expect(tokenIfExists).to.be.undefined();
        });
    });
});
