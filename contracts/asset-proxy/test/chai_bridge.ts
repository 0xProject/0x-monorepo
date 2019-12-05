import { ERC20TokenContract } from '@0x/contracts-erc20';
import { blockchainTests, constants, expect, randomAddress } from '@0x/contracts-test-utils';
import { AssetProxyId, RevertReason } from '@0x/types';
import { BigNumber } from '@0x/utils';

import { artifacts } from './artifacts';
import { TestChaiBridgeContract } from './wrappers';

blockchainTests.resets('ChaiBridge unit tests', env => {
    let chaiBridgeContract: TestChaiBridgeContract;
    let testDaiContract: ERC20TokenContract;
    let fromAddress: string;
    let toAddress: string;

    const alwaysRevertAddress = '0x0000000000000000000000000000000000000001';
    const amount = new BigNumber(1);

    before(async () => {
        [fromAddress, toAddress] = await env.getAccountAddressesAsync();
        chaiBridgeContract = await TestChaiBridgeContract.deployFrom0xArtifactAsync(
            artifacts.TestChaiBridge,
            env.provider,
            env.txDefaults,
            artifacts,
        );
        const testChaiDaiAddress = await chaiBridgeContract.testChaiDai().callAsync();
        testDaiContract = new ERC20TokenContract(testChaiDaiAddress, env.provider, env.txDefaults);
    });

    describe('bridgeTransferFrom()', () => {
        it('fails if not called by ERC20BridgeProxy', async () => {
            return expect(
                chaiBridgeContract
                    .bridgeTransferFrom(randomAddress(), fromAddress, toAddress, amount, constants.NULL_BYTES)
                    .awaitTransactionSuccessAsync({ from: alwaysRevertAddress }),
            ).to.revertWith(RevertReason.ChaiBridgeOnlyCallableByErc20BridgeProxy);
        });
        it('returns magic bytes upon success', async () => {
            const magicBytes = await chaiBridgeContract
                .bridgeTransferFrom(randomAddress(), fromAddress, toAddress, amount, constants.NULL_BYTES)
                .callAsync();
            expect(magicBytes).to.eq(AssetProxyId.ERC20Bridge);
        });
        it('should increase the Dai balance of `toAddress` by `amount` if successful', async () => {
            const initialBalance = await testDaiContract.balanceOf(toAddress).callAsync();
            await chaiBridgeContract
                .bridgeTransferFrom(randomAddress(), fromAddress, toAddress, amount, constants.NULL_BYTES)
                .awaitTransactionSuccessAsync();
            const endBalance = await testDaiContract.balanceOf(toAddress).callAsync();
            expect(endBalance).to.bignumber.eq(initialBalance.plus(amount));
        });
        it('fails if the `chai.draw` call fails', async () => {
            return expect(
                chaiBridgeContract
                    .bridgeTransferFrom(randomAddress(), alwaysRevertAddress, toAddress, amount, constants.NULL_BYTES)
                    .awaitTransactionSuccessAsync(),
            ).to.revertWith(RevertReason.ChaiBridgeDrawDaiFailed);
        });
    });
});
