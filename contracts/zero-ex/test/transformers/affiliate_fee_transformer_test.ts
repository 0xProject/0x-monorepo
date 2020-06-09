import { blockchainTests, constants, expect, getRandomInteger, randomAddress } from '@0x/contracts-test-utils';
import { BigNumber, hexUtils } from '@0x/utils';
import * as _ from 'lodash';

import { ETH_TOKEN_ADDRESS } from '../../src/constants';
import { encodeAffiliateFeeTransformerData } from '../../src/transformer_data_encoders';
import { artifacts } from '../artifacts';
import {
    AffiliateFeeTransformerContract,
    TestMintableERC20TokenContract,
    TestTransformerHostContract,
} from '../wrappers';

const { MAX_UINT256, ZERO_AMOUNT } = constants;

blockchainTests.resets('AffiliateFeeTransformer', env => {
    const recipients = new Array(2).fill(0).map(() => randomAddress());
    let caller: string;
    let token: TestMintableERC20TokenContract;
    let transformer: AffiliateFeeTransformerContract;
    let host: TestTransformerHostContract;

    before(async () => {
        [caller] = await env.getAccountAddressesAsync();
        token = await TestMintableERC20TokenContract.deployFrom0xArtifactAsync(
            artifacts.TestMintableERC20Token,
            env.provider,
            env.txDefaults,
            artifacts,
        );
        transformer = await AffiliateFeeTransformerContract.deployFrom0xArtifactAsync(
            artifacts.AffiliateFeeTransformer,
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
        const amounts = recipients.map(() => getRandomInteger(1, '1e18'));
        const tokens = [token.address, ETH_TOKEN_ADDRESS];
        const data = encodeAffiliateFeeTransformerData({
            fees: recipients.map((r, i) => ({
                token: tokens[i],
                amount: amounts[i],
                recipient: r,
            })),
        });
        await mintHostTokensAsync(amounts[0]);
        await sendEtherAsync(host.address, amounts[1]);
        await host
            .rawExecuteTransform(transformer.address, hexUtils.random(), randomAddress(), data)
            .awaitTransactionSuccessAsync();
        expect(await getBalancesAsync(host.address)).to.deep.eq(ZERO_BALANCES);
        expect(await getBalancesAsync(recipients[0])).to.deep.eq({
            tokenBalance: amounts[0],
            ethBalance: ZERO_AMOUNT,
        });
        expect(await getBalancesAsync(recipients[1])).to.deep.eq({
            tokenBalance: ZERO_AMOUNT,
            ethBalance: amounts[1],
        });
    });

    it('can transfer all of a token and ETH', async () => {
        const amounts = recipients.map(() => getRandomInteger(1, '1e18'));
        const tokens = [token.address, ETH_TOKEN_ADDRESS];
        const data = encodeAffiliateFeeTransformerData({
            fees: recipients.map((r, i) => ({
                token: tokens[i],
                amount: MAX_UINT256,
                recipient: r,
            })),
        });
        await mintHostTokensAsync(amounts[0]);
        await sendEtherAsync(host.address, amounts[1]);
        await host
            .rawExecuteTransform(transformer.address, hexUtils.random(), randomAddress(), data)
            .awaitTransactionSuccessAsync();
        expect(await getBalancesAsync(host.address)).to.deep.eq(ZERO_BALANCES);
        expect(await getBalancesAsync(recipients[0])).to.deep.eq({
            tokenBalance: amounts[0],
            ethBalance: ZERO_AMOUNT,
        });
        expect(await getBalancesAsync(recipients[1])).to.deep.eq({
            tokenBalance: ZERO_AMOUNT,
            ethBalance: amounts[1],
        });
    });

    it('can transfer less than the balance of a token and ETH', async () => {
        const amounts = recipients.map(() => getRandomInteger(1, '1e18'));
        const tokens = [token.address, ETH_TOKEN_ADDRESS];
        const data = encodeAffiliateFeeTransformerData({
            fees: recipients.map((r, i) => ({
                token: tokens[i],
                amount: amounts[i].minus(1),
                recipient: r,
            })),
        });
        await mintHostTokensAsync(amounts[0]);
        await sendEtherAsync(host.address, amounts[1]);
        await host
            .rawExecuteTransform(transformer.address, hexUtils.random(), randomAddress(), data)
            .awaitTransactionSuccessAsync();
        expect(await getBalancesAsync(host.address)).to.deep.eq({
            tokenBalance: new BigNumber(1),
            ethBalance: new BigNumber(1),
        });
        expect(await getBalancesAsync(recipients[0])).to.deep.eq({
            tokenBalance: amounts[0].minus(1),
            ethBalance: ZERO_AMOUNT,
        });
        expect(await getBalancesAsync(recipients[1])).to.deep.eq({
            tokenBalance: ZERO_AMOUNT,
            ethBalance: amounts[1].minus(1),
        });
    });
});
