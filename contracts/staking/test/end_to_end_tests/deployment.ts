import { artifacts as exchangeArtifacts, ExchangeContract } from '@0x/contracts-exchange';
import { artifacts as multisigArtifacts, AssetProxyOwnerContract } from '@0x/contracts-multisig';
import { blockchainTests, constants, expect } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { TxData } from 'ethereum-types';

import { artifacts as stakingArtifacts, ReadOnlyProxyContract, StakingContract, StakingProxyContract } from '../../src';

blockchainTests.only('Deployment and Configuration End to End Tests', env => {
    // Available Addresses
    let nonOwner: string;
    let owner: string;

    // Contract Instances
    let assetProxyOwner: AssetProxyOwnerContract;
    let exchange: ExchangeContract;
    let readOnlyProxy: ReadOnlyProxyContract;
    let staking: StakingContract;
    let stakingProxy: StakingProxyContract;
    let stakingWrapper: StakingContract;

    // TxDefaults
    let txDefaults: Partial<TxData>;

    // ChainId of the Exchange
    const chainId = new BigNumber(1);

    before(async () => {
        [nonOwner, owner] = await env.getAccountAddressesAsync();

        txDefaults = {
            from: owner,
            ...env.txDefaults,
        };

        // Deploy AssetProxyOwner. For the purposes of this test, we will assume that
        // the AssetProxyOwner does not know what destinations will be needed during
        // construction.
        assetProxyOwner = await AssetProxyOwnerContract.deployFrom0xArtifactAsync(
            multisigArtifacts.AssetProxyOwner,
            env.provider,
            txDefaults,
            multisigArtifacts,
            [],
            [],
            [],
            [owner],
            new BigNumber(1),
            constants.ZERO_AMOUNT,
        );

        // Deploy Exchange.
        exchange = await ExchangeContract.deployFrom0xArtifactAsync(
            exchangeArtifacts.Exchange,
            env.provider,
            txDefaults,
            exchangeArtifacts,
            chainId,
        );

        // Deploy ReadOnlyProxy.
        readOnlyProxy = await ReadOnlyProxyContract.deployFrom0xArtifactAsync(
            stakingArtifacts.ReadOnlyProxy,
            env.provider,
            txDefaults,
            stakingArtifacts,
        );

        // Deploy Staking.
        staking = await StakingContract.deployFrom0xArtifactAsync(
            stakingArtifacts.Staking,
            env.provider,
            txDefaults,
            stakingArtifacts,
        );

        // Deploy Staking.
        stakingProxy = await StakingProxyContract.deployFrom0xArtifactAsync(
            stakingArtifacts.StakingProxy,
            env.provider,
            txDefaults,
            stakingArtifacts,
            staking.address,
            readOnlyProxy.address,
        );

        // Set up the staking wrapper so that the entire staking interface can be accessed
        // easily through the proxy.
        stakingWrapper = new StakingContract(stakingProxy.address, env.provider);
    });

    it('should have properly configured the staking proxy', async () => {
        // Ensure that the registered read-only proxy is correct.
        const readOnlyProxyAddres = await stakingProxy.readOnlyProxy.callAsync();
        expect(readOnlyProxyAddres).to.be.eq(readOnlyProxy.address);

        // Ensure that the registered read-only proxy callee is correct.
        const readOnlyProxyCalleeAddres = await stakingProxy.readOnlyProxyCallee.callAsync();
        expect(readOnlyProxyCalleeAddres).to.be.eq(staking.address);

        // Ensure that the registered staking contract is correct.
        const stakingAddress = await stakingProxy.stakingContract.callAsync();
        expect(stakingAddress).to.be.eq(staking.address);
    });

    it('should have initialized the correct parameters', async () => {
        // Ensure that the correct parameters were set.
        const params = await stakingWrapper.getParams.callAsync();
        expect(params.length).to.be.eq(6);
        expect(params[0]).bignumber.to.be.eq(new BigNumber(864000)); // epochDurationInSeconds
        expect(params[1]).bignumber.to.be.eq(new BigNumber(900000)); // rewardDelegatedStakeWeight
        expect(params[2]).bignumber.to.be.eq(new BigNumber(100000000000000000000)); // minimumPoolStake
        expect(params[3]).bignumber.to.be.eq(10); // maximumMakerInPool
        expect(params[4]).bignumber.to.be.eq(1); // cobbDouglasAlphaNumerator
        expect(params[5]).bignumber.to.be.eq(2); // cobbDouglasAlphaDenominator
    });
});
