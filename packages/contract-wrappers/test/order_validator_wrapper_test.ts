import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { FillScenarios } from '@0xproject/fill-scenarios';
import { assetDataUtils } from '@0xproject/order-utils';
import { SignedOrder, ContractAddresses } from '@0xproject/types';
import { getContractAddresses } from '@0xproject/migrations';
import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import * as _ from 'lodash';
import 'mocha';

import { ContractWrappers, OrderStatus } from '../src';
import { OrderInfo, TraderInfo } from '../src/types';

import { chaiSetup } from './utils/chai_setup';
import { constants } from './utils/constants';
import { tokenUtils } from './utils/token_utils';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('OrderValidator', () => {
    const fillableAmount = new BigNumber(5);
    let contractWrappers: ContractWrappers;
    let fillScenarios: FillScenarios;
    let exchangeContractAddress: string;
    let zrxTokenAddress: string;
    let zrxTokenAssetData: string;
    let userAddresses: string[];
    let coinbase: string;
    let makerAddress: string;
    let takerAddress: string;
    let feeRecipient: string;
    let anotherMakerAddress: string;
    let makerTokenAddress: string;
    let takerTokenAddress: string;
    let makerAssetData: string;
    let takerAssetData: string;
    let signedOrder: SignedOrder;
    let anotherSignedOrder: SignedOrder;
    let contractAddresses: ContractAddresses;

    before(async () => {
        await blockchainLifecycle.startAsync();
        contractAddresses = getContractAddresses();
        const config = {
            networkId: constants.TESTRPC_NETWORK_ID,
            contractAddresses,
            blockPollingIntervalMs: 10,
        };
        contractWrappers = new ContractWrappers(provider, config);
        exchangeContractAddress = contractWrappers.exchange.address;
        userAddresses = await web3Wrapper.getAvailableAddressesAsync();
        zrxTokenAddress = contractWrappers.exchange.zrxTokenAddress;
        zrxTokenAssetData = assetDataUtils.encodeERC20AssetData(zrxTokenAddress);
        fillScenarios = new FillScenarios(
            provider,
            userAddresses,
            zrxTokenAddress,
            exchangeContractAddress,
            contractWrappers.erc20Proxy.address,
            contractWrappers.erc721Proxy.address,
        );
        [coinbase, makerAddress, takerAddress, feeRecipient, anotherMakerAddress] = userAddresses;
        [makerTokenAddress] = tokenUtils.getDummyERC20TokenAddresses();
        takerTokenAddress = contractAddresses.etherToken;
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
            zrxTokenAssetData,
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
    describe('#getOrdersAndTradersInfoAsync', () => {
        let signedOrders: SignedOrder[];
        let takerAddresses: string[];
        let ordersInfo: OrderInfo[];
        let tradersInfo: TraderInfo[];
        beforeEach(async () => {
            signedOrders = [signedOrder, anotherSignedOrder];
            takerAddresses = [takerAddress, takerAddress];
            const ordersAndTradersInfo = await contractWrappers.orderValidator.getOrdersAndTradersInfoAsync(
                signedOrders,
                takerAddresses,
            );
            ordersInfo = _.map(ordersAndTradersInfo, orderAndTraderInfo => orderAndTraderInfo.orderInfo);
            tradersInfo = _.map(ordersAndTradersInfo, orderAndTraderInfo => orderAndTraderInfo.traderInfo);
        });
        it('should return the same number of order infos and trader infos as input orders', async () => {
            expect(ordersInfo.length).to.be.equal(signedOrders.length);
            expect(tradersInfo.length).to.be.equal(takerAddresses.length);
        });
        it('should return correct on-chain order info for input orders', async () => {
            const firstOrderInfo = ordersInfo[0];
            const secondOrderInfo = ordersInfo[1];
            expect(firstOrderInfo.orderStatus).to.be.equal(OrderStatus.FILLABLE);
            expect(firstOrderInfo.orderTakerAssetFilledAmount).to.bignumber.equal(constants.ZERO_AMOUNT);
            expect(secondOrderInfo.orderStatus).to.be.equal(OrderStatus.FILLABLE);
            expect(secondOrderInfo.orderTakerAssetFilledAmount).to.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should return correct on-chain trader info for input takers', async () => {
            const firstTraderInfo = tradersInfo[0];
            const secondTraderInfo = tradersInfo[1];
            expect(firstTraderInfo.makerBalance).to.bignumber.equal(new BigNumber(5));
            expect(firstTraderInfo.makerAllowance).to.bignumber.equal(new BigNumber(5));
            expect(firstTraderInfo.takerBalance).to.bignumber.equal(new BigNumber(0));
            expect(firstTraderInfo.takerAllowance).to.bignumber.equal(new BigNumber(0));
            expect(firstTraderInfo.makerZrxBalance).to.bignumber.equal(new BigNumber(5));
            expect(firstTraderInfo.makerZrxAllowance).to.bignumber.equal(new BigNumber(5));
            expect(firstTraderInfo.takerZrxBalance).to.bignumber.equal(new BigNumber(0));
            expect(firstTraderInfo.takerZrxAllowance).to.bignumber.equal(new BigNumber(0));
            expect(secondTraderInfo.makerBalance).to.bignumber.equal(new BigNumber(5));
            expect(secondTraderInfo.makerAllowance).to.bignumber.equal(new BigNumber(5));
            expect(secondTraderInfo.takerBalance).to.bignumber.equal(new BigNumber(0));
            expect(secondTraderInfo.takerAllowance).to.bignumber.equal(new BigNumber(0));
            expect(secondTraderInfo.makerZrxBalance).to.bignumber.equal(new BigNumber(5));
            expect(secondTraderInfo.makerZrxAllowance).to.bignumber.equal(new BigNumber(5));
            expect(secondTraderInfo.takerZrxBalance).to.bignumber.equal(new BigNumber(0));
            expect(secondTraderInfo.takerZrxAllowance).to.bignumber.equal(new BigNumber(0));
        });
    });
});
