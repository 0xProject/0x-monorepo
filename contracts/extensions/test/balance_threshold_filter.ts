import { ExchangeContract, ExchangeWrapper } from '@0x/contracts-exchange';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { assetDataUtils, ExchangeRevertErrors } from '@0x/order-utils';
import { Order, RevertReason, SignedOrder } from '@0x/types';
import { BigNumber, providerUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import { ERC20Wrapper, ERC721Wrapper } from '@0x/contracts-asset-proxy';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import {
    chaiSetup,
    constants,
    ContractName,
    ERC20BalancesByOwner,
    OrderFactory,
    OrderStatus,
    provider,
    TransactionFactory,
    txDefaults,
    web3Wrapper,
} from '@0x/contracts-test-utils';

import { artifacts, BalanceThresholdFilterContract, BalanceThresholdWrapper } from '../src';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
const DECIMALS_DEFAULT = 18;

interface ValidatedAddressesLog {
    args: { addresses: string[] };
}

describe(ContractName.BalanceThresholdFilter, () => {
    const takerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(500), DECIMALS_DEFAULT);
    const makerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(1000), DECIMALS_DEFAULT);
    const takerAssetFillAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(250), DECIMALS_DEFAULT);

    let chainId: number;
    let validMakerAddress: string;
    let validMakerAddress2: string;
    let owner: string;
    let validTakerAddress: string;
    let feeRecipientAddress: string;
    let invalidAddress: string;
    let defaultMakerAssetAddress: string;
    let defaultTakerAssetAddress: string;
    let zrxAssetData: string;
    let zrxToken: DummyERC20TokenContract;
    let exchangeInstance: ExchangeContract;
    let exchangeWrapper: ExchangeWrapper;

    let orderFactory: OrderFactory;
    let orderFactory2: OrderFactory;
    let invalidOrderFactory: OrderFactory;
    let erc20Wrapper: ERC20Wrapper;
    let erc20Balances: ERC20BalancesByOwner;
    let erc20TakerBalanceThresholdWrapper: BalanceThresholdWrapper;
    let erc721TakerBalanceThresholdWrapper: BalanceThresholdWrapper;
    let erc721MakerBalanceThresholdWrapper: BalanceThresholdWrapper;
    let erc721NonValidBalanceThresholdWrapper: BalanceThresholdWrapper;

    let defaultOrderParams: Partial<Order>;
    let validSignedOrder: SignedOrder;
    let validSignedOrder2: SignedOrder;

    let erc721BalanceThresholdFilterInstance: BalanceThresholdFilterContract;
    let erc20BalanceThresholdFilterInstance: BalanceThresholdFilterContract;

    const assertValidatedAddressesLog = async (
        txReceipt: TransactionReceiptWithDecodedLogs,
        expectedValidatedAddresses: string[],
    ) => {
        expect(txReceipt.logs.length).to.be.gte(1);
        const validatedAddressesLog = (txReceipt.logs[0] as any) as ValidatedAddressesLog;
        const validatedAddresses = validatedAddressesLog.args.addresses;
        // @HACK-hysz: Nested addresses are not translated to lower-case but this will change once
        //             the new ABI Encoder/Decoder is used by the contract templates.
        const validatedAddressesNormalized: string[] = [];
        _.each(validatedAddresses, address => {
            const normalizedAddress = _.toLower(address);
            validatedAddressesNormalized.push(normalizedAddress);
        });
        expect(validatedAddressesNormalized).to.be.deep.equal(expectedValidatedAddresses);
    };

    before(async () => {
        // Get the chain ID.
        chainId = await providerUtils.getChainIdAsync(provider);
        // Create accounts
        await blockchainLifecycle.startAsync();
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const usedAddresses = ([
            owner,
            validMakerAddress,
            validMakerAddress2,
            validTakerAddress,
            feeRecipientAddress,
            invalidAddress,
        ] = accounts);
        const takerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(validTakerAddress)];
        const makerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(validMakerAddress)];
        const secondMakerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(validMakerAddress2)];
        const invalidAddressPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(invalidAddress)];
        // Create wrappers
        erc20Wrapper = new ERC20Wrapper(provider, usedAddresses, owner);
        const validAddresses = _.cloneDeepWith(usedAddresses);
        _.remove(validAddresses, (address: string) => {
            return address === invalidAddress;
        });
        const erc721Wrapper = new ERC721Wrapper(provider, validAddresses, owner);
        // Deploy ERC20 tokens
        const numDummyErc20ToDeploy = 4;
        let erc20TokenA: DummyERC20TokenContract;
        let erc20TokenB: DummyERC20TokenContract;
        let erc20BalanceThresholdAsset: DummyERC20TokenContract;
        [erc20TokenA, erc20TokenB, zrxToken, erc20BalanceThresholdAsset] = await erc20Wrapper.deployDummyTokensAsync(
            numDummyErc20ToDeploy,
            constants.DUMMY_TOKEN_DECIMALS,
        );
        defaultMakerAssetAddress = erc20TokenA.address;
        defaultTakerAssetAddress = erc20TokenB.address;
        zrxAssetData = assetDataUtils.encodeERC20AssetData(zrxToken.address);
        // Create proxies
        const erc20Proxy = await erc20Wrapper.deployProxyAsync();
        await erc20Wrapper.setBalancesAndAllowancesAsync();
        // Deploy Exchange contract
        exchangeInstance = await ExchangeContract.deployFrom0xArtifactAsync(
            artifacts.Exchange,
            provider,
            txDefaults,
            artifacts,
            zrxAssetData,
            new BigNumber(chainId),
        );
        exchangeWrapper = new ExchangeWrapper(exchangeInstance, provider);
        // Register proxies
        await exchangeWrapper.registerAssetProxyAsync(erc20Proxy.address, owner);
        await erc20Proxy.addAuthorizedAddress.sendTransactionAsync(exchangeInstance.address, {
            from: owner,
        });
        // Deploy Balance Threshold Filters
        // One uses an ERC721 token as its balance threshold asset; the other uses an ERC20
        const erc721alanceThreshold = new BigNumber(1);
        await erc721Wrapper.deployProxyAsync();
        const [erc721BalanceThresholdAsset] = await erc721Wrapper.deployDummyTokensAsync();
        await erc721Wrapper.setBalancesAndAllowancesAsync();
        erc721BalanceThresholdFilterInstance = await BalanceThresholdFilterContract.deployFrom0xArtifactAsync(
            artifacts.BalanceThresholdFilter,
            provider,
            txDefaults,
            artifacts,
            exchangeInstance.address,
            erc721BalanceThresholdAsset.address,
            erc721alanceThreshold,
        );
        const erc20BalanceThreshold = Web3Wrapper.toBaseUnitAmount(new BigNumber(1), 10);
        erc20BalanceThresholdFilterInstance = await BalanceThresholdFilterContract.deployFrom0xArtifactAsync(
            artifacts.BalanceThresholdFilter,
            provider,
            txDefaults,
            artifacts,
            exchangeInstance.address,
            erc20BalanceThresholdAsset.address,
            erc20BalanceThreshold,
        );
        // Default order parameters
        defaultOrderParams = {
            feeRecipientAddress,
            makerAssetData: assetDataUtils.encodeERC20AssetData(defaultMakerAssetAddress),
            takerAssetData: assetDataUtils.encodeERC20AssetData(defaultTakerAssetAddress),
            makerAssetAmount,
            takerAssetAmount,
            makerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), DECIMALS_DEFAULT),
            takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(150), DECIMALS_DEFAULT),
            senderAddress: erc721BalanceThresholdFilterInstance.address,
            domain: {
                verifyingContract: exchangeInstance.address,
                chainId,
            },
        };
        // Create two order factories with valid makers (who meet the threshold balance), and
        // one factory for an invalid address (that does not meet the threshold balance)
        // Valid order factory #1
        const defaultOrderParams1 = {
            makerAddress: validMakerAddress,
            ...defaultOrderParams,
        };
        orderFactory = new OrderFactory(makerPrivateKey, defaultOrderParams1);
        // Valid order factory #2
        const defaultOrderParams2 = {
            makerAddress: validMakerAddress2,
            ...defaultOrderParams,
        };
        orderFactory2 = new OrderFactory(secondMakerPrivateKey, defaultOrderParams2);
        // Invalid order factory
        const defaultNonValidOrderParams = {
            makerAddress: invalidAddress,
            ...defaultOrderParams,
        };
        invalidOrderFactory = new OrderFactory(invalidAddressPrivateKey, defaultNonValidOrderParams);
        // Create Balance Thresold Wrappers
        erc20TakerBalanceThresholdWrapper = new BalanceThresholdWrapper(
            erc20BalanceThresholdFilterInstance,
            exchangeInstance,
            new TransactionFactory(takerPrivateKey, exchangeInstance.address, chainId),
            provider,
        );
        erc721TakerBalanceThresholdWrapper = new BalanceThresholdWrapper(
            erc721BalanceThresholdFilterInstance,
            exchangeInstance,
            new TransactionFactory(takerPrivateKey, exchangeInstance.address, chainId),
            provider,
        );
        erc721MakerBalanceThresholdWrapper = new BalanceThresholdWrapper(
            erc721BalanceThresholdFilterInstance,
            exchangeInstance,
            new TransactionFactory(makerPrivateKey, exchangeInstance.address, chainId),
            provider,
        );
        erc721NonValidBalanceThresholdWrapper = new BalanceThresholdWrapper(
            erc721BalanceThresholdFilterInstance,
            exchangeInstance,
            new TransactionFactory(invalidAddressPrivateKey, exchangeInstance.address, chainId),
            provider,
        );
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('General Sanity Checks', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            validSignedOrder = await orderFactory.newSignedOrderAsync();
            validSignedOrder2 = await orderFactory2.newSignedOrderAsync();
        });
        it('should transfer the correct amounts and validate both maker/taker when both maker and taker exceed the balance threshold of an ERC20 token', async () => {
            const validSignedOrderERC20Sender = await orderFactory.newSignedOrderAsync({
                ...defaultOrderParams,
                makerAddress: validMakerAddress,
                senderAddress: erc20TakerBalanceThresholdWrapper.getBalanceThresholdAddress(),
            });
            // Execute a valid fill
            const txReceipt = await erc20TakerBalanceThresholdWrapper.fillOrderAsync(
                validSignedOrderERC20Sender,
                validTakerAddress,
                { takerAssetFillAmount },
            );
            // Assert validated addresses
            const expectedValidatedAddresseses = [validSignedOrder.makerAddress, validTakerAddress];
            await assertValidatedAddressesLog(txReceipt, expectedValidatedAddresseses);
            // Check balances
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const makerAssetFillAmount = takerAssetFillAmount
                .times(validSignedOrder.makerAssetAmount)
                .dividedToIntegerBy(validSignedOrder.takerAssetAmount);
            const makerFeePaid = validSignedOrder.makerFee
                .times(makerAssetFillAmount)
                .dividedToIntegerBy(validSignedOrder.makerAssetAmount);
            const takerFeePaid = validSignedOrder.takerFee
                .times(makerAssetFillAmount)
                .dividedToIntegerBy(validSignedOrder.makerAssetAmount);
            expect(newBalances[validMakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress][defaultMakerAssetAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[validMakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress][defaultTakerAssetAddress].plus(takerAssetFillAmount),
            );
            expect(newBalances[validMakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress][zrxToken.address].minus(makerFeePaid),
            );
            expect(newBalances[validTakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validTakerAddress][defaultTakerAssetAddress].minus(takerAssetFillAmount),
            );
            expect(newBalances[validTakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validTakerAddress][defaultMakerAssetAddress].plus(makerAssetFillAmount),
            );
            expect(newBalances[validTakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[validTakerAddress][zrxToken.address].minus(takerFeePaid),
            );
            expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address].plus(makerFeePaid.plus(takerFeePaid)),
            );
        });
        it('should revert if the Exchange transaction function is not supported', async () => {
            // Create signed order without the fillOrder function selector
            const salt = new BigNumber(0);
            const badSelectorHex = '0x00000000';
            const signatureHex = '0x';
            // Call valid forwarder
            const tx = erc721BalanceThresholdFilterInstance.executeTransaction.sendTransactionAsync(
                salt,
                validTakerAddress,
                badSelectorHex,
                signatureHex,
            );
            return expect(tx).to.revertWith(RevertReason.InvalidOrBlockedExchangeSelector);
        });
        it('should revert if senderAddress is not set to the valid forwarding contract', async () => {
            // Create signed order with incorrect senderAddress
            const notBalanceThresholdFilterAddress = zrxToken.address;
            const signedOrderWithBadSenderAddress = await orderFactory.newSignedOrderAsync({
                senderAddress: notBalanceThresholdFilterAddress,
            });
            const expectedError = new ExchangeRevertErrors.TransactionExecutionError();
            // Call valid forwarder
            const tx = erc721TakerBalanceThresholdWrapper.fillOrderAsync(
                signedOrderWithBadSenderAddress,
                validTakerAddress,
                { takerAssetFillAmount },
            );
            return expect(tx).to.revertWith(expectedError);
        });
    });

    describe('batchFillOrders', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            validSignedOrder = await orderFactory.newSignedOrderAsync();
            validSignedOrder2 = await orderFactory2.newSignedOrderAsync();
        });
        it('should transfer the correct amounts and validate both makers/taker when both maker and taker meet the balance threshold', async () => {
            // Execute a valid fill
            const orders = [validSignedOrder, validSignedOrder2];
            const takerAssetFillAmounts = [takerAssetFillAmount, takerAssetFillAmount];
            const txReceipt = await erc721TakerBalanceThresholdWrapper.batchFillOrdersAsync(orders, validTakerAddress, {
                takerAssetFillAmounts,
            });
            // Assert validated addresses
            const expectedValidatedAddresseses = [
                validSignedOrder.makerAddress,
                validSignedOrder2.makerAddress,
                validTakerAddress,
            ];
            await assertValidatedAddressesLog(txReceipt, expectedValidatedAddresseses);
            // Check balances
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const cumulativeTakerAssetFillAmount = takerAssetFillAmount.times(2);
            const makerAssetFillAmount = takerAssetFillAmount
                .times(validSignedOrder.makerAssetAmount)
                .dividedToIntegerBy(validSignedOrder.takerAssetAmount);
            const makerFeePaid = validSignedOrder.makerFee
                .times(makerAssetFillAmount)
                .dividedToIntegerBy(validSignedOrder.makerAssetAmount);
            const takerFeePaid = validSignedOrder.takerFee
                .times(makerAssetFillAmount)
                .dividedToIntegerBy(validSignedOrder.makerAssetAmount)
                .times(2);
            // Maker #1
            expect(newBalances[validMakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress][defaultMakerAssetAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[validMakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress][defaultTakerAssetAddress].plus(takerAssetFillAmount),
            );
            expect(newBalances[validMakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress][zrxToken.address].minus(makerFeePaid),
            );
            // Maker #2
            expect(newBalances[validMakerAddress2][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress2][defaultMakerAssetAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[validMakerAddress2][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress2][defaultTakerAssetAddress].plus(takerAssetFillAmount),
            );
            expect(newBalances[validMakerAddress2][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress2][zrxToken.address].minus(makerFeePaid),
            );
            // Taker
            expect(newBalances[validTakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validTakerAddress][defaultTakerAssetAddress].minus(cumulativeTakerAssetFillAmount),
            );

            expect(newBalances[validTakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validTakerAddress][defaultMakerAssetAddress].plus(makerAssetFillAmount.times(2)),
            );
            expect(newBalances[validTakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[validTakerAddress][zrxToken.address].minus(takerFeePaid),
            );
            // Fee recipient
            expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address].plus(makerFeePaid.times(2).plus(takerFeePaid)),
            );
        });
        it('should revert if one maker does not meet the balance threshold', async () => {
            // Create order set with one non-valid maker address
            const takerAssetFillAmounts = [takerAssetFillAmount, takerAssetFillAmount];
            const signedOrderWithBadMakerAddress = await orderFactory.newSignedOrderAsync({
                makerAddress: invalidAddress,
            });
            const orders = [validSignedOrder, signedOrderWithBadMakerAddress];
            // Execute transaction
            const tx = erc721TakerBalanceThresholdWrapper.batchFillOrdersAsync(orders, validTakerAddress, {
                takerAssetFillAmounts,
            });
            return expect(tx).to.revertWith(RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold);
        });
        it('should revert if taker does not meet the balance threshold', async () => {
            const orders = [validSignedOrder, validSignedOrder2];
            const takerAssetFillAmounts = [takerAssetFillAmount, takerAssetFillAmount];
            const tx = erc721NonValidBalanceThresholdWrapper.batchFillOrdersAsync(orders, invalidAddress, {
                takerAssetFillAmounts,
            });
            return expect(tx).to.revertWith(RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold);
        });
    });

    describe('batchFillOrdersNoThrow', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            validSignedOrder = await orderFactory.newSignedOrderAsync();
            validSignedOrder2 = await orderFactory2.newSignedOrderAsync();
        });
        it('should transfer the correct amounts and validate both makers/taker when both maker and taker meet the balance threshold', async () => {
            // Execute a valid fill
            const orders = [validSignedOrder, validSignedOrder2];
            const takerAssetFillAmounts = [takerAssetFillAmount, takerAssetFillAmount];
            const txReceipt = await erc721TakerBalanceThresholdWrapper.batchFillOrdersNoThrowAsync(
                orders,
                validTakerAddress,
                {
                    takerAssetFillAmounts,
                },
            );
            // Assert validated addresses
            const expectedValidatedAddresseses = [
                validSignedOrder.makerAddress,
                validSignedOrder2.makerAddress,
                validTakerAddress,
            ];
            await assertValidatedAddressesLog(txReceipt, expectedValidatedAddresseses);
            // Check balances
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const cumulativeTakerAssetFillAmount = takerAssetFillAmount.times(2);
            const makerAssetFillAmount = takerAssetFillAmount
                .times(validSignedOrder.makerAssetAmount)
                .dividedToIntegerBy(validSignedOrder.takerAssetAmount);
            const makerFeePaid = validSignedOrder.makerFee
                .times(makerAssetFillAmount)
                .dividedToIntegerBy(validSignedOrder.makerAssetAmount);
            const takerFeePaid = validSignedOrder.takerFee
                .times(makerAssetFillAmount)
                .dividedToIntegerBy(validSignedOrder.makerAssetAmount)
                .times(2);
            // Maker #1
            expect(newBalances[validMakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress][defaultMakerAssetAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[validMakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress][defaultTakerAssetAddress].plus(takerAssetFillAmount),
            );
            expect(newBalances[validMakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress][zrxToken.address].minus(makerFeePaid),
            );
            // Maker #2
            expect(newBalances[validMakerAddress2][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress2][defaultMakerAssetAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[validMakerAddress2][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress2][defaultTakerAssetAddress].plus(takerAssetFillAmount),
            );
            expect(newBalances[validMakerAddress2][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress2][zrxToken.address].minus(makerFeePaid),
            );
            // Taker
            expect(newBalances[validTakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validTakerAddress][defaultTakerAssetAddress].minus(cumulativeTakerAssetFillAmount),
            );

            expect(newBalances[validTakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validTakerAddress][defaultMakerAssetAddress].plus(makerAssetFillAmount.times(2)),
            );
            expect(newBalances[validTakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[validTakerAddress][zrxToken.address].minus(takerFeePaid),
            );
            // Fee recipient
            expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address].plus(makerFeePaid.times(2).plus(takerFeePaid)),
            );
        });
        it('should revert if one maker does not meet the balance threshold', async () => {
            // Create order set with one non-valid maker address
            const takerAssetFillAmounts = [takerAssetFillAmount, takerAssetFillAmount];
            const signedOrderWithBadMakerAddress = await orderFactory.newSignedOrderAsync({
                makerAddress: invalidAddress,
            });
            const orders = [validSignedOrder, signedOrderWithBadMakerAddress];
            // Execute transaction
            const tx = erc721TakerBalanceThresholdWrapper.batchFillOrdersNoThrowAsync(orders, validTakerAddress, {
                takerAssetFillAmounts,
            });
            return expect(tx).to.revertWith(RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold);
        });
        it('should revert if taker does not meet the balance threshold', async () => {
            const orders = [validSignedOrder, validSignedOrder2];
            const takerAssetFillAmounts = [takerAssetFillAmount, takerAssetFillAmount];
            const tx = erc721NonValidBalanceThresholdWrapper.batchFillOrdersNoThrowAsync(orders, invalidAddress, {
                takerAssetFillAmounts,
            });
            return expect(tx).to.revertWith(RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold);
        });
    });

    describe('batchFillOrKillOrders', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            validSignedOrder = await orderFactory.newSignedOrderAsync();
            validSignedOrder2 = await orderFactory2.newSignedOrderAsync();
        });
        it('should transfer the correct amounts and validate both makers/taker when both makers and taker meet the balance threshold', async () => {
            // Execute a valid fill
            const orders = [validSignedOrder, validSignedOrder2];
            const takerAssetFillAmounts = [takerAssetFillAmount, takerAssetFillAmount];
            const txReceipt = await erc721TakerBalanceThresholdWrapper.batchFillOrKillOrdersAsync(
                orders,
                validTakerAddress,
                { takerAssetFillAmounts },
            );
            // Assert validated addresses
            const expectedValidatedAddresseses = [
                validSignedOrder.makerAddress,
                validSignedOrder2.makerAddress,
                validTakerAddress,
            ];
            await assertValidatedAddressesLog(txReceipt, expectedValidatedAddresseses);
            // Check balances
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const cumulativeTakerAssetFillAmount = takerAssetFillAmount.times(2);
            const makerAssetFillAmount = takerAssetFillAmount
                .times(validSignedOrder.makerAssetAmount)
                .dividedToIntegerBy(validSignedOrder.takerAssetAmount);
            const makerFeePaid = validSignedOrder.makerFee
                .times(makerAssetFillAmount)
                .dividedToIntegerBy(validSignedOrder.makerAssetAmount);
            const takerFeePaid = validSignedOrder.takerFee
                .times(makerAssetFillAmount)
                .dividedToIntegerBy(validSignedOrder.makerAssetAmount)
                .times(2);
            // Maker #1
            expect(newBalances[validMakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress][defaultMakerAssetAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[validMakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress][defaultTakerAssetAddress].plus(takerAssetFillAmount),
            );
            expect(newBalances[validMakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress][zrxToken.address].minus(makerFeePaid),
            );
            // Maker #2
            expect(newBalances[validMakerAddress2][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress2][defaultMakerAssetAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[validMakerAddress2][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress2][defaultTakerAssetAddress].plus(takerAssetFillAmount),
            );
            expect(newBalances[validMakerAddress2][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress2][zrxToken.address].minus(makerFeePaid),
            );
            // Taker
            expect(newBalances[validTakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validTakerAddress][defaultTakerAssetAddress].minus(cumulativeTakerAssetFillAmount),
            );

            expect(newBalances[validTakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validTakerAddress][defaultMakerAssetAddress].plus(makerAssetFillAmount.times(2)),
            );
            expect(newBalances[validTakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[validTakerAddress][zrxToken.address].minus(takerFeePaid),
            );
            // Fee recipient
            expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address].plus(makerFeePaid.times(2).plus(takerFeePaid)),
            );
        });
        it('should revert if one maker does not meet the balance threshold', async () => {
            // Create order set with one non-valid maker address
            const takerAssetFillAmounts = [takerAssetFillAmount, takerAssetFillAmount];
            const signedOrderWithBadMakerAddress = await orderFactory.newSignedOrderAsync({
                makerAddress: invalidAddress,
            });
            const orders = [validSignedOrder, signedOrderWithBadMakerAddress];
            // Execute transaction
            const tx = erc721TakerBalanceThresholdWrapper.batchFillOrKillOrdersAsync(orders, validTakerAddress, {
                takerAssetFillAmounts,
            });
            return expect(tx).to.revertWith(RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold);
        });
        it('should revert if taker does not meet the balance threshold', async () => {
            const orders = [validSignedOrder, validSignedOrder2];
            const takerAssetFillAmounts = [takerAssetFillAmount, takerAssetFillAmount];
            const tx = erc721NonValidBalanceThresholdWrapper.batchFillOrKillOrdersAsync(orders, invalidAddress, {
                takerAssetFillAmounts,
            });
            return expect(tx).to.revertWith(RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold);
        });
        it('should revert if one takerAssetFillAmount is not fully filled', async () => {
            const tooBigTakerAssetFillAmount = validSignedOrder.takerAssetAmount.times(2);
            const orders = [validSignedOrder, validSignedOrder2];
            const takerAssetFillAmounts = [takerAssetFillAmount, tooBigTakerAssetFillAmount];
            const expectedError = new ExchangeRevertErrors.TransactionExecutionError();
            // Call valid forwarder
            const tx = erc721TakerBalanceThresholdWrapper.batchFillOrKillOrdersAsync(orders, validTakerAddress, {
                takerAssetFillAmounts,
            });
            return expect(tx).to.revertWith(expectedError);
        });
    });

    describe('fillOrder', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            validSignedOrder = await orderFactory.newSignedOrderAsync();
        });
        it('should transfer the correct amounts and validate both maker/taker when both maker and taker meet the balance threshold', async () => {
            // Execute a valid fill
            const txReceipt = await erc721TakerBalanceThresholdWrapper.fillOrderAsync(
                validSignedOrder,
                validTakerAddress,
                { takerAssetFillAmount },
            );
            // Assert validated addresses
            const expectedValidatedAddresseses = [validSignedOrder.makerAddress, validTakerAddress];
            await assertValidatedAddressesLog(txReceipt, expectedValidatedAddresseses);
            // Check balances
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const makerAssetFillAmount = takerAssetFillAmount
                .times(validSignedOrder.makerAssetAmount)
                .dividedToIntegerBy(validSignedOrder.takerAssetAmount);
            const makerFeePaid = validSignedOrder.makerFee
                .times(makerAssetFillAmount)
                .dividedToIntegerBy(validSignedOrder.makerAssetAmount);
            const takerFeePaid = validSignedOrder.takerFee
                .times(makerAssetFillAmount)
                .dividedToIntegerBy(validSignedOrder.makerAssetAmount);
            expect(newBalances[validMakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress][defaultMakerAssetAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[validMakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress][defaultTakerAssetAddress].plus(takerAssetFillAmount),
            );
            expect(newBalances[validMakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress][zrxToken.address].minus(makerFeePaid),
            );
            expect(newBalances[validTakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validTakerAddress][defaultTakerAssetAddress].minus(takerAssetFillAmount),
            );
            expect(newBalances[validTakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validTakerAddress][defaultMakerAssetAddress].plus(makerAssetFillAmount),
            );
            expect(newBalances[validTakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[validTakerAddress][zrxToken.address].minus(takerFeePaid),
            );
            expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address].plus(makerFeePaid.plus(takerFeePaid)),
            );
        });
        it('should revert if maker does not meet the balance threshold', async () => {
            // Create signed order with non-valid maker address
            const signedOrderWithBadMakerAddress = await orderFactory.newSignedOrderAsync({
                senderAddress: erc721BalanceThresholdFilterInstance.address,
                makerAddress: invalidAddress,
            });
            // Execute transaction
            const tx = erc721TakerBalanceThresholdWrapper.fillOrderAsync(
                signedOrderWithBadMakerAddress,
                validTakerAddress,
                { takerAssetFillAmount },
            );
            return expect(tx).to.revertWith(RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold);
        });
        it('should revert if taker does not meet the balance threshold', async () => {
            const tx = erc721NonValidBalanceThresholdWrapper.fillOrderAsync(validSignedOrder, invalidAddress, {
                takerAssetFillAmount,
            });
            return expect(tx).to.revertWith(RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold);
        });
    });

    describe('fillOrderNoThrow', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            validSignedOrder = await orderFactory.newSignedOrderAsync();
        });
        it('should transfer the correct amounts and validate both maker/taker when both maker and taker meet the balance threshold', async () => {
            // Execute a valid fill
            const txReceipt = await erc721TakerBalanceThresholdWrapper.fillOrderNoThrowAsync(
                validSignedOrder,
                validTakerAddress,
                {
                    takerAssetFillAmount,
                },
            );
            // Assert validated addresses
            const expectedValidatedAddresseses = [validSignedOrder.makerAddress, validTakerAddress];
            await assertValidatedAddressesLog(txReceipt, expectedValidatedAddresseses);
            // Check balances
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const makerAssetFillAmount = takerAssetFillAmount
                .times(validSignedOrder.makerAssetAmount)
                .dividedToIntegerBy(validSignedOrder.takerAssetAmount);
            const makerFeePaid = validSignedOrder.makerFee
                .times(makerAssetFillAmount)
                .dividedToIntegerBy(validSignedOrder.makerAssetAmount);
            const takerFeePaid = validSignedOrder.takerFee
                .times(makerAssetFillAmount)
                .dividedToIntegerBy(validSignedOrder.makerAssetAmount);
            expect(newBalances[validMakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress][defaultMakerAssetAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[validMakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress][defaultTakerAssetAddress].plus(takerAssetFillAmount),
            );
            expect(newBalances[validMakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress][zrxToken.address].minus(makerFeePaid),
            );
            expect(newBalances[validTakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validTakerAddress][defaultTakerAssetAddress].minus(takerAssetFillAmount),
            );
            expect(newBalances[validTakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validTakerAddress][defaultMakerAssetAddress].plus(makerAssetFillAmount),
            );
            expect(newBalances[validTakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[validTakerAddress][zrxToken.address].minus(takerFeePaid),
            );
            expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address].plus(makerFeePaid.plus(takerFeePaid)),
            );
        });
        it('should revert if maker does not meet the balance threshold', async () => {
            // Create signed order with non-valid maker address
            const signedOrderWithBadMakerAddress = await orderFactory.newSignedOrderAsync({
                senderAddress: erc721BalanceThresholdFilterInstance.address,
                makerAddress: invalidAddress,
            });
            // Execute transaction
            const tx = erc721TakerBalanceThresholdWrapper.fillOrderNoThrowAsync(
                signedOrderWithBadMakerAddress,
                validTakerAddress,
                { takerAssetFillAmount },
            );
            return expect(tx).to.revertWith(RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold);
        });
        it('should revert if taker does not meet the balance threshold', async () => {
            const tx = erc721NonValidBalanceThresholdWrapper.fillOrderNoThrowAsync(validSignedOrder, invalidAddress, {
                takerAssetFillAmount,
            });
            return expect(tx).to.revertWith(RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold);
        });
    });

    describe('fillOrKillOrder', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            validSignedOrder = await orderFactory.newSignedOrderAsync();
        });
        it('should transfer the correct amounts and validate both maker/taker when both maker and taker meet the balance threshold', async () => {
            // Execute a valid fill
            const takerAssetFillAmount_ = validSignedOrder.takerAssetAmount;
            const txReceipt = await erc721TakerBalanceThresholdWrapper.fillOrKillOrderAsync(
                validSignedOrder,
                validTakerAddress,
                { takerAssetFillAmount: takerAssetFillAmount_ },
            );
            // Assert validated addresses
            const expectedValidatedAddresseses = [validSignedOrder.makerAddress, validTakerAddress];
            await assertValidatedAddressesLog(txReceipt, expectedValidatedAddresseses);
            // Check balances
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const makerAssetFillAmount = takerAssetFillAmount_
                .times(validSignedOrder.makerAssetAmount)
                .dividedToIntegerBy(validSignedOrder.takerAssetAmount);
            const makerFeePaid = validSignedOrder.makerFee
                .times(makerAssetFillAmount)
                .dividedToIntegerBy(validSignedOrder.makerAssetAmount);
            const takerFeePaid = validSignedOrder.takerFee
                .times(makerAssetFillAmount)
                .dividedToIntegerBy(validSignedOrder.makerAssetAmount);
            expect(newBalances[validMakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress][defaultMakerAssetAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[validMakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress][defaultTakerAssetAddress].plus(takerAssetFillAmount_),
            );
            expect(newBalances[validMakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress][zrxToken.address].minus(makerFeePaid),
            );
            expect(newBalances[validTakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validTakerAddress][defaultTakerAssetAddress].minus(takerAssetFillAmount_),
            );
            expect(newBalances[validTakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validTakerAddress][defaultMakerAssetAddress].plus(makerAssetFillAmount),
            );
            expect(newBalances[validTakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[validTakerAddress][zrxToken.address].minus(takerFeePaid),
            );
            expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address].plus(makerFeePaid.plus(takerFeePaid)),
            );
        });
        it('should revert if maker does not meet the balance threshold', async () => {
            // Create signed order with non-valid maker address
            const signedOrderWithBadMakerAddress = await orderFactory.newSignedOrderAsync({
                senderAddress: erc721BalanceThresholdFilterInstance.address,
                makerAddress: invalidAddress,
            });
            // Execute transaction
            const tx = erc721TakerBalanceThresholdWrapper.fillOrKillOrderAsync(
                signedOrderWithBadMakerAddress,
                validTakerAddress,
                { takerAssetFillAmount },
            );
            return expect(tx).to.revertWith(RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold);
        });
        it('should revert if taker does not meet the balance threshold', async () => {
            const tx = erc721NonValidBalanceThresholdWrapper.fillOrKillOrderAsync(validSignedOrder, invalidAddress, {
                takerAssetFillAmount,
            });
            return expect(tx).to.revertWith(RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold);
        });
        it('should revert if takerAssetFillAmount is not fully filled', async () => {
            const tooBigTakerAssetFillAmount = validSignedOrder.takerAssetAmount.times(2);
            const expectedError = new ExchangeRevertErrors.TransactionExecutionError();
            const tx = erc721TakerBalanceThresholdWrapper.fillOrKillOrderAsync(validSignedOrder, validTakerAddress, {
                takerAssetFillAmount: tooBigTakerAssetFillAmount,
            });
            return expect(tx).to.revertWith(expectedError);
        });
    });

    describe('marketSellOrders', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            validSignedOrder = await orderFactory.newSignedOrderAsync();
            validSignedOrder2 = await orderFactory2.newSignedOrderAsync();
        });
        it('should transfer the correct amounts and validate both makers/taker when both makers and taker meet the balance threshold', async () => {
            // Execute a valid fill
            const orders = [validSignedOrder, validSignedOrder2];
            const cumulativeTakerAssetFillAmount = validSignedOrder.takerAssetAmount.plus(takerAssetFillAmount);
            const txReceipt = await erc721TakerBalanceThresholdWrapper.marketSellOrdersAsync(
                orders,
                validTakerAddress,
                { takerAssetFillAmount: cumulativeTakerAssetFillAmount },
            );
            // Assert validated addresses
            const expectedValidatedAddresseses = [
                validSignedOrder.makerAddress,
                validSignedOrder2.makerAddress,
                validTakerAddress,
            ];
            await assertValidatedAddressesLog(txReceipt, expectedValidatedAddresseses);
            // Check balances
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const makerAssetFillAmount2 = takerAssetFillAmount
                .times(validSignedOrder.makerAssetAmount)
                .dividedToIntegerBy(validSignedOrder.takerAssetAmount);
            const makerFeePaid2 = validSignedOrder2.makerFee
                .times(makerAssetFillAmount2)
                .dividedToIntegerBy(validSignedOrder2.makerAssetAmount);
            const takerFeePaid2 = validSignedOrder2.takerFee
                .times(makerAssetFillAmount2)
                .dividedToIntegerBy(validSignedOrder2.makerAssetAmount);
            const takerFeePaid = validSignedOrder.takerFee.plus(takerFeePaid2);
            const cumulativeMakerAssetFillAmount = validSignedOrder.makerAssetAmount.plus(makerAssetFillAmount2);
            // Maker #1
            expect(newBalances[validMakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress][defaultMakerAssetAddress].minus(validSignedOrder.makerAssetAmount),
            );
            expect(newBalances[validMakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress][defaultTakerAssetAddress].plus(validSignedOrder.takerAssetAmount),
            );
            expect(newBalances[validMakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress][zrxToken.address].minus(validSignedOrder.makerFee),
            );
            // Maker #2
            expect(newBalances[validMakerAddress2][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress2][defaultMakerAssetAddress].minus(makerAssetFillAmount2),
            );
            expect(newBalances[validMakerAddress2][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress2][defaultTakerAssetAddress].plus(takerAssetFillAmount),
            );
            expect(newBalances[validMakerAddress2][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress2][zrxToken.address].minus(makerFeePaid2),
            );
            // Taker
            expect(newBalances[validTakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validTakerAddress][defaultTakerAssetAddress].minus(cumulativeTakerAssetFillAmount),
            );
            expect(newBalances[validTakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validTakerAddress][defaultMakerAssetAddress].plus(cumulativeMakerAssetFillAmount),
            );
            expect(newBalances[validTakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[validTakerAddress][zrxToken.address].minus(takerFeePaid),
            );
            // Fee recipient
            expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address]
                    .plus(validSignedOrder.makerFee)
                    .plus(makerFeePaid2)
                    .plus(takerFeePaid),
            );
        });
        it('should revert if one maker does not meet the balance threshold', async () => {
            // Create order set with one non-valid maker address
            const signedOrderWithBadMakerAddress = await orderFactory.newSignedOrderAsync({
                makerAddress: invalidAddress,
            });
            const orders = [validSignedOrder, signedOrderWithBadMakerAddress];
            // Execute transaction
            const tx = erc721TakerBalanceThresholdWrapper.marketSellOrdersAsync(orders, validTakerAddress, {
                takerAssetFillAmount,
            });
            return expect(tx).to.revertWith(RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold);
        });
        it('should revert if taker does not meet the balance threshold', async () => {
            const orders = [validSignedOrder, validSignedOrder2];
            const tx = erc721NonValidBalanceThresholdWrapper.marketSellOrdersAsync(orders, invalidAddress, {
                takerAssetFillAmount,
            });
            return expect(tx).to.revertWith(RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold);
        });
    });

    describe('marketSellOrdersNoThrow', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            validSignedOrder = await orderFactory.newSignedOrderAsync();
            validSignedOrder2 = await orderFactory2.newSignedOrderAsync();
        });
        it('should transfer the correct amounts and validate both makers/taker when both makers and taker meet the balance threshold', async () => {
            // Execute a valid fill
            const orders = [validSignedOrder, validSignedOrder2];
            const cumulativeTakerAssetFillAmount = validSignedOrder.takerAssetAmount.plus(takerAssetFillAmount);
            const txReceipt = await erc721TakerBalanceThresholdWrapper.marketSellOrdersNoThrowAsync(
                orders,
                validTakerAddress,
                {
                    takerAssetFillAmount: cumulativeTakerAssetFillAmount,
                },
            );
            // Assert validated addresses
            const expectedValidatedAddresseses = [
                validSignedOrder.makerAddress,
                validSignedOrder2.makerAddress,
                validTakerAddress,
            ];
            await assertValidatedAddressesLog(txReceipt, expectedValidatedAddresseses);
            // Check balances
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const makerAssetFillAmount2 = takerAssetFillAmount
                .times(validSignedOrder.makerAssetAmount)
                .dividedToIntegerBy(validSignedOrder.takerAssetAmount);
            const makerFeePaid2 = validSignedOrder2.makerFee
                .times(makerAssetFillAmount2)
                .dividedToIntegerBy(validSignedOrder2.makerAssetAmount);
            const takerFeePaid2 = validSignedOrder2.takerFee
                .times(makerAssetFillAmount2)
                .dividedToIntegerBy(validSignedOrder2.makerAssetAmount);
            const takerFeePaid = validSignedOrder.takerFee.plus(takerFeePaid2);
            const cumulativeMakerAssetFillAmount = validSignedOrder.makerAssetAmount.plus(makerAssetFillAmount2);
            // Maker #1
            expect(newBalances[validMakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress][defaultMakerAssetAddress].minus(validSignedOrder.makerAssetAmount),
            );
            expect(newBalances[validMakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress][defaultTakerAssetAddress].plus(validSignedOrder.takerAssetAmount),
            );
            expect(newBalances[validMakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress][zrxToken.address].minus(validSignedOrder.makerFee),
            );
            // Maker #2
            expect(newBalances[validMakerAddress2][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress2][defaultMakerAssetAddress].minus(makerAssetFillAmount2),
            );
            expect(newBalances[validMakerAddress2][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress2][defaultTakerAssetAddress].plus(takerAssetFillAmount),
            );
            expect(newBalances[validMakerAddress2][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress2][zrxToken.address].minus(makerFeePaid2),
            );
            // Taker
            expect(newBalances[validTakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validTakerAddress][defaultTakerAssetAddress].minus(cumulativeTakerAssetFillAmount),
            );
            expect(newBalances[validTakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validTakerAddress][defaultMakerAssetAddress].plus(cumulativeMakerAssetFillAmount),
            );
            expect(newBalances[validTakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[validTakerAddress][zrxToken.address].minus(takerFeePaid),
            );
            // Fee recipient
            expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address]
                    .plus(validSignedOrder.makerFee)
                    .plus(makerFeePaid2)
                    .plus(takerFeePaid),
            );
        });
        it('should revert if one maker does not meet the balance threshold', async () => {
            // Create order set with one non-valid maker address
            const signedOrderWithBadMakerAddress = await orderFactory.newSignedOrderAsync({
                makerAddress: invalidAddress,
            });
            const orders = [validSignedOrder, signedOrderWithBadMakerAddress];
            // Execute transaction
            const tx = erc721TakerBalanceThresholdWrapper.marketSellOrdersNoThrowAsync(orders, validTakerAddress, {
                takerAssetFillAmount,
            });
            return expect(tx).to.revertWith(RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold);
        });
        it('should revert if taker does not meet the balance threshold', async () => {
            const orders = [validSignedOrder, validSignedOrder2];
            const tx = erc721NonValidBalanceThresholdWrapper.marketSellOrdersNoThrowAsync(orders, invalidAddress, {
                takerAssetFillAmount,
            });
            return expect(tx).to.revertWith(RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold);
        });
    });

    describe('marketBuyOrders', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            validSignedOrder = await orderFactory.newSignedOrderAsync();
            validSignedOrder2 = await orderFactory2.newSignedOrderAsync();
        });
        it('should transfer the correct amounts and validate both makers/taker when both makers and taker meet the balance threshold', async () => {
            // Execute a valid fill
            const orders = [validSignedOrder, validSignedOrder2];
            const cumulativeTakerAssetFillAmount = validSignedOrder.takerAssetAmount.plus(takerAssetFillAmount);
            const makerAssetFillAmount2 = takerAssetFillAmount
                .times(validSignedOrder.makerAssetAmount)
                .dividedToIntegerBy(validSignedOrder.takerAssetAmount);
            const cumulativeMakerAssetFillAmount = validSignedOrder.makerAssetAmount.plus(makerAssetFillAmount2);
            const txReceipt = await erc721TakerBalanceThresholdWrapper.marketBuyOrdersAsync(orders, validTakerAddress, {
                makerAssetFillAmount: cumulativeMakerAssetFillAmount,
            });
            // Assert validated addresses
            const expectedValidatedAddresseses = [
                validSignedOrder.makerAddress,
                validSignedOrder2.makerAddress,
                validTakerAddress,
            ];
            await assertValidatedAddressesLog(txReceipt, expectedValidatedAddresseses);
            // Check balances
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const makerFeePaid2 = validSignedOrder2.makerFee
                .times(makerAssetFillAmount2)
                .dividedToIntegerBy(validSignedOrder2.makerAssetAmount);
            const takerFeePaid2 = validSignedOrder2.takerFee
                .times(makerAssetFillAmount2)
                .dividedToIntegerBy(validSignedOrder2.makerAssetAmount);
            const takerFeePaid = validSignedOrder.takerFee.plus(takerFeePaid2);
            // Maker #1
            expect(newBalances[validMakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress][defaultMakerAssetAddress].minus(validSignedOrder.makerAssetAmount),
            );
            expect(newBalances[validMakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress][defaultTakerAssetAddress].plus(validSignedOrder.takerAssetAmount),
            );
            expect(newBalances[validMakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress][zrxToken.address].minus(validSignedOrder.makerFee),
            );
            // Maker #2
            expect(newBalances[validMakerAddress2][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress2][defaultMakerAssetAddress].minus(makerAssetFillAmount2),
            );
            expect(newBalances[validMakerAddress2][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress2][defaultTakerAssetAddress].plus(takerAssetFillAmount),
            );
            expect(newBalances[validMakerAddress2][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress2][zrxToken.address].minus(makerFeePaid2),
            );
            // Taker
            expect(newBalances[validTakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validTakerAddress][defaultTakerAssetAddress].minus(cumulativeTakerAssetFillAmount),
            );
            expect(newBalances[validTakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validTakerAddress][defaultMakerAssetAddress].plus(cumulativeMakerAssetFillAmount),
            );
            expect(newBalances[validTakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[validTakerAddress][zrxToken.address].minus(takerFeePaid),
            );
            // Fee recipient
            expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address]
                    .plus(validSignedOrder.makerFee)
                    .plus(makerFeePaid2)
                    .plus(takerFeePaid),
            );
        });
        it('should revert if one maker does not meet the balance threshold', async () => {
            // Create order set with one non-valid maker address
            const signedOrderWithBadMakerAddress = await orderFactory.newSignedOrderAsync({
                makerAddress: invalidAddress,
            });
            const orders = [validSignedOrder, signedOrderWithBadMakerAddress];
            // Execute transaction
            const dummyMakerAssetFillAmount = new BigNumber(0);
            const tx = erc721TakerBalanceThresholdWrapper.marketBuyOrdersAsync(orders, validTakerAddress, {
                makerAssetFillAmount: dummyMakerAssetFillAmount,
            });
            return expect(tx).to.revertWith(RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold);
        });
        it('should revert if taker does not meet the balance threshold', async () => {
            const orders = [validSignedOrder, validSignedOrder2];
            const dummyMakerAssetFillAmount = new BigNumber(0);
            const tx = erc721NonValidBalanceThresholdWrapper.marketBuyOrdersAsync(orders, invalidAddress, {
                makerAssetFillAmount: dummyMakerAssetFillAmount,
            });
            return expect(tx).to.revertWith(RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold);
        });
    });

    describe('marketBuyOrdersNoThrowAsync', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            validSignedOrder = await orderFactory.newSignedOrderAsync();
            validSignedOrder2 = await orderFactory2.newSignedOrderAsync();
        });
        it('should transfer the correct amounts and validate both makers/taker when both makers and taker meet the balance threshold', async () => {
            // Execute a valid fill
            const orders = [validSignedOrder, validSignedOrder2];
            const cumulativeTakerAssetFillAmount = validSignedOrder.takerAssetAmount.plus(takerAssetFillAmount);
            const makerAssetFillAmount2 = takerAssetFillAmount
                .times(validSignedOrder.makerAssetAmount)
                .dividedToIntegerBy(validSignedOrder.takerAssetAmount);
            const cumulativeMakerAssetFillAmount = validSignedOrder.makerAssetAmount.plus(makerAssetFillAmount2);
            const txReceipt = await erc721TakerBalanceThresholdWrapper.marketBuyOrdersNoThrowAsync(
                orders,
                validTakerAddress,
                {
                    makerAssetFillAmount: cumulativeMakerAssetFillAmount,
                    // HACK(albrow): We need to hardcode the gas estimate here because
                    // the Geth gas estimator doesn't work with the way we use
                    // delegatecall and swallow errors.
                    gas: 600000,
                },
            );
            // Assert validated addresses
            const expectedValidatedAddresseses = [
                validSignedOrder.makerAddress,
                validSignedOrder2.makerAddress,
                validTakerAddress,
            ];
            await assertValidatedAddressesLog(txReceipt, expectedValidatedAddresseses);
            // Check balances
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const makerFeePaid2 = validSignedOrder2.makerFee
                .times(makerAssetFillAmount2)
                .dividedToIntegerBy(validSignedOrder2.makerAssetAmount);
            const takerFeePaid2 = validSignedOrder2.takerFee
                .times(makerAssetFillAmount2)
                .dividedToIntegerBy(validSignedOrder2.makerAssetAmount);
            const takerFeePaid = validSignedOrder.takerFee.plus(takerFeePaid2);
            // Maker #1
            expect(newBalances[validMakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress][defaultMakerAssetAddress].minus(validSignedOrder.makerAssetAmount),
            );
            expect(newBalances[validMakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress][defaultTakerAssetAddress].plus(validSignedOrder.takerAssetAmount),
            );
            expect(newBalances[validMakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress][zrxToken.address].minus(validSignedOrder.makerFee),
            );
            // Maker #2
            expect(newBalances[validMakerAddress2][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress2][defaultMakerAssetAddress].minus(makerAssetFillAmount2),
            );
            expect(newBalances[validMakerAddress2][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress2][defaultTakerAssetAddress].plus(takerAssetFillAmount),
            );
            expect(newBalances[validMakerAddress2][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[validMakerAddress2][zrxToken.address].minus(makerFeePaid2),
            );
            // Taker
            expect(newBalances[validTakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validTakerAddress][defaultTakerAssetAddress].minus(cumulativeTakerAssetFillAmount),
            );
            expect(newBalances[validTakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[validTakerAddress][defaultMakerAssetAddress].plus(cumulativeMakerAssetFillAmount),
            );
            expect(newBalances[validTakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[validTakerAddress][zrxToken.address].minus(takerFeePaid),
            );
            // Fee recipient
            expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address]
                    .plus(validSignedOrder.makerFee)
                    .plus(makerFeePaid2)
                    .plus(takerFeePaid),
            );
        });
        it('should revert if one maker does not meet the balance threshold', async () => {
            // Create order set with one non-valid maker address
            const signedOrderWithBadMakerAddress = await orderFactory.newSignedOrderAsync({
                makerAddress: invalidAddress,
            });
            const orders = [validSignedOrder, signedOrderWithBadMakerAddress];
            // Execute transaction
            const dummyMakerAssetFillAmount = new BigNumber(0);
            const tx = erc721TakerBalanceThresholdWrapper.marketBuyOrdersNoThrowAsync(orders, validTakerAddress, {
                makerAssetFillAmount: dummyMakerAssetFillAmount,
            });
            return expect(tx).to.revertWith(RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold);
        });
        it('should revert if taker does not meet the balance threshold', async () => {
            const orders = [validSignedOrder, validSignedOrder2];
            const dummyMakerAssetFillAmount = new BigNumber(0);
            const tx = erc721NonValidBalanceThresholdWrapper.marketBuyOrdersNoThrowAsync(orders, invalidAddress, {
                makerAssetFillAmount: dummyMakerAssetFillAmount,
            });
            return expect(tx).to.revertWith(RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold);
        });
    });

    describe('matchOrders', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            validSignedOrder = await orderFactory.newSignedOrderAsync();
            validSignedOrder2 = await orderFactory2.newSignedOrderAsync();
        });
        it('Should transfer correct amounts when both makers and taker meet the balance threshold', async () => {
            // Test values/results taken from Match Orders test:
            // 'Should transfer correct amounts when right order is fully filled and values pass isRoundingErrorFloor but fail isRoundingErrorCeil'
            // Create orders to match
            const signedOrderLeft = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(17), 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(98), 0),
                makerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), 18),
                takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), 18),
                feeRecipientAddress,
            });
            const signedOrderRight = await orderFactory2.newSignedOrderAsync({
                makerAssetData: assetDataUtils.encodeERC20AssetData(defaultTakerAssetAddress),
                takerAssetData: assetDataUtils.encodeERC20AssetData(defaultMakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(75), 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(13), 0),
                makerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), 18),
                takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), 18),
                feeRecipientAddress,
            });
            // Compute expected transfer amounts
            const expectedTransferAmounts = {
                // Left Maker
                amountSoldByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(13), 0),
                amountBoughtByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(75), 0),
                feePaidByLeftMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber('76.4705882352941176'), 16), // 76.47%
                // Right Maker
                amountSoldByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(75), 0),
                amountBoughtByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(13), 0),
                feePaidByRightMaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
                // Taker
                amountReceivedByTaker: Web3Wrapper.toBaseUnitAmount(new BigNumber(0), 0),
                feePaidByTakerLeft: Web3Wrapper.toBaseUnitAmount(new BigNumber('76.5306122448979591'), 16), // 76.53%
                feePaidByTakerRight: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 16), // 100%
            };
            const txReceipt = await erc721TakerBalanceThresholdWrapper.matchOrdersAsync(
                signedOrderLeft,
                signedOrderRight,
                validTakerAddress,
            );
            // Assert validated addresses
            const expectedValidatedAddresseses = [
                signedOrderLeft.makerAddress,
                signedOrderRight.makerAddress,
                validTakerAddress,
            ];
            await assertValidatedAddressesLog(txReceipt, expectedValidatedAddresseses);
            // Check balances
            const newBalances = await erc20Wrapper.getBalancesAsync();
            expect(
                newBalances[signedOrderLeft.makerAddress][defaultMakerAssetAddress],
                'Checking left maker egress ERC20 account balance',
            ).to.be.bignumber.equal(
                erc20Balances[signedOrderLeft.makerAddress][defaultMakerAssetAddress].minus(
                    expectedTransferAmounts.amountSoldByLeftMaker,
                ),
            );
            expect(
                newBalances[signedOrderRight.makerAddress][defaultTakerAssetAddress],
                'Checking right maker ingress ERC20 account balance',
            ).to.be.bignumber.equal(
                erc20Balances[signedOrderRight.makerAddress][defaultTakerAssetAddress].minus(
                    expectedTransferAmounts.amountSoldByRightMaker,
                ),
            );
            expect(
                newBalances[validTakerAddress][defaultMakerAssetAddress],
                'Checking taker ingress ERC20 account balance',
            ).to.be.bignumber.equal(
                erc20Balances[validTakerAddress][defaultMakerAssetAddress].plus(
                    expectedTransferAmounts.amountReceivedByTaker,
                ),
            );
            expect(
                newBalances[signedOrderLeft.makerAddress][defaultTakerAssetAddress],
                'Checking left maker ingress ERC20 account balance',
            ).to.be.bignumber.equal(
                erc20Balances[signedOrderLeft.makerAddress][defaultTakerAssetAddress].plus(
                    expectedTransferAmounts.amountBoughtByLeftMaker,
                ),
            );
            expect(
                newBalances[signedOrderRight.makerAddress][defaultMakerAssetAddress],
                'Checking right maker egress ERC20 account balance',
            ).to.be.bignumber.equal(
                erc20Balances[signedOrderRight.makerAddress][defaultMakerAssetAddress].plus(
                    expectedTransferAmounts.amountBoughtByRightMaker,
                ),
            );
            // Paid fees
            expect(
                newBalances[signedOrderLeft.makerAddress][zrxToken.address],
                'Checking left maker egress ERC20 account fees',
            ).to.be.bignumber.equal(
                erc20Balances[signedOrderLeft.makerAddress][zrxToken.address].minus(
                    expectedTransferAmounts.feePaidByLeftMaker,
                ),
            );
            expect(
                newBalances[signedOrderRight.makerAddress][zrxToken.address],
                'Checking right maker egress ERC20 account fees',
            ).to.be.bignumber.equal(
                erc20Balances[signedOrderRight.makerAddress][zrxToken.address].minus(
                    expectedTransferAmounts.feePaidByRightMaker,
                ),
            );
            expect(
                newBalances[validTakerAddress][zrxToken.address],
                'Checking taker egress ERC20 account fees',
            ).to.be.bignumber.equal(
                erc20Balances[validTakerAddress][zrxToken.address]
                    .minus(expectedTransferAmounts.feePaidByTakerLeft)
                    .minus(expectedTransferAmounts.feePaidByTakerRight),
            );
            // Received fees
            expect(
                newBalances[signedOrderLeft.feeRecipientAddress][zrxToken.address],
                'Checking left fee recipient ingress ERC20 account fees',
            ).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address]
                    .plus(expectedTransferAmounts.feePaidByLeftMaker)
                    .plus(expectedTransferAmounts.feePaidByRightMaker)
                    .plus(expectedTransferAmounts.feePaidByTakerLeft)
                    .plus(expectedTransferAmounts.feePaidByTakerRight),
            );
        });
        it('should revert if left maker does not meet the balance threshold', async () => {
            // Create signed order with non-valid maker address
            const signedOrderWithBadMakerAddress = await orderFactory.newSignedOrderAsync({
                senderAddress: erc721BalanceThresholdFilterInstance.address,
                makerAddress: invalidAddress,
            });
            // Execute transaction
            const tx = erc721TakerBalanceThresholdWrapper.matchOrdersAsync(
                validSignedOrder,
                signedOrderWithBadMakerAddress,
                validTakerAddress,
            );
            return expect(tx).to.revertWith(RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold);
        });
        it('should revert if right maker does not meet the balance threshold', async () => {
            // Create signed order with non-valid maker address
            const signedOrderWithBadMakerAddress = await orderFactory.newSignedOrderAsync({
                senderAddress: erc721BalanceThresholdFilterInstance.address,
                makerAddress: invalidAddress,
            });
            // Execute transaction
            const tx = erc721TakerBalanceThresholdWrapper.matchOrdersAsync(
                signedOrderWithBadMakerAddress,
                validSignedOrder,
                validTakerAddress,
            );
            return expect(tx).to.revertWith(RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold);
        });
        it('should revert if taker does not meet the balance threshold', async () => {
            const tx = erc721NonValidBalanceThresholdWrapper.matchOrdersAsync(
                validSignedOrder,
                validSignedOrder,
                invalidAddress,
            );
            return expect(tx).to.revertWith(RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold);
        });
    });

    describe('cancelOrder', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            validSignedOrder = await orderFactory.newSignedOrderAsync();
            validSignedOrder2 = await orderFactory2.newSignedOrderAsync();
        });
        it('Should successfully cancel order if maker meets balance threshold', async () => {
            // Verify order is not cancelled
            const orderInfoBeforeCancelling = await erc721MakerBalanceThresholdWrapper.getOrderInfoAsync(
                validSignedOrder,
            );
            expect(orderInfoBeforeCancelling.orderStatus).to.be.equal(OrderStatus.Fillable);
            // Cancel
            const txReceipt = await erc721MakerBalanceThresholdWrapper.cancelOrderAsync(
                validSignedOrder,
                validSignedOrder.makerAddress,
            );
            // Assert validated addresses
            const expectedValidatedAddresseses: string[] = [];
            await assertValidatedAddressesLog(txReceipt, expectedValidatedAddresseses);
            // Check that order was cancelled
            const orderInfoAfterCancelling = await erc721MakerBalanceThresholdWrapper.getOrderInfoAsync(
                validSignedOrder,
            );
            expect(orderInfoAfterCancelling.orderStatus).to.be.equal(OrderStatus.Cancelled);
        });
        it('Should successfully cancel order if maker does not meet balance threshold', async () => {
            // Create order where maker does not meet balance threshold
            const signedOrderWithBadMakerAddress = await invalidOrderFactory.newSignedOrderAsync({});
            // Verify order is not cancelled
            const orderInfoBeforeCancelling = await erc721NonValidBalanceThresholdWrapper.getOrderInfoAsync(
                signedOrderWithBadMakerAddress,
            );
            expect(orderInfoBeforeCancelling.orderStatus).to.be.equal(OrderStatus.Fillable);
            // Cancel
            const txReceipt = await erc721NonValidBalanceThresholdWrapper.cancelOrderAsync(
                signedOrderWithBadMakerAddress,
                signedOrderWithBadMakerAddress.makerAddress,
            );
            // Assert validated addresses
            const expectedValidatedAddresseses: string[] = [];
            await assertValidatedAddressesLog(txReceipt, expectedValidatedAddresseses);
            // Check that order was cancelled
            const orderInfoAfterCancelling = await erc721MakerBalanceThresholdWrapper.getOrderInfoAsync(
                signedOrderWithBadMakerAddress,
            );
            expect(orderInfoAfterCancelling.orderStatus).to.be.equal(OrderStatus.Cancelled);
        });
    });

    describe('batchCancelOrders', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
        });
        it('Should successfully batch cancel orders if maker meets balance threshold', async () => {
            // Create orders to cancel
            const validSignedOrders = [
                await orderFactory.newSignedOrderAsync(),
                await orderFactory.newSignedOrderAsync(),
                await orderFactory.newSignedOrderAsync(),
            ];
            // Verify orders are not cancelled
            _.each(validSignedOrders, async signedOrder => {
                const orderInfoBeforeCancelling = await erc721MakerBalanceThresholdWrapper.getOrderInfoAsync(
                    signedOrder,
                );
                return expect(orderInfoBeforeCancelling.orderStatus).to.be.equal(OrderStatus.Fillable);
            });
            // Cancel
            const txReceipt = await erc721MakerBalanceThresholdWrapper.batchCancelOrdersAsync(
                validSignedOrders,
                validSignedOrders[0].makerAddress,
            );
            // Assert validated addresses
            const expectedValidatedAddresseses: string[] = [];
            await assertValidatedAddressesLog(txReceipt, expectedValidatedAddresseses);
            // Check that order was cancelled
            _.each(validSignedOrders, async signedOrder => {
                const orderInfoAfterCancelling = await erc721MakerBalanceThresholdWrapper.getOrderInfoAsync(
                    signedOrder,
                );
                return expect(orderInfoAfterCancelling.orderStatus).to.be.equal(OrderStatus.Cancelled);
            });
        });
        it('Should successfully batch cancel order if maker does not meet balance threshold', async () => {
            // Create orders to cancel
            const invalidSignedOrders = [
                await invalidOrderFactory.newSignedOrderAsync(),
                await invalidOrderFactory.newSignedOrderAsync(),
                await invalidOrderFactory.newSignedOrderAsync(),
            ];
            // Verify orders are not cancelled
            _.each(invalidSignedOrders, async signedOrder => {
                const orderInfoBeforeCancelling = await erc721NonValidBalanceThresholdWrapper.getOrderInfoAsync(
                    signedOrder,
                );
                return expect(orderInfoBeforeCancelling.orderStatus).to.be.equal(OrderStatus.Fillable);
            });
            // Cancel
            const txReceipt = await erc721NonValidBalanceThresholdWrapper.batchCancelOrdersAsync(
                invalidSignedOrders,
                invalidAddress,
            );
            // Assert validated addresses
            const expectedValidatedAddresseses: string[] = [];
            await assertValidatedAddressesLog(txReceipt, expectedValidatedAddresseses);
            // Check that order was cancelled
            _.each(invalidSignedOrders, async signedOrder => {
                const orderInfoAfterCancelling = await erc721NonValidBalanceThresholdWrapper.getOrderInfoAsync(
                    signedOrder,
                );
                return expect(orderInfoAfterCancelling.orderStatus).to.be.equal(OrderStatus.Cancelled);
            });
        });
    });

    describe('cancelOrdersUpTo', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
        });
        it('Should successfully batch cancel orders if maker meets balance threshold', async () => {
            // Create orders to cancel
            const validSignedOrders = [
                await orderFactory.newSignedOrderAsync({ salt: new BigNumber(0) }),
                await orderFactory.newSignedOrderAsync({ salt: new BigNumber(1) }),
                await orderFactory.newSignedOrderAsync({ salt: new BigNumber(2) }),
            ];
            // Verify orders are not cancelled
            _.each(validSignedOrders, async signedOrder => {
                const orderInfoBeforeCancelling = await erc721MakerBalanceThresholdWrapper.getOrderInfoAsync(
                    signedOrder,
                );
                return expect(orderInfoBeforeCancelling.orderStatus).to.be.equal(OrderStatus.Fillable);
            });
            // Cancel
            const cancelOrdersUpToThisSalt = new BigNumber(1);
            const txReceipt = await erc721MakerBalanceThresholdWrapper.cancelOrdersUpToAsync(
                cancelOrdersUpToThisSalt,
                validSignedOrders[0].makerAddress,
            );
            // Assert validated addresses
            const expectedValidatedAddresseses: string[] = [];
            await assertValidatedAddressesLog(txReceipt, expectedValidatedAddresseses);
            // Check that order was cancelled
            _.each(validSignedOrders, async (signedOrder, salt: number) => {
                const orderInfoAfterCancelling = await erc721MakerBalanceThresholdWrapper.getOrderInfoAsync(
                    signedOrder,
                );
                const saltAsBigNumber = new BigNumber(salt);
                if (saltAsBigNumber.isLessThanOrEqualTo(cancelOrdersUpToThisSalt)) {
                    return expect(orderInfoAfterCancelling.orderStatus).to.be.equal(OrderStatus.Cancelled);
                } else {
                    return expect(orderInfoAfterCancelling.orderStatus).to.be.equal(OrderStatus.Fillable);
                }
            });
        });
        it('Should successfully batch cancel order if maker does not meet balance threshold', async () => {
            // Create orders to cancel
            const invalidSignedOrders = [
                await invalidOrderFactory.newSignedOrderAsync({ salt: new BigNumber(0) }),
                await invalidOrderFactory.newSignedOrderAsync({ salt: new BigNumber(1) }),
                await invalidOrderFactory.newSignedOrderAsync({ salt: new BigNumber(2) }),
            ];
            // Verify orders are not cancelled
            _.each(invalidSignedOrders, async signedOrder => {
                const orderInfoBeforeCancelling = await erc721NonValidBalanceThresholdWrapper.getOrderInfoAsync(
                    signedOrder,
                );
                return expect(orderInfoBeforeCancelling.orderStatus).to.be.equal(OrderStatus.Fillable);
            });
            // Cancel
            const cancelOrdersUpToThisSalt = new BigNumber(1);
            const txReceipt = await erc721NonValidBalanceThresholdWrapper.cancelOrdersUpToAsync(
                cancelOrdersUpToThisSalt,
                invalidAddress,
            );
            // Assert validated addresses
            const expectedValidatedAddresseses: string[] = [];
            await assertValidatedAddressesLog(txReceipt, expectedValidatedAddresseses);
            // Check that order was cancelled
            _.each(invalidSignedOrders, async (signedOrder, salt: number) => {
                const orderInfoAfterCancelling = await erc721NonValidBalanceThresholdWrapper.getOrderInfoAsync(
                    signedOrder,
                );
                const saltAsBigNumber = new BigNumber(salt);
                if (saltAsBigNumber.isLessThanOrEqualTo(cancelOrdersUpToThisSalt)) {
                    return expect(orderInfoAfterCancelling.orderStatus).to.be.equal(OrderStatus.Cancelled);
                } else {
                    return expect(orderInfoAfterCancelling.orderStatus).to.be.equal(OrderStatus.Fillable);
                }
            });
        });
    });
});
// tslint:disable:max-file-line-count
// tslint:enable:no-unnecessary-type-assertion
