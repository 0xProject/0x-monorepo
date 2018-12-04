import { BlockchainLifecycle } from '@0x/dev-utils';
import { assetDataUtils } from '@0x/order-utils';
import { RevertReason, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { DummyERC20TokenContract } from '../../generated-wrappers/dummy_erc20_token';
import { ExchangeContract } from '../../generated-wrappers/exchange';
import { CompliantForwarderContract } from '../../generated-wrappers/compliant_forwarder';
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

describe.only(ContractName.CompliantForwarder, () => {
    let compliantMakerAddress: string;
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
    let erc20Wrapper: ERC20Wrapper;
    let erc20Balances: ERC20BalancesByOwner;

    let takerTransactionFactory: TransactionFactory;
    let compliantSignedOrder: SignedOrder;
    let compliantSignedFillOrderTx: SignedTransaction;
    let noncompliantSignedFillOrderTx: SignedTransaction;

    const takerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(500), DECIMALS_DEFAULT);
    const makerAssetAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(1000), DECIMALS_DEFAULT);
    const takerAssetFillAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(250), DECIMALS_DEFAULT);

    let compliantForwarderInstance: CompliantForwarderContract;

    before(async () => {
        // Create accounts
        await blockchainLifecycle.startAsync();
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const usedAddresses = ([
            owner,
            compliantMakerAddress,
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
        // Default order parameters
        const defaultOrderParams = {
            exchangeAddress: exchangeInstance.address,
            makerAddress: compliantMakerAddress,
            feeRecipientAddress,
            makerAssetData: assetDataUtils.encodeERC20AssetData(defaultMakerAssetAddress),
            takerAssetData: assetDataUtils.encodeERC20AssetData(defaultTakerAssetAddress),
            makerAssetAmount,
            takerAssetAmount,
            makerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), DECIMALS_DEFAULT),
            takerFee: Web3Wrapper.toBaseUnitAmount(new BigNumber(150), DECIMALS_DEFAULT),
        };
        const privateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(compliantMakerAddress)];
        orderFactory = new OrderFactory(privateKey, defaultOrderParams);
        // Deploy Compliant Forwarder
        compliantForwarderInstance = await CompliantForwarderContract.deployFrom0xArtifactAsync(
            artifacts.CompliantForwarder,
            provider,
            txDefaults,
            exchangeInstance.address,
            yesTokenInstance.address,
        );
        /*
        const compliantForwarderContract = new CompliantForwarderContract(
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

        /* generate selectors for every exchange method
        _.each(exchangeInstance.abi, (abiDefinition: AbiDefinition) => {
            try {
                const method = new Method(abiDefinition as MethodAbi);
                console.log('\n', `// ${method.getDataItem().name}`);
                console.log(`bytes4 constant ${method.getDataItem().name}Selector = ${method.getSelector()};`);
                console.log(`bytes4 constant ${method.getDataItem().name}SelectorGenerator = byes4(keccak256('${method.getSignature()}'));`);
            } catch(e) {
                _.noop();
            }
        });*/
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe.only('fillOrder', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
        });
        it.only('should transfer the correct amounts when maker and taker are compliant', async () => {
            const txHash = await compliantForwarderInstance.executeTransaction.sendTransactionAsync(
                compliantSignedFillOrderTx.salt,
                compliantSignedFillOrderTx.signerAddress,
                compliantSignedFillOrderTx.data,
                compliantSignedFillOrderTx.signature,
            );
            const decoder = new LogDecoder(web3Wrapper);
            const tx = await decoder.getTxWithDecodedLogsAsync(txHash);
            console.log(JSON.stringify(tx, null, 4));
            console.log('****** MAKER ADDRESS = ', compliantSignedOrder.makerAddress);
            
            
            /*const newBalances = await erc20Wrapper.getBalancesAsync();
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
            );*/
        });
        it('should revert if the signed transaction is not intended for fillOrder', async () => {
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
            const notCompliantForwarderAddress = zrxToken.address;
            const signedOrderWithBadSenderAddress = await orderFactory.newSignedOrderAsync({
                senderAddress: notCompliantForwarderAddress,
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
        it('should revert if taker address is not compliant (does not hold a Yes Token)', async () => {
            return expectTransactionFailedAsync(
                compliantForwarderInstance.executeTransaction.sendTransactionAsync(
                    compliantSignedFillOrderTx.salt,
                    nonCompliantAddress,
                    compliantSignedFillOrderTx.data,
                    compliantSignedFillOrderTx.signature,
                ),
                RevertReason.AtLeastOneAddressHasZeroBalance
            );
        });
        it('should revert if maker address is not compliant (does not hold a Yes Token)', async () => {
            // Create signed order with non-compliant maker address
            const signedOrderWithBadMakerAddress = await orderFactory.newSignedOrderAsync({
                senderAddress: compliantForwarderInstance.address,
                makerAddress: nonCompliantAddress
            });
            const signedOrderWithoutExchangeAddress = orderUtils.getOrderWithoutExchangeAddress(
                signedOrderWithBadMakerAddress,
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
            return expectTransactionFailedAsync(
                compliantForwarderInstance.executeTransaction.sendTransactionAsync(
                    signedFillOrderTx.salt,
                    signedFillOrderTx.signerAddress,
                    signedFillOrderTx.data,
                    signedFillOrderTx.signature,
                ),
                RevertReason.AtLeastOneAddressHasZeroBalance
            );
        });
    });

    describe('batchFillOrders', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
        });
        it('should transfer the correct amounts when maker and taker are compliant', async () => {
            let order2 = _.cloneDeep(compliantSignedOrder);
            order2.makerAddress = `0x${_.reverse(compliantSignedOrder.makerAddress.slice(2).split('')).join('')}`;
            const orders = [compliantSignedOrder, order2];
            const fillAmounts = [new BigNumber(4), new BigNumber(4)];
            const signatures = ["0xabcd", "0xabcd"];
            const exchangeCalldata = exchangeInstance.batchFillOrders.getABIEncodedTransactionData(orders, fillAmounts, signatures);
            console.log('*'.repeat(40), exchangeCalldata, '*'.repeat(40));
            console.log('****** MAKER ADDRESS = ', compliantSignedOrder.makerAddress);

            const txHash = await compliantForwarderInstance.executeTransaction.sendTransactionAsync(
                compliantSignedFillOrderTx.salt,
                compliantSignedFillOrderTx.signerAddress,
                exchangeCalldata,
                compliantSignedFillOrderTx.signature,
            );
            const decoder = new LogDecoder(web3Wrapper);
            const tx = await decoder.getTxWithDecodedLogsAsync(txHash);
            console.log(JSON.stringify(tx, null, 4));
        });
    });
});
// tslint:disable:max-file-line-count
// tslint:enable:no-unnecessary-type-assertion
