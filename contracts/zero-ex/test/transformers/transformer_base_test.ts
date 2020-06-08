import { blockchainTests, constants, expect, randomAddress } from '@0x/contracts-test-utils';
import { BigNumber, ZeroExRevertErrors } from '@0x/utils';
import * as _ from 'lodash';

import { rlpEncodeNonce } from '../../src/nonce_utils';
import { artifacts } from '../artifacts';
import { TestDelegateCallerContract, TestTransformerBaseContract } from '../wrappers';

blockchainTests.resets('Transformer (base)', env => {
    const deploymentNonce = _.random(0, 0xffffffff);
    let deployer: string;
    let delegateCaller: TestDelegateCallerContract;
    let transformer: TestTransformerBaseContract;

    before(async () => {
        [deployer] = await env.getAccountAddressesAsync();
        delegateCaller = await TestDelegateCallerContract.deployFrom0xArtifactAsync(
            artifacts.TestDelegateCaller,
            env.provider,
            env.txDefaults,
            artifacts,
        );
        transformer = await TestTransformerBaseContract.deployFrom0xArtifactAsync(
            artifacts.TestTransformerBase,
            env.provider,
            {
                ...env.txDefaults,
                from: deployer,
            },
            artifacts,
            new BigNumber(deploymentNonce),
        );
    });

    describe('_getRLPEncodedDeploymentNonce()', () => {
        it('returns the RLP encoded deployment nonce', async () => {
            const r = await transformer.getRLPEncodedDeploymentNonce().callAsync();
            expect(r).to.eq(rlpEncodeNonce(deploymentNonce));
        });
    });

    describe('die()', () => {
        it('cannot be called by non-deployer', async () => {
            const notDeployer = randomAddress();
            const tx = transformer.die(randomAddress()).callAsync({ from: notDeployer });
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.TransformERC20.OnlyCallableByDeployerError(notDeployer, deployer),
            );
        });

        it('cannot be called outside of its own context', async () => {
            const callData = transformer.die(randomAddress()).getABIEncodedTransactionData();
            const tx = delegateCaller.executeDelegateCall(transformer.address, callData).callAsync({ from: deployer });
            return expect(tx).to.revertWith(
                new ZeroExRevertErrors.TransformERC20.InvalidExecutionContextError(
                    delegateCaller.address,
                    transformer.address,
                ),
            );
        });

        it('destroys the transformer', async () => {
            await transformer.die(randomAddress()).awaitTransactionSuccessAsync({ from: deployer });
            const code = await env.web3Wrapper.getContractCodeAsync(transformer.address);
            return expect(code).to.eq(constants.NULL_BYTES);
        });
    });
});
