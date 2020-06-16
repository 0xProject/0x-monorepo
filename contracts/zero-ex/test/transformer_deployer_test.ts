import { blockchainTests, constants, expect, randomAddress, verifyEventsFromLogs } from '@0x/contracts-test-utils';
import { AuthorizableRevertErrors, BigNumber } from '@0x/utils';

import { artifacts } from './artifacts';
import {
    TestTransformerDeployerTransformerContract,
    TransformerDeployerContract,
    TransformerDeployerEvents,
} from './wrappers';

blockchainTests.resets('TransformerDeployer', env => {
    let owner: string;
    let authority: string;
    let deployer: TransformerDeployerContract;
    const deployBytes = artifacts.TestTransformerDeployerTransformer.compilerOutput.evm.bytecode.object;

    before(async () => {
        [owner, authority] = await env.getAccountAddressesAsync();
        deployer = await TransformerDeployerContract.deployFrom0xArtifactAsync(
            artifacts.TransformerDeployer,
            env.provider,
            env.txDefaults,
            artifacts,
            [authority],
        );
    });

    describe('deploy()', () => {
        it('non-authority cannot call', async () => {
            const nonAuthority = randomAddress();
            const tx = deployer.deploy(deployBytes).callAsync({ from: nonAuthority });
            return expect(tx).to.revertWith(new AuthorizableRevertErrors.SenderNotAuthorizedError(nonAuthority));
        });

        it('authority can deploy', async () => {
            const targetAddress = await deployer.deploy(deployBytes).callAsync({ from: authority });
            const target = new TestTransformerDeployerTransformerContract(targetAddress, env.provider);
            const receipt = await deployer.deploy(deployBytes).awaitTransactionSuccessAsync({ from: authority });
            expect(await target.deployer().callAsync()).to.eq(deployer.address);
            verifyEventsFromLogs(
                receipt.logs,
                [{ deployedAddress: targetAddress, nonce: new BigNumber(1), sender: authority }],
                TransformerDeployerEvents.Deployed,
            );
        });

        it('authority can deploy with value', async () => {
            const targetAddress = await deployer.deploy(deployBytes).callAsync({ from: authority, value: 1 });
            const target = new TestTransformerDeployerTransformerContract(targetAddress, env.provider);
            const receipt = await deployer
                .deploy(deployBytes)
                .awaitTransactionSuccessAsync({ from: authority, value: 1 });
            expect(await target.deployer().callAsync()).to.eq(deployer.address);
            verifyEventsFromLogs(
                receipt.logs,
                [{ deployedAddress: targetAddress, nonce: new BigNumber(1), sender: authority }],
                TransformerDeployerEvents.Deployed,
            );
            expect(await env.web3Wrapper.getBalanceInWeiAsync(targetAddress)).to.bignumber.eq(1);
        });

        it('updates nonce', async () => {
            expect(await deployer.nonce().callAsync()).to.bignumber.eq(1);
            await deployer.deploy(deployBytes).awaitTransactionSuccessAsync({ from: authority });
            expect(await deployer.nonce().callAsync()).to.bignumber.eq(2);
        });

        it('nonce can predict deployment address', async () => {
            const nonce = await deployer.nonce().callAsync();
            const targetAddress = await deployer.deploy(deployBytes).callAsync({ from: authority });
            const target = new TestTransformerDeployerTransformerContract(targetAddress, env.provider);
            await deployer.deploy(deployBytes).awaitTransactionSuccessAsync({ from: authority });
            expect(await target.isDeployedByDeployer(nonce).callAsync()).to.eq(true);
        });

        it('can retrieve deployment nonce from contract address', async () => {
            const nonce = await deployer.nonce().callAsync();
            const targetAddress = await deployer.deploy(deployBytes).callAsync({ from: authority });
            await deployer.deploy(deployBytes).awaitTransactionSuccessAsync({ from: authority });
            expect(await deployer.toDeploymentNonce(targetAddress).callAsync()).to.bignumber.eq(nonce);
        });
    });

    describe('kill()', () => {
        let target: TestTransformerDeployerTransformerContract;

        before(async () => {
            const targetAddress = await deployer.deploy(deployBytes).callAsync({ from: authority });
            target = new TestTransformerDeployerTransformerContract(targetAddress, env.provider);
            await deployer.deploy(deployBytes).awaitTransactionSuccessAsync({ from: authority });
        });

        it('authority cannot call', async () => {
            const nonAuthority = randomAddress();
            const tx = deployer.kill(target.address).callAsync({ from: nonAuthority });
            return expect(tx).to.revertWith(new AuthorizableRevertErrors.SenderNotAuthorizedError(nonAuthority));
        });

        it('authority can kill a contract', async () => {
            const receipt = await deployer.kill(target.address).awaitTransactionSuccessAsync({ from: authority });
            verifyEventsFromLogs(
                receipt.logs,
                [{ target: target.address, sender: authority }],
                TransformerDeployerEvents.Killed,
            );
            return expect(env.web3Wrapper.getContractCodeAsync(target.address)).to.become(constants.NULL_BYTES);
        });
    });
});
