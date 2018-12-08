import { BlockchainLifecycle } from '@0x/dev-utils';
import { assetDataUtils } from '@0x/order-utils';
import { RevertReason, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';

import { DummyERC20TokenContract } from '../../generated-wrappers/dummy_erc20_token';
import { ExchangeContract } from '../../generated-wrappers/exchange';
import { BalanceThresholdFilterContract } from '../../generated-wrappers/balance_threshold_filter';
import { YesComplianceTokenContract } from '../../generated-wrappers/yes_compliance_token';

import { artifacts } from '../../src/artifacts';
import {
    expectTransactionFailedAsync,
    expectTransactionFailedWithoutReasonAsync,
} from '../utils/assertions';
import { chaiSetup } from '../utils/chai_setup';
import { constants } from '../utils/constants';
import { ERC20Wrapper } from '../utils/erc20_wrapper';
import { ExchangeWrapper } from '../utils/exchange_wrapper';
import { OrderFactory } from '../utils/order_factory';
import { orderUtils } from '../utils/order_utils';
import { TransactionFactory } from '../utils/transaction_factory';
import { BalanceThresholdWrapper } from '../utils/balance_threshold_wrapper';
import { ContractName, ERC20BalancesByOwner, SignedTransaction } from '../utils/types';
import { provider, txDefaults, web3Wrapper } from '../utils/web3_wrapper';

import { MethodAbi, AbiDefinition } from 'ethereum-types';
import { AbiEncoder } from '@0x/utils';
import { Method } from '@0x/utils/lib/src/abi_encoder';
import { LogDecoder } from '../utils/log_decoder';

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
    let erc20Wrapper: ERC20Wrapper;
    let erc20Balances: ERC20BalancesByOwner;
    let balanceThresholdWrapper: BalanceThresholdWrapper;
    let nonCompliantBalanceThresholdWrapper: BalanceThresholdWrapper;

    let takerTransactionFactory: TransactionFactory;
    let compliantSignedOrder: SignedOrder;
    let compliantSignedOrder2: SignedOrder;
    let compliantSignedFillOrderTx: SignedTransaction;

    let logDecoder: LogDecoder;

    const takerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(500), DECIMALS_DEFAULT);
    const makerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(1000), DECIMALS_DEFAULT);
    const takerAssetFillAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(250), DECIMALS_DEFAULT);

    let compliantForwarderInstance: BalanceThresholdFilterContract;

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
        // Deploy ERC20 tokens
        const numDummyErc20ToDeploy = 3;
        let erc20TokenA: DummyERC20TokenContract;
        let erc20TokenB: DummyERC20TokenContract;
        [erc20TokenA, erc20TokenB, zrxToken] = await erc20Wrapper.deployDummyTokensAsync(
            numDummyErc20ToDeploy,
            constants.DUMMY_TOKEN_DECIMALS,
        );
        defaultMakerAssetAddress = erc20TokenA.address;
        defaultTakerAssetAddress = erc20TokenB.address;
        zrxAssetData = assetDataUtils.encodeERC20AssetData(zrxToken.address);
        // Deploy Yes Token
        const yesTokenInstance = await YesComplianceTokenContract.deployFrom0xArtifactAsync(
            artifacts.YesComplianceToken,
            provider,
            txDefaults,
        );
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
        const erc721BalanceThreshold = new BigNumber(1);
        compliantForwarderInstance = await BalanceThresholdFilterContract.deployFrom0xArtifactAsync(
            artifacts.BalanceThresholdFilter,
            provider,
            txDefaults,
            exchangeInstance.address,
            yesTokenInstance.address,
            erc721BalanceThreshold
        );
        // Default order parameters
        const defaultOrderParams = {
            exchangeAddress: exchangeInstance.address,
            feeRecipientAddress,
            makerAssetData: assetDataUtils.encodeERC20AssetData(defaultMakerAssetAddress),
            takerAssetData: assetDataUtils.encodeERC20AssetData(defaultTakerAssetAddress),
            makerAssetAmount,
            takerAssetAmount,
            makerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), DECIMALS_DEFAULT),
            takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(150), DECIMALS_DEFAULT),
            senderAddress: compliantForwarderInstance.address,
        };
        const defaultOrderParams1 = {
            makerAddress: compliantMakerAddress,
            ...
            defaultOrderParams,
        }
        const makerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(compliantMakerAddress)];
        orderFactory = new OrderFactory(makerPrivateKey, defaultOrderParams1);
        const defaultOrderParams2 = {
            makerAddress: compliantMakerAddress2,
            ...
            defaultOrderParams,
        }
        const secondMakerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(compliantMakerAddress2)];
        orderFactory2 = new OrderFactory(secondMakerPrivateKey, defaultOrderParams2);
        /*
        const compliantForwarderContract = new BalanceThresholdFilterContract(
            compliantForwarderInstance.abi,
            compliantForwarderInstance.address,
            provider,
        );
        forwarderWrapper = new ForwarderWrapper(compliantForwarderContract, provider);
        */
        // Initialize Yes Token
        await yesTokenInstance._upgradeable_initialize.sendTransactionAsync({ from: owner });
        const yesTokenName = 'YesToken';
        const yesTokenTicker = 'YEET';
        await yesTokenInstance.initialize.sendTransactionAsync(yesTokenName, yesTokenTicker, { from: owner });
        // Verify Maker / Taker
        const addressesCanControlTheirToken = true;
        const compliantMakerCountryCode = new BigNumber(519);
        const compliantMakerYesMark = new BigNumber(1);
        const compliantMakerEntityId = new BigNumber(2);
        await yesTokenInstance.mint2.sendTransactionAsync(
            compliantMakerAddress,
            compliantMakerEntityId,
            addressesCanControlTheirToken,
            compliantMakerCountryCode,
            [compliantMakerYesMark],
            { from: owner },
        );
        const compliantTakerCountryCode = new BigNumber(519);
        const compliantTakerYesMark = new BigNumber(1);
        const compliantTakerEntityId = new BigNumber(2);
        await yesTokenInstance.mint2.sendTransactionAsync(
            compliantTakerAddress,
            compliantTakerEntityId,
            addressesCanControlTheirToken,
            compliantTakerCountryCode,
            [compliantTakerYesMark],
            { from: owner },
        );
        await yesTokenInstance.mint2.sendTransactionAsync(
            compliantMakerAddress2,
            compliantTakerEntityId,
            addressesCanControlTheirToken,
            compliantTakerCountryCode,
            [compliantTakerYesMark],
            { from: owner },
        );
        // Create Valid/Invalid orders
        const takerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(compliantTakerAddress)];
        takerTransactionFactory = new TransactionFactory(takerPrivateKey, exchangeInstance.address);
        compliantSignedOrder = await orderFactory.newSignedOrderAsync({
            senderAddress: compliantForwarderInstance.address,
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

        /*
        _.each(exchangeInstance.abi, (abiDefinition: AbiDefinition) => {
            try {
                const method = new Method(abiDefinition as MethodAbi);
                console.log(method.getSignature());
                if (!method.getSignature().startsWith('matchOrders')) {
                    return;
                }
                console.log(`FOUND IT`);
                const signedOrderWithoutExchangeAddress = orderUtils.getOrderWithoutExchangeAddress(
                    compliantSignedOrder,
                );
                const args = [signedOrderWithoutExchangeAddress, signedOrderWithoutExchangeAddress, compliantSignedOrder.signature, compliantSignedOrder.signature];
                console.log(method.encode(args, {annotate: true}));
                //console.log('\n', `// ${method.getDataItem().name}`);
                //console.log(`bytes4 constant ${method.getDataItem().name}Selector = ${method.getSelector()};`);
                //console.log(`bytes4 constant ${method.getDataItem().name}SelectorGenerator = byes4(keccak256('${method.getSignature()}'));`);
            } catch(e) {
                console.log(`encoding failed: ${e}`);
            }
        });
        throw new Error(`w`);*/
        logDecoder = new LogDecoder(web3Wrapper);
        balanceThresholdWrapper = new BalanceThresholdWrapper(compliantForwarderInstance, exchangeInstance, new TransactionFactory(takerPrivateKey, exchangeInstance.address), provider);
        const nonCompliantPrivateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(nonCompliantAddress)];
        nonCompliantBalanceThresholdWrapper = new BalanceThresholdWrapper(compliantForwarderInstance, exchangeInstance, new TransactionFactory(nonCompliantPrivateKey, exchangeInstance.address), provider);
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('General Sanity Checks', () => {
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
            return expectTransactionFailedWithoutReasonAsync(compliantForwarderInstance.executeTransaction.sendTransactionAsync(
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
            return expectTransactionFailedWithoutReasonAsync(compliantForwarderInstance.executeTransaction.sendTransactionAsync(
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
            const txReceipt = await balanceThresholdWrapper.batchFillOrdersAsync(orders, compliantTakerAddress, {takerAssetFillAmounts});
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
                balanceThresholdWrapper.batchFillOrdersAsync(
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
                nonCompliantBalanceThresholdWrapper.batchFillOrdersAsync(
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
            const txReceipt = await balanceThresholdWrapper.batchFillOrdersNoThrowAsync(orders, compliantTakerAddress, {takerAssetFillAmounts});
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
                balanceThresholdWrapper.batchFillOrdersNoThrowAsync(
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
                nonCompliantBalanceThresholdWrapper.batchFillOrdersNoThrowAsync(
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
            const txReceipt = await balanceThresholdWrapper.batchFillOrKillOrdersAsync(orders, compliantTakerAddress, {takerAssetFillAmounts});
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
                balanceThresholdWrapper.batchFillOrKillOrdersAsync(
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
                nonCompliantBalanceThresholdWrapper.batchFillOrKillOrdersAsync(
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
                balanceThresholdWrapper.batchFillOrKillOrdersAsync(
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
            const txReceipt = await balanceThresholdWrapper.fillOrderAsync(compliantSignedOrder, compliantTakerAddress, {takerAssetFillAmount});
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
                senderAddress: compliantForwarderInstance.address,
                makerAddress: nonCompliantAddress
            });
            // Execute transaction
            return expectTransactionFailedAsync(
                balanceThresholdWrapper.fillOrderAsync(
                    signedOrderWithBadMakerAddress,
                    compliantTakerAddress, 
                    {takerAssetFillAmount}
                ),
                RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold
            );
        });
        it('should revert if taker does not meet the balance threshold', async () => {
            return expectTransactionFailedAsync(
                nonCompliantBalanceThresholdWrapper.fillOrderAsync(
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
            const txReceipt = await balanceThresholdWrapper.fillOrderNoThrowAsync(compliantSignedOrder, compliantTakerAddress, {takerAssetFillAmount});
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
                senderAddress: compliantForwarderInstance.address,
                makerAddress: nonCompliantAddress
            });
            // Execute transaction
            return expectTransactionFailedAsync(
                balanceThresholdWrapper.fillOrderNoThrowAsync(
                    signedOrderWithBadMakerAddress,
                    compliantTakerAddress, 
                    {takerAssetFillAmount}
                ),
                RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold
            );
        });
        it('should revert if taker does not meet the balance threshold', async () => {
            return expectTransactionFailedAsync(
                nonCompliantBalanceThresholdWrapper.fillOrderNoThrowAsync(
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
            const txReceipt = await balanceThresholdWrapper.fillOrKillOrderAsync(compliantSignedOrder, compliantTakerAddress, {takerAssetFillAmount: takerAssetFillAmount_});
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
                senderAddress: compliantForwarderInstance.address,
                makerAddress: nonCompliantAddress
            });
            // Execute transaction
            return expectTransactionFailedAsync(
                balanceThresholdWrapper.fillOrKillOrderAsync(
                    signedOrderWithBadMakerAddress,
                    compliantTakerAddress, 
                    {takerAssetFillAmount}
                ),
                RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold
            );
        });
        it('should revert if taker does not meet the balance threshold', async () => {
            return expectTransactionFailedAsync(
                nonCompliantBalanceThresholdWrapper.fillOrKillOrderAsync(
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
                balanceThresholdWrapper.fillOrKillOrderAsync(
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
            const txReceipt = await balanceThresholdWrapper.marketSellOrdersAsync(orders, compliantTakerAddress, {takerAssetFillAmount: cumulativeTakerAssetFillAmount});
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
                balanceThresholdWrapper.marketSellOrdersAsync(
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
                nonCompliantBalanceThresholdWrapper.marketSellOrdersAsync(
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
            const txReceipt = await balanceThresholdWrapper.marketSellOrdersNoThrowAsync(orders, compliantTakerAddress, {takerAssetFillAmount: cumulativeTakerAssetFillAmount});
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
                balanceThresholdWrapper.marketSellOrdersNoThrowAsync(
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
                nonCompliantBalanceThresholdWrapper.marketSellOrdersNoThrowAsync(
                    orders,
                    nonCompliantAddress, 
                    {takerAssetFillAmount}
                ),
                RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold
            );
        });
    });

    describe.only('marketBuyOrders', () => {
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
            const txReceipt = await balanceThresholdWrapper.marketBuyOrdersAsync(orders, compliantTakerAddress, {makerAssetFillAmount: cumulativeMakerAssetFillAmount});
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
                balanceThresholdWrapper.marketBuyOrdersAsync(
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
                nonCompliantBalanceThresholdWrapper.marketBuyOrdersAsync(
                    orders,
                    nonCompliantAddress, 
                    {makerAssetFillAmount: dummyMakerAssetFillAmount}
                ),
                RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold
            );
        });
    });

    describe.only('marketBuyOrdersNoThrowAsync', () => {
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
            const txReceipt = await balanceThresholdWrapper.marketBuyOrdersNoThrowAsync(orders, compliantTakerAddress, {makerAssetFillAmount: cumulativeMakerAssetFillAmount});
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
                balanceThresholdWrapper.marketBuyOrdersNoThrowAsync(
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
                nonCompliantBalanceThresholdWrapper.marketBuyOrdersNoThrowAsync(
                    orders,
                    nonCompliantAddress, 
                    {makerAssetFillAmount: dummyMakerAssetFillAmount}
                ),
                RevertReason.AtLeastOneAddressDoesNotMeetBalanceThreshold
            );
        });
    });
    
    describe('matchOrders', () => {
    });

    describe('cancelOrder', () => {
    });

    describe('batchCancelOrders', () => {
    });

    describe('cancelOrdersUpTo', () => {
    });
});
// tslint:disable:max-file-line-count
// tslint:enable:no-unnecessary-type-assertion
