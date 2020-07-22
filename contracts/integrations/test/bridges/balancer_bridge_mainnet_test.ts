import { artifacts as assetProxyArtifacts } from '@0x/contracts-asset-proxy';
import { BalancerBridgeContract } from '@0x/contracts-asset-proxy/lib/src/wrappers';
import { ERC20TokenContract } from '@0x/contracts-erc20';
import { blockchainTests, constants, expect, toBaseUnitAmount } from '@0x/contracts-test-utils';
import { AbiEncoder } from '@0x/utils';

const CHONKY_DAI_WALLET = '0x1e0447b19bb6ecfdae1e4ae1694b0c3659614e4e'; // dydx solo margin
const CHONKY_WETH_WALLET = '0x2f0b23f53734252bda2277357e97e1517d6b042a'; // MCD wETH vault
const CHONKY_USDC_WALLET = '0x39aa39c021dfbae8fac545936693ac917d5e7563'; // Compound
blockchainTests.configure({
    fork: {
        unlockedAccounts: [CHONKY_USDC_WALLET, CHONKY_WETH_WALLET, CHONKY_DAI_WALLET],
    },
});

blockchainTests.fork('Mainnet Balancer bridge tests', env => {
    let testContract: BalancerBridgeContract;
    let weth: ERC20TokenContract;
    let usdc: ERC20TokenContract;
    const receiver = '0x986ccf5234d9cfbb25246f1a5bfa51f4ccfcb308';
    const usdcAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    const wethAddress = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
    const wethUsdcBalancerAddress = '0x2471de1547296aadb02cc1af84afe369b6f67c87';
    const wethUsdcDaiBalancerAddress = '0x9b208194acc0a8ccb2a8dcafeacfbb7dcc093f81';
    const bridgeDataEncoder = AbiEncoder.create([
        { name: 'takerToken', type: 'address' },
        { name: 'poolAddress', type: 'address' },
    ]);

    before(async () => {
        testContract = await BalancerBridgeContract.deployFrom0xArtifactAsync(
            assetProxyArtifacts.BalancerBridge,
            env.provider,
            { ...env.txDefaults, from: CHONKY_DAI_WALLET, gasPrice: 0 },
            {},
        );
        weth = new ERC20TokenContract(wethAddress, env.provider, env.txDefaults);
        usdc = new ERC20TokenContract(usdcAddress, env.provider, env.txDefaults);
    });

    blockchainTests.resets('Can trade with two-asset pool', () => {
        it('successfully exchanges WETH for USDC', async () => {
            const bridgeData = bridgeDataEncoder.encode([wethAddress, wethUsdcBalancerAddress]);
            // Fund the Bridge
            await weth
                .transfer(testContract.address, toBaseUnitAmount(1))
                .awaitTransactionSuccessAsync({ from: CHONKY_WETH_WALLET, gasPrice: 0 }, { shouldValidate: false });
            const usdcBalanceBefore = await usdc.balanceOf(receiver).callAsync();
            // Exchange via Balancer
            await testContract
                .bridgeTransferFrom(usdcAddress, constants.NULL_ADDRESS, receiver, constants.ZERO_AMOUNT, bridgeData)
                .awaitTransactionSuccessAsync({ from: CHONKY_WETH_WALLET, gasPrice: 0 }, { shouldValidate: false });
            // Check that USDC balance increased
            const usdcBalanceAfter = await usdc.balanceOf(receiver).callAsync();
            expect(usdcBalanceAfter).to.be.bignumber.greaterThan(usdcBalanceBefore);
        });
        it('successfully exchanges USDC for WETH', async () => {
            const bridgeData = bridgeDataEncoder.encode([usdcAddress, wethUsdcBalancerAddress]);
            // Fund the Bridge
            await usdc
                .transfer(testContract.address, toBaseUnitAmount(1, 6))
                .awaitTransactionSuccessAsync({ from: CHONKY_USDC_WALLET, gasPrice: 0 }, { shouldValidate: false });
            const wethBalanceBefore = await weth.balanceOf(receiver).callAsync();
            // Exchange via Balancer
            await testContract
                .bridgeTransferFrom(wethAddress, constants.NULL_ADDRESS, receiver, constants.ZERO_AMOUNT, bridgeData)
                .awaitTransactionSuccessAsync({ from: CHONKY_USDC_WALLET, gasPrice: 0 }, { shouldValidate: false });
            const wethBalanceAfter = await weth.balanceOf(receiver).callAsync();
            expect(wethBalanceAfter).to.be.bignumber.greaterThan(wethBalanceBefore);
        });
    });
    blockchainTests.resets('Can trade with three-asset pool', () => {
        it('successfully exchanges WETH for USDC', async () => {
            const bridgeData = bridgeDataEncoder.encode([wethAddress, wethUsdcDaiBalancerAddress]);
            // Fund the Bridge
            await weth
                .transfer(testContract.address, toBaseUnitAmount(1))
                .awaitTransactionSuccessAsync({ from: CHONKY_WETH_WALLET, gasPrice: 0 }, { shouldValidate: false });
            const usdcBalanceBefore = await usdc.balanceOf(receiver).callAsync();
            // Exchange via Balancer
            await testContract
                .bridgeTransferFrom(usdcAddress, constants.NULL_ADDRESS, receiver, constants.ZERO_AMOUNT, bridgeData)
                .awaitTransactionSuccessAsync({ from: CHONKY_WETH_WALLET, gasPrice: 0 }, { shouldValidate: false });
            // Check that USDC balance increased
            const usdcBalanceAfter = await usdc.balanceOf(receiver).callAsync();
            expect(usdcBalanceAfter).to.be.bignumber.greaterThan(usdcBalanceBefore);
        });
        it('successfully exchanges USDC for WETH', async () => {
            const bridgeData = bridgeDataEncoder.encode([usdcAddress, wethUsdcDaiBalancerAddress]);
            // Fund the Bridge
            await usdc
                .transfer(testContract.address, toBaseUnitAmount(1, 6))
                .awaitTransactionSuccessAsync({ from: CHONKY_USDC_WALLET, gasPrice: 0 }, { shouldValidate: false });
            const wethBalanceBefore = await weth.balanceOf(receiver).callAsync();
            // Exchange via Balancer
            await testContract
                .bridgeTransferFrom(wethAddress, constants.NULL_ADDRESS, receiver, constants.ZERO_AMOUNT, bridgeData)
                .awaitTransactionSuccessAsync({ from: CHONKY_USDC_WALLET, gasPrice: 0 }, { shouldValidate: false });
            const wethBalanceAfter = await weth.balanceOf(receiver).callAsync();
            expect(wethBalanceAfter).to.be.bignumber.greaterThan(wethBalanceBefore);
        });
    });
});
