import { artifacts as assetProxyArtifacts } from '@0x/contracts-asset-proxy';
import { CurveBridgeContract } from '@0x/contracts-asset-proxy/lib/src/wrappers';
import { ERC20TokenContract } from '@0x/contracts-erc20';
import { blockchainTests, constants, describe, toBaseUnitAmount } from '@0x/contracts-test-utils';
import { AbiEncoder } from '@0x/utils';

const USDC_WALLET = '0xF977814e90dA44bFA03b6295A0616a897441aceC';
const DAI_WALLET = '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b';
const WBTC_WALLET = '0x56178a0d5F301bAf6CF3e1Cd53d9863437345Bf9';
blockchainTests.configure({
    fork: {
        unlockedAccounts: [USDC_WALLET, DAI_WALLET, WBTC_WALLET],
    },
});

blockchainTests.fork.resets('Mainnet curve bridge tests', env => {
    let testContract: CurveBridgeContract;
    const RECEIVER = '0x986ccf5234d9cfbb25246f1a5bfa51f4ccfcb308';
    const bridgeDataEncoder = AbiEncoder.create([
        { name: 'curveAddress', type: 'address' },
        { name: 'exchangeFunctionSelector', type: 'bytes4' },
        { name: 'fromTokenAddress', type: 'address' },
        { name: 'fromTokenIdx', type: 'int128' },
        { name: 'toTokenIdx', type: 'int128' },
    ]);
    before(async () => {
        testContract = await CurveBridgeContract.deployFrom0xArtifactAsync(
            assetProxyArtifacts.CurveBridge,
            env.provider,
            { ...env.txDefaults },
            {},
        );
    });

    describe('bridgeTransferFrom()', () => {
        describe('exchange_underlying()', () => {
            const USDC_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
            const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
            const DAI_TOKEN_IDX = 0;
            const USDC_TOKEN_IDX = 1;
            const EXCHANGE_UNDERLYING_SELECTOR = '0xa6417ed6';
            const CURVE_ADDRESS = '0x45f783cce6b7ff23b2ab2d70e416cdb7d6055f51';
            it('succeeds exchanges DAI for USDC', async () => {
                const bridgeData = bridgeDataEncoder.encode([
                    CURVE_ADDRESS,
                    EXCHANGE_UNDERLYING_SELECTOR,
                    DAI_ADDRESS,
                    DAI_TOKEN_IDX,
                    USDC_TOKEN_IDX,
                ]);
                // Fund the Bridge
                const dai = new ERC20TokenContract(DAI_ADDRESS, env.provider, { ...env.txDefaults, from: DAI_WALLET });
                await dai
                    .transfer(testContract.address, toBaseUnitAmount(1))
                    .awaitTransactionSuccessAsync({}, { shouldValidate: false });
                // Exchange via Curve
                await testContract
                    .bridgeTransferFrom(
                        USDC_ADDRESS,
                        constants.NULL_ADDRESS,
                        RECEIVER,
                        constants.ZERO_AMOUNT,
                        bridgeData,
                    )
                    .awaitTransactionSuccessAsync({}, { shouldValidate: false });
            });
            it('succeeds exchanges USDC for DAI', async () => {
                const bridgeData = bridgeDataEncoder.encode([
                    CURVE_ADDRESS,
                    EXCHANGE_UNDERLYING_SELECTOR,
                    USDC_ADDRESS,
                    USDC_TOKEN_IDX,
                    DAI_TOKEN_IDX,
                ]);
                // Fund the Bridge
                const usdc = new ERC20TokenContract(USDC_ADDRESS, env.provider, {
                    ...env.txDefaults,
                    from: USDC_WALLET,
                });
                await usdc
                    .transfer(testContract.address, toBaseUnitAmount(1, 6))
                    .awaitTransactionSuccessAsync({}, { shouldValidate: false });
                // Exchange via Curve
                await testContract
                    .bridgeTransferFrom(
                        DAI_ADDRESS,
                        constants.NULL_ADDRESS,
                        RECEIVER,
                        constants.ZERO_AMOUNT,
                        bridgeData,
                    )
                    .awaitTransactionSuccessAsync({}, { shouldValidate: false });
            });
        });

        describe('exchange()', () => {
            const WBTC_ADDRESS = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599';
            const RENBTC_ADDRESS = '0xeb4c2781e4eba804ce9a9803c67d0893436bb27d';
            const RENBTC_TOKEN_IDX = 0;
            const WBTC_TOKEN_IDX = 1;
            const EXCHANGE_SELECTOR = '0x3df02124';
            const CURVE_ADDRESS = '0x7fc77b5c7614e1533320ea6ddc2eb61fa00a9714';
            it('succeeds exchanges WBTC for renBTC', async () => {
                const bridgeData = bridgeDataEncoder.encode([
                    CURVE_ADDRESS,
                    EXCHANGE_SELECTOR,
                    WBTC_ADDRESS,
                    WBTC_TOKEN_IDX,
                    RENBTC_TOKEN_IDX,
                ]);
                // Fund the Bridge
                const wbtc = new ERC20TokenContract(WBTC_ADDRESS, env.provider, {
                    ...env.txDefaults,
                    from: WBTC_WALLET,
                });
                await wbtc
                    .transfer(testContract.address, toBaseUnitAmount(1, 8))
                    .awaitTransactionSuccessAsync({}, { shouldValidate: false });
                // Exchange via Curve
                await testContract
                    .bridgeTransferFrom(
                        RENBTC_ADDRESS,
                        constants.NULL_ADDRESS,
                        RECEIVER,
                        constants.ZERO_AMOUNT,
                        bridgeData,
                    )
                    .awaitTransactionSuccessAsync({ gas: 6e6 }, { shouldValidate: false });
            });
        });
    });
});
