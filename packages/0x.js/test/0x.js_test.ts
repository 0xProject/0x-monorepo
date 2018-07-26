import { ContractWrappers } from '@0xproject/contract-wrappers';
import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import 'mocha';

import { ERC20TokenApprovalEventArgs, ERC20TokenEvents, LogWithDecodedArgs, ZeroEx } from '../src';

import { chaiSetup } from './utils/chai_setup';
import { constants } from './utils/constants';
import { tokenUtils } from './utils/token_utils';
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
            expect((zeroEx.exchange as any)._exchangeContractIfExists).to.not.be.undefined();

            // Add property to newProvider so that we can differentiate it from old provider
            (provider as any).zeroExTestId = 1;
            zeroEx.setProvider(provider, constants.TESTRPC_NETWORK_ID);

            // Check that contractInstances with old provider are removed after provider update
            expect((zeroEx.exchange as any)._exchangeContractIfExists).to.be.undefined();

            // Check that all nested zeroExContract/web3Wrapper instances return the updated provider
            const nestedWeb3WrapperProvider = ((zeroEx as any)._contractWrappers as ContractWrappers).getProvider();
            expect((nestedWeb3WrapperProvider as any).zeroExTestId).to.be.a('number');
            const exchangeWeb3WrapperProvider = (zeroEx.exchange as any)._web3Wrapper.getProvider();
            expect(exchangeWeb3WrapperProvider.zeroExTestId).to.be.a('number');
        });
    });
    describe('#isValidSignature', () => {
        const dataHex = '0x6927e990021d23b1eb7b8789f6a6feaf98fe104bb0cf8259421b79f9a34222b0';
        const ethSignSignature =
            '0x1B61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351bc3340349190569279751135161d22529dc25add4f6069af05be04cacbda2ace225403';
        const address = '0x5409ed021d9299bf6814279a6a1411a7e866a631';
        const bytes32Zeros = '0x0000000000000000000000000000000000000000000000000000000000000000';
        it("should return false if the data doesn't pertain to the signature & address", async () => {
            return expect((zeroEx.exchange as any).isValidSignatureAsync(bytes32Zeros, address, ethSignSignature)).to.become(
                false,
            );
        });
        it("should return false if the address doesn't pertain to the signature & data", async () => {
            const validUnrelatedAddress = '0x8b0292b11a196601ed2ce54b665cafeca0347d42';
            return expect(
                (zeroEx.exchange as any).isValidSignatureAsync(dataHex, validUnrelatedAddress, ethSignSignature),
            ).to.become(false);
        });
        it("should return false if the signature doesn't pertain to the dataHex & address", async () => {
            const signatureArray = ethSignSignature.split('');
            // tslint:disable-next-line:custom-no-magic-numbers
            signatureArray[5] = 'C'; // V = 28, instead of 27
            const wrongSignature = signatureArray.join('');
            return expect((zeroEx.exchange as any).isValidSignatureAsync(dataHex, address, wrongSignature)).to.become(
                false,
            );
        });
        it('should return true if the signature does pertain to the dataHex & address', async () => {
            return expect((zeroEx.exchange as any).isValidSignatureAsync(dataHex, address, ethSignSignature)).to.become(
                true,
            );
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
            const zrxTokenAddress = tokenUtils.getProtocolTokenAddress();
            const erc20ProxyAddress = zeroEx.erc20Proxy.getContractAddress();
            const txHash = await zeroEx.erc20Token.setUnlimitedProxyAllowanceAsync(zrxTokenAddress, coinbase);
            const txReceiptWithDecodedLogs = await zeroEx.awaitTransactionMinedAsync(txHash);
            // tslint:disable-next-line:no-unnecessary-type-assertion
            const log = txReceiptWithDecodedLogs.logs[0] as LogWithDecodedArgs<ERC20TokenApprovalEventArgs>;
            expect(log.event).to.be.equal(ERC20TokenEvents.Approval);
            expect(log.args._owner).to.be.equal(coinbase);
            expect(log.args._spender).to.be.equal(erc20ProxyAddress);
            expect(log.args._value).to.be.bignumber.equal(zeroEx.erc20Token.UNLIMITED_ALLOWANCE_IN_BASE_UNITS);
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
        it('allows to specify erc20Proxy contract address', async () => {
            const zeroExConfig = {
                erc20ProxyContractAddress: ZeroEx.NULL_ADDRESS,
                networkId: constants.TESTRPC_NETWORK_ID,
            };
            const zeroExWithWrongERC20ProxyAddress = new ZeroEx(provider, zeroExConfig);
            expect(zeroExWithWrongERC20ProxyAddress.erc20Proxy.getContractAddress()).to.be.equal(ZeroEx.NULL_ADDRESS);
        });
    });
});
