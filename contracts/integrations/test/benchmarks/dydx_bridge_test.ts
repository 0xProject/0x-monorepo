import {
    DydxBridgeActionType,
    DydxBridgeData,
    dydxBridgeDataEncoder,
    encodeERC20AssetData,
    encodeERC20BridgeAssetData,
    IDydxContract,
} from '@0x/contracts-asset-proxy';
import { ERC20TokenContract } from '@0x/contracts-erc20';
import { ExchangeContract } from '@0x/contracts-exchange';
import {
    blockchainTests,
    constants,
    expect,
    FillEventArgs,
    getRandomInteger,
    Numberish,
} from '@0x/contracts-test-utils';
import { orderHashUtils } from '@0x/order-utils';
import { Order } from '@0x/types';
import { BigNumber, fromTokenUnitAmount, logUtils } from '@0x/utils';
import { DecodedLogEntry } from 'ethereum-types';

import { contractAddresses } from '../mainnet_fork_utils';

// A chonky dai wallet.
const MAKER_ADDRESS = '0xe235AAa27428E32cA14089b03F532c571C7ab3c8';
// Also a chonky dai wallet.
const TAKER_ADDRESS = '0x66c57bf505a85a74609d2c83e94aabb26d691e1f';
blockchainTests.configure({
    fork: {
        unlockedAccounts: [TAKER_ADDRESS, MAKER_ADDRESS],
    },
});

blockchainTests.fork.skip('DydxBridge fill benchmarks', env => {
    let exchange: ExchangeContract;
    let dydx: IDydxContract;

    before(async () => {
        exchange = new ExchangeContract(contractAddresses.exchange, env.provider, env.txDefaults);
        dydx = new IDydxContract(DYDX_ADDRESS, env.provider, env.txDefaults);
        // Initialize a dydx account with some Dai collateral and USDC borrowed.
        await approveSpenderAsync(MAKER_ADDRESS, BRIDGE_ADDRESS, DAI_ADDRESS);
        await approveSpenderAsync(MAKER_ADDRESS, DYDX_ADDRESS, DAI_ADDRESS);
        await dydx
            .setOperators([{ operator: BRIDGE_ADDRESS, trusted: true }])
            .awaitTransactionSuccessAsync({ from: MAKER_ADDRESS }, { shouldValidate: false });
        await depositAndWithdrawAsync(100, 1);
    });

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

    const ZERO = constants.ZERO_AMOUNT;
    const BRIDGE_ADDRESS = contractAddresses.dydxBridge;
    const DYDX_ACCOUNT_ID = getRandomInteger(0, constants.MAX_UINT256);
    const DYDX_ADDRESS = '0x1E0447b19BB6EcFdAe1e4AE1694b0C3659614e4e';
    const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
    const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    const TOKEN_INFO: { [addr: string]: { decimals: number; marketId: number } } = {
        [DAI_ADDRESS]: {
            decimals: 18,
            marketId: 3,
        },
        [USDC_ADDRESS]: {
            decimals: 6,
            marketId: 2,
        },
    };

    function encodeDydxBridgeAssetData(fromToken: string, toToken: string, depositRate: number = 1): string {
        const fromTokenMarketId = new BigNumber(TOKEN_INFO[fromToken].marketId);
        const toTokenMarketId = new BigNumber(TOKEN_INFO[toToken].marketId);
        const bridgeData: DydxBridgeData = {
            accountNumbers: [DYDX_ACCOUNT_ID],
            actions: [
                ...(depositRate > 0
                    ? [
                          {
                              actionType: DydxBridgeActionType.Deposit,
                              accountIdx: ZERO,
                              marketId: fromTokenMarketId,
                              ...createConversionFraction(toToken, fromToken, depositRate),
                          },
                      ]
                    : []),
                {
                    actionType: DydxBridgeActionType.Withdraw,
                    accountIdx: ZERO,
                    marketId: toTokenMarketId,
                    ...createConversionFraction(toToken, toToken, 1),
                },
            ],
        };
        return encodeERC20BridgeAssetData(
            toToken,
            contractAddresses.dydxBridge,
            dydxBridgeDataEncoder.encode({ bridgeData }),
        );
    }

    // Create fraction with default 18 decimal precision.
    function createConversionFraction(
        fromToken: string,
        toToken: string,
        rate: number,
    ): {
        conversionRateNumerator: BigNumber;
        conversionRateDenominator: BigNumber;
    } {
        const fromDecimals = TOKEN_INFO[fromToken].decimals;
        const toDecimals = TOKEN_INFO[toToken].decimals;
        return {
            conversionRateNumerator: fromTokenUnitAmount(rate, toDecimals),
            conversionRateDenominator: fromTokenUnitAmount(1, fromDecimals),
        };
    }

    enum DydxActionType {
        Deposit = 0,
        Withdraw = 1,
    }

    enum DydxAssetDenomination {
        Wei = 0,
        Par = 1,
    }

    enum DydxAssetReference {
        Delta = 0,
        Target = 1,
    }

    async function depositAndWithdrawAsync(depositSize: Numberish, withdrawSize: Numberish): Promise<void> {
        const dai = TOKEN_INFO[DAI_ADDRESS];
        const usdc = TOKEN_INFO[USDC_ADDRESS];
        await dydx
            .operate(
                [{ owner: MAKER_ADDRESS, number: DYDX_ACCOUNT_ID }],
                [
                    {
                        actionType: DydxActionType.Deposit,
                        accountIdx: ZERO,
                        amount: {
                            sign: true,
                            denomination: DydxAssetDenomination.Wei,
                            ref: DydxAssetReference.Delta,
                            value: fromTokenUnitAmount(depositSize, dai.decimals),
                        },
                        primaryMarketId: new BigNumber(dai.marketId),
                        secondaryMarketId: new BigNumber(constants.NULL_ADDRESS),
                        otherAddress: MAKER_ADDRESS,
                        otherAccountIdx: ZERO,
                        data: constants.NULL_BYTES,
                    },
                    {
                        actionType: DydxActionType.Withdraw,
                        accountIdx: ZERO,
                        amount: {
                            sign: false,
                            denomination: DydxAssetDenomination.Wei,
                            ref: DydxAssetReference.Delta,
                            value: fromTokenUnitAmount(withdrawSize, usdc.decimals),
                        },
                        primaryMarketId: new BigNumber(usdc.marketId),
                        secondaryMarketId: new BigNumber(constants.NULL_ADDRESS),
                        otherAddress: MAKER_ADDRESS,
                        otherAccountIdx: ZERO,
                        data: constants.NULL_BYTES,
                    },
                ],
            )
            .awaitTransactionSuccessAsync({ from: MAKER_ADDRESS }, { shouldValidate: false });
    }

    const DYDX_ASSET_DATA = encodeDydxBridgeAssetData(DAI_ADDRESS, USDC_ADDRESS);
    const DAI_ASSET_DATA = encodeERC20AssetData(DAI_ADDRESS);
    const SIGNATURE_PRESIGN = '0x06';
    const PROTOCOL_FEE = 150e3;
    const ONE_DAY = 60 * 60 * 24;
    const ORDER_DEFAULTS: Order = {
        chainId: 1,
        exchangeAddress: contractAddresses.exchange,
        expirationTimeSeconds: new BigNumber(Math.floor(Date.now() / 1e3) + ONE_DAY),
        salt: getRandomInteger(0, constants.MAX_UINT256),
        makerAddress: MAKER_ADDRESS,
        feeRecipientAddress: constants.NULL_ADDRESS,
        senderAddress: constants.NULL_ADDRESS,
        takerAddress: constants.NULL_ADDRESS,
        makerAssetAmount: fromTokenUnitAmount(50, TOKEN_INFO[USDC_ADDRESS].decimals),
        takerAssetAmount: fromTokenUnitAmount(100, TOKEN_INFO[USDC_ADDRESS].decimals),
        makerFee: constants.ZERO_AMOUNT,
        takerFee: constants.ZERO_AMOUNT,
        makerAssetData: DYDX_ASSET_DATA,
        takerAssetData: DAI_ASSET_DATA,
        makerFeeAssetData: constants.NULL_BYTES,
        takerFeeAssetData: constants.NULL_BYTES,
    };

    describe('gas usage', () => {
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
            await approveSpenderAsync(TAKER_ADDRESS, contractAddresses.erc20Proxy, DAI_ADDRESS);
            return order;
        }

        // Last run: 375066
        it('filling a DAI->USDC dydx order with a deposit action', async () => {
            const order = await prepareOrderAsync();
            const receipt = await exchange
                .fillOrder(order, order.takerAssetAmount, SIGNATURE_PRESIGN)
                .awaitTransactionSuccessAsync(
                    {
                        from: TAKER_ADDRESS,
                        value: PROTOCOL_FEE,
                        gasPrice: 1,
                    },
                    { shouldValidate: false },
                );
            const fillEvent = (receipt.logs as Array<DecodedLogEntry<FillEventArgs>>).find(log => log.event === 'Fill');
            expect(fillEvent).to.exist('');
            logUtils.log(`gas used: ${receipt.gasUsed}`);
        });

        // Last run: 315896
        it('filling a DAI->USDC dydx order with no deposit action', async () => {
            const order = await prepareOrderAsync({
                makerAssetData: encodeDydxBridgeAssetData(DAI_ADDRESS, USDC_ADDRESS, 0),
            });
            const receipt = await exchange
                .fillOrder(order, order.takerAssetAmount, SIGNATURE_PRESIGN)
                .awaitTransactionSuccessAsync(
                    {
                        from: TAKER_ADDRESS,
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
