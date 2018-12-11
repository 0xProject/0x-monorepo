import { BlockchainLifecycle } from '@0x/dev-utils';
import { assetDataUtils } from '@0x/order-utils';
import { RevertReason, SignedOrder, Order } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';

import { DummyERC20TokenContract } from '../../generated-wrappers/dummy_erc20_token';
import { ExchangeContract } from '../../generated-wrappers/exchange';
import { BalanceThresholdFilterContract } from '../../generated-wrappers/balance_threshold_filter';

import { artifacts } from '../../src/artifacts';
import {
    expectTransactionFailedAsync,
    expectTransactionFailedWithoutReasonAsync,
} from '../utils/assertions';
import { chaiSetup } from '../utils/chai_setup';
import { constants } from '../utils/constants';
import { ERC20Wrapper } from '../utils/erc20_wrapper';
import { ExchangeWrapper } from '../utils/exchange_wrapper';
import { MatchOrderTester } from '../utils/match_order_tester';
import { OrderFactory } from '../utils/order_factory';
import { orderUtils } from '../utils/order_utils';
import { TransactionFactory } from '../utils/transaction_factory';
import { BalanceThresholdWrapper } from '../utils/balance_threshold_wrapper';
import { ContractName, ERC20BalancesByOwner, SignedTransaction, OrderStatus } from '../utils/types';
import { provider, txDefaults, web3Wrapper } from '../utils/web3_wrapper';
import { TestExchangeInternalsContract } from '../../generated-wrappers/test_exchange_internals';

import { MethodAbi, AbiDefinition } from 'ethereum-types';
import { AbiEncoder } from '@0x/utils';
import { Method } from '@0x/utils/lib/src/abi_encoder';
import { LogDecoder } from '../utils/log_decoder';
import { ERC721Wrapper } from '../utils/erc721_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
const DECIMALS_DEFAULT = 18;

interface ValidatedAddressesLog {
    args: {addresses: string[]}
}

describe.only(ContractName.BalanceThresholdFilter, () => {
    let compliantMakerAddress: string;
    let compliantMakerAddress2: string;
    let owner: string;
    let compliantTakerAddress: string;
    let feeRecipientAddress: string;
    let nonCompliantAddress: string;
    let defaultMakerAssetAddress: string;
    let defaultTakerAssetAddress: string;
    let zrxAssetData: string;
    let zrxToken: DummyERC20TokenContract;
    let exchangeInstance: ExchangeContract;
    let exchangeWrapper: ExchangeWrapper;

    let orderFactory: OrderFactory;
    let orderFactory2: OrderFactory;
    let nonCompliantOrderFactory: OrderFactory;
    let erc20Wrapper: ERC20Wrapper;
    let erc20Balances: ERC20BalancesByOwner;
    let erc20TakerBalanceThresholdWrapper: BalanceThresholdWrapper;
    let erc721TakerBalanceThresholdWrapper: BalanceThresholdWrapper;
    let erc721MakerBalanceThresholdWrapper: BalanceThresholdWrapper;
    let erc721NonCompliantBalanceThresholdWrapper: BalanceThresholdWrapper;

    let takerTransactionFactory: TransactionFactory;
    let makerTransactionFactory: TransactionFactory;
    let compliantSignedOrder: SignedOrder;
    let compliantSignedOrder2: SignedOrder;
    let compliantSignedFillOrderTx: SignedTransaction;

    let logDecoder: LogDecoder;
    let exchangeInternals: TestExchangeInternalsContract;

    let defaultOrderParams: Partial<Order>;

    const takerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(500), DECIMALS_DEFAULT);
    const makerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(1000), DECIMALS_DEFAULT);
    const takerAssetFillAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(250), DECIMALS_DEFAULT);

    let erc721CompliantForwarderInstance: BalanceThresholdFilterContract;
    let erc20CompliantForwarderInstance: BalanceThresholdFilterContract;

    const assertValidatedAddressesLog = async (txReceipt: TransactionReceiptWithDecodedLogs, expectedValidatedAddresses: string[]) => {
        expect(txReceipt.logs.length).to.be.gte(1);
        const validatedAddressesLog = (txReceipt.logs[0] as any) as ValidatedAddressesLog;
        const validatedAddresses = validatedAddressesLog.args.addresses;
        // @HACK-hysz: Nested addresses are not translated to lower-case but this will change once
        //             the new ABI Encoder/Decoder is used by the contract templates.
        let validatedAddressesNormalized: string[] = [];
        _.each(validatedAddresses, (address) => {
            const normalizedAddress = _.toLower(address);
            validatedAddressesNormalized.push(normalizedAddress);
        });
        expect(validatedAddressesNormalized).to.be.deep.equal(expectedValidatedAddresses);
    };

    before(async () => {
        // Create accounts
        await blockchainLifecycle.startAsync();
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const usedAddresses = ([
            owner,
            compliantMakerAddress,
            compliantMakerAddress2,
            compliantTakerAddress,
            feeRecipientAddress,
            nonCompliantAddress,
        ] = accounts);
        // Create wrappers
        erc20Wrapper = new ERC20Wrapper(provider, usedAddresses, owner);
        let compliantAddresses = _.cloneDeepWith(usedAddresses);
        _.remove(compliantAddresses, (address: string) => {
            return address === nonCompliantAddress;
        });
        const erc721Wrapper = new ERC721Wrapper(provider, compliantAddresses, owner);
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
        // Deploy Exchange congtract
        exchangeInstance = await ExchangeContract.deployFrom0xArtifactAsync(
            artifacts.Exchange,
            provider,
            txDefaults,
            zrxAssetData,
        );
        exchangeWrapper = new ExchangeWrapper(exchangeInstance, provider);
        // Register proxies
        await exchangeWrapper.registerAssetProxyAsync(erc20Proxy.address, owner);
        await erc20Proxy.addAuthorizedAddress.sendTransactionAsync(exchangeInstance.address, {
            from: owner,
        });
        // Deploy Compliant Forwarder
        const erc721alanceThreshold = new BigNumber(1);
        await erc721Wrapper.deployProxyAsync();
        const [erc721BalanceThresholdAsset] = await erc721Wrapper.deployDummyTokensAsync();
        await erc721Wrapper.setBalancesAndAllowancesAsync();
        erc721CompliantForwarderInstance = await BalanceThresholdFilterContract.deployFrom0xArtifactAsync(
            artifacts.BalanceThresholdFilter,
            provider,
            txDefaults,
            exchangeInstance.address,
            erc721BalanceThresholdAsset.address,
            erc721alanceThreshold
        );
        const erc20BalanceThreshold = Web3Wrapper.toBaseUnitAmount(new BigNumber(1), 10);
        erc20CompliantForwarderInstance = await BalanceThresholdFilterContract.deployFrom0xArtifactAsync(
            artifacts.BalanceThresholdFilter,
            provider,
            txDefaults,
            exchangeInstance.address,
            erc20BalanceThresholdAsset.address,
            erc20BalanceThreshold
        );

        // Default order parameters
        defaultOrderParams = {
            exchangeAddress: exchangeInstance.address,
            feeRecipientAddress,
            makerAssetData: assetDataUtils.encodeERC20AssetData(defaultMakerAssetAddress),
            takerAssetData: assetDataUtils.encodeERC20AssetData(defaultTakerAssetAddress),
            makerAssetAmount,
            takerAssetAmount,
            makerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), DECIMALS_DEFAULT),
            takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(150), DECIMALS_DEFAULT),
            senderAddress: erc721CompliantForwarderInstance.address,
        };
        const defaultOrderParams1 = {
            makerAddress: compliantMakerAddress,
            ...
            defaultOrderParams,
        }
        const makerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(compliantMakerAddress)];
        takerTransactionFactory = new TransactionFactory(makerPrivateKey, exchangeInstance.address);
        orderFactory = new OrderFactory(makerPrivateKey, defaultOrderParams1);
        const defaultOrderParams2 = {
            makerAddress: compliantMakerAddress2,
            ...
            defaultOrderParams,
        }
        const secondMakerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(compliantMakerAddress2)];
        orderFactory2 = new OrderFactory(secondMakerPrivateKey, defaultOrderParams2);

        const nonCompliantPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(nonCompliantAddress)];
        const defaultNonCompliantOrderParams = {
            makerAddress: nonCompliantAddress,
            ...
            defaultOrderParams,
        };
        nonCompliantOrderFactory = new OrderFactory(nonCompliantPrivateKey, defaultNonCompliantOrderParams);
        // Create Valid/Invalid orders
        const takerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(compliantTakerAddress)];
        takerTransactionFactory = new TransactionFactory(takerPrivateKey, exchangeInstance.address);
        compliantSignedOrder = await orderFactory.newSignedOrderAsync({
            senderAddress: erc721CompliantForwarderInstance.address,
        });
        const compliantSignedOrderWithoutExchangeAddress = orderUtils.getOrderWithoutExchangeAddress(
            compliantSignedOrder,
        );
        const compliantSignedOrderWithoutExchangeAddressData = exchangeInstance.fillOrder.getABIEncodedTransactionData(
            compliantSignedOrderWithoutExchangeAddress,
            takerAssetFillAmount,
            compliantSignedOrder.signature,
        );
        compliantSignedFillOrderTx = takerTransactionFactory.newSignedTransaction(
            compliantSignedOrderWithoutExchangeAddressData,
        );

        logDecoder = new LogDecoder(web3Wrapper);
        erc20TakerBalanceThresholdWrapper = new BalanceThresholdWrapper(erc20CompliantForwarderInstance, exchangeInstance, new TransactionFactory(takerPrivateKey, exchangeInstance.address), provider);
        erc721TakerBalanceThresholdWrapper = new BalanceThresholdWrapper(erc721CompliantForwarderInstance, exchangeInstance, new TransactionFactory(takerPrivateKey, exchangeInstance.address), provider);
        erc721MakerBalanceThresholdWrapper = new BalanceThresholdWrapper(erc721CompliantForwarderInstance, exchangeInstance, new TransactionFactory(makerPrivateKey, exchangeInstance.address), provider);
        erc721NonCompliantBalanceThresholdWrapper = new BalanceThresholdWrapper(erc721CompliantForwarderInstance, exchangeInstance, new TransactionFactory(nonCompliantPrivateKey, exchangeInstance.address), provider);
        
        // Instantiate internal exchange contract
        exchangeInternals = await TestExchangeInternalsContract.deployFrom0xArtifactAsync(
            artifacts.TestExchangeInternals,
            provider,
            txDefaults,
        );
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe.only('General Sanity Checks', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            compliantSignedOrder = await orderFactory.newSignedOrderAsync();
            compliantSignedOrder2 = await orderFactory2.newSignedOrderAsync();
        });
        it.only('should transfer the correct amounts and validate both maker/taker when both maker and taker exceed the balance threshold of an ERC20 token', async () => {
            const compliantSignedOrderERC20Sender = await orderFactory.newSignedOrderAsync({
                ...
                defaultOrderParams,
                makerAddress: compliantMakerAddress,
                senderAddress: erc20TakerBalanceThresholdWrapper.getBalanceThresholdAddress(),
            });
            // Execute a valid fill
            const txReceipt = await erc20TakerBalanceThresholdWrapper.fillOrderAsync(compliantSignedOrderERC20Sender, compliantTakerAddress, {takerAssetFillAmount});
            // Assert validated addresses
            const expectedValidatedAddresseses = [compliantSignedOrder.makerAddress, compliantSignedFillOrderTx.signerAddress];
            assertValidatedAddressesLog(txReceipt, expectedValidatedAddresseses);
            // Check balances
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const makerAssetFillAmount = takerAssetFillAmount
                .times(compliantSignedOrder.makerAssetAmount)
                .dividedToIntegerBy(compliantSignedOrder.takerAssetAmount);
            const makerFeePaid = compliantSignedOrder.makerFee
                .times(makerAssetFillAmount)
                .dividedToIntegerBy(compliantSignedOrder.makerAssetAmount);
            const takerFeePaid = compliantSignedOrder.takerFee
                .times(makerAssetFillAmount)
                .dividedToIntegerBy(compliantSignedOrder.makerAssetAmount);
            expect(newBalances[compliantMakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress][defaultMakerAssetAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[compliantMakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress][defaultTakerAssetAddress].add(takerAssetFillAmount),
            );
            expect(newBalances[compliantMakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress][zrxToken.address].minus(makerFeePaid),
            );
            expect(newBalances[compliantTakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantTakerAddress][defaultTakerAssetAddress].minus(takerAssetFillAmount),
            );
            expect(newBalances[compliantTakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantTakerAddress][defaultMakerAssetAddress].add(makerAssetFillAmount),
            );
            expect(newBalances[compliantTakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[compliantTakerAddress][zrxToken.address].minus(takerFeePaid),
            );
            expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address].add(makerFeePaid.add(takerFeePaid)),
            );
        });
        it('should revert if the signed transaction is not intended for supported', async () => {
            // Create signed order without the fillOrder function selector
            const txDataBuf = ethUtil.toBuffer(compliantSignedFillOrderTx.data);
            const selectorLengthInBytes = 4;
            const txDataBufMinusSelector = txDataBuf.slice(selectorLengthInBytes);
            const badSelector = '0x00000000';
            const badSelectorBuf = ethUtil.toBuffer(badSelector);
            const txDataBufWithBadSelector = Buffer.concat([badSelectorBuf, txDataBufMinusSelector]);
            const txDataBufWithBadSelectorHex = ethUtil.bufferToHex(txDataBufWithBadSelector);
            // Call compliant forwarder
            return expectTransactionFailedWithoutReasonAsync(erc721CompliantForwarderInstance.executeTransaction.sendTransactionAsync(
                compliantSignedFillOrderTx.salt,
                compliantSignedFillOrderTx.signerAddress,
                txDataBufWithBadSelectorHex,
                compliantSignedFillOrderTx.signature,
            ));
        });
        it('should revert if senderAddress is not set to the compliant forwarding contract', async () => {
            // Create signed order with incorrect senderAddress
            const notBalanceThresholdFilterAddress = zrxToken.address;
            const signedOrderWithBadSenderAddress = await orderFactory.newSignedOrderAsync({
                senderAddress: notBalanceThresholdFilterAddress,
            });
            const signedOrderWithoutExchangeAddress = orderUtils.getOrderWithoutExchangeAddress(
                signedOrderWithBadSenderAddress,
            );
            const signedOrderWithoutExchangeAddressData = exchangeInstance.fillOrder.getABIEncodedTransactionData(
                signedOrderWithoutExchangeAddress,
                takerAssetFillAmount,
                compliantSignedOrder.signature,
            );
            const signedFillOrderTx = takerTransactionFactory.newSignedTransaction(
                signedOrderWithoutExchangeAddressData,
            );
            // Call compliant forwarder
            return expectTransactionFailedWithoutReasonAsync(erc721CompliantForwarderInstance.executeTransaction.sendTransactionAsync(
                signedFillOrderTx.salt,
                signedFillOrderTx.signerAddress,
                signedFillOrderTx.data,
                signedFillOrderTx.signature,
            ));
        });
        // @TODO - greater than 1 balance
    });

    describe('batchFillOrders', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            compliantSignedOrder = await orderFactory.newSignedOrderAsync();
            compliantSignedOrder2 = await orderFactory2.newSignedOrderAsync();
        });
        it('should transfer the correct amounts and validate both makers/taker when both maker and taker meet the balance threshold', async () => {
            // Execute a valid fill
            const orders = [compliantSignedOrder, compliantSignedOrder2];
            const takerAssetFillAmounts = [takerAssetFillAmount, takerAssetFillAmount];
            const txReceipt = await erc721TakerBalanceThresholdWrapper.batchFillOrdersAsync(orders, compliantTakerAddress, {takerAssetFillAmounts});
            // Assert validated addresses
            const expectedValidatedAddresseses = [compliantSignedOrder.makerAddress, compliantSignedOrder2.makerAddress, compliantSignedFillOrderTx.signerAddress];
            assertValidatedAddressesLog(txReceipt, expectedValidatedAddresseses);
            // Check balances
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const cumulativeTakerAssetFillAmount = takerAssetFillAmount.times(2);
            const makerAssetFillAmount = takerAssetFillAmount
                .times(compliantSignedOrder.makerAssetAmount)
                .dividedToIntegerBy(compliantSignedOrder.takerAssetAmount);
            const makerFeePaid = compliantSignedOrder.makerFee
                .times(makerAssetFillAmount)
                .dividedToIntegerBy(compliantSignedOrder.makerAssetAmount);
            const takerFeePaid = compliantSignedOrder.takerFee
                .times(makerAssetFillAmount)
                .dividedToIntegerBy(compliantSignedOrder.makerAssetAmount)
                .times(2);
            // Maker #1
            expect(newBalances[compliantMakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress][defaultMakerAssetAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[compliantMakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress][defaultTakerAssetAddress].add(takerAssetFillAmount),
            );
            expect(newBalances[compliantMakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress][zrxToken.address].minus(makerFeePaid),
            );
            // Maker #2
            expect(newBalances[compliantMakerAddress2][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress2][defaultMakerAssetAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[compliantMakerAddress2][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress2][defaultTakerAssetAddress].add(takerAssetFillAmount),
            );
            expect(newBalances[compliantMakerAddress2][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress2][zrxToken.address].minus(makerFeePaid),
            );
            // Taker      
            expect(newBalances[compliantTakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantTakerAddress][defaultTakerAssetAddress].minus(cumulativeTakerAssetFillAmount),
            );
                        
            expect(newBalances[compliantTakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantTakerAddress][defaultMakerAssetAddress].add(makerAssetFillAmount.times(2)),
            );
            expect(newBalances[compliantTakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[compliantTakerAddress][zrxToken.address].minus(takerFeePaid),
            );
            // Fee recipient
            expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address].add(makerFeePaid.times(2).add(takerFeePaid)),
            );
        });
        it('should revert if one maker does not meet the balance threshold', async () => {
            // Create order set with one non-compliant maker address
            const takerAssetFillAmounts = [takerAssetFillAmount, takerAssetFillAmount];
            const signedOrderWithBadMakerAddress = await orderFactory.newSignedOrderAsync({
                makerAddress: nonCompliantAddress
            });
            const orders = [compliantSignedOrder, signedOrderWithBadMakerAddress];
            // Execute transaction
            return expectTransactionFailedAsync(
                erc721TakerBalanceThresholdWrapper.batchFillOrdersAsync(
                    orders,
                    compliantTakerAddress, 
                    {takerAssetFillAmounts}
                ),
                RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold
            );
        });
        it('should revert if taker does not meet the balance threshold', async () => {
            const orders = [compliantSignedOrder, compliantSignedOrder2];
            const takerAssetFillAmounts = [takerAssetFillAmount, takerAssetFillAmount];
            return expectTransactionFailedAsync(
                erc721NonCompliantBalanceThresholdWrapper.batchFillOrdersAsync(
                    orders,
                    nonCompliantAddress, 
                    {takerAssetFillAmounts}
                ),
                RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold
            );
        });
    });

    describe('batchFillOrdersNoThrow', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            compliantSignedOrder = await orderFactory.newSignedOrderAsync();
            compliantSignedOrder2 = await orderFactory2.newSignedOrderAsync();
        });
        it('should transfer the correct amounts and validate both makers/taker when both maker and taker meet the balance threshold', async () => {
            // Execute a valid fill
            const orders = [compliantSignedOrder, compliantSignedOrder2];
            const takerAssetFillAmounts = [takerAssetFillAmount, takerAssetFillAmount];
            const txReceipt = await erc721TakerBalanceThresholdWrapper.batchFillOrdersNoThrowAsync(orders, compliantTakerAddress, {takerAssetFillAmounts});
            // Assert validated addresses
            const expectedValidatedAddresseses = [compliantSignedOrder.makerAddress, compliantSignedOrder2.makerAddress, compliantSignedFillOrderTx.signerAddress];
            assertValidatedAddressesLog(txReceipt, expectedValidatedAddresseses);
            // Check balances
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const cumulativeTakerAssetFillAmount = takerAssetFillAmount.times(2);
            const makerAssetFillAmount = takerAssetFillAmount
                .times(compliantSignedOrder.makerAssetAmount)
                .dividedToIntegerBy(compliantSignedOrder.takerAssetAmount);
            const makerFeePaid = compliantSignedOrder.makerFee
                .times(makerAssetFillAmount)
                .dividedToIntegerBy(compliantSignedOrder.makerAssetAmount);
            const takerFeePaid = compliantSignedOrder.takerFee
                .times(makerAssetFillAmount)
                .dividedToIntegerBy(compliantSignedOrder.makerAssetAmount)
                .times(2);
            // Maker #1
            expect(newBalances[compliantMakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress][defaultMakerAssetAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[compliantMakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress][defaultTakerAssetAddress].add(takerAssetFillAmount),
            );
            expect(newBalances[compliantMakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress][zrxToken.address].minus(makerFeePaid),
            );
            // Maker #2
            expect(newBalances[compliantMakerAddress2][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress2][defaultMakerAssetAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[compliantMakerAddress2][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress2][defaultTakerAssetAddress].add(takerAssetFillAmount),
            );
            expect(newBalances[compliantMakerAddress2][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress2][zrxToken.address].minus(makerFeePaid),
            );
            // Taker      
            expect(newBalances[compliantTakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantTakerAddress][defaultTakerAssetAddress].minus(cumulativeTakerAssetFillAmount),
            );
                        
            expect(newBalances[compliantTakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantTakerAddress][defaultMakerAssetAddress].add(makerAssetFillAmount.times(2)),
            );
            expect(newBalances[compliantTakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[compliantTakerAddress][zrxToken.address].minus(takerFeePaid),
            );
            // Fee recipient
            expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address].add(makerFeePaid.times(2).add(takerFeePaid)),
            );
        });
        it('should revert if one maker does not meet the balance threshold', async () => {
            // Create order set with one non-compliant maker address
            const takerAssetFillAmounts = [takerAssetFillAmount, takerAssetFillAmount];
            const signedOrderWithBadMakerAddress = await orderFactory.newSignedOrderAsync({
                makerAddress: nonCompliantAddress
            });
            const orders = [compliantSignedOrder, signedOrderWithBadMakerAddress];
            // Execute transaction
            return expectTransactionFailedAsync(
                erc721TakerBalanceThresholdWrapper.batchFillOrdersNoThrowAsync(
                    orders,
                    compliantTakerAddress, 
                    {takerAssetFillAmounts}
                ),
                RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold
            );
        });
        it('should revert if taker does not meet the balance threshold', async () => {
            const orders = [compliantSignedOrder, compliantSignedOrder2];
            const takerAssetFillAmounts = [takerAssetFillAmount, takerAssetFillAmount];
            return expectTransactionFailedAsync(
                erc721NonCompliantBalanceThresholdWrapper.batchFillOrdersNoThrowAsync(
                    orders,
                    nonCompliantAddress, 
                    {takerAssetFillAmounts}
                ),
                RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold
            );
        });
    });

    describe('batchFillOrKillOrders', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            compliantSignedOrder = await orderFactory.newSignedOrderAsync();
            compliantSignedOrder2 = await orderFactory2.newSignedOrderAsync();
        });
        it('should transfer the correct amounts and validate both makers/taker when both makers and taker meet the balance threshold', async () => {
            // Execute a valid fill
            const orders = [compliantSignedOrder, compliantSignedOrder2];
            const takerAssetFillAmounts = [takerAssetFillAmount, takerAssetFillAmount];
            const txReceipt = await erc721TakerBalanceThresholdWrapper.batchFillOrKillOrdersAsync(orders, compliantTakerAddress, {takerAssetFillAmounts});
            // Assert validated addresses
            const expectedValidatedAddresseses = [compliantSignedOrder.makerAddress, compliantSignedOrder2.makerAddress, compliantSignedFillOrderTx.signerAddress];
            assertValidatedAddressesLog(txReceipt, expectedValidatedAddresseses);
            // Check balances
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const cumulativeTakerAssetFillAmount = takerAssetFillAmount.times(2);
            const makerAssetFillAmount = takerAssetFillAmount
                .times(compliantSignedOrder.makerAssetAmount)
                .dividedToIntegerBy(compliantSignedOrder.takerAssetAmount);
            const makerFeePaid = compliantSignedOrder.makerFee
                .times(makerAssetFillAmount)
                .dividedToIntegerBy(compliantSignedOrder.makerAssetAmount);
            const takerFeePaid = compliantSignedOrder.takerFee
                .times(makerAssetFillAmount)
                .dividedToIntegerBy(compliantSignedOrder.makerAssetAmount)
                .times(2);
            // Maker #1
            expect(newBalances[compliantMakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress][defaultMakerAssetAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[compliantMakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress][defaultTakerAssetAddress].add(takerAssetFillAmount),
            );
            expect(newBalances[compliantMakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress][zrxToken.address].minus(makerFeePaid),
            );
            // Maker #2
            expect(newBalances[compliantMakerAddress2][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress2][defaultMakerAssetAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[compliantMakerAddress2][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress2][defaultTakerAssetAddress].add(takerAssetFillAmount),
            );
            expect(newBalances[compliantMakerAddress2][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress2][zrxToken.address].minus(makerFeePaid),
            );
            // Taker      
            expect(newBalances[compliantTakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantTakerAddress][defaultTakerAssetAddress].minus(cumulativeTakerAssetFillAmount),
            );
                        
            expect(newBalances[compliantTakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantTakerAddress][defaultMakerAssetAddress].add(makerAssetFillAmount.times(2)),
            );
            expect(newBalances[compliantTakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[compliantTakerAddress][zrxToken.address].minus(takerFeePaid),
            );
            // Fee recipient
            expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address].add(makerFeePaid.times(2).add(takerFeePaid)),
            );
        });
        it('should revert if one maker does not meet the balance threshold', async () => {
            // Create order set with one non-compliant maker address
            const takerAssetFillAmounts = [takerAssetFillAmount, takerAssetFillAmount];
            const signedOrderWithBadMakerAddress = await orderFactory.newSignedOrderAsync({
                makerAddress: nonCompliantAddress
            });
            const orders = [compliantSignedOrder, signedOrderWithBadMakerAddress];
            // Execute transaction
            return expectTransactionFailedAsync(
                erc721TakerBalanceThresholdWrapper.batchFillOrKillOrdersAsync(
                    orders,
                    compliantTakerAddress, 
                    {takerAssetFillAmounts}
                ),
                RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold
            );
        });
        it('should revert if taker does not meet the balance threshold', async () => {
            const orders = [compliantSignedOrder, compliantSignedOrder2];
            const takerAssetFillAmounts = [takerAssetFillAmount, takerAssetFillAmount];
            return expectTransactionFailedAsync(
                erc721NonCompliantBalanceThresholdWrapper.batchFillOrKillOrdersAsync(
                    orders,
                    nonCompliantAddress, 
                    {takerAssetFillAmounts}
                ),
                RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold
            );
        });
        it('should revert if one takerAssetFillAmount is not fully filled', async () => {
            const tooBigTakerAssetFillAmount = compliantSignedOrder.takerAssetAmount.times(2);
            const orders = [compliantSignedOrder, compliantSignedOrder2];
            const takerAssetFillAmounts = [takerAssetFillAmount, tooBigTakerAssetFillAmount];
            return expectTransactionFailedAsync(
                erc721TakerBalanceThresholdWrapper.batchFillOrKillOrdersAsync(
                    orders,
                    compliantTakerAddress, 
                    {takerAssetFillAmounts}
                ),
                RevertReason.FailedExecution
            );
        });
    });

    describe('fillOrder', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            compliantSignedOrder = await orderFactory.newSignedOrderAsync();
        });
        it('should transfer the correct amounts and validate both maker/taker when both maker and taker meet the balance threshold', async () => {
            // Execute a valid fill
            const txReceipt = await erc721TakerBalanceThresholdWrapper.fillOrderAsync(compliantSignedOrder, compliantTakerAddress, {takerAssetFillAmount});
            // Assert validated addresses
            const expectedValidatedAddresseses = [compliantSignedOrder.makerAddress, compliantSignedFillOrderTx.signerAddress];
            assertValidatedAddressesLog(txReceipt, expectedValidatedAddresseses);
            // Check balances
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const makerAssetFillAmount = takerAssetFillAmount
                .times(compliantSignedOrder.makerAssetAmount)
                .dividedToIntegerBy(compliantSignedOrder.takerAssetAmount);
            const makerFeePaid = compliantSignedOrder.makerFee
                .times(makerAssetFillAmount)
                .dividedToIntegerBy(compliantSignedOrder.makerAssetAmount);
            const takerFeePaid = compliantSignedOrder.takerFee
                .times(makerAssetFillAmount)
                .dividedToIntegerBy(compliantSignedOrder.makerAssetAmount);
            expect(newBalances[compliantMakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress][defaultMakerAssetAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[compliantMakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress][defaultTakerAssetAddress].add(takerAssetFillAmount),
            );
            expect(newBalances[compliantMakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress][zrxToken.address].minus(makerFeePaid),
            );
            expect(newBalances[compliantTakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantTakerAddress][defaultTakerAssetAddress].minus(takerAssetFillAmount),
            );
            expect(newBalances[compliantTakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantTakerAddress][defaultMakerAssetAddress].add(makerAssetFillAmount),
            );
            expect(newBalances[compliantTakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[compliantTakerAddress][zrxToken.address].minus(takerFeePaid),
            );
            expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address].add(makerFeePaid.add(takerFeePaid)),
            );
        });
        it('should revert if maker does not meet the balance threshold', async () => {
            // Create signed order with non-compliant maker address
            const signedOrderWithBadMakerAddress = await orderFactory.newSignedOrderAsync({
                senderAddress: erc721CompliantForwarderInstance.address,
                makerAddress: nonCompliantAddress
            });
            // Execute transaction
            return expectTransactionFailedAsync(
                erc721TakerBalanceThresholdWrapper.fillOrderAsync(
                    signedOrderWithBadMakerAddress,
                    compliantTakerAddress, 
                    {takerAssetFillAmount}
                ),
                RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold
            );
        });
        it('should revert if taker does not meet the balance threshold', async () => {
            return expectTransactionFailedAsync(
                erc721NonCompliantBalanceThresholdWrapper.fillOrderAsync(
                    compliantSignedOrder,
                    nonCompliantAddress, 
                    {takerAssetFillAmount}
                ),
                RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold
            );
        });
    });

    describe('fillOrderNoThrow', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            compliantSignedOrder = await orderFactory.newSignedOrderAsync();
        });
        it('should transfer the correct amounts and validate both maker/taker when both maker and taker meet the balance threshold', async () => {
            // Execute a valid fill
            const txReceipt = await erc721TakerBalanceThresholdWrapper.fillOrderNoThrowAsync(compliantSignedOrder, compliantTakerAddress, {takerAssetFillAmount});
            // Assert validated addresses
            const expectedValidatedAddresseses = [compliantSignedOrder.makerAddress, compliantSignedFillOrderTx.signerAddress];
            assertValidatedAddressesLog(txReceipt, expectedValidatedAddresseses);
            // Check balances
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const makerAssetFillAmount = takerAssetFillAmount
                .times(compliantSignedOrder.makerAssetAmount)
                .dividedToIntegerBy(compliantSignedOrder.takerAssetAmount);
            const makerFeePaid = compliantSignedOrder.makerFee
                .times(makerAssetFillAmount)
                .dividedToIntegerBy(compliantSignedOrder.makerAssetAmount);
            const takerFeePaid = compliantSignedOrder.takerFee
                .times(makerAssetFillAmount)
                .dividedToIntegerBy(compliantSignedOrder.makerAssetAmount);
            expect(newBalances[compliantMakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress][defaultMakerAssetAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[compliantMakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress][defaultTakerAssetAddress].add(takerAssetFillAmount),
            );
            expect(newBalances[compliantMakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress][zrxToken.address].minus(makerFeePaid),
            );
            expect(newBalances[compliantTakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantTakerAddress][defaultTakerAssetAddress].minus(takerAssetFillAmount),
            );
            expect(newBalances[compliantTakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantTakerAddress][defaultMakerAssetAddress].add(makerAssetFillAmount),
            );
            expect(newBalances[compliantTakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[compliantTakerAddress][zrxToken.address].minus(takerFeePaid),
            );
            expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address].add(makerFeePaid.add(takerFeePaid)),
            );
        });
        it('should revert if maker does not meet the balance threshold', async () => {
            // Create signed order with non-compliant maker address
            const signedOrderWithBadMakerAddress = await orderFactory.newSignedOrderAsync({
                senderAddress: erc721CompliantForwarderInstance.address,
                makerAddress: nonCompliantAddress
            });
            // Execute transaction
            return expectTransactionFailedAsync(
                erc721TakerBalanceThresholdWrapper.fillOrderNoThrowAsync(
                    signedOrderWithBadMakerAddress,
                    compliantTakerAddress, 
                    {takerAssetFillAmount}
                ),
                RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold
            );
        });
        it('should revert if taker does not meet the balance threshold', async () => {
            return expectTransactionFailedAsync(
                erc721NonCompliantBalanceThresholdWrapper.fillOrderNoThrowAsync(
                    compliantSignedOrder,
                    nonCompliantAddress, 
                    {takerAssetFillAmount}
                ),
                RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold
            );
        });
    });

    describe('fillOrKillOrder', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            compliantSignedOrder = await orderFactory.newSignedOrderAsync();
        });
        it('should transfer the correct amounts and validate both maker/taker when both maker and taker meet the balance threshold', async () => {
            // Execute a valid fill
            const takerAssetFillAmount_ = compliantSignedOrder.takerAssetAmount;
            const txReceipt = await erc721TakerBalanceThresholdWrapper.fillOrKillOrderAsync(compliantSignedOrder, compliantTakerAddress, {takerAssetFillAmount: takerAssetFillAmount_});
            // Assert validated addresses
            const expectedValidatedAddresseses = [compliantSignedOrder.makerAddress, compliantSignedFillOrderTx.signerAddress];
            assertValidatedAddressesLog(txReceipt, expectedValidatedAddresseses);
            // Check balances
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const makerAssetFillAmount = takerAssetFillAmount_
                .times(compliantSignedOrder.makerAssetAmount)
                .dividedToIntegerBy(compliantSignedOrder.takerAssetAmount);
            const makerFeePaid = compliantSignedOrder.makerFee
                .times(makerAssetFillAmount)
                .dividedToIntegerBy(compliantSignedOrder.makerAssetAmount);
            const takerFeePaid = compliantSignedOrder.takerFee
                .times(makerAssetFillAmount)
                .dividedToIntegerBy(compliantSignedOrder.makerAssetAmount);
            expect(newBalances[compliantMakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress][defaultMakerAssetAddress].minus(makerAssetFillAmount),
            );
            expect(newBalances[compliantMakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress][defaultTakerAssetAddress].add(takerAssetFillAmount_),
            );
            expect(newBalances[compliantMakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress][zrxToken.address].minus(makerFeePaid),
            );
            expect(newBalances[compliantTakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantTakerAddress][defaultTakerAssetAddress].minus(takerAssetFillAmount_),
            );
            expect(newBalances[compliantTakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantTakerAddress][defaultMakerAssetAddress].add(makerAssetFillAmount),
            );
            expect(newBalances[compliantTakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[compliantTakerAddress][zrxToken.address].minus(takerFeePaid),
            );
            expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address].add(makerFeePaid.add(takerFeePaid)),
            );
        });
        it('should revert if maker does not meet the balance threshold', async () => {
            // Create signed order with non-compliant maker address
            const signedOrderWithBadMakerAddress = await orderFactory.newSignedOrderAsync({
                senderAddress: erc721CompliantForwarderInstance.address,
                makerAddress: nonCompliantAddress
            });
            // Execute transaction
            return expectTransactionFailedAsync(
                erc721TakerBalanceThresholdWrapper.fillOrKillOrderAsync(
                    signedOrderWithBadMakerAddress,
                    compliantTakerAddress, 
                    {takerAssetFillAmount}
                ),
                RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold
            );
        });
        it('should revert if taker does not meet the balance threshold', async () => {
            return expectTransactionFailedAsync(
                erc721NonCompliantBalanceThresholdWrapper.fillOrKillOrderAsync(
                    compliantSignedOrder,
                    nonCompliantAddress, 
                    {takerAssetFillAmount}
                ),
                RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold
            );
        });
        it('should revert if takerAssetFillAmount is not fully filled', async () => {
            const tooBigTakerAssetFillAmount = compliantSignedOrder.takerAssetAmount.times(2);
            return expectTransactionFailedAsync(
                erc721TakerBalanceThresholdWrapper.fillOrKillOrderAsync(
                    compliantSignedOrder,
                    compliantTakerAddress, 
                    {takerAssetFillAmount: tooBigTakerAssetFillAmount}
                ),
                RevertReason.FailedExecution
            );
        });
    });

    describe('marketSellOrders', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            compliantSignedOrder = await orderFactory.newSignedOrderAsync();
            compliantSignedOrder2 = await orderFactory2.newSignedOrderAsync();
        });
        it('should transfer the correct amounts and validate both makers/taker when both makers and taker meet the balance threshold', async () => {
            // Execute a valid fill
            const orders = [compliantSignedOrder, compliantSignedOrder2];
            const cumulativeTakerAssetFillAmount = compliantSignedOrder.takerAssetAmount.plus(takerAssetFillAmount);
            const txReceipt = await erc721TakerBalanceThresholdWrapper.marketSellOrdersAsync(orders, compliantTakerAddress, {takerAssetFillAmount: cumulativeTakerAssetFillAmount});
            // Assert validated addresses
            const expectedValidatedAddresseses = [compliantSignedOrder.makerAddress, compliantSignedOrder2.makerAddress, compliantSignedFillOrderTx.signerAddress];
            assertValidatedAddressesLog(txReceipt, expectedValidatedAddresseses);
            // Check balances
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const makerAssetFillAmount2 = takerAssetFillAmount
                .times(compliantSignedOrder.makerAssetAmount)
                .dividedToIntegerBy(compliantSignedOrder.takerAssetAmount);
            const makerFeePaid2 = compliantSignedOrder2.makerFee
                .times(makerAssetFillAmount2)
                .dividedToIntegerBy(compliantSignedOrder2.makerAssetAmount);
            const takerFeePaid2 = compliantSignedOrder2.takerFee
                .times(makerAssetFillAmount2)
                .dividedToIntegerBy(compliantSignedOrder2.makerAssetAmount);
            const takerFeePaid = compliantSignedOrder.takerFee.plus(takerFeePaid2);
            const cumulativeMakerAssetFillAmount = compliantSignedOrder.makerAssetAmount.plus(makerAssetFillAmount2);
            // Maker #1
            expect(newBalances[compliantMakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress][defaultMakerAssetAddress].minus(compliantSignedOrder.makerAssetAmount),
            );
            expect(newBalances[compliantMakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress][defaultTakerAssetAddress].add(compliantSignedOrder.takerAssetAmount),
            );
            expect(newBalances[compliantMakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress][zrxToken.address].minus(compliantSignedOrder.makerFee),
            );
            // Maker #2
            expect(newBalances[compliantMakerAddress2][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress2][defaultMakerAssetAddress].minus(makerAssetFillAmount2),
            );
            expect(newBalances[compliantMakerAddress2][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress2][defaultTakerAssetAddress].add(takerAssetFillAmount),
            );
            expect(newBalances[compliantMakerAddress2][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress2][zrxToken.address].minus(makerFeePaid2),
            );
            // Taker      
            expect(newBalances[compliantTakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantTakerAddress][defaultTakerAssetAddress].minus(cumulativeTakerAssetFillAmount),
            );
            expect(newBalances[compliantTakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantTakerAddress][defaultMakerAssetAddress].add(cumulativeMakerAssetFillAmount),
            );
            expect(newBalances[compliantTakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[compliantTakerAddress][zrxToken.address].minus(takerFeePaid),
            );
            // Fee recipient
            expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address].add(compliantSignedOrder.makerFee).add(makerFeePaid2).add(takerFeePaid),
            );
        });
        it('should revert if one maker does not meet the balance threshold', async () => {
            // Create order set with one non-compliant maker address
            const signedOrderWithBadMakerAddress = await orderFactory.newSignedOrderAsync({
                makerAddress: nonCompliantAddress
            });
            const orders = [compliantSignedOrder, signedOrderWithBadMakerAddress];
            // Execute transaction
            return expectTransactionFailedAsync(
                erc721TakerBalanceThresholdWrapper.marketSellOrdersAsync(
                    orders,
                    compliantTakerAddress, 
                    {takerAssetFillAmount}
                ),
                RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold
            );
        });
        it('should revert if taker does not meet the balance threshold', async () => {
            const orders = [compliantSignedOrder, compliantSignedOrder2];
            return expectTransactionFailedAsync(
                erc721NonCompliantBalanceThresholdWrapper.marketSellOrdersAsync(
                    orders,
                    nonCompliantAddress, 
                    {takerAssetFillAmount}
                ),
                RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold
            );
        });
    });

    describe('marketSellOrdersNoThrow', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            compliantSignedOrder = await orderFactory.newSignedOrderAsync();
            compliantSignedOrder2 = await orderFactory2.newSignedOrderAsync();
        });
        it('should transfer the correct amounts and validate both makers/taker when both makers and taker meet the balance threshold', async () => {
            // Execute a valid fill
            const orders = [compliantSignedOrder, compliantSignedOrder2];
            const cumulativeTakerAssetFillAmount = compliantSignedOrder.takerAssetAmount.plus(takerAssetFillAmount);
            const txReceipt = await erc721TakerBalanceThresholdWrapper.marketSellOrdersNoThrowAsync(orders, compliantTakerAddress, {takerAssetFillAmount: cumulativeTakerAssetFillAmount});
            // Assert validated addresses
            const expectedValidatedAddresseses = [compliantSignedOrder.makerAddress, compliantSignedOrder2.makerAddress, compliantSignedFillOrderTx.signerAddress];
            assertValidatedAddressesLog(txReceipt, expectedValidatedAddresseses);
            // Check balances
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const makerAssetFillAmount2 = takerAssetFillAmount
                .times(compliantSignedOrder.makerAssetAmount)
                .dividedToIntegerBy(compliantSignedOrder.takerAssetAmount);
            const makerFeePaid2 = compliantSignedOrder2.makerFee
                .times(makerAssetFillAmount2)
                .dividedToIntegerBy(compliantSignedOrder2.makerAssetAmount);
            const takerFeePaid2 = compliantSignedOrder2.takerFee
                .times(makerAssetFillAmount2)
                .dividedToIntegerBy(compliantSignedOrder2.makerAssetAmount);
            const takerFeePaid = compliantSignedOrder.takerFee.plus(takerFeePaid2);
            const cumulativeMakerAssetFillAmount = compliantSignedOrder.makerAssetAmount.plus(makerAssetFillAmount2);
            // Maker #1
            expect(newBalances[compliantMakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress][defaultMakerAssetAddress].minus(compliantSignedOrder.makerAssetAmount),
            );
            expect(newBalances[compliantMakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress][defaultTakerAssetAddress].add(compliantSignedOrder.takerAssetAmount),
            );
            expect(newBalances[compliantMakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress][zrxToken.address].minus(compliantSignedOrder.makerFee),
            );
            // Maker #2
            expect(newBalances[compliantMakerAddress2][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress2][defaultMakerAssetAddress].minus(makerAssetFillAmount2),
            );
            expect(newBalances[compliantMakerAddress2][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress2][defaultTakerAssetAddress].add(takerAssetFillAmount),
            );
            expect(newBalances[compliantMakerAddress2][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress2][zrxToken.address].minus(makerFeePaid2),
            );
            // Taker      
            expect(newBalances[compliantTakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantTakerAddress][defaultTakerAssetAddress].minus(cumulativeTakerAssetFillAmount),
            );
            expect(newBalances[compliantTakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantTakerAddress][defaultMakerAssetAddress].add(cumulativeMakerAssetFillAmount),
            );
            expect(newBalances[compliantTakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[compliantTakerAddress][zrxToken.address].minus(takerFeePaid),
            );
            // Fee recipient
            expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address].add(compliantSignedOrder.makerFee).add(makerFeePaid2).add(takerFeePaid),
            );
        });
        it('should revert if one maker does not meet the balance threshold', async () => {
            // Create order set with one non-compliant maker address
            const signedOrderWithBadMakerAddress = await orderFactory.newSignedOrderAsync({
                makerAddress: nonCompliantAddress
            });
            const orders = [compliantSignedOrder, signedOrderWithBadMakerAddress];
            // Execute transaction
            return expectTransactionFailedAsync(
                erc721TakerBalanceThresholdWrapper.marketSellOrdersNoThrowAsync(
                    orders,
                    compliantTakerAddress, 
                    {takerAssetFillAmount}
                ),
                RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold
            );
        });
        it('should revert if taker does not meet the balance threshold', async () => {
            const orders = [compliantSignedOrder, compliantSignedOrder2];
            return expectTransactionFailedAsync(
                erc721NonCompliantBalanceThresholdWrapper.marketSellOrdersNoThrowAsync(
                    orders,
                    nonCompliantAddress, 
                    {takerAssetFillAmount}
                ),
                RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold
            );
        });
    });

    describe('marketBuyOrders', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            compliantSignedOrder = await orderFactory.newSignedOrderAsync();
            compliantSignedOrder2 = await orderFactory2.newSignedOrderAsync();
        });
        it('should transfer the correct amounts and validate both makers/taker when both makers and taker meet the balance threshold', async () => {
            // Execute a valid fill
            const orders = [compliantSignedOrder, compliantSignedOrder2];
            const cumulativeTakerAssetFillAmount = compliantSignedOrder.takerAssetAmount.plus(takerAssetFillAmount);
            const makerAssetFillAmount2 = takerAssetFillAmount
            .times(compliantSignedOrder.makerAssetAmount)
            .dividedToIntegerBy(compliantSignedOrder.takerAssetAmount);
            const cumulativeMakerAssetFillAmount = compliantSignedOrder.makerAssetAmount.plus(makerAssetFillAmount2);
            const txReceipt = await erc721TakerBalanceThresholdWrapper.marketBuyOrdersAsync(orders, compliantTakerAddress, {makerAssetFillAmount: cumulativeMakerAssetFillAmount});
            // Assert validated addresses
            const expectedValidatedAddresseses = [compliantSignedOrder.makerAddress, compliantSignedOrder2.makerAddress, compliantSignedFillOrderTx.signerAddress];
            assertValidatedAddressesLog(txReceipt, expectedValidatedAddresseses);
            // Check balances
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const makerFeePaid2 = compliantSignedOrder2.makerFee
                .times(makerAssetFillAmount2)
                .dividedToIntegerBy(compliantSignedOrder2.makerAssetAmount);
            const takerFeePaid2 = compliantSignedOrder2.takerFee
                .times(makerAssetFillAmount2)
                .dividedToIntegerBy(compliantSignedOrder2.makerAssetAmount);
            const takerFeePaid = compliantSignedOrder.takerFee.plus(takerFeePaid2);
            // Maker #1
            expect(newBalances[compliantMakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress][defaultMakerAssetAddress].minus(compliantSignedOrder.makerAssetAmount),
            );
            expect(newBalances[compliantMakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress][defaultTakerAssetAddress].add(compliantSignedOrder.takerAssetAmount),
            );
            expect(newBalances[compliantMakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress][zrxToken.address].minus(compliantSignedOrder.makerFee),
            );
            // Maker #2
            expect(newBalances[compliantMakerAddress2][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress2][defaultMakerAssetAddress].minus(makerAssetFillAmount2),
            );
            expect(newBalances[compliantMakerAddress2][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress2][defaultTakerAssetAddress].add(takerAssetFillAmount),
            );
            expect(newBalances[compliantMakerAddress2][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress2][zrxToken.address].minus(makerFeePaid2),
            );
            // Taker      
            expect(newBalances[compliantTakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantTakerAddress][defaultTakerAssetAddress].minus(cumulativeTakerAssetFillAmount),
            );
            expect(newBalances[compliantTakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantTakerAddress][defaultMakerAssetAddress].add(cumulativeMakerAssetFillAmount),
            );
            expect(newBalances[compliantTakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[compliantTakerAddress][zrxToken.address].minus(takerFeePaid),
            );
            // Fee recipient
            expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address].add(compliantSignedOrder.makerFee).add(makerFeePaid2).add(takerFeePaid),
            );
        });
        it('should revert if one maker does not meet the balance threshold', async () => {
            // Create order set with one non-compliant maker address
            const signedOrderWithBadMakerAddress = await orderFactory.newSignedOrderAsync({
                makerAddress: nonCompliantAddress
            });
            const orders = [compliantSignedOrder, signedOrderWithBadMakerAddress];
            // Execute transaction
            const dummyMakerAssetFillAmount = new BigNumber(0);
            return expectTransactionFailedAsync(
                erc721TakerBalanceThresholdWrapper.marketBuyOrdersAsync(
                    orders,
                    compliantTakerAddress, 
                    {makerAssetFillAmount: dummyMakerAssetFillAmount}
                ),
                RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold
            );
        });
        it('should revert if taker does not meet the balance threshold', async () => {
            const orders = [compliantSignedOrder, compliantSignedOrder2];
            const dummyMakerAssetFillAmount = new BigNumber(0);
            return expectTransactionFailedAsync(
                erc721NonCompliantBalanceThresholdWrapper.marketBuyOrdersAsync(
                    orders,
                    nonCompliantAddress, 
                    {makerAssetFillAmount: dummyMakerAssetFillAmount}
                ),
                RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold
            );
        });
    });

    describe('marketBuyOrdersNoThrowAsync', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            compliantSignedOrder = await orderFactory.newSignedOrderAsync();
            compliantSignedOrder2 = await orderFactory2.newSignedOrderAsync();
        });
        it('should transfer the correct amounts and validate both makers/taker when both makers and taker meet the balance threshold', async () => {
            // Execute a valid fill
            const orders = [compliantSignedOrder, compliantSignedOrder2];
            const cumulativeTakerAssetFillAmount = compliantSignedOrder.takerAssetAmount.plus(takerAssetFillAmount);
            const makerAssetFillAmount2 = takerAssetFillAmount
            .times(compliantSignedOrder.makerAssetAmount)
            .dividedToIntegerBy(compliantSignedOrder.takerAssetAmount);
            const cumulativeMakerAssetFillAmount = compliantSignedOrder.makerAssetAmount.plus(makerAssetFillAmount2);
            const txReceipt = await erc721TakerBalanceThresholdWrapper.marketBuyOrdersNoThrowAsync(orders, compliantTakerAddress, {makerAssetFillAmount: cumulativeMakerAssetFillAmount});
            // Assert validated addresses
            const expectedValidatedAddresseses = [compliantSignedOrder.makerAddress, compliantSignedOrder2.makerAddress, compliantSignedFillOrderTx.signerAddress];
            assertValidatedAddressesLog(txReceipt, expectedValidatedAddresseses);
            // Check balances
            const newBalances = await erc20Wrapper.getBalancesAsync();
            const makerFeePaid2 = compliantSignedOrder2.makerFee
                .times(makerAssetFillAmount2)
                .dividedToIntegerBy(compliantSignedOrder2.makerAssetAmount);
            const takerFeePaid2 = compliantSignedOrder2.takerFee
                .times(makerAssetFillAmount2)
                .dividedToIntegerBy(compliantSignedOrder2.makerAssetAmount);
            const takerFeePaid = compliantSignedOrder.takerFee.plus(takerFeePaid2);
            // Maker #1
            expect(newBalances[compliantMakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress][defaultMakerAssetAddress].minus(compliantSignedOrder.makerAssetAmount),
            );
            expect(newBalances[compliantMakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress][defaultTakerAssetAddress].add(compliantSignedOrder.takerAssetAmount),
            );
            expect(newBalances[compliantMakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress][zrxToken.address].minus(compliantSignedOrder.makerFee),
            );
            // Maker #2
            expect(newBalances[compliantMakerAddress2][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress2][defaultMakerAssetAddress].minus(makerAssetFillAmount2),
            );
            expect(newBalances[compliantMakerAddress2][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress2][defaultTakerAssetAddress].add(takerAssetFillAmount),
            );
            expect(newBalances[compliantMakerAddress2][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[compliantMakerAddress2][zrxToken.address].minus(makerFeePaid2),
            );
            // Taker      
            expect(newBalances[compliantTakerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantTakerAddress][defaultTakerAssetAddress].minus(cumulativeTakerAssetFillAmount),
            );
            expect(newBalances[compliantTakerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[compliantTakerAddress][defaultMakerAssetAddress].add(cumulativeMakerAssetFillAmount),
            );
            expect(newBalances[compliantTakerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[compliantTakerAddress][zrxToken.address].minus(takerFeePaid),
            );
            // Fee recipient
            expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address].add(compliantSignedOrder.makerFee).add(makerFeePaid2).add(takerFeePaid),
            );
        });
        it('should revert if one maker does not meet the balance threshold', async () => {
            // Create order set with one non-compliant maker address
            const signedOrderWithBadMakerAddress = await orderFactory.newSignedOrderAsync({
                makerAddress: nonCompliantAddress
            });
            const orders = [compliantSignedOrder, signedOrderWithBadMakerAddress];
            // Execute transaction
            const dummyMakerAssetFillAmount = new BigNumber(0);
            return expectTransactionFailedAsync(
                erc721TakerBalanceThresholdWrapper.marketBuyOrdersNoThrowAsync(
                    orders,
                    compliantTakerAddress, 
                    {makerAssetFillAmount: dummyMakerAssetFillAmount}
                ),
                RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold
            );
        });
        it('should revert if taker does not meet the balance threshold', async () => {
            const orders = [compliantSignedOrder, compliantSignedOrder2];
            const dummyMakerAssetFillAmount = new BigNumber(0);
            return expectTransactionFailedAsync(
                erc721NonCompliantBalanceThresholdWrapper.marketBuyOrdersNoThrowAsync(
                    orders,
                    nonCompliantAddress, 
                    {makerAssetFillAmount: dummyMakerAssetFillAmount}
                ),
                RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold
            );
        });
    });
    
    describe('matchOrders', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            compliantSignedOrder = await orderFactory.newSignedOrderAsync();
            compliantSignedOrder2 = await orderFactory2.newSignedOrderAsync();
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
                feeRecipientAddress: feeRecipientAddress,
            });
            const signedOrderRight = await orderFactory2.newSignedOrderAsync({
                makerAssetData: assetDataUtils.encodeERC20AssetData(defaultTakerAssetAddress),
                takerAssetData: assetDataUtils.encodeERC20AssetData(defaultMakerAssetAddress),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(75), 0),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(13), 0),
                makerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), 18),
                takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(1), 18),
                feeRecipientAddress: feeRecipientAddress,
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
            const txReceipt = await erc721TakerBalanceThresholdWrapper.matchOrdersAsync(signedOrderLeft, signedOrderRight, compliantTakerAddress);
            // Assert validated addresses
            const expectedValidatedAddresseses = [signedOrderLeft.makerAddress, signedOrderRight.makerAddress, compliantTakerAddress];
            assertValidatedAddressesLog(txReceipt, expectedValidatedAddresseses);
            // Check balances
            const newBalances = await erc20Wrapper.getBalancesAsync();
            expect(
                newBalances[signedOrderLeft.makerAddress][defaultMakerAssetAddress],
                'Checking left maker egress ERC20 account balance',
            ).to.be.bignumber.equal(erc20Balances[signedOrderLeft.makerAddress][defaultMakerAssetAddress].sub(expectedTransferAmounts.amountSoldByLeftMaker));
            expect(
                newBalances[signedOrderRight.makerAddress][defaultTakerAssetAddress],
                'Checking right maker ingress ERC20 account balance',
            ).to.be.bignumber.equal(erc20Balances[signedOrderRight.makerAddress][defaultTakerAssetAddress].sub(expectedTransferAmounts.amountSoldByRightMaker));
            expect(
                newBalances[compliantTakerAddress][defaultMakerAssetAddress],
                'Checking taker ingress ERC20 account balance',
            ).to.be.bignumber.equal(erc20Balances[compliantTakerAddress][defaultMakerAssetAddress].add(expectedTransferAmounts.amountReceivedByTaker));
            expect(
                newBalances[signedOrderLeft.makerAddress][defaultTakerAssetAddress],
                'Checking left maker ingress ERC20 account balance',
            ).to.be.bignumber.equal(erc20Balances[signedOrderLeft.makerAddress][defaultTakerAssetAddress].add(expectedTransferAmounts.amountBoughtByLeftMaker));
            expect(
                newBalances[signedOrderRight.makerAddress][defaultMakerAssetAddress],
                'Checking right maker egress ERC20 account balance',
            ).to.be.bignumber.equal(
                erc20Balances[signedOrderRight.makerAddress][defaultMakerAssetAddress].add(expectedTransferAmounts.amountBoughtByRightMaker),
            );
            // Paid fees
            expect(
                newBalances[signedOrderLeft.makerAddress][zrxToken.address],
                'Checking left maker egress ERC20 account fees',
            ).to.be.bignumber.equal(erc20Balances[signedOrderLeft.makerAddress][zrxToken.address].minus(expectedTransferAmounts.feePaidByLeftMaker));
            expect(
                newBalances[signedOrderRight.makerAddress][zrxToken.address],
                'Checking right maker egress ERC20 account fees',
            ).to.be.bignumber.equal(erc20Balances[signedOrderRight.makerAddress][zrxToken.address].minus(expectedTransferAmounts.feePaidByRightMaker));
            expect(
                newBalances[compliantTakerAddress][zrxToken.address],
                'Checking taker egress ERC20 account fees',
            ).to.be.bignumber.equal(erc20Balances[compliantTakerAddress][zrxToken.address].minus(expectedTransferAmounts.feePaidByTakerLeft).sub(expectedTransferAmounts.feePaidByTakerRight));
            // Received fees
            expect(
                newBalances[signedOrderLeft.feeRecipientAddress][zrxToken.address],
                'Checking left fee recipient ingress ERC20 account fees',
            ).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address].add(expectedTransferAmounts.feePaidByLeftMaker).add(expectedTransferAmounts.feePaidByRightMaker).add(expectedTransferAmounts.feePaidByTakerLeft).add(expectedTransferAmounts.feePaidByTakerRight),
            );
        });
        it('should revert if left maker does not meet the balance threshold', async () => {
            // Create signed order with non-compliant maker address
            const signedOrderWithBadMakerAddress = await orderFactory.newSignedOrderAsync({
                senderAddress: erc721CompliantForwarderInstance.address,
                makerAddress: nonCompliantAddress
            });
            // Execute transaction
            return expectTransactionFailedAsync(
                erc721TakerBalanceThresholdWrapper.matchOrdersAsync(
                    compliantSignedOrder,
                    signedOrderWithBadMakerAddress,
                    compliantTakerAddress, 
                ),
                RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold
            );
        });
        it('should revert if right maker does not meet the balance threshold', async () => {
            // Create signed order with non-compliant maker address
            const signedOrderWithBadMakerAddress = await orderFactory.newSignedOrderAsync({
                senderAddress: erc721CompliantForwarderInstance.address,
                makerAddress: nonCompliantAddress
            });
            // Execute transaction
            return expectTransactionFailedAsync(
                erc721TakerBalanceThresholdWrapper.matchOrdersAsync(
                    signedOrderWithBadMakerAddress,
                    compliantSignedOrder,
                    compliantTakerAddress, 
                ),
                RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold
            );
        });
        it('should revert if taker does not meet the balance threshold', async () => {
            return expectTransactionFailedAsync(
                erc721NonCompliantBalanceThresholdWrapper.matchOrdersAsync(
                    compliantSignedOrder,
                    compliantSignedOrder,
                    nonCompliantAddress, 
                ),
                RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold
            );
        });
    });

    describe('cancelOrder', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            compliantSignedOrder = await orderFactory.newSignedOrderAsync();
            compliantSignedOrder2 = await orderFactory2.newSignedOrderAsync();
        });
        it('Should successfully cancel order if maker meets balance threshold', async () => {
            // Verify order is not cancelled
            const orderInfoBeforeCancelling = await erc721MakerBalanceThresholdWrapper.getOrderInfoAsync(compliantSignedOrder)
            expect(orderInfoBeforeCancelling.orderStatus).to.be.equal(OrderStatus.FILLABLE);
            // Cancel
            const txReceipt = await erc721MakerBalanceThresholdWrapper.cancelOrderAsync(compliantSignedOrder, compliantSignedOrder.makerAddress);
            // Assert validated addresses
            const expectedValidatedAddresseses: string[] = [];
            assertValidatedAddressesLog(txReceipt, expectedValidatedAddresseses);
            // Check that order was cancelled
            const orderInfoAfterCancelling = await erc721MakerBalanceThresholdWrapper.getOrderInfoAsync(compliantSignedOrder)
            expect(orderInfoAfterCancelling.orderStatus).to.be.equal(OrderStatus.CANCELLED);
        });
        it('Should successfully cancel order if maker does not meet balance threshold', async () => {
            // Create order where maker does not meet balance threshold
            const signedOrderWithBadMakerAddress = await nonCompliantOrderFactory.newSignedOrderAsync({});
            // Verify order is not cancelled
            const orderInfoBeforeCancelling = await erc721NonCompliantBalanceThresholdWrapper.getOrderInfoAsync(signedOrderWithBadMakerAddress)
            expect(orderInfoBeforeCancelling.orderStatus).to.be.equal(OrderStatus.FILLABLE);
            // Cancel
            const txReceipt = await erc721NonCompliantBalanceThresholdWrapper.cancelOrderAsync(signedOrderWithBadMakerAddress, signedOrderWithBadMakerAddress.makerAddress);
            // Assert validated addresses
            const expectedValidatedAddresseses: string[] = [];
            assertValidatedAddressesLog(txReceipt, expectedValidatedAddresseses);
            // Check that order was cancelled
            const orderInfoAfterCancelling = await erc721MakerBalanceThresholdWrapper.getOrderInfoAsync(signedOrderWithBadMakerAddress)
            expect(orderInfoAfterCancelling.orderStatus).to.be.equal(OrderStatus.CANCELLED);
        });
    });

    describe('batchCancelOrders', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
        });
        it('Should successfully batch cancel orders if maker meets balance threshold', async () => {
            // Create orders to cancel
            const compliantSignedOrders = [
                await orderFactory.newSignedOrderAsync(),
                await orderFactory.newSignedOrderAsync(),
                await orderFactory.newSignedOrderAsync(),
            ]; 
            // Verify orders are not cancelled
            await _.each(compliantSignedOrders, async (compliantSignedOrder) => {
                const orderInfoBeforeCancelling = await erc721MakerBalanceThresholdWrapper.getOrderInfoAsync(compliantSignedOrder)
                return expect(orderInfoBeforeCancelling.orderStatus).to.be.equal(OrderStatus.FILLABLE);
            });
            // Cancel
            const txReceipt = await erc721MakerBalanceThresholdWrapper.batchCancelOrdersAsync(compliantSignedOrders, compliantSignedOrder.makerAddress);
            // Assert validated addresses
            const expectedValidatedAddresseses: string[] = [];
            assertValidatedAddressesLog(txReceipt, expectedValidatedAddresseses);
            // Check that order was cancelled
            await _.each(compliantSignedOrders, async (compliantSignedOrder) => {
                const orderInfoAfterCancelling = await erc721MakerBalanceThresholdWrapper.getOrderInfoAsync(compliantSignedOrder)
                return expect(orderInfoAfterCancelling.orderStatus).to.be.equal(OrderStatus.CANCELLED);
            });
        });
        it('Should successfully batch cancel order if maker does not meet balance threshold', async () => {
            // Create orders to cancel
            const nonCompliantSignedOrders = [
                await nonCompliantOrderFactory.newSignedOrderAsync(),
                await nonCompliantOrderFactory.newSignedOrderAsync(),
                await nonCompliantOrderFactory.newSignedOrderAsync(),
            ]; 
            // Verify orders are not cancelled
            await _.each(nonCompliantSignedOrders, async (nonCompliantSignedOrder) => {
                const orderInfoBeforeCancelling = await erc721NonCompliantBalanceThresholdWrapper.getOrderInfoAsync(nonCompliantSignedOrder)
                return expect(orderInfoBeforeCancelling.orderStatus).to.be.equal(OrderStatus.FILLABLE);
            });
            // Cancel
            const txReceipt = await erc721NonCompliantBalanceThresholdWrapper.batchCancelOrdersAsync(nonCompliantSignedOrders, nonCompliantAddress);
            // Assert validated addresses
            const expectedValidatedAddresseses: string[] = [];
            assertValidatedAddressesLog(txReceipt, expectedValidatedAddresseses);
            // Check that order was cancelled
            await _.each(nonCompliantSignedOrders, async (nonCompliantSignedOrder) => {
                const orderInfoAfterCancelling = await erc721NonCompliantBalanceThresholdWrapper.getOrderInfoAsync(nonCompliantSignedOrder)
                return expect(orderInfoAfterCancelling.orderStatus).to.be.equal(OrderStatus.CANCELLED);
            });
        });
    });

    describe('cancelOrdersUpTo', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
        });
        it('Should successfully batch cancel orders if maker meets balance threshold', async () => {
            // Create orders to cancel
            const compliantSignedOrders = [
                await orderFactory.newSignedOrderAsync({salt: new BigNumber(0)}),
                await orderFactory.newSignedOrderAsync({salt: new BigNumber(1)}),
                await orderFactory.newSignedOrderAsync({salt: new BigNumber(2)}),
            ]; 
            // Verify orders are not cancelled
            await _.each(compliantSignedOrders, async (compliantSignedOrder) => {
                const orderInfoBeforeCancelling = await erc721MakerBalanceThresholdWrapper.getOrderInfoAsync(compliantSignedOrder)
                return expect(orderInfoBeforeCancelling.orderStatus).to.be.equal(OrderStatus.FILLABLE);
            });
            // Cancel
            const cancelOrdersUpToThisSalt = new BigNumber(1);
            const txReceipt = await erc721MakerBalanceThresholdWrapper.cancelOrdersUpToAsync(cancelOrdersUpToThisSalt, compliantSignedOrder.makerAddress);
            // Assert validated addresses
            const expectedValidatedAddresseses: string[] = [];
            assertValidatedAddressesLog(txReceipt, expectedValidatedAddresseses);
            // Check that order was cancelled
            await _.each(compliantSignedOrders, async (compliantSignedOrder, salt: number) => {
                const orderInfoAfterCancelling = await erc721MakerBalanceThresholdWrapper.getOrderInfoAsync(compliantSignedOrder)
                const saltAsBigNumber = new BigNumber(salt);
                if (saltAsBigNumber.lessThanOrEqualTo(cancelOrdersUpToThisSalt)) {
                    return expect(orderInfoAfterCancelling.orderStatus).to.be.equal(OrderStatus.CANCELLED);
                } else {
                    return expect(orderInfoAfterCancelling.orderStatus).to.be.equal(OrderStatus.FILLABLE);
                }
            });
        });
        it('Should successfully batch cancel order if maker does not meet balance threshold', async () => {
            // Create orders to cancel
            const nonCompliantSignedOrders = [
                await nonCompliantOrderFactory.newSignedOrderAsync({salt: new BigNumber(0)}),
                await nonCompliantOrderFactory.newSignedOrderAsync({salt: new BigNumber(1)}),
                await nonCompliantOrderFactory.newSignedOrderAsync({salt: new BigNumber(2)}),
            ]; 
            // Verify orders are not cancelled
            await _.each(nonCompliantSignedOrders, async (nonCompliantSignedOrder) => {
                const orderInfoBeforeCancelling = await erc721NonCompliantBalanceThresholdWrapper.getOrderInfoAsync(nonCompliantSignedOrder)
                return expect(orderInfoBeforeCancelling.orderStatus).to.be.equal(OrderStatus.FILLABLE);
            });
            // Cancel
            const cancelOrdersUpToThisSalt = new BigNumber(1);
            const txReceipt = await erc721NonCompliantBalanceThresholdWrapper.cancelOrdersUpToAsync(cancelOrdersUpToThisSalt, nonCompliantAddress);
            // Assert validated addresses
            const expectedValidatedAddresseses: string[] = [];
            assertValidatedAddressesLog(txReceipt, expectedValidatedAddresseses);
            // Check that order was cancelled
            await _.each(nonCompliantSignedOrders, async (nonCompliantSignedOrder, salt: number) => {
                const orderInfoAfterCancelling = await erc721NonCompliantBalanceThresholdWrapper.getOrderInfoAsync(nonCompliantSignedOrder)
                const saltAsBigNumber = new BigNumber(salt);
                if (saltAsBigNumber.lessThanOrEqualTo(cancelOrdersUpToThisSalt)) {
                    return expect(orderInfoAfterCancelling.orderStatus).to.be.equal(OrderStatus.CANCELLED);
                } else {
                    return expect(orderInfoAfterCancelling.orderStatus).to.be.equal(OrderStatus.FILLABLE);
                }
            });
        });
    });
});
// tslint:disable:max-file-line-count
// tslint:enable:no-unnecessary-type-assertion
