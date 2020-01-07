import { artifacts as erc20Artifacts, DummyERC20TokenContract } from '@0x/contracts-erc20';
import { ForwarderContract, IExchangeV2Contract } from '@0x/contracts-exchange-forwarder';
import {
    blockchainTests,
    constants,
    expect,
    getLatestBlockTimestampAsync,
    orderHashUtils,
    signingUtils,
} from '@0x/contracts-test-utils';
import { assetDataUtils, generatePseudoRandomSalt } from '@0x/order-utils';
import { Order, SignatureType, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as ethUtil from 'ethereumjs-util';

import { contractAddresses } from '../mainnet_fork_utils';

import { SignedV2Order } from './types';

blockchainTests.fork.resets('Forwarder mainnet tests', env => {
    const forwarder = new ForwarderContract(contractAddresses.forwarder, env.provider, env.txDefaults);
    const exchangeV2 = new IExchangeV2Contract(contractAddresses.exchangeV2, env.provider, env.txDefaults);
    const wethAssetData = assetDataUtils.encodeERC20AssetData(contractAddresses.etherToken);
    const v2OrderId = '0x770501f8';
    let makerAddress: string;
    let takerAddress: string;
    let makerAssetData: string;
    let makerToken: DummyERC20TokenContract;
    let makerPrivateKey: Buffer;

    before(async () => {
        [makerAddress, takerAddress] = await env.web3Wrapper.getAvailableAddressesAsync();
        makerToken = await DummyERC20TokenContract.deployFrom0xArtifactAsync(
            erc20Artifacts.DummyERC20Token,
            env.provider,
            env.txDefaults,
            erc20Artifacts,
            constants.DUMMY_TOKEN_NAME,
            constants.DUMMY_TOKEN_SYMBOL,
            constants.DUMMY_TOKEN_DECIMALS,
            constants.DUMMY_TOKEN_TOTAL_SUPPLY,
        );
        await makerToken.setBalance(makerAddress, constants.INITIAL_ERC20_BALANCE).awaitTransactionSuccessAsync();
        await makerToken
            .approve(contractAddresses.erc20Proxy, constants.INITIAL_ERC20_ALLOWANCE)
            .awaitTransactionSuccessAsync({ from: makerAddress });
        makerAssetData = assetDataUtils.encodeERC20AssetData(makerToken.address);
        makerPrivateKey = constants.TESTRPC_PRIVATE_KEYS[0];
    });

    async function createOrderAsync(orderParams: Partial<Order> = {}): Promise<SignedOrder | SignedV2Order> {
        const currentBlockTimestamp = await getLatestBlockTimestampAsync();
        const fifteenMinutesInSeconds = 15 * 60;
        const order = {
            chainId: 1,
            exchangeAddress: contractAddresses.exchange,
            makerAddress,
            takerAddress: constants.NULL_ADDRESS,
            senderAddress: constants.NULL_ADDRESS,
            feeRecipientAddress: constants.NULL_ADDRESS,
            expirationTimeSeconds: new BigNumber(currentBlockTimestamp).plus(fifteenMinutesInSeconds),
            salt: generatePseudoRandomSalt(),
            makerAssetData,
            takerAssetData: wethAssetData,
            makerFeeAssetData: makerAssetData,
            takerFeeAssetData: wethAssetData,
            makerAssetAmount: constants.INITIAL_ERC20_BALANCE.dividedToIntegerBy(2),
            takerAssetAmount: Web3Wrapper.toBaseUnitAmount(0.001, 18),
            makerFee: constants.ZERO_AMOUNT,
            takerFee: constants.ZERO_AMOUNT,
            ...orderParams,
        };
        const orderHashHex =
            order.makerFeeAssetData === v2OrderId
                ? (await exchangeV2.getOrderInfo(order).callAsync()).orderHash
                : orderHashUtils.getOrderHashHex(order);
        const signature = `0x${signingUtils
            .signMessage(ethUtil.toBuffer(orderHashHex), makerPrivateKey, SignatureType.EthSign)
            .toString('hex')}`;
        return {
            ...order,
            signature,
        };
    }

    describe('marketSellOrdersWithEth', () => {
        it('should fill a single v2 order with no fees', async () => {
            const order = await createOrderAsync({ makerFeeAssetData: v2OrderId });
            const [wethSpentAmount, makerAssetAcquiredAmount] = await forwarder
                .marketSellOrdersWithEth([order], [order.signature], [], [])
                .callAsync({
                    from: takerAddress,
                    value: order.takerAssetAmount,
                });
            expect(wethSpentAmount).to.bignumber.eq(order.takerAssetAmount);
            expect(makerAssetAcquiredAmount).to.bignumber.eq(order.makerAssetAmount);
        });
        it('should fill multiple v2 orders', async () => {
            const orders = [
                await createOrderAsync({ makerFeeAssetData: v2OrderId }),
                await createOrderAsync({ makerFeeAssetData: v2OrderId }),
            ];
            const ethSellAmount = BigNumber.sum(
                orders[0].takerAssetAmount,
                orders[1].takerAssetAmount.dividedToIntegerBy(2),
            );
            const [wethSpentAmount, makerAssetAcquiredAmount] = await forwarder
                .marketSellOrdersWithEth(orders, orders.map(o => o.signature), [], [])
                .callAsync({
                    from: takerAddress,
                    value: ethSellAmount,
                });
            expect(wethSpentAmount).to.bignumber.eq(ethSellAmount);
            expect(makerAssetAcquiredAmount).to.bignumber.eq(
                BigNumber.sum(orders[0].makerAssetAmount, orders[1].makerAssetAmount.dividedToIntegerBy(2)),
            );
        });
        it.skip('should fill multiple v2/v3 orders', async () => {
            const v2Order = await createOrderAsync({ makerFeeAssetData: v2OrderId });
            const v3Order = await createOrderAsync();
            const protocolFee = new BigNumber(150000).times(constants.DEFAULT_GAS_PRICE);
            const ethSellAmount = BigNumber.sum(
                v2Order.takerAssetAmount,
                v3Order.takerAssetAmount.dividedToIntegerBy(2),
            );
            const [wethSpentAmount, makerAssetAcquiredAmount] = await forwarder
                .marketSellOrdersWithEth([v2Order, v3Order], [v2Order.signature, v3Order.signature], [], [])
                .callAsync({
                    from: takerAddress,
                    value: ethSellAmount.plus(protocolFee),
                    gasPrice: constants.DEFAULT_GAS_PRICE,
                });
            expect(wethSpentAmount).to.bignumber.eq(ethSellAmount.plus(protocolFee));
            expect(makerAssetAcquiredAmount).to.bignumber.eq(
                BigNumber.sum(v2Order.makerAssetAmount, v3Order.makerAssetAmount.dividedToIntegerBy(2)),
            );
        });
    });

    describe('marketBuyOrdersWithEth', () => {
        it('should fill a single v2 order', async () => {
            const order = await createOrderAsync({ makerFeeAssetData: v2OrderId });
            const [wethSpentAmount, makerAssetAcquiredAmount] = await forwarder
                .marketBuyOrdersWithEth([order], order.makerAssetAmount, [order.signature], [], [])
                .callAsync({ from: takerAddress, value: order.takerAssetAmount });
            expect(wethSpentAmount).to.bignumber.eq(order.takerAssetAmount);
            expect(makerAssetAcquiredAmount).to.bignumber.eq(order.makerAssetAmount);
        });
        it('should fill multiple v2 orders', async () => {
            const orders = [
                await createOrderAsync({ makerFeeAssetData: v2OrderId }),
                await createOrderAsync({ makerFeeAssetData: v2OrderId }),
            ];
            const ethSellAmount = BigNumber.sum(
                orders[0].takerAssetAmount,
                orders[1].takerAssetAmount.dividedToIntegerBy(2),
            );
            const makerAssetBuyAmount = BigNumber.sum(
                orders[0].makerAssetAmount,
                orders[1].makerAssetAmount.dividedToIntegerBy(2),
            );
            const [wethSpentAmount, makerAssetAcquiredAmount] = await forwarder
                .marketBuyOrdersWithEth(orders, makerAssetBuyAmount, orders.map(o => o.signature), [], [])
                .callAsync({
                    from: takerAddress,
                    value: ethSellAmount,
                });
            expect(wethSpentAmount).to.bignumber.eq(ethSellAmount);
            expect(makerAssetAcquiredAmount).to.bignumber.eq(makerAssetBuyAmount);
        });
        it.skip('should fill multiple v2/v3 orders', async () => {
            const v2Order = await createOrderAsync({ makerFeeAssetData: v2OrderId });
            const v3Order = await createOrderAsync();
            const protocolFee = new BigNumber(150000).times(constants.DEFAULT_GAS_PRICE);
            const ethSellAmount = BigNumber.sum(
                v2Order.takerAssetAmount,
                v3Order.takerAssetAmount.dividedToIntegerBy(2),
            );
            const makerAssetBuyAmount = BigNumber.sum(
                v2Order.makerAssetAmount,
                v3Order.makerAssetAmount.dividedToIntegerBy(2),
            );
            const [wethSpentAmount, makerAssetAcquiredAmount] = await forwarder
                .marketBuyOrdersWithEth(
                    [v2Order, v3Order],
                    makerAssetBuyAmount,
                    [v2Order.signature, v3Order.signature],
                    [],
                    [],
                )
                .callAsync({
                    from: takerAddress,
                    value: ethSellAmount.plus(protocolFee),
                    gasPrice: constants.DEFAULT_GAS_PRICE,
                });
            expect(wethSpentAmount).to.bignumber.eq(ethSellAmount.plus(protocolFee));
            expect(makerAssetAcquiredAmount).to.bignumber.eq(makerAssetBuyAmount);
        });
    });
});
