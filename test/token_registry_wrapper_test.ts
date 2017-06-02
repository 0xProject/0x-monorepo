import * as _ from 'lodash';
import 'mocha';
import * as chai from 'chai';
import chaiAsPromised = require('chai-as-promised');
import * as Web3 from 'web3';
import {web3Factory} from './utils/web3_factory';
import {ZeroEx} from '../src/0x.js';
import {BlockchainLifecycle} from './utils/blockchain_lifecycle';
import {Token} from '../src/types';
import {SchemaValidator} from '../src/utils/schema_validator';
import {tokenSchema} from '../src/schemas/token_schema';

chai.config.includeStack = true;
const expect = chai.expect;
chai.use(chaiAsPromised);
const blockchainLifecycle = new BlockchainLifecycle();

const TOKEN_REGISTRY_SIZE_AFTER_MIGRATION = 7;

describe('TokenRegistryWrapper', () => {
    let zeroEx: ZeroEx;
    before(async () => {
        const web3 = web3Factory.create();
        zeroEx = new ZeroEx(web3);
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
});
