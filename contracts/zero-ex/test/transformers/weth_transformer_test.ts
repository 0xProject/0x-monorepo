import { blockchainTests, constants, expect, getRandomInteger, randomAddress } from '@0x/contracts-test-utils';
import { BigNumber, ZeroExRevertErrors } from '@0x/utils';
import * as _ from 'lodash';

import { ETH_TOKEN_ADDRESS } from '../../src/constants';
import { encodeWethTransformerData } from '../../src/transformer_data_encoders';
import { artifacts } from '../artifacts';
import { TestWethContract, TestWethTransformerHostContract, WethTransformerContract } from '../wrappers';

const { MAX_UINT256, ZERO_AMOUNT } = constants;

blockchainTests.resets('WethTransformer', env => {
    let weth: TestWethContract;
    let transformer: WethTransformerContract;
    let host: TestWethTransformerHostContract;

    before(async () => {
        weth = await TestWethContract.deployFrom0xArtifactAsync(
            artifacts.TestWeth,
            env.provider,
            env.txDefaults,
            artifacts,
        );
        transformer = await WethTransformerContract.deployFrom0xArtifactAsync(
            artifacts.WethTransformer,
            env.provider,
            env.txDefaults,
            artifacts,
            weth.address,
        );
        host = await TestWethTransformerHostContract.deployFrom0xArtifactAsync(
            artifacts.TestWethTransformerHost,
            env.provider,
            env.txDefaults,
            artifacts,
            weth.address,
        );
    });

    interface Balances {
        ethBalance: BigNumber;
        wethBalance: BigNumber;
    }

    async function getHostBalancesAsync(): Promise<Balances> {
        return {
            ethBalance: await env.web3Wrapper.getBalanceInWeiAsync(host.address),
            wethBalance: await weth.balanceOf(host.address).callAsync(),
        };
    }

    it('fails if the token is neither ETH or WETH', async () => {
        const amount = getRandomInteger(1, '1e18');
        const data = encodeWethTransformerData({
            amount,
            token: randomAddress(),
        });
        const tx = host
            .executeTransform(amount, transformer.address, data)
            .awaitTransactionSuccessAsync({ value: amount });
        return expect(tx).to.revertWith(
            new ZeroExRevertErrors.TransformERC20.InvalidTransformDataError(
                ZeroExRevertErrors.TransformERC20.InvalidTransformDataErrorCode.InvalidTokens,
                data,
            ),
        );
    });

    it('can unwrap WETH', async () => {
        const amount = getRandomInteger(1, '1e18');
        const data = encodeWethTransformerData({
            amount,
            token: weth.address,
        });
        await host.executeTransform(amount, transformer.address, data).awaitTransactionSuccessAsync({ value: amount });
        expect(await getHostBalancesAsync()).to.deep.eq({
            ethBalance: amount,
            wethBalance: ZERO_AMOUNT,
        });
    });

    it('can unwrap all WETH', async () => {
        const amount = getRandomInteger(1, '1e18');
        const data = encodeWethTransformerData({
            amount: MAX_UINT256,
            token: weth.address,
        });
        await host.executeTransform(amount, transformer.address, data).awaitTransactionSuccessAsync({ value: amount });
        expect(await getHostBalancesAsync()).to.deep.eq({
            ethBalance: amount,
            wethBalance: ZERO_AMOUNT,
        });
    });

    it('can unwrap some WETH', async () => {
        const amount = getRandomInteger(1, '1e18');
        const data = encodeWethTransformerData({
            amount: amount.dividedToIntegerBy(2),
            token: weth.address,
        });
        await host.executeTransform(amount, transformer.address, data).awaitTransactionSuccessAsync({ value: amount });
        expect(await getHostBalancesAsync()).to.deep.eq({
            ethBalance: amount.dividedToIntegerBy(2),
            wethBalance: amount.minus(amount.dividedToIntegerBy(2)),
        });
    });

    it('can wrap ETH', async () => {
        const amount = getRandomInteger(1, '1e18');
        const data = encodeWethTransformerData({
            amount,
            token: ETH_TOKEN_ADDRESS,
        });
        await host
            .executeTransform(ZERO_AMOUNT, transformer.address, data)
            .awaitTransactionSuccessAsync({ value: amount });
        expect(await getHostBalancesAsync()).to.deep.eq({
            ethBalance: ZERO_AMOUNT,
            wethBalance: amount,
        });
    });

    it('can wrap all ETH', async () => {
        const amount = getRandomInteger(1, '1e18');
        const data = encodeWethTransformerData({
            amount: MAX_UINT256,
            token: ETH_TOKEN_ADDRESS,
        });
        await host
            .executeTransform(ZERO_AMOUNT, transformer.address, data)
            .awaitTransactionSuccessAsync({ value: amount });
        expect(await getHostBalancesAsync()).to.deep.eq({
            ethBalance: ZERO_AMOUNT,
            wethBalance: amount,
        });
    });

    it('can wrap some ETH', async () => {
        const amount = getRandomInteger(1, '1e18');
        const data = encodeWethTransformerData({
            amount: amount.dividedToIntegerBy(2),
            token: ETH_TOKEN_ADDRESS,
        });
        await host
            .executeTransform(ZERO_AMOUNT, transformer.address, data)
            .awaitTransactionSuccessAsync({ value: amount });
        expect(await getHostBalancesAsync()).to.deep.eq({
            ethBalance: amount.minus(amount.dividedToIntegerBy(2)),
            wethBalance: amount.dividedToIntegerBy(2),
        });
    });
});
