import {
    artifacts as assetProxyArtifacts,
    DydxBridgeActionType,
    DydxBridgeContract,
    DydxBridgeData,
    dydxBridgeDataEncoder,
    encodeERC20AssetData,
    encodeERC20BridgeAssetData,
    IDydxContract,
} from '@0x/contracts-asset-proxy';
import { artifacts as devUtilsArtifacts, DevUtilsContract } from '@0x/contracts-dev-utils';
import { ERC20TokenContract } from '@0x/contracts-erc20';
import { blockchainTests, constants, expect, Numberish } from '@0x/contracts-test-utils';
import { Order } from '@0x/types';
import { BigNumber, fromTokenUnitAmount, hexUtils, toTokenUnitAmount } from '@0x/utils';

import { contractAddresses } from '../mainnet_fork_utils';

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

const MAKER_ADDRESS = '0x3a9F7C8cA36C42d7035E87C3304eE5cBd353a532';

blockchainTests.configure({
    fork: {
        unlockedAccounts: [MAKER_ADDRESS],
    },
});

blockchainTests.fork('DevUtils dydx order validation tests', env => {
    const { ZERO_AMOUNT: ZERO } = constants;
    const SIGNATURE = '0x01'; // Invalid signature. Doesn't matter.
    const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
    const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    const DYDX_ADDRESS = '0x1E0447b19BB6EcFdAe1e4AE1694b0C3659614e4e';
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
    const DAI_DECIMALS = TOKEN_INFO[DAI_ADDRESS].decimals;
    const USDC_DECIMALS = TOKEN_INFO[USDC_ADDRESS].decimals;
    const DAI_MARKET_ID = TOKEN_INFO[DAI_ADDRESS].marketId;
    const USDC_MARKET_ID = TOKEN_INFO[USDC_ADDRESS].marketId;
    let bridge: DydxBridgeContract;
    let dydx: IDydxContract;
    let dai: ERC20TokenContract;
    let devUtils: DevUtilsContract;
    let accountOwner: string;
    let minMarginRatio: number;

    before(async () => {
        [accountOwner] = await env.getAccountAddressesAsync();
        dydx = new IDydxContract(DYDX_ADDRESS, env.provider, env.txDefaults);
        dai = new ERC20TokenContract(DAI_ADDRESS, env.provider, env.txDefaults);
        bridge = await DydxBridgeContract.deployFrom0xArtifactAsync(
            assetProxyArtifacts.DydxBridge,
            env.provider,
            env.txDefaults,
            {},
        );
        devUtils = await DevUtilsContract.deployWithLibrariesFrom0xArtifactAsync(
            devUtilsArtifacts.DevUtils,
            devUtilsArtifacts,
            env.provider,
            env.txDefaults,
            devUtilsArtifacts,
            contractAddresses.exchange,
            contractAddresses.chaiBridge,
            bridge.address,
        );
        minMarginRatio = toTokenUnitAmount((await dydx.getRiskParams().callAsync()).marginRatio.value)
            .plus(1)
            .toNumber();
        // Deposit Dai collateral.
        await dai.approve(DYDX_ADDRESS, constants.MAX_UINT256).awaitTransactionSuccessAsync({ from: MAKER_ADDRESS });
        await dydx
            .setOperators([{ operator: bridge.address, trusted: true }])
            .awaitTransactionSuccessAsync({ from: MAKER_ADDRESS });
    });

    async function depositAndWithdrawAsync(
        accountId: BigNumber,
        depositSize: Numberish = 0,
        withdrawSize: Numberish = 0,
    ): Promise<void> {
        await dydx
            .operate(
                [{ owner: MAKER_ADDRESS, number: accountId }],
                [
                    ...(depositSize > 0
                        ? [
                              {
                                  actionType: DydxActionType.Deposit,
                                  accountIdx: ZERO,
                                  amount: {
                                      sign: true,
                                      denomination: DydxAssetDenomination.Wei,
                                      ref: DydxAssetReference.Delta,
                                      value: fromTokenUnitAmount(depositSize, DAI_DECIMALS),
                                  },
                                  primaryMarketId: new BigNumber(DAI_MARKET_ID),
                                  secondaryMarketId: new BigNumber(constants.NULL_ADDRESS),
                                  otherAddress: MAKER_ADDRESS,
                                  otherAccountIdx: ZERO,
                                  data: constants.NULL_BYTES,
                              },
                          ]
                        : []),
                    ...(withdrawSize > 0
                        ? [
                              {
                                  actionType: DydxActionType.Withdraw,
                                  accountIdx: ZERO,
                                  amount: {
                                      sign: false,
                                      denomination: DydxAssetDenomination.Wei,
                                      ref: DydxAssetReference.Delta,
                                      value: fromTokenUnitAmount(withdrawSize, USDC_DECIMALS),
                                  },
                                  primaryMarketId: new BigNumber(USDC_MARKET_ID),
                                  secondaryMarketId: new BigNumber(constants.NULL_ADDRESS),
                                  otherAddress: MAKER_ADDRESS,
                                  otherAccountIdx: ZERO,
                                  data: constants.NULL_BYTES,
                              },
                          ]
                        : []),
                ],
            )
            .awaitTransactionSuccessAsync({ from: MAKER_ADDRESS });
    }

    const SECONDS_IN_ONE_YEAR = 365 * 24 * 60 * 60;

    function createOrder(fields: Partial<Order> = {}): Order {
        return {
            chainId: 1,
            exchangeAddress: contractAddresses.exchange,
            expirationTimeSeconds: new BigNumber(Math.floor(Date.now() / 1000 + SECONDS_IN_ONE_YEAR)),
            makerAddress: MAKER_ADDRESS,
            takerAddress: constants.NULL_ADDRESS,
            senderAddress: constants.NULL_ADDRESS,
            feeRecipientAddress: constants.NULL_ADDRESS,
            salt: new BigNumber(hexUtils.random()),
            makerAssetAmount: fromTokenUnitAmount(100, USDC_DECIMALS),
            takerAssetAmount: fromTokenUnitAmount(200, DAI_DECIMALS),
            makerFee: ZERO,
            takerFee: ZERO,
            makerAssetData: encodeDydxBridgeAssetData(),
            takerAssetData: encodeERC20AssetData(DAI_ADDRESS),
            makerFeeAssetData: constants.NULL_BYTES,
            takerFeeAssetData: constants.NULL_BYTES,
            ...fields,
        };
    }

    function encodeDydxBridgeAssetData(
        fields: Partial<{
            fromToken: string;
            toToken: string;
            depositRate: number;
            withdrawRate: number;
            accountId: BigNumber;
        }> = {},
    ): string {
        const { fromToken, toToken, depositRate, withdrawRate, accountId } = {
            fromToken: DAI_ADDRESS,
            toToken: USDC_ADDRESS,
            depositRate: 1,
            withdrawRate: 1,
            accountId: ZERO,
            ...fields,
        };
        const fromTokenMarketId = new BigNumber(TOKEN_INFO[fromToken].marketId);
        const toTokenMarketId = new BigNumber(TOKEN_INFO[toToken].marketId);
        const bridgeData: DydxBridgeData = {
            accountNumbers: [accountId],
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
                ...(withdrawRate > 0
                    ? [
                          {
                              actionType: DydxBridgeActionType.Withdraw,
                              accountIdx: ZERO,
                              marketId: toTokenMarketId,
                              ...createConversionFraction(toToken, toToken, withdrawRate),
                          },
                      ]
                    : []),
            ],
        };
        return encodeERC20BridgeAssetData(toToken, bridge.address, dydxBridgeDataEncoder.encode({ bridgeData }));
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

    function randomAccountId(): BigNumber {
        return new BigNumber(hexUtils.random());
    }

    it('validates a fully solvent order', async () => {
        // This account is collateralized enough to fill the order with just
        // withdraws.
        const accountId = randomAccountId();
        await depositAndWithdrawAsync(accountId, 200, 0);
        const order = createOrder({
            makerAssetData: encodeDydxBridgeAssetData({
                accountId,
                depositRate: 0,
            }),
        });
        const [, fillableTakerAssetAmount] = await devUtils.getOrderRelevantState(order, SIGNATURE).callAsync();
        expect(fillableTakerAssetAmount).to.bignumber.eq(order.takerAssetAmount);
    });

    it('validates a perpetually solvent order', async () => {
        // This account is not very well collateralized, but the deposit rate
        // will keep the collateralization ratio the same or better.
        const accountId = randomAccountId();
        await depositAndWithdrawAsync(accountId, 1, 0);
        const order = createOrder({
            makerAssetData: encodeDydxBridgeAssetData({
                accountId,
                depositRate: minMarginRatio,
            }),
        });
        const [, fillableTakerAssetAmount] = await devUtils.getOrderRelevantState(order, SIGNATURE).callAsync();
        expect(fillableTakerAssetAmount).to.bignumber.eq(order.takerAssetAmount);
    });

    it('validates a partially solvent order with an inadequate deposit', async () => {
        // This account is not very well collateralized and the deposit rate is
        // also too low to sustain the collateralization ratio for the full order.
        const accountId = randomAccountId();
        await depositAndWithdrawAsync(accountId, 1, 0);
        const order = createOrder({
            makerAssetData: encodeDydxBridgeAssetData({
                accountId,
                depositRate: minMarginRatio * 0.95,
            }),
        });
        const [, fillableTakerAssetAmount] = await devUtils.getOrderRelevantState(order, SIGNATURE).callAsync();
        expect(fillableTakerAssetAmount).to.bignumber.gt(0);
        expect(fillableTakerAssetAmount).to.bignumber.lt(order.takerAssetAmount);
    });

    it('validates a partially solvent order with no deposit', async () => {
        // This account is not very well collateralized and there is no deposit
        // to keep the collateralization ratio up.
        const accountId = randomAccountId();
        await depositAndWithdrawAsync(accountId, 1, 0);
        const order = createOrder({
            makerAssetData: encodeDydxBridgeAssetData({
                accountId,
                depositRate: 0,
            }),
        });
        const [, fillableTakerAssetAmount] = await devUtils.getOrderRelevantState(order, SIGNATURE).callAsync();
        expect(fillableTakerAssetAmount).to.bignumber.gt(0);
        expect(fillableTakerAssetAmount).to.bignumber.lt(order.takerAssetAmount);
    });

    // TODO(dorothy-zbornak): We can't actually create an account that's below
    // the margin ratio without replacing the price oracles.
    it('invalidates a virtually insolvent order', async () => {
        // This account has a collateralization ratio JUST above the
        // minimum margin ratio, so it can only withdraw nearly zero maker tokens.
        const accountId = randomAccountId();
        await depositAndWithdrawAsync(accountId, 1, 1 / (minMarginRatio + 3e-4));
        const order = createOrder({
            makerAssetData: encodeDydxBridgeAssetData({
                accountId,
                depositRate: 0,
            }),
        });
        const [, fillableTakerAssetAmount] = await devUtils.getOrderRelevantState(order, SIGNATURE).callAsync();
        // Price fluctuations will cause this to be a little above zero, so we
        // don't compare to zero.
        expect(fillableTakerAssetAmount).to.bignumber.lt(fromTokenUnitAmount(1e-7, DAI_DECIMALS));
    });
});
