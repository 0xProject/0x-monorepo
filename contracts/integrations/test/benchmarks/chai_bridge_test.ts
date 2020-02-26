import { encodeERC20AssetData, encodeERC20BridgeAssetData } from '@0x/contracts-asset-proxy';
import { ERC20TokenContract } from '@0x/contracts-erc20';
import { ExchangeContract } from '@0x/contracts-exchange';
import { blockchainTests, constants, expect, FillEventArgs, getRandomInteger } from '@0x/contracts-test-utils';
import { orderHashUtils } from '@0x/order-utils';
import { Order } from '@0x/types';
import { BigNumber, logUtils } from '@0x/utils';
import { DecodedLogEntry } from 'ethereum-types';

import { contractAddresses } from '../mainnet_fork_utils';

const CHONKY_DAI_WALLET = '0xe235AAa27428E32cA14089b03F532c571C7ab3c8';
const CHONKY_CHAI_WALLET = '0xfc64382c9ce89ba1c21692a68000366a35ff0336';
const CHONKY_WETH_WALLET = '0x4abB24590606f5bf4645185e20C4E7B97596cA3B';
blockchainTests.configure({
    fork: {
        unlockedAccounts: [CHONKY_CHAI_WALLET, CHONKY_WETH_WALLET, CHONKY_DAI_WALLET],
    },
});

blockchainTests.fork.skip('ChaiBridge fill benchmarks', env => {
    let exchange: ExchangeContract;

    before(async () => {
        exchange = new ExchangeContract(contractAddresses.exchange, env.provider, env.txDefaults);
    });

    const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
    const CHAI_ADDRESS = '0x06AF07097C9Eeb7fD685c692751D5C66dB49c215';
    const CHAI_BRIDGE_ASSET_DATA = encodeERC20BridgeAssetData(
        DAI_ADDRESS,
        contractAddresses.chaiBridge,
        constants.NULL_BYTES,
    );
    const DAI_ASSET_DATA = encodeERC20AssetData(DAI_ADDRESS);
    const WETH_ASSET_DATA = encodeERC20AssetData(contractAddresses.etherToken);
    const SIGNATURE_PRESIGN = '0x06';
    const PROTOCOL_FEE = 150e3;
    const ONE_DAY = 60 * 60 * 24;
    const ORDER_DEFAULTS: Order = {
        chainId: 1,
        exchangeAddress: contractAddresses.exchange,
        expirationTimeSeconds: new BigNumber(Math.floor(Date.now() / 1e3) + ONE_DAY),
        salt: getRandomInteger(0, constants.MAX_UINT256),
        makerAddress: CHONKY_CHAI_WALLET,
        feeRecipientAddress: constants.NULL_ADDRESS,
        senderAddress: constants.NULL_ADDRESS,
        takerAddress: constants.NULL_ADDRESS,
        makerAssetAmount: new BigNumber(1e18),
        takerAssetAmount: new BigNumber(1e18),
        makerFee: constants.ZERO_AMOUNT,
        takerFee: constants.ZERO_AMOUNT,
        makerAssetData: CHAI_BRIDGE_ASSET_DATA,
        takerAssetData: WETH_ASSET_DATA,
        makerFeeAssetData: constants.NULL_BYTES,
        takerFeeAssetData: constants.NULL_BYTES,
    };

    async function approveSpenderAsync(
        ownerAddress: string,
        spenderAddress: string,
        tokenAddress: string,
    ): Promise<void> {
        const token = new ERC20TokenContract(tokenAddress, env.provider, env.txDefaults);
        await token.approve(spenderAddress, constants.MAX_UINT256).awaitTransactionSuccessAsync(
            {
                from: ownerAddress,
            },
            { shouldValidate: false },
        );
    }

    describe('chai gas usage', () => {
        before(async () => {
            await approveSpenderAsync(CHONKY_CHAI_WALLET, contractAddresses.chaiBridge, CHAI_ADDRESS);
            await approveSpenderAsync(CHONKY_WETH_WALLET, contractAddresses.erc20Proxy, contractAddresses.etherToken);
        });

        async function prepareOrderAsync(fields: Partial<Order> = {}): Promise<Order> {
            const order = {
                ...ORDER_DEFAULTS,
                ...fields,
            };
            const orderHash = orderHashUtils.getOrderHash(order);
            await exchange.preSign(orderHash).awaitTransactionSuccessAsync(
                {
                    from: order.makerAddress,
                },
                { shouldValidate: false },
            );
            return order;
        }

        // Last run: 282194
        it('filling one chai maker asset', async () => {
            const order = await prepareOrderAsync();
            const receipt = await exchange
                .fillOrder(order, order.takerAssetAmount, SIGNATURE_PRESIGN)
                .awaitTransactionSuccessAsync(
                    {
                        from: CHONKY_WETH_WALLET,
                        value: PROTOCOL_FEE,
                        gasPrice: 1,
                    },
                    { shouldValidate: false },
                );
            const fillEvent = (receipt.logs as Array<DecodedLogEntry<FillEventArgs>>).find(log => log.event === 'Fill');
            expect(fillEvent).to.exist('');
            logUtils.log(`gas used: ${receipt.gasUsed}`);
        });

        // Last run: 292707
        it('filling one chai taker asset', async () => {
            const order = await prepareOrderAsync({
                makerAddress: CHONKY_WETH_WALLET,
                takerAssetData: CHAI_BRIDGE_ASSET_DATA,
                makerAssetData: WETH_ASSET_DATA,
            });
            const receipt = await exchange
                .fillOrder(order, order.takerAssetAmount, SIGNATURE_PRESIGN)
                .awaitTransactionSuccessAsync(
                    {
                        from: CHONKY_CHAI_WALLET,
                        value: PROTOCOL_FEE,
                        gasPrice: 1,
                    },
                    { shouldValidate: false },
                );
            const fillEvent = (receipt.logs as Array<DecodedLogEntry<FillEventArgs>>).find(log => log.event === 'Fill');
            expect(fillEvent).to.exist('');
            logUtils.log(`gas used: ${receipt.gasUsed}`);
        });
    });

    describe('dai gas usage', () => {
        before(async () => {
            await approveSpenderAsync(CHONKY_DAI_WALLET, contractAddresses.erc20Proxy, DAI_ADDRESS);
            await approveSpenderAsync(CHONKY_WETH_WALLET, contractAddresses.erc20Proxy, contractAddresses.etherToken);
        });

        async function prepareOrderAsync(fields: Partial<Order> = {}): Promise<Order> {
            const order = {
                ...ORDER_DEFAULTS,
                ...fields,
            };
            const orderHash = orderHashUtils.getOrderHash(order);
            await exchange.preSign(orderHash).awaitTransactionSuccessAsync(
                {
                    from: order.makerAddress,
                },
                { shouldValidate: false },
            );
            return order;
        }

        // Last run: 124665
        it('filling one dai maker asset', async () => {
            const order = await prepareOrderAsync({
                makerAddress: CHONKY_DAI_WALLET,
                makerAssetData: DAI_ASSET_DATA,
            });
            const receipt = await exchange
                .fillOrder(order, order.takerAssetAmount, SIGNATURE_PRESIGN)
                .awaitTransactionSuccessAsync(
                    {
                        from: CHONKY_WETH_WALLET,
                        value: PROTOCOL_FEE,
                        gasPrice: 1,
                    },
                    { shouldValidate: false },
                );
            const fillEvent = (receipt.logs as Array<DecodedLogEntry<FillEventArgs>>).find(log => log.event === 'Fill');
            expect(fillEvent).to.exist('');
            logUtils.log(`gas used: ${receipt.gasUsed}`);
        });

        // Last run: 124665
        it('filling one dai taker asset', async () => {
            const order = await prepareOrderAsync({
                makerAddress: CHONKY_WETH_WALLET,
                takerAssetData: DAI_ASSET_DATA,
                makerAssetData: WETH_ASSET_DATA,
            });
            const receipt = await exchange
                .fillOrder(order, order.takerAssetAmount, SIGNATURE_PRESIGN)
                .awaitTransactionSuccessAsync(
                    {
                        from: CHONKY_DAI_WALLET,
                        value: PROTOCOL_FEE,
                        gasPrice: 1,
                    },
                    { shouldValidate: false },
                );
            const fillEvent = (receipt.logs as Array<DecodedLogEntry<FillEventArgs>>).find(log => log.event === 'Fill');
            expect(fillEvent).to.exist('');
            logUtils.log(`gas used: ${receipt.gasUsed}`);
        });
    });
});
