import { BlockchainLifecycle, devConstants, web3Factory } from '@0xproject/dev-utils';
import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import * as _ from 'lodash';
import 'mocha';
import * as path from 'path';
import * as Sinon from 'sinon';

import { ApprovalContractEventArgs, LogWithDecodedArgs, Order, TokenEvents, ZeroEx } from '../src';

import { chaiSetup } from './utils/chai_setup';
import { constants } from './utils/constants';
import { TokenUtils } from './utils/token_utils';
import { provider, web3Wrapper } from './utils/web3_wrapper';

const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
chaiSetup.configure();
const expect = chai.expect;

describe('ZeroEx library', () => {
    let zeroEx: ZeroEx;
    before(async () => {
        const config = {
            networkId: constants.TESTRPC_NETWORK_ID,
        };
        zeroEx = new ZeroEx(provider, config);
    });
    describe('#setProvider', () => {
        it('overrides provider in nested web3s and invalidates contractInstances', async () => {
            // Instantiate the contract instances with the current provider
            await (zeroEx.exchange as any)._getExchangeContractAsync();
            await (zeroEx.tokenRegistry as any)._getTokenRegistryContractAsync();
            expect((zeroEx.exchange as any)._exchangeContractIfExists).to.not.be.undefined();
            expect((zeroEx.tokenRegistry as any)._tokenRegistryContractIfExists).to.not.be.undefined();

            // Add property to newProvider so that we can differentiate it from old provider
            (provider as any).zeroExTestId = 1;
            zeroEx.setProvider(provider, constants.TESTRPC_NETWORK_ID);

            // Check that contractInstances with old provider are removed after provider update
            expect((zeroEx.exchange as any)._exchangeContractIfExists).to.be.undefined();
            expect((zeroEx.tokenRegistry as any)._tokenRegistryContractIfExists).to.be.undefined();

            // Check that all nested zeroExContract/web3Wrapper instances return the updated provider
            const nestedWeb3WrapperProvider = (zeroEx as any)._contractWrappers.getProvider();
            expect(nestedWeb3WrapperProvider.zeroExTestId).to.be.a('number');
            const exchangeWeb3WrapperProvider = (zeroEx.exchange as any)._web3Wrapper.getProvider();
            expect(exchangeWeb3WrapperProvider.zeroExTestId).to.be.a('number');
            const tokenRegistryWeb3WrapperProvider = (zeroEx.tokenRegistry as any)._web3Wrapper.getProvider();
            expect(tokenRegistryWeb3WrapperProvider.zeroExTestId).to.be.a('number');
        });
    });
    describe('#isValidSignature', () => {
        // The Exchange smart contract `isValidSignature` method only validates orderHashes and assumes
        // the length of the data is exactly 32 bytes. Thus for these tests, we use data of this size.
        const dataHex = '0x6927e990021d23b1eb7b8789f6a6feaf98fe104bb0cf8259421b79f9a34222b0';
        const signature = {
            v: 27,
            r: '0x61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351bc33',
            s: '0x40349190569279751135161d22529dc25add4f6069af05be04cacbda2ace2254',
        };
        const address = '0x5409ed021d9299bf6814279a6a1411a7e866a631';
        it("should return false if the data doesn't pertain to the signature & address", async () => {
            return expect(
                (zeroEx.exchange as any)._isValidSignatureUsingContractCallAsync('0x0', signature, address),
            ).to.become(false);
        });
        it("should return false if the address doesn't pertain to the signature & data", async () => {
            const validUnrelatedAddress = '0x8b0292b11a196601ed2ce54b665cafeca0347d42';
            return expect(
                (zeroEx.exchange as any)._isValidSignatureUsingContractCallAsync(
                    dataHex,
                    signature,
                    validUnrelatedAddress,
                ),
            ).to.become(false);
        });
        it("should return false if the signature doesn't pertain to the dataHex & address", async () => {
            const wrongSignature = _.assign({}, signature, { v: 28 });
            return expect(
                (zeroEx.exchange as any)._isValidSignatureUsingContractCallAsync(dataHex, wrongSignature, address),
            ).to.become(false);
        });
        it('should return true if the signature does pertain to the dataHex & address', async () => {
            return expect(
                (zeroEx.exchange as any)._isValidSignatureUsingContractCallAsync(dataHex, signature, address),
            ).to.become(true);
        });
    });
    describe('#toUnitAmount', () => {
        it('should throw if invalid baseUnit amount supplied as argument', () => {
            const invalidBaseUnitAmount = new BigNumber(1000000000.4);
            const decimals = 6;
            expect(() => ZeroEx.toUnitAmount(invalidBaseUnitAmount, decimals)).to.throw(
                'amount should be in baseUnits (no decimals), found value: 1000000000.4',
            );
        });
        it('Should return the expected unit amount for the decimals passed in', () => {
            const baseUnitAmount = new BigNumber(1000000000);
            const decimals = 6;
            const unitAmount = ZeroEx.toUnitAmount(baseUnitAmount, decimals);
            const expectedUnitAmount = new BigNumber(1000);
            expect(unitAmount).to.be.bignumber.equal(expectedUnitAmount);
        });
    });
    describe('#toBaseUnitAmount', () => {
        it('Should return the expected base unit amount for the decimals passed in', () => {
            const unitAmount = new BigNumber(1000);
            const decimals = 6;
            const baseUnitAmount = ZeroEx.toBaseUnitAmount(unitAmount, decimals);
            const expectedUnitAmount = new BigNumber(1000000000);
            expect(baseUnitAmount).to.be.bignumber.equal(expectedUnitAmount);
        });
        it('should throw if unitAmount has more decimals then specified as the max decimal precision', () => {
            const unitAmount = new BigNumber(0.823091);
            const decimals = 5;
            expect(() => ZeroEx.toBaseUnitAmount(unitAmount, decimals)).to.throw(
                'Invalid unit amount: 0.823091 - Too many decimal places',
            );
        });
    });
    describe('#awaitTransactionMinedAsync', () => {
        beforeEach(async () => {
            await blockchainLifecycle.startAsync();
        });
        afterEach(async () => {
            await blockchainLifecycle.revertAsync();
        });
        it('returns transaction receipt with decoded logs', async () => {
            const availableAddresses = await zeroEx.getAvailableAddressesAsync();
            const coinbase = availableAddresses[0];
            const tokens = await zeroEx.tokenRegistry.getTokensAsync();
            const tokenUtils = new TokenUtils(tokens);
            const zrxTokenAddress = tokenUtils.getProtocolTokenOrThrow().address;
            const proxyAddress = zeroEx.proxy.getContractAddress();
            const txHash = await zeroEx.token.setUnlimitedProxyAllowanceAsync(zrxTokenAddress, coinbase);
            const txReceiptWithDecodedLogs = await zeroEx.awaitTransactionMinedAsync(txHash);
            const log = txReceiptWithDecodedLogs.logs[0] as LogWithDecodedArgs<ApprovalContractEventArgs>;
            expect(log.event).to.be.equal(TokenEvents.Approval);
            expect(log.args._owner).to.be.equal(coinbase);
            expect(log.args._spender).to.be.equal(proxyAddress);
            expect(log.args._value).to.be.bignumber.equal(zeroEx.token.UNLIMITED_ALLOWANCE_IN_BASE_UNITS);
        });
    });
    describe('#config', () => {
        it('allows to specify exchange contract address', async () => {
            const zeroExConfig = {
                exchangeContractAddress: ZeroEx.NULL_ADDRESS,
                networkId: constants.TESTRPC_NETWORK_ID,
            };
            const zeroExWithWrongExchangeAddress = new ZeroEx(provider, zeroExConfig);
            expect(zeroExWithWrongExchangeAddress.exchange.getContractAddress()).to.be.equal(ZeroEx.NULL_ADDRESS);
        });
        it('allows to specify token registry token contract address', async () => {
            const zeroExConfig = {
                tokenRegistryContractAddress: ZeroEx.NULL_ADDRESS,
                networkId: constants.TESTRPC_NETWORK_ID,
            };
            const zeroExWithWrongTokenRegistryAddress = new ZeroEx(provider, zeroExConfig);
            expect(zeroExWithWrongTokenRegistryAddress.tokenRegistry.getContractAddress()).to.be.equal(
                ZeroEx.NULL_ADDRESS,
            );
        });
    });
});
