import { artifacts as ERC20Artifacts, ERC20TokenContract } from '@0x/contracts-erc20';
import { blockchainTests, constants, expect, getRandomInteger, randomAddress } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';

import { artifacts } from './artifacts';
import { TestDydxContract, TestLibDydxBalanceContract } from './wrappers';

blockchainTests('LibDydxBalance', env => {
    interface TestDydxConfig {
        marginRatio: BigNumber;
        accounts: Array<{
            owner: string;
            accountId: BigNumber;
            operators: string[];
            balances: Array<{
                supply: BigNumber;
                borrow: BigNumber;
            }>;
        }>;
        markets: Array<{
            token: string;
            price: BigNumber;
        }>;
    }

    const BRIDGE_ADDRESS = randomAddress();
    const MAKER_DECIMALS = 6;
    const TAKER_DECIMALS = 18;
    const VALID_OPERATOR = randomAddress();
    const VALID_OWNERS = [randomAddress(), randomAddress()];
    const DYDX_CONFIG: TestDydxConfig = {
        marginRatio: new BigNumber(1.5).times(constants.ONE_ETHER),
        accounts: [
            {
                owner: VALID_OWNERS[0],
                accountId: getRandomInteger(0, 2 ** 64),
                operators: [VALID_OPERATOR],
                balances: [
                    { supply: toTokenBaseAmount(2.5, TAKER_DECIMALS), borrow: toTokenBaseAmount(1, TAKER_DECIMALS) },
                    { supply: toTokenBaseAmount(4, MAKER_DECIMALS), borrow: toTokenBaseAmount(2, MAKER_DECIMALS) },
                ],
            },
            {
                owner: VALID_OWNERS[1],
                accountId: getRandomInteger(0, 2 ** 64),
                operators: [VALID_OPERATOR],
                balances: [
                    { supply: toTokenBaseAmount(1, TAKER_DECIMALS), borrow: toTokenBaseAmount(1, TAKER_DECIMALS) },
                    { supply: toTokenBaseAmount(1.5, MAKER_DECIMALS), borrow: toTokenBaseAmount(0.5, MAKER_DECIMALS) },
                ],
            },
        ],
        markets: [
            {
                token: constants.NULL_ADDRESS, // TBD
                price: new BigNumber(100),
            },
            {
                token: constants.NULL_ADDRESS, // TBD
                price: new BigNumber(50),
            },
        ],
    };

    let tokens: ERC20TokenContract[];
    let dydx: TestDydxContract;
    let testContract: TestLibDydxBalanceContract;

    before(async () => {
        tokens = await Promise.all([...Array(2)].map(async () =>
            ERC20TokenContract.deployFrom0xArtifactAsync(
                ERC20Artifacts.ERC20Token,
                env.provider,
                env.txDefaults,
                {},
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
            makerAddress: VALID_OWNERS[0],
            makerTokenAddress: DYDX_CONFIG.markets[0].token,
            takerTokenAddress: DYDX_CONFIG.markets[1].token,
            makerAssetAmount: toTokenBaseAmount(100, MAKER_DECIMALS),
            takerAssetAmount: toTokenBaseAmount(5, TAKER_DECIMALS),
            accounts: [DYDX_CONFIG.accounts[0].accountId],
            actions: [
                {
                    actionType: BridgeActionType.Deposit,
                    accountId: new BigNumber(0),
                    marketId: new BigNumber(0),
                    conversionRateNumerator: new BigNumber(0),
                    conversionRateDenominator: new BigNumber(0),
                },
                {
                    actionType: BridgeActionType.Deposit,
                    accountId: new BigNumber(0),
                    marketId: new BigNumber(1),
                    conversionRateNumerator: new BigNumber(1),
                    conversionRateDenominator: new BigNumber(1),
                },
            ],
            ...fields,
        };
    }

    function toTokenBaseAmount(units: BigNumber | number, decimals: number = 18): BigNumber {
        return new BigNumber(units).times(new BigNumber(10).pow(decimals));
    }

    describe('_getSolventMakerAmount()', () => {
        it('computes correct amount for a solvent maker', async () => {
            const checkInfo = createBalanceCheckInfo();
            const r = await testContract.getSolventMakerAmount(checkInfo).callAsync();
            console.log(r.div(MAKER_DECIMALS));
        });
    });
});
