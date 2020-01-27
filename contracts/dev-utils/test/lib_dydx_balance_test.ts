import { artifacts as ERC20Artifacts, DummyERC20TokenContract } from '@0x/contracts-erc20';
import { blockchainTests, constants, expect, getRandomInteger, randomAddress } from '@0x/contracts-test-utils';
import { BigNumber, fromTokenUnitAmount, toTokenUnitAmount } from '@0x/utils';

import { artifacts } from './artifacts';
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

    const PRICE_DECIMALS = 18;
    const MAKER_DECIMALS = 6;
    const TAKER_DECIMALS = 18;
    const BRIDGE_ADDRESS = randomAddress();
    const ACCOUNT_OWNER = randomAddress();
    const DYDX_CONFIG: TestDydxConfig = {
        marginRatio: fromTokenUnitAmount(1.5, PRICE_DECIMALS),
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
                    fromTokenUnitAmount(5, TAKER_DECIMALS),
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
        ],
        markets: [
            {
                token: constants.NULL_ADDRESS, // TBD
                decimals: TAKER_DECIMALS,
                price: fromTokenUnitAmount(150, PRICE_DECIMALS), // $150
            },
            {
                token: constants.NULL_ADDRESS, // TBD
                decimals: MAKER_DECIMALS,
                price: fromTokenUnitAmount(100, PRICE_DECIMALS), // $100
            },
        ],
    };

    let makerToken: DummyERC20TokenContract;
    let takerToken: DummyERC20TokenContract;
    let dydx: TestDydxContract;
    let testContract: TestLibDydxBalanceContract;

    before(async () => {
        const tokenDecimals = [TAKER_DECIMALS, MAKER_DECIMALS];
        const tokens = [takerToken, makerToken] = await Promise.all([...Array(2)].map(async (v, i) =>
            DummyERC20TokenContract.deployFrom0xArtifactAsync(
                ERC20Artifacts.DummyERC20Token,
                env.provider,
                env.txDefaults,
                {},
                `Token-${i}`,
                `TOK${i}`,
                new BigNumber(tokenDecimals[i]),
                fromTokenUnitAmount(1e9, tokenDecimals[i]),
            ),
        ));
        DYDX_CONFIG.markets = DYDX_CONFIG.markets.map((m, i) => ({ ...m, token: tokens[i].address }));
        dydx = await TestDydxContract.deployFrom0xArtifactAsync(
            artifacts.TestDydx,
            env.provider,
            env.txDefaults,
            {},
            DYDX_CONFIG,
        );
        testContract = await TestLibDydxBalanceContract.deployFrom0xArtifactAsync(
            artifacts.TestLibDydxBalance,
            env.provider,
            env.txDefaults,
            {},
        );
    });

    enum BridgeActionType {
        Deposit = 0,
        Withdraw = 1,
    }

    interface BridgeAction {
        actionType: BridgeActionType;
        accountId: BigNumber;
        marketId: BigNumber;
        conversionRateNumerator: BigNumber;
        conversionRateDenominator: BigNumber;
    }

    interface BalanceCheckInfo {
        dydx: string;
        bridgeAddress: string;
        makerAddress: string;
        makerTokenAddress: string;
        takerTokenAddress: string;
        makerAssetAmount: BigNumber;
        takerAssetAmount: BigNumber;
        accounts: BigNumber[];
        actions: BridgeAction[];
    }

    function createBalanceCheckInfo(fields: Partial<BalanceCheckInfo> = {}): BalanceCheckInfo {
        return {
            dydx: dydx.address,
            bridgeAddress: BRIDGE_ADDRESS,
            makerAddress: ACCOUNT_OWNER,
            makerTokenAddress: DYDX_CONFIG.markets[1].token,
            takerTokenAddress: DYDX_CONFIG.markets[0].token,
            makerAssetAmount: fromTokenUnitAmount(1000, MAKER_DECIMALS),
            takerAssetAmount: fromTokenUnitAmount(5, TAKER_DECIMALS),
            accounts: DYDX_CONFIG.accounts.map(a => a.accountId).slice(0, 1),
            actions: [
                {
                    actionType: BridgeActionType.Deposit,
                    accountId: new BigNumber(0),
                    marketId: new BigNumber(0),
                    conversionRateNumerator: fromTokenUnitAmount(5, MAKER_DECIMALS - TAKER_DECIMALS),
                    conversionRateDenominator: new BigNumber(10),
                },
                {
                    actionType: BridgeActionType.Withdraw,
                    accountId: new BigNumber(0),
                    marketId: new BigNumber(1),
                    conversionRateNumerator: new BigNumber(0),
                    conversionRateDenominator: new BigNumber(0),
                },
            ],
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
                const actionAccountIdx = action.accountId.toNumber();
                if (checkInfo.accounts[actionAccountIdx] !== accountId) {
                    continue;
                }
                const rate = action.conversionRateDenominator.eq(0)
                    ? new BigNumber(1)
                    : action.conversionRateNumerator.div(action.conversionRateDenominator);
                const change = makerAssetFillAmount
                    .times(action.actionType === BridgeActionType.Deposit ? rate : rate.negated());
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

    describe('_getSolventMakerAmount()', () => {
        it('computes correct amount for a solvent maker', async () => {
            const checkInfo = createBalanceCheckInfo();
            const makerAssetFillAmount = await testContract.getSolventMakerAmount(checkInfo).callAsync();
            const cr = getFilledAccountCollateralizations(
                DYDX_CONFIG,
                checkInfo,
                makerAssetFillAmount,
            );
            expect(cr[0]).to.bignumber.eq(1.5);
        });
    });
});
