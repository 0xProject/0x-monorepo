import * as _ from 'lodash';
import 'mocha';
import * as chai from 'chai';
import {chaiSetup} from './utils/chai_setup';
import {web3Factory} from './utils/web3_factory';
import {ZeroEx} from '../src';
import {BlockchainLifecycle} from './utils/blockchain_lifecycle';
import {SchemaValidator} from '../src/utils/schema_validator';
import {tokenSchema} from '../src/schemas/token_schema';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle();

const TOKEN_REGISTRY_SIZE_AFTER_MIGRATION = 7;

describe('TokenRegistryWrapper', () => {
    let zeroEx: ZeroEx;
    before(async () => {
        const web3 = web3Factory.create();
        zeroEx = new ZeroEx(web3.currentProvider);
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('#getTokensAsync', () => {
        it('should return all the tokens added to the tokenRegistry during the migration', async () => {
            const tokens = await zeroEx.tokenRegistry.getTokensAsync();
            expect(tokens).to.have.lengthOf(TOKEN_REGISTRY_SIZE_AFTER_MIGRATION);

            const schemaValidator = new SchemaValidator();
            _.each(tokens, token => {
                const validationResult = schemaValidator.validate(token, tokenSchema);
                expect(validationResult.errors).to.have.lengthOf(0);
            });
        });
    });
    describe('#getTokenMetadataIfExistsAsync', () => {
        it('should return the token added to the tokenRegistry during the migration', async () => {
            const tokens = await zeroEx.tokenRegistry.getTokensAsync();
            const aToken = tokens[0];

            const token = await zeroEx.tokenRegistry.getTokenMetadataIfExistsAsync(aToken.address);
            const schemaValidator = new SchemaValidator();
            const validationResult = schemaValidator.validate(token, tokenSchema);
            expect(validationResult.errors).to.have.lengthOf(0);
        });
        it('should return return undefined when passed a token address not in the tokenRegistry', async () => {
            const unregisteredTokenAddress = '0x5409ED021D9299bf6814279A6A1411A7e866A631';
            const tokenIfExists = await zeroEx.tokenRegistry.getTokenMetadataIfExistsAsync(unregisteredTokenAddress);
            expect(tokenIfExists).to.be.undefined();
        });
    });
});
