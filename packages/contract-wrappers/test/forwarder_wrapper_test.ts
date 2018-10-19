import { BlockchainLifecycle } from '@0x/dev-utils';
import { FillScenarios } from '@0x/fill-scenarios';
import { assetDataUtils } from '@0x/order-utils';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import { ContractWrappers, OrderStatus } from '../src';

import { chaiSetup } from './utils/chai_setup';
import { constants } from './utils/constants';
import { migrateOnceAsync } from './utils/migrate';
import { tokenUtils } from './utils/token_utils';
import { provider, ethRPCClient } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(ethRPCClient);

// tslint:disable:custom-no-magic-numbers
describe('ForwarderWrapper', () => {
    const fillableAmount = new BigNumber(5);
    let contractWrappers: ContractWrappers;
    let fillScenarios: FillScenarios;
    let exchangeContractAddress: string;
    let zrxTokenAddress: string;
    let userAddresses: string[];
    let makerAddress: string;
    let takerAddress: string;
    let makerTokenAddress: string;
    let takerTokenAddress: string;
    let makerAssetData: string;
    let takerAssetData: string;
    let signedOrder: SignedOrder;
    let anotherSignedOrder: SignedOrder;
    before(async () => {
        const contractAddresses = await migrateOnceAsync();
        await blockchainLifecycle.startAsync();
        const config = {
            networkId: constants.TESTRPC_NETWORK_ID,
            contractAddresses,
            blockPollingIntervalMs: 10,
        };
        contractWrappers = new ContractWrappers(provider, config);
        exchangeContractAddress = contractWrappers.exchange.address;
        userAddresses = await ethRPCClient.getAvailableAddressesAsync();
        zrxTokenAddress = contractWrappers.exchange.zrxTokenAddress;
        fillScenarios = new FillScenarios(
            provider,
            userAddresses,
            zrxTokenAddress,
            exchangeContractAddress,
            contractWrappers.erc20Proxy.address,
            contractWrappers.erc721Proxy.address,
        );
        [, makerAddress, takerAddress] = userAddresses;
        [makerTokenAddress] = tokenUtils.getDummyERC20TokenAddresses();
        takerTokenAddress = contractWrappers.forwarder.etherTokenAddress;
        [makerAssetData, takerAssetData] = [
            assetDataUtils.encodeERC20AssetData(makerTokenAddress),
            assetDataUtils.encodeERC20AssetData(takerTokenAddress),
        ];
        signedOrder = await fillScenarios.createFillableSignedOrderAsync(
            makerAssetData,
            takerAssetData,
            makerAddress,
            constants.NULL_ADDRESS,
            fillableAmount,
        );
        anotherSignedOrder = await fillScenarios.createFillableSignedOrderAsync(
            makerAssetData,
            takerAssetData,
            makerAddress,
            constants.NULL_ADDRESS,
            fillableAmount,
        );
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('#marketBuyOrdersWithEthAsync', () => {
        it('should market buy orders with eth', async () => {
            const signedOrders = [signedOrder, anotherSignedOrder];
            const makerAssetFillAmount = signedOrder.makerAssetAmount.plus(anotherSignedOrder.makerAssetAmount);
            const txHash = await contractWrappers.forwarder.marketBuyOrdersWithEthAsync(
                signedOrders,
                makerAssetFillAmount,
                takerAddress,
                makerAssetFillAmount,
            );
            await ethRPCClient.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            const ordersInfo = await contractWrappers.exchange.getOrdersInfoAsync([signedOrder, anotherSignedOrder]);
            expect(ordersInfo[0].orderStatus).to.be.equal(OrderStatus.FULLY_FILLED);
            expect(ordersInfo[1].orderStatus).to.be.equal(OrderStatus.FULLY_FILLED);
        });
        it('should throw when invalid transaction and shouldValidate is true', async () => {
            const signedOrders = [signedOrder];
            // request more makerAsset than what is available
            const makerAssetFillAmount = signedOrder.makerAssetAmount.plus(100);
            return expect(
                contractWrappers.forwarder.marketBuyOrdersWithEthAsync(
                    signedOrders,
                    makerAssetFillAmount,
                    takerAddress,
                    makerAssetFillAmount,
                    [],
                    0,
                    constants.NULL_ADDRESS,
                    {
                        shouldValidate: true,
                    },
                ),
            ).to.be.rejectedWith('COMPLETE_FILL_FAILED');
        });
    });
    describe('#marketSellOrdersWithEthAsync', () => {
        it('should market sell orders with eth', async () => {
            const signedOrders = [signedOrder, anotherSignedOrder];
            const makerAssetFillAmount = signedOrder.makerAssetAmount.plus(anotherSignedOrder.makerAssetAmount);
            const txHash = await contractWrappers.forwarder.marketSellOrdersWithEthAsync(
                signedOrders,
                takerAddress,
                makerAssetFillAmount,
            );
            await ethRPCClient.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
            const ordersInfo = await contractWrappers.exchange.getOrdersInfoAsync([signedOrder, anotherSignedOrder]);
            expect(ordersInfo[0].orderStatus).to.be.equal(OrderStatus.FULLY_FILLED);
            expect(ordersInfo[1].orderStatus).to.be.equal(OrderStatus.FILLABLE);
            expect(ordersInfo[1].orderTakerAssetFilledAmount).to.be.bignumber.equal(new BigNumber(4)); // only 95% of ETH is sold
        });
        it('should throw when invalid transaction and shouldValidate is true', async () => {
            // create an order with fees, we try to fill it but we do not provide enough ETH to cover the fees
            const signedOrderWithFee = await fillScenarios.createFillableSignedOrderWithFeesAsync(
                makerAssetData,
                takerAssetData,
                constants.ZERO_AMOUNT,
                new BigNumber(100),
                makerAddress,
                constants.NULL_ADDRESS,
                fillableAmount,
                constants.NULL_ADDRESS,
            );
            const signedOrders = [signedOrderWithFee];
            const makerAssetFillAmount = signedOrder.makerAssetAmount;
            return expect(
                contractWrappers.forwarder.marketSellOrdersWithEthAsync(
                    signedOrders,
                    takerAddress,
                    makerAssetFillAmount,
                    [],
                    0,
                    constants.NULL_ADDRESS,
                    {
                        shouldValidate: true,
                    },
                ),
            ).to.be.rejectedWith('COMPLETE_FILL_FAILED');
        });
    });
});
