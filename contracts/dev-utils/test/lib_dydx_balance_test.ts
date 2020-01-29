import { DydxBridgeAction, DydxBridgeActionType } from '@0x/contracts-asset-proxy';
import { blockchainTests, constants, expect, getRandomFloat, getRandomInteger, Numberish, randomAddress } from '@0x/contracts-test-utils';
import { BigNumber, fromTokenUnitAmount, toTokenUnitAmount } from '@0x/utils';

import { artifacts as devUtilsArtifacts } from './artifacts';
import { TestDydxContract, TestLibDydxBalanceContract } from './wrappers';

blockchainTests('LibDydxBalance', env => {
    interface TestDydxConfig {
        marginRatio: BigNumber;
        operators: Array<{
            owner: string;
            operator: string;
        }>;
        accounts: Array<{
            owner: string;
            accountId: BigNumber;
            balances: BigNumber[];
        }>;
        markets: Array<{
            token: string;
            decimals: number;
            price: BigNumber;
        }>;
    }

    const MARGIN_RATIO = 1.5;
    const PRICE_DECIMALS = 18;
    const MAKER_DECIMALS = 6;
    const TAKER_DECIMALS = 18;
    const INITIAL_TAKER_TOKEN_BALANCE = fromTokenUnitAmount(1000, TAKER_DECIMALS);
    const BRIDGE_ADDRESS = randomAddress();
    const ACCOUNT_OWNER = randomAddress();
    const MAKER_PRICE = 150;
    const TAKER_PRICE = 100;
    const SOLVENT_ACCOUNT_IDX = 0;
    // const MIN_SOLVENT_ACCOUNT_IDX = 1;
    const INSOLVENT_ACCOUNT_IDX = 2;
    const ZERO_BALANCE_ACCOUNT_IDX = 3;
    const DYDX_CONFIG: TestDydxConfig = {
        marginRatio: fromTokenUnitAmount(MARGIN_RATIO, PRICE_DECIMALS),
        operators: [
            { owner: ACCOUNT_OWNER, operator: BRIDGE_ADDRESS },
        ],
        accounts: [
            {
                owner: ACCOUNT_OWNER,
                accountId: getRandomInteger(1, 2 ** 64),
                // Account exceeds collateralization.
                balances: [
                    fromTokenUnitAmount(10, TAKER_DECIMALS),
                    fromTokenUnitAmount(-1, MAKER_DECIMALS),
                ],
            },
            {
                owner: ACCOUNT_OWNER,
                accountId: getRandomInteger(1, 2 ** 64),
                // Account is at minimum collateralization.
                balances: [
                    fromTokenUnitAmount(MAKER_PRICE / TAKER_PRICE * MARGIN_RATIO * 5, TAKER_DECIMALS),
                    fromTokenUnitAmount(-5, MAKER_DECIMALS),
                ],
            },
            {
                owner: ACCOUNT_OWNER,
                accountId: getRandomInteger(1, 2 ** 64),
                // Account is undercollateralized..
                balances: [
                    fromTokenUnitAmount(1, TAKER_DECIMALS),
                    fromTokenUnitAmount(-2, MAKER_DECIMALS),
                ],
            },
            {
                owner: ACCOUNT_OWNER,
                accountId: getRandomInteger(1, 2 ** 64),
                // Account has no balance.
                balances: [
                    fromTokenUnitAmount(0, TAKER_DECIMALS),
                    fromTokenUnitAmount(0, MAKER_DECIMALS),
                ],
            },
        ],
        markets: [
            {
                token: constants.NULL_ADDRESS, // TBD
                decimals: TAKER_DECIMALS,
                price: fromTokenUnitAmount(TAKER_PRICE, PRICE_DECIMALS),
            },
            {
                token: constants.NULL_ADDRESS, // TBD
                decimals: MAKER_DECIMALS,
                price: fromTokenUnitAmount(MAKER_PRICE, PRICE_DECIMALS),
            },
        ],
    };

    let dydx: TestDydxContract;
    let testContract: TestLibDydxBalanceContract;

    before(async () => {
        testContract = await TestLibDydxBalanceContract.deployFrom0xArtifactAsync(
            devUtilsArtifacts.TestLibDydxBalance,
            env.provider,
            env.txDefaults,
            {},
        );

        // Create tokens.
        const takerTokenAddress = await testContract.createToken(TAKER_DECIMALS).callAsync();
        await testContract.createToken(TAKER_DECIMALS).awaitTransactionSuccessAsync();
        const makerTokenAddress = await testContract.createToken(MAKER_DECIMALS).callAsync();
        await testContract.createToken(MAKER_DECIMALS).awaitTransactionSuccessAsync();

        DYDX_CONFIG.markets[0].token = takerTokenAddress;
        DYDX_CONFIG.markets[1].token = makerTokenAddress;

        dydx = await TestDydxContract.deployFrom0xArtifactAsync(
            devUtilsArtifacts.TestDydx,
            env.provider,
            env.txDefaults,
            {},
            DYDX_CONFIG,
        );

        // Mint taker tokens.
        await testContract.setTokenBalance(
            takerTokenAddress,
            ACCOUNT_OWNER,
            INITIAL_TAKER_TOKEN_BALANCE,
        ).awaitTransactionSuccessAsync();
        // Approve the Dydx contract to spend takerToken.
        await testContract.setTokenApproval(
            takerTokenAddress,
            ACCOUNT_OWNER,
            dydx.address,
            constants.MAX_UINT256,
        ).awaitTransactionSuccessAsync();
    });

    interface BalanceCheckInfo {
        dydx: string;
        bridgeAddress: string;
        makerAddress: string;
        makerTokenAddress: string;
        takerTokenAddress: string;
        makerAssetAmount: BigNumber;
        takerAssetAmount: BigNumber;
        accounts: BigNumber[];
        actions: DydxBridgeAction[];
    }

    function createBalanceCheckInfo(fields: Partial<BalanceCheckInfo> = {}): BalanceCheckInfo {
        return {
            dydx: dydx.address,
            bridgeAddress: BRIDGE_ADDRESS,
            makerAddress: ACCOUNT_OWNER,
            makerTokenAddress: DYDX_CONFIG.markets[1].token,
            takerTokenAddress: DYDX_CONFIG.markets[0].token,
            makerAssetAmount: fromTokenUnitAmount(10, MAKER_DECIMALS),
            takerAssetAmount: fromTokenUnitAmount(5, TAKER_DECIMALS),
            accounts: [DYDX_CONFIG.accounts[SOLVENT_ACCOUNT_IDX].accountId],
            actions: [],
            ...fields,
        };
    }

    function getFilledAccountCollateralizations(
        config: TestDydxConfig,
        checkInfo: BalanceCheckInfo,
        makerAssetFillAmount: BigNumber,
    ): BigNumber[] {
        const values: BigNumber[][] = checkInfo.accounts.map((accountId, accountIdx) => {
            const accountBalances = config.accounts[accountIdx].balances.slice();
            for (const action of checkInfo.actions) {
                const actionMarketId = action.marketId.toNumber();
                const actionAccountIdx = action.accountIdx.toNumber();
                if (checkInfo.accounts[actionAccountIdx] !== accountId) {
                    continue;
                }
                const rate = action.conversionRateDenominator.eq(0)
                    ? new BigNumber(1)
                    : action.conversionRateNumerator.div(action.conversionRateDenominator);
                const change = makerAssetFillAmount
                    .times(action.actionType === DydxBridgeActionType.Deposit ? rate : rate.negated());
                accountBalances[actionMarketId] = change.plus(accountBalances[actionMarketId]);
            }
            return accountBalances.map((b, marketId) =>
                toTokenUnitAmount(b, config.markets[marketId].decimals)
                    .times(toTokenUnitAmount(config.markets[marketId].price, PRICE_DECIMALS)),
            );
        });
        return values.map(accountValues => {
            return [
                // supply
                BigNumber.sum(...accountValues.filter(b => b.gte(0))),
                // borrow
                BigNumber.sum(...accountValues.filter(b => b.lt(0))).abs(),
            ];
        }).map(([supply, borrow]) => supply.div(borrow));
    }

    function getRandomRate(): BigNumber {
        return getRandomFloat(0, 1);
    }

    // Computes a deposit rate that is the minimum to keep an account solvent
    // perpetually.
    function getBalancedDepositRate(withdrawRate: BigNumber, scaling: Numberish = 1.000001): BigNumber {
        return withdrawRate.times(MAKER_PRICE / TAKER_PRICE * MARGIN_RATIO).times(scaling);
    }

    function takerToMakerAmount(takerAmount: BigNumber): BigNumber {
        return takerAmount.times(new BigNumber(10).pow(MAKER_DECIMALS - TAKER_DECIMALS));
    }

    describe('_getSolventMakerAmount()', () => {
        it('computes fillable amount for a solvent maker', async () => {
            // Deposit collateral at a rate low enough to steadily reduce the
            // withdraw account's collateralization ratio.
            const withdrawRate = getRandomRate();
            const depositRate = getBalancedDepositRate(withdrawRate, Math.random());
            const checkInfo = createBalanceCheckInfo({
                actions: [
                    {
                        actionType: DydxBridgeActionType.Deposit,
                        accountIdx: new BigNumber(0),
                        marketId: new BigNumber(0),
                        conversionRateNumerator: fromTokenUnitAmount(depositRate, TAKER_DECIMALS),
                        conversionRateDenominator: fromTokenUnitAmount(1, MAKER_DECIMALS),
                    },
                    {
                        actionType: DydxBridgeActionType.Withdraw,
                        accountIdx: new BigNumber(0),
                        marketId: new BigNumber(1),
                        conversionRateNumerator: fromTokenUnitAmount(withdrawRate),
                        conversionRateDenominator: fromTokenUnitAmount(1),
                    },
                ],
            });
            const makerAssetFillAmount = await testContract.getSolventMakerAmount(checkInfo).callAsync();
            expect(makerAssetFillAmount).to.not.bignumber.eq(constants.MAX_UINT256);
            // The collateralization ratio after filling `makerAssetFillAmount`
            // should be exactly at `MARGIN_RATIO`.
            const cr = getFilledAccountCollateralizations(
                DYDX_CONFIG,
                checkInfo,
                makerAssetFillAmount,
            );
            expect(cr[0].dp(2)).to.bignumber.eq(MARGIN_RATIO);
        });

        it('computes fillable amount for a solvent maker with zero-sized deposits', async () => {
            const withdrawRate = getRandomRate();
            const depositRate = new BigNumber(0);
            const checkInfo = createBalanceCheckInfo({
                actions: [
                    {
                        actionType: DydxBridgeActionType.Deposit,
                        accountIdx: new BigNumber(0),
                        marketId: new BigNumber(0),
                        conversionRateNumerator: fromTokenUnitAmount(depositRate, TAKER_DECIMALS),
                        conversionRateDenominator: fromTokenUnitAmount(1, MAKER_DECIMALS),
                    },
                    {
                        actionType: DydxBridgeActionType.Withdraw,
                        accountIdx: new BigNumber(0),
                        marketId: new BigNumber(1),
                        conversionRateNumerator: fromTokenUnitAmount(withdrawRate),
                        conversionRateDenominator: fromTokenUnitAmount(1),
                    },
                ],
            });
            const makerAssetFillAmount = await testContract.getSolventMakerAmount(checkInfo).callAsync();
            expect(makerAssetFillAmount).to.not.bignumber.eq(constants.MAX_UINT256);
            // The collateralization ratio after filling `makerAssetFillAmount`
            // should be exactly at `MARGIN_RATIO`.
            const cr = getFilledAccountCollateralizations(
                DYDX_CONFIG,
                checkInfo,
                makerAssetFillAmount,
            );
            expect(cr[0].dp(2)).to.bignumber.eq(MARGIN_RATIO);
        });

        it('computes fillable amount for a solvent maker with no deposits', async () => {
            const withdrawRate = getRandomRate();
            const checkInfo = createBalanceCheckInfo({
                actions: [
                    {
                        actionType: DydxBridgeActionType.Withdraw,
                        accountIdx: new BigNumber(0),
                        marketId: new BigNumber(1),
                        conversionRateNumerator: fromTokenUnitAmount(withdrawRate),
                        conversionRateDenominator: fromTokenUnitAmount(1),
                    },
                ],
            });
            const makerAssetFillAmount = await testContract.getSolventMakerAmount(checkInfo).callAsync();
            expect(makerAssetFillAmount).to.not.bignumber.eq(constants.MAX_UINT256);
            // The collateralization ratio after filling `makerAssetFillAmount`
            // should be exactly at `MARGIN_RATIO`.
            const cr = getFilledAccountCollateralizations(
                DYDX_CONFIG,
                checkInfo,
                makerAssetFillAmount,
            );
            expect(cr[0].dp(2)).to.bignumber.eq(MARGIN_RATIO);
        });

        it('computes fillable amount for a solvent maker with multiple deposits', async () => {
            // Deposit collateral at a rate low enough to steadily reduce the
            // withdraw account's collateralization ratio.
            const withdrawRate = getRandomRate();
            const depositRate = getBalancedDepositRate(withdrawRate, Math.random());
            const checkInfo = createBalanceCheckInfo({
                actions: [
                    {
                        actionType: DydxBridgeActionType.Deposit,
                        accountIdx: new BigNumber(0),
                        marketId: new BigNumber(0),
                        conversionRateNumerator: fromTokenUnitAmount(depositRate.times(0.75), TAKER_DECIMALS),
                        conversionRateDenominator: fromTokenUnitAmount(1, MAKER_DECIMALS),
                    },
                    {
                        actionType: DydxBridgeActionType.Deposit,
                        accountIdx: new BigNumber(0),
                        marketId: new BigNumber(0),
                        conversionRateNumerator: fromTokenUnitAmount(depositRate.times(0.25), TAKER_DECIMALS),
                        conversionRateDenominator: fromTokenUnitAmount(1, MAKER_DECIMALS),
                    },
                    {
                        actionType: DydxBridgeActionType.Withdraw,
                        accountIdx: new BigNumber(0),
                        marketId: new BigNumber(1),
                        conversionRateNumerator: fromTokenUnitAmount(withdrawRate),
                        conversionRateDenominator: fromTokenUnitAmount(1),
                    },
                ],
            });
            const makerAssetFillAmount = await testContract.getSolventMakerAmount(checkInfo).callAsync();
            expect(makerAssetFillAmount).to.not.bignumber.eq(constants.MAX_UINT256);
            // The collateralization ratio after filling `makerAssetFillAmount`
            // should be exactly at `MARGIN_RATIO`.
            const cr = getFilledAccountCollateralizations(
                DYDX_CONFIG,
                checkInfo,
                makerAssetFillAmount,
            );
            expect(cr[0].dp(2)).to.bignumber.eq(MARGIN_RATIO);
        });

        it('returns infinite amount for a perpetually solvent maker', async () => {
            // Deposit collateral at a rate that keeps the withdraw account's
            // collateralization ratio constant.
            const withdrawRate = getRandomRate();
            const depositRate = getBalancedDepositRate(withdrawRate);
            const checkInfo = createBalanceCheckInfo({
                // Deposit/Withdraw at a rate == marginRatio.
                actions: [
                    {
                        actionType: DydxBridgeActionType.Deposit,
                        accountIdx: new BigNumber(0),
                        marketId: new BigNumber(0),
                        conversionRateNumerator: fromTokenUnitAmount(depositRate, TAKER_DECIMALS),
                        conversionRateDenominator: fromTokenUnitAmount(1, MAKER_DECIMALS),
                    },
                    {
                        actionType: DydxBridgeActionType.Withdraw,
                        accountIdx: new BigNumber(0),
                        marketId: new BigNumber(1),
                        conversionRateNumerator: fromTokenUnitAmount(withdrawRate),
                        conversionRateDenominator: fromTokenUnitAmount(1),
                    },
                ],
            });
            const makerAssetFillAmount = await testContract.getSolventMakerAmount(checkInfo).callAsync();
            expect(makerAssetFillAmount).to.bignumber.eq(constants.MAX_UINT256);
        });

        it('returns infinite amount for a perpetually solvent maker with multiple deposits', async () => {
            // Deposit collateral at a rate that keeps the withdraw account's
            // collateralization ratio constant.
            const withdrawRate = getRandomRate();
            const depositRate = getBalancedDepositRate(withdrawRate);
            const checkInfo = createBalanceCheckInfo({
                // Deposit/Withdraw at a rate == marginRatio.
                actions: [
                    {
                        actionType: DydxBridgeActionType.Deposit,
                        accountIdx: new BigNumber(0),
                        marketId: new BigNumber(0),
                        conversionRateNumerator: fromTokenUnitAmount(depositRate.times(0.25), TAKER_DECIMALS),
                        conversionRateDenominator: fromTokenUnitAmount(1, MAKER_DECIMALS),
                    },
                    {
                        actionType: DydxBridgeActionType.Deposit,
                        accountIdx: new BigNumber(0),
                        marketId: new BigNumber(0),
                        conversionRateNumerator: fromTokenUnitAmount(depositRate.times(0.75), TAKER_DECIMALS),
                        conversionRateDenominator: fromTokenUnitAmount(1, MAKER_DECIMALS),
                    },
                    {
                        actionType: DydxBridgeActionType.Withdraw,
                        accountIdx: new BigNumber(0),
                        marketId: new BigNumber(1),
                        conversionRateNumerator: fromTokenUnitAmount(withdrawRate),
                        conversionRateDenominator: fromTokenUnitAmount(1),
                    },
                ],
            });
            const makerAssetFillAmount = await testContract.getSolventMakerAmount(checkInfo).callAsync();
            expect(makerAssetFillAmount).to.bignumber.eq(constants.MAX_UINT256);
        });

        it('does not count deposits to other accounts', async () => {
            // Deposit collateral at a rate that keeps the withdraw account's
            // collateralization ratio constant, BUT we split it in two deposits
            // and one will go into a different account.
            const withdrawRate = getRandomRate();
            const depositRate = getBalancedDepositRate(withdrawRate);
            const checkInfo = createBalanceCheckInfo({
                actions: [
                    {
                        actionType: DydxBridgeActionType.Deposit,
                        accountIdx: new BigNumber(0),
                        marketId: new BigNumber(0),
                        conversionRateNumerator: fromTokenUnitAmount(depositRate.times(0.5), TAKER_DECIMALS),
                        conversionRateDenominator: fromTokenUnitAmount(1, MAKER_DECIMALS),
                    },
                    {
                        actionType: DydxBridgeActionType.Deposit,
                        // Deposit enough to balance out withdraw, but
                        // into a different account.
                        accountIdx: new BigNumber(1),
                        marketId: new BigNumber(0),
                        conversionRateNumerator: fromTokenUnitAmount(depositRate.times(0.5), TAKER_DECIMALS),
                        conversionRateDenominator: fromTokenUnitAmount(1, MAKER_DECIMALS),
                    },
                    {
                        actionType: DydxBridgeActionType.Withdraw,
                        accountIdx: new BigNumber(0),
                        marketId: new BigNumber(1),
                        conversionRateNumerator: fromTokenUnitAmount(withdrawRate),
                        conversionRateDenominator: fromTokenUnitAmount(1),
                    },
                ],
            });
            const makerAssetFillAmount = await testContract.getSolventMakerAmount(checkInfo).callAsync();
            expect(makerAssetFillAmount).to.not.bignumber.eq(constants.MAX_UINT256);
        });

        it('returns zero on an account that is under-collateralized', async () => {
            // Even though the deposit rate is enough to meet the minimum collateralization ratio,
            // the account is under-collateralized from the start, so cannot be filled.
            const withdrawRate = getRandomRate();
            const depositRate = getBalancedDepositRate(withdrawRate);
            const checkInfo = createBalanceCheckInfo({
                accounts: [DYDX_CONFIG.accounts[INSOLVENT_ACCOUNT_IDX].accountId],
                actions: [
                    {
                        actionType: DydxBridgeActionType.Deposit,
                        accountIdx: new BigNumber(0),
                        marketId: new BigNumber(0),
                        conversionRateNumerator: fromTokenUnitAmount(depositRate, TAKER_DECIMALS),
                        conversionRateDenominator: fromTokenUnitAmount(1, MAKER_DECIMALS),
                    },
                    {
                        actionType: DydxBridgeActionType.Withdraw,
                        accountIdx: new BigNumber(0),
                        marketId: new BigNumber(1),
                        conversionRateNumerator: fromTokenUnitAmount(withdrawRate),
                        conversionRateDenominator: fromTokenUnitAmount(1),
                    },
                ],
            });
            const makerAssetFillAmount = await testContract.getSolventMakerAmount(checkInfo).callAsync();
            expect(makerAssetFillAmount).to.bignumber.eq(0);
        });

        it('returns zero on an account that has no balance if deposit ' +
           'to withdraw ratio is < the minimum collateralization rate', async () => {
            // If the deposit rate is not enough to meet the minimum collateralization ratio,
            // the fillable maker amount is zero because it will become insolvent as soon as
            // the withdraw occurs.
            const withdrawRate = getRandomRate();
            const depositRate = getBalancedDepositRate(withdrawRate, 0.99);
            const checkInfo = createBalanceCheckInfo({
                accounts: [DYDX_CONFIG.accounts[ZERO_BALANCE_ACCOUNT_IDX].accountId],
                actions: [
                    {
                        actionType: DydxBridgeActionType.Deposit,
                        accountIdx: new BigNumber(0),
                        marketId: new BigNumber(0),
                        conversionRateNumerator: fromTokenUnitAmount(depositRate, TAKER_DECIMALS),
                        conversionRateDenominator: fromTokenUnitAmount(1, MAKER_DECIMALS),
                    },
                    {
                        actionType: DydxBridgeActionType.Withdraw,
                        accountIdx: new BigNumber(0),
                        marketId: new BigNumber(1),
                        conversionRateNumerator: fromTokenUnitAmount(withdrawRate),
                        conversionRateDenominator: fromTokenUnitAmount(1),
                    },
                ],
            });
            const makerAssetFillAmount = await testContract.getSolventMakerAmount(checkInfo).callAsync();
            expect(makerAssetFillAmount).to.bignumber.eq(0);
        });

        it('returns infinite on an account that has no balance if deposit ' +
           'to withdraw ratio is >= the minimum collateralization rate', async () => {
            const withdrawRate = getRandomRate();
            const depositRate = getBalancedDepositRate(withdrawRate);
            const checkInfo = createBalanceCheckInfo({
                accounts: [DYDX_CONFIG.accounts[ZERO_BALANCE_ACCOUNT_IDX].accountId],
                actions: [
                    {
                        actionType: DydxBridgeActionType.Deposit,
                        accountIdx: new BigNumber(0),
                        marketId: new BigNumber(0),
                        conversionRateNumerator: fromTokenUnitAmount(depositRate, TAKER_DECIMALS),
                        conversionRateDenominator: fromTokenUnitAmount(1, MAKER_DECIMALS),
                    },
                    {
                        actionType: DydxBridgeActionType.Withdraw,
                        accountIdx: new BigNumber(0),
                        marketId: new BigNumber(1),
                        conversionRateNumerator: fromTokenUnitAmount(withdrawRate),
                        conversionRateDenominator: fromTokenUnitAmount(1),
                    },
                ],
            });
            const makerAssetFillAmount = await testContract.getSolventMakerAmount(checkInfo).callAsync();
            expect(makerAssetFillAmount).to.bignumber.eq(constants.MAX_UINT256);
        });
    });

    describe('_getDepositableMakerAmount()', () => {
        it('returns infinite if no deposit action', async () => {
            const checkInfo = createBalanceCheckInfo({
                takerAssetAmount: fromTokenUnitAmount(10, TAKER_DECIMALS),
                makerAssetAmount: fromTokenUnitAmount(100, MAKER_DECIMALS),
                actions: [],
            });
            const makerAssetFillAmount = await testContract.getDepositableMakerAmount(checkInfo).callAsync();
            expect(makerAssetFillAmount).to.bignumber.eq(constants.MAX_UINT256);
        });

        it('returns infinite if deposit rate is zero', async () => {
            const checkInfo = createBalanceCheckInfo({
                takerAssetAmount: fromTokenUnitAmount(10, TAKER_DECIMALS),
                makerAssetAmount: fromTokenUnitAmount(100, MAKER_DECIMALS),
                actions: [
                    {
                        actionType: DydxBridgeActionType.Deposit,
                        accountIdx: new BigNumber(0),
                        marketId: new BigNumber(0),
                        conversionRateNumerator: fromTokenUnitAmount(0, TAKER_DECIMALS),
                        conversionRateDenominator: fromTokenUnitAmount(1, MAKER_DECIMALS),
                    },
                ],
            });
            const makerAssetFillAmount = await testContract.getDepositableMakerAmount(checkInfo).callAsync();
            expect(makerAssetFillAmount).to.bignumber.eq(constants.MAX_UINT256);
        });

        it('returns infinite if taker tokens cover the deposit rate', async () => {
            const checkInfo = createBalanceCheckInfo({
                takerAssetAmount: fromTokenUnitAmount(10, TAKER_DECIMALS),
                makerAssetAmount: fromTokenUnitAmount(100, MAKER_DECIMALS),
                actions: [
                    {
                        actionType: DydxBridgeActionType.Deposit,
                        accountIdx: new BigNumber(0),
                        marketId: new BigNumber(0),
                        conversionRateNumerator: fromTokenUnitAmount(Math.random() * 0.1, TAKER_DECIMALS),
                        conversionRateDenominator: fromTokenUnitAmount(1, MAKER_DECIMALS),
                    },
                ],
            });
            const makerAssetFillAmount = await testContract.getDepositableMakerAmount(checkInfo).callAsync();
            expect(makerAssetFillAmount).to.bignumber.eq(constants.MAX_UINT256);
        });

        it('returns correct amount if taker tokens only partially cover deposit rate', async () => {
            // The taker tokens getting exchanged in will only partially cover the deposit.
            const exchangeRate = 0.1;
            const depositRate = Math.random() + exchangeRate;
            const checkInfo = createBalanceCheckInfo({
                takerAssetAmount: fromTokenUnitAmount(exchangeRate, TAKER_DECIMALS),
                makerAssetAmount: fromTokenUnitAmount(1, MAKER_DECIMALS),
                actions: [
                    {
                        actionType: DydxBridgeActionType.Deposit,
                        accountIdx: new BigNumber(0),
                        marketId: new BigNumber(0),
                        conversionRateNumerator: fromTokenUnitAmount(depositRate, TAKER_DECIMALS),
                        conversionRateDenominator: fromTokenUnitAmount(1, MAKER_DECIMALS),
                    },
                ],
            });
            const makerAssetFillAmount = await testContract.getDepositableMakerAmount(checkInfo).callAsync();
            expect(makerAssetFillAmount).to.not.bignumber.eq(constants.MAX_UINT256);
            // Compute the equivalent taker asset fill amount.
            const takerAssetFillAmount = fromTokenUnitAmount(
                toTokenUnitAmount(makerAssetFillAmount, MAKER_DECIMALS)
                    // Reduce the deposit rate by the exchange rate.
                    .times(depositRate - exchangeRate),
                TAKER_DECIMALS,
            );
            // Which should equal the entire taker token balance of the account owner.
            // We do some rounding to account for integer vs FP vs symbolic precision differences.
            expect(toTokenUnitAmount(takerAssetFillAmount, TAKER_DECIMALS).dp(5))
                .to.bignumber.eq(toTokenUnitAmount(INITIAL_TAKER_TOKEN_BALANCE, TAKER_DECIMALS).dp(5));
        });

        it('returns correct amount if the taker asset not an ERC20', async () => {
            const depositRate = 0.1;
            const checkInfo = createBalanceCheckInfo({
                // The `takerTokenAddress` will be zero if the asset is not an ERC20.
                takerTokenAddress: constants.NULL_ADDRESS,
                takerAssetAmount: new BigNumber(1),
                makerAssetAmount: fromTokenUnitAmount(100, MAKER_DECIMALS),
                actions: [
                    {
                        actionType: DydxBridgeActionType.Deposit,
                        accountIdx: new BigNumber(0),
                        marketId: new BigNumber(0),
                        conversionRateNumerator: fromTokenUnitAmount(depositRate, TAKER_DECIMALS),
                        conversionRateDenominator: fromTokenUnitAmount(1, MAKER_DECIMALS),
                    },
                ],
            });
            const makerAssetFillAmount = await testContract.getDepositableMakerAmount(checkInfo).callAsync();
            expect(makerAssetFillAmount).to.not.bignumber.eq(constants.MAX_UINT256);
            // Compute the equivalent taker asset fill amount.
            const takerAssetFillAmount = fromTokenUnitAmount(
                toTokenUnitAmount(makerAssetFillAmount, MAKER_DECIMALS)
                    // Reduce the deposit rate by the exchange rate.
                    .times(depositRate),
                TAKER_DECIMALS,
            );
            // Which should equal the entire taker token balance of the account owner.
            // We do some rounding to account for integer vs FP vs symbolic precision differences.
            expect(toTokenUnitAmount(takerAssetFillAmount, TAKER_DECIMALS).dp(6))
                .to.bignumber.eq(toTokenUnitAmount(INITIAL_TAKER_TOKEN_BALANCE, TAKER_DECIMALS).dp(6));
        });

        it('returns the correct amount if taker:maker deposit rate is 1:1 and' +
           'token != taker token', async () => {
            const checkInfo = createBalanceCheckInfo({
                takerTokenAddress: randomAddress(),
                // These amounts should be effectively ignored in the final computation
                // because the token being deposited is not the taker token.
                takerAssetAmount: fromTokenUnitAmount(10, TAKER_DECIMALS),
                makerAssetAmount: fromTokenUnitAmount(100, MAKER_DECIMALS),
                actions: [
                    {
                        actionType: DydxBridgeActionType.Deposit,
                        accountIdx: new BigNumber(0),
                        marketId: new BigNumber(0),
                        conversionRateNumerator: fromTokenUnitAmount(1, TAKER_DECIMALS),
                        conversionRateDenominator: fromTokenUnitAmount(1, MAKER_DECIMALS),
                    },
                ],
            });
            const makerAssetFillAmount = await testContract.getDepositableMakerAmount(checkInfo).callAsync();
            expect(makerAssetFillAmount).to.bignumber.eq(takerToMakerAmount(INITIAL_TAKER_TOKEN_BALANCE));
        });

        it('returns the smallest viable maker amount with multiple deposits', async () => {
            // The taker tokens getting exchanged in will only partially cover the deposit.
            const exchangeRate = 0.1;
            const checkInfo = createBalanceCheckInfo({
                takerAssetAmount: fromTokenUnitAmount(exchangeRate, TAKER_DECIMALS),
                makerAssetAmount: fromTokenUnitAmount(1, MAKER_DECIMALS),
                actions: [
                    // Technically, deposits of the same token are not allowed, but the
                    // check isn't done in this function so we'll do this to simulate
                    // two deposits to distinct tokens.
                    {
                        actionType: DydxBridgeActionType.Deposit,
                        accountIdx: new BigNumber(0),
                        marketId: new BigNumber(0),
                        conversionRateNumerator: fromTokenUnitAmount(Math.random() + exchangeRate, TAKER_DECIMALS),
                        conversionRateDenominator: fromTokenUnitAmount(1, MAKER_DECIMALS),
                    },
                    {
                        actionType: DydxBridgeActionType.Deposit,
                        accountIdx: new BigNumber(0),
                        marketId: new BigNumber(0),
                        conversionRateNumerator: fromTokenUnitAmount(Math.random() + exchangeRate, TAKER_DECIMALS),
                        conversionRateDenominator: fromTokenUnitAmount(1, MAKER_DECIMALS),
                    },
                ],
            });
            const makerAssetFillAmount = await testContract.getDepositableMakerAmount(checkInfo).callAsync();
            expect(makerAssetFillAmount).to.not.bignumber.eq(constants.MAX_UINT256);
            // Extract the deposit rates.
            const depositRates = checkInfo.actions.map(a =>
                toTokenUnitAmount(a.conversionRateNumerator, TAKER_DECIMALS)
                    .div(toTokenUnitAmount(a.conversionRateDenominator, MAKER_DECIMALS)),
            );
            // The largest deposit rate will result in the smallest maker asset fill amount.
            const maxDepositRate = BigNumber.max(...depositRates);
            // Compute the equivalent taker asset fill amounts.
            const takerAssetFillAmount = fromTokenUnitAmount(
                toTokenUnitAmount(makerAssetFillAmount, MAKER_DECIMALS)
                    // Reduce the deposit rate by the exchange rate.
                    .times(maxDepositRate.minus(exchangeRate)),
                TAKER_DECIMALS,
            );
            // Which should equal the entire taker token balance of the account owner.
            // We do some rounding to account for integer vs FP vs symbolic precision differences.
            expect(toTokenUnitAmount(takerAssetFillAmount, TAKER_DECIMALS).dp(5))
                .to.bignumber.eq(toTokenUnitAmount(INITIAL_TAKER_TOKEN_BALANCE, TAKER_DECIMALS).dp(5));
        });
    });
});
// tslint:disable-next-line: max-file-line-count
