import { ERC20TokenContract } from '@0x/contracts-erc20';
import { blockchainTests, constants } from '@0x/contracts-test-utils';

import { IAllowanceTargetContract, SimpleFunctionRegistryContract, ZeroExContract } from '../../src/wrappers';
import { artifacts } from '../artifacts';
import { abis } from '../utils/abis';
import {
    AsmUniswapContract,
    DirectUniswapContract,
    AsmUniswapWrapperContract,
    IUniswapV2RouterContract,
} from '../wrappers';

const EP_GOVERNOR = '0x618f9c67ce7bf1a50afa1e7e0238422601b0ff6e';
const CHONKY_DAI_WALLET = '0xa5407eae9ba41422680e2e00537571bcc53efbfd';
blockchainTests.configure({
    fork: {
        unlockedAccounts: [EP_GOVERNOR, CHONKY_DAI_WALLET],
    },
});

blockchainTests.fork.only('UniswapV2 Benchmark', env => {
    const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
    const dai = new ERC20TokenContract(DAI_ADDRESS, env.provider, env.txDefaults);
    const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
    const ALLOWANCE_TARGET = '0xf740b67da229f2f10bcbd38a7979992fcc71b8eb';
    const UNISWAPV2_ROUTER02 = '0x7a250d5630b4cf539739df2c5dacb4c659f2488d';

    let zeroEx: ZeroExContract;
    let directUniswap: DirectUniswapContract;
    let directUniswapImpl: DirectUniswapContract;
    let asmUniswap: AsmUniswapWrapperContract;
    let asmUniswapImpl: AsmUniswapWrapperContract;
    let uniswapV2Router02: IUniswapV2RouterContract;

    before(async () => {
        zeroEx = new ZeroExContract('0xdef1c0ded9bec7f1a1670819833240f027b25eff', env.provider, env.txDefaults, abis);
        const registry = new SimpleFunctionRegistryContract(zeroEx.address, env.provider, env.txDefaults, abis);
        directUniswap = new DirectUniswapContract(zeroEx.address, env.provider, env.txDefaults, abis);
        directUniswapImpl = await DirectUniswapContract.deployFrom0xArtifactAsync(
            artifacts.DirectUniswap,
            env.provider,
            env.txDefaults,
            artifacts,
        );
        asmUniswap = new AsmUniswapWrapperContract(zeroEx.address, env.provider, env.txDefaults, abis);
        asmUniswapImpl = new AsmUniswapWrapperContract(
            (await AsmUniswapContract.deployFrom0xArtifactAsync(
                artifacts.AsmUniswap,
                env.provider,
                env.txDefaults,
                artifacts,
            )).address,
            env.provider,
            env.txDefaults,
        );
        await registry
            .extend(directUniswap.getSelector('uniswap'), directUniswapImpl.address)
            .awaitTransactionSuccessAsync({ from: EP_GOVERNOR, gasPrice: 0 }, { shouldValidate: false });
        await registry
            .extend(asmUniswap.getSelector('uniswapWethDai'), asmUniswapImpl.address)
            .awaitTransactionSuccessAsync({ from: EP_GOVERNOR, gasPrice: 0 }, { shouldValidate: false });
        await dai
            .approve(ALLOWANCE_TARGET, constants.MAX_UINT256)
            .awaitTransactionSuccessAsync({ from: CHONKY_DAI_WALLET, gasPrice: 0 }, { shouldValidate: false });
        await dai
            .approve(UNISWAPV2_ROUTER02, constants.MAX_UINT256)
            .awaitTransactionSuccessAsync({ from: CHONKY_DAI_WALLET, gasPrice: 0 }, { shouldValidate: false });
        uniswapV2Router02 = new IUniswapV2RouterContract(UNISWAPV2_ROUTER02, env.provider, env.txDefaults);
        const allowanceTarget = new IAllowanceTargetContract(ALLOWANCE_TARGET, env.provider, env.txDefaults);
        await allowanceTarget
            .addAuthorizedAddress(directUniswapImpl.address)
            .awaitTransactionSuccessAsync({ from: EP_GOVERNOR, gasPrice: 0 }, { shouldValidate: false });
        await allowanceTarget
            .addAuthorizedAddress(asmUniswapImpl.address)
            .awaitTransactionSuccessAsync({ from: EP_GOVERNOR, gasPrice: 0 }, { shouldValidate: false });
    });

    blockchainTests('benchmark', () => {
        it('DirectUniswap', async () => {
            const gas = [];
            for (let i = 0; i <= 10; i++) {
                const tx = await directUniswap
                    .uniswap(CHONKY_DAI_WALLET, DAI_ADDRESS, WETH_ADDRESS, constants.ONE_ETHER)
                    .awaitTransactionSuccessAsync({ from: CHONKY_DAI_WALLET, gasPrice: 0 }, { shouldValidate: false });
                gas.push(tx.gasUsed);
            }
            console.log(`DirectUniswap feature: ${gas}`);
        });
        it('DirectUniswap bypass ExchangeProxy', async () => {
            const gas = [];
            for (let i = 0; i <= 10; i++) {
                const tx = await directUniswapImpl
                    .uniswap(CHONKY_DAI_WALLET, DAI_ADDRESS, WETH_ADDRESS, constants.ONE_ETHER)
                    .awaitTransactionSuccessAsync({ from: CHONKY_DAI_WALLET, gasPrice: 0 }, { shouldValidate: false });
                gas.push(tx.gasUsed);
            }
            console.log(`DirectUniswap bypass ExchangeProxy: ${gas}`);
        });
        it('AsmUniswap', async () => {
            const gas = [];
            for (let i = 0; i <= 10; i++) {
                const tx = await asmUniswap
                    .uniswapWethDai(constants.ONE_ETHER)
                    .awaitTransactionSuccessAsync({ from: CHONKY_DAI_WALLET, gasPrice: 0 }, { shouldValidate: false });
                gas.push(tx.gasUsed);
            }
            console.log(`AsmUniswap feature: ${gas}`);
        });
        it('AsmUniswap bypass ExchangeProxy', async () => {
            const gas = [];
            for (let i = 0; i <= 10; i++) {
                const tx = await asmUniswapImpl
                    .uniswapWethDai(constants.ONE_ETHER)
                    .awaitTransactionSuccessAsync({ from: CHONKY_DAI_WALLET, gasPrice: 0 }, { shouldValidate: false });
                gas.push(tx.gasUsed);
            }
            console.log(`AsmUniswap bypass ExchangeProxy: ${gas}`);
        });
        it('UniswapV2Router02', async () => {
            const gas = [];
            for (let i = 0; i <= 10; i++) {
                const tx = await uniswapV2Router02
                    .swapExactTokensForTokens(
                        constants.ONE_ETHER,
                        constants.ZERO_AMOUNT,
                        [DAI_ADDRESS, WETH_ADDRESS],
                        CHONKY_DAI_WALLET,
                        constants.MAX_UINT256,
                    )
                    .awaitTransactionSuccessAsync({ from: CHONKY_DAI_WALLET, gasPrice: 0 }, { shouldValidate: false });
                gas.push(tx.gasUsed);
            }
            console.log(`UniswapV2Router02: ${gas}`);
        });
    });
});
