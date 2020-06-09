import { blockchainTests, constants, expect, getRandomInteger, randomAddress } from '@0x/contracts-test-utils';
import { BigNumber, hexUtils } from '@0x/utils';
import * as _ from 'lodash';

import { ETH_TOKEN_ADDRESS } from '../../src/constants';
import { encodePayTakerTransformerData } from '../../src/transformer_data_encoders';
import { artifacts } from '../artifacts';
import { PayTakerTransformerContract, TestMintableERC20TokenContract, TestTransformerHostContract } from '../wrappers';

const { MAX_UINT256, ZERO_AMOUNT } = constants;

blockchainTests.resets('PayTakerTransformer', env => {
    const taker = randomAddress();
    let caller: string;
    let token: TestMintableERC20TokenContract;
    let transformer: PayTakerTransformerContract;
    let host: TestTransformerHostContract;

    before(async () => {
        [caller] = await env.getAccountAddressesAsync();
        token = await TestMintableERC20TokenContract.deployFrom0xArtifactAsync(
            artifacts.TestMintableERC20Token,
            env.provider,
            env.txDefaults,
            artifacts,
        );
        transformer = await PayTakerTransformerContract.deployFrom0xArtifactAsync(
            artifacts.PayTakerTransformer,
            env.provider,
            env.txDefaults,
            artifacts,
        );
        host = await TestTransformerHostContract.deployFrom0xArtifactAsync(
            artifacts.TestTransformerHost,
            env.provider,
            { ...env.txDefaults, from: caller },
            artifacts,
        );
    });

    interface Balances {
        ethBalance: BigNumber;
        tokenBalance: BigNumber;
    }

    const ZERO_BALANCES = {
        ethBalance: ZERO_AMOUNT,
        tokenBalance: ZERO_AMOUNT,
    };

    async function getBalancesAsync(owner: string): Promise<Balances> {
        return {
            ethBalance: await env.web3Wrapper.getBalanceInWeiAsync(owner),
            tokenBalance: await token.balanceOf(owner).callAsync(),
        };
    }

    async function mintHostTokensAsync(amount: BigNumber): Promise<void> {
        await token.mint(host.address, amount).awaitTransactionSuccessAsync();
    }

    async function sendEtherAsync(to: string, amount: BigNumber): Promise<void> {
        await env.web3Wrapper.awaitTransactionSuccessAsync(
            await env.web3Wrapper.sendTransactionAsync({
                ...env.txDefaults,
                to,
                from: caller,
                value: amount,
            }),
        );
    }

    it('can transfer a token and ETH', async () => {
        const amounts = _.times(2, () => getRandomInteger(1, '1e18'));
        const data = encodePayTakerTransformerData({
            amounts,
            tokens: [token.address, ETH_TOKEN_ADDRESS],
        });
        await mintHostTokensAsync(amounts[0]);
        await sendEtherAsync(host.address, amounts[1]);
        await host
            .rawExecuteTransform(transformer.address, hexUtils.random(), taker, data)
            .awaitTransactionSuccessAsync();
        expect(await getBalancesAsync(host.address)).to.deep.eq(ZERO_BALANCES);
        expect(await getBalancesAsync(taker)).to.deep.eq({
            tokenBalance: amounts[0],
            ethBalance: amounts[1],
        });
    });

    it('can transfer all of a token and ETH', async () => {
        const amounts = _.times(2, () => getRandomInteger(1, '1e18'));
        const data = encodePayTakerTransformerData({
            amounts: [MAX_UINT256, MAX_UINT256],
            tokens: [token.address, ETH_TOKEN_ADDRESS],
        });
        await mintHostTokensAsync(amounts[0]);
        await sendEtherAsync(host.address, amounts[1]);
        await host
            .rawExecuteTransform(transformer.address, hexUtils.random(), taker, data)
            .awaitTransactionSuccessAsync();
        expect(await getBalancesAsync(host.address)).to.deep.eq(ZERO_BALANCES);
        expect(await getBalancesAsync(taker)).to.deep.eq({
            tokenBalance: amounts[0],
            ethBalance: amounts[1],
        });
    });

    it('can transfer all of a token and ETH (empty amounts)', async () => {
        const amounts = _.times(2, () => getRandomInteger(1, '1e18'));
        const data = encodePayTakerTransformerData({
            amounts: [],
            tokens: [token.address, ETH_TOKEN_ADDRESS],
        });
        await mintHostTokensAsync(amounts[0]);
        await sendEtherAsync(host.address, amounts[1]);
        await host
            .rawExecuteTransform(transformer.address, hexUtils.random(), taker, data)
            .awaitTransactionSuccessAsync();
        expect(await getBalancesAsync(host.address)).to.deep.eq(ZERO_BALANCES);
        expect(await getBalancesAsync(taker)).to.deep.eq({
            tokenBalance: amounts[0],
            ethBalance: amounts[1],
        });
    });

    it('can transfer less than the balance of a token and ETH', async () => {
        const amounts = _.times(2, () => getRandomInteger(1, '1e18'));
        const data = encodePayTakerTransformerData({
            amounts: amounts.map(a => a.dividedToIntegerBy(2)),
            tokens: [token.address, ETH_TOKEN_ADDRESS],
        });
        await mintHostTokensAsync(amounts[0]);
        await sendEtherAsync(host.address, amounts[1]);
        await host
            .rawExecuteTransform(transformer.address, hexUtils.random(), taker, data)
            .awaitTransactionSuccessAsync();
        expect(await getBalancesAsync(host.address)).to.deep.eq({
            tokenBalance: amounts[0].minus(amounts[0].dividedToIntegerBy(2)),
            ethBalance: amounts[1].minus(amounts[1].dividedToIntegerBy(2)),
        });
        expect(await getBalancesAsync(taker)).to.deep.eq({
            tokenBalance: amounts[0].dividedToIntegerBy(2),
            ethBalance: amounts[1].dividedToIntegerBy(2),
        });
    });
});
