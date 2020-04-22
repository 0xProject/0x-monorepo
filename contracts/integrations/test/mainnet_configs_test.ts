import { ContractWrappers } from '@0x/contract-wrappers';
import { ERC20ProxyContract, MultiAssetProxyContract } from '@0x/contracts-asset-proxy';
import { StakingProxyContract, ZrxVaultContract, StakingContract } from '@0x/contracts-staking';
import { blockchainTests, describe, verifyEvents, expect, provider } from '@0x/contracts-test-utils';
import { AssetProxyId } from '@0x/types';
import { BigNumber } from '@0x/utils';
import {AbiDefinition} from 'ethereum-types';

import { contractAddresses, getContractwrappers } from './mainnet_fork_utils';

import { artifacts as multisigArtifacts, ZeroExGovernorContract } from '@0x/contracts-multisig';
import { artifacts as stakingArtifacts } from '@0x/contracts-staking';
import { artifacts } from '@0x/contracts-erc721';

import { ExchangeContract } from '@0x/contracts-exchange';

blockchainTests.fork.only('Mainnet configs tests', env => {
    let contractWrappers: ContractWrappers;

    before(async () => {
        contractWrappers = getContractwrappers(env.provider);
    });

    /*
    describe('Exchange', () => {
        it('should be owned by the ZeroExGovernor ', async () => {
            const owner = await contractWrappers.exchange.owner().callAsync();
            expect(owner).to.eq(contractAddresses.zeroExGovernor);
        });
        it('ERC20Proxy should be registered', async () => {
            const erc20Proxy = await contractWrappers.exchange.getAssetProxy(AssetProxyId.ERC20).callAsync();
            expect(erc20Proxy).to.eq(contractAddresses.erc20Proxy);
        });
        it('ERC721Proxy should be registered', async () => {
            const erc721Proxy = await contractWrappers.exchange.getAssetProxy(AssetProxyId.ERC721).callAsync();
            expect(erc721Proxy).to.eq(contractAddresses.erc721Proxy);
        });
        it('ERC1155Proxy should be registered', async () => {
            const erc1155Proxy = await contractWrappers.exchange.getAssetProxy(AssetProxyId.ERC1155).callAsync();
            expect(erc1155Proxy).to.eq(contractAddresses.erc1155Proxy);
        });
        it('ERC20BridgeProxy should be registered', async () => {
            const erc20BridgeProxy = await contractWrappers.exchange
                .getAssetProxy(AssetProxyId.ERC20Bridge)
                .callAsync();
            expect(erc20BridgeProxy).to.eq(contractAddresses.erc20BridgeProxy);
        });
        it('MultiAssetProxy should be registered', async () => {
            const multiAssetProxy = await contractWrappers.exchange.getAssetProxy(AssetProxyId.MultiAsset).callAsync();
            expect(multiAssetProxy).to.eq(contractAddresses.multiAssetProxy);
        });
        it('StaticCallProxy should be registered', async () => {
            const staticCallProxy = await contractWrappers.exchange.getAssetProxy(AssetProxyId.StaticCall).callAsync();
            expect(staticCallProxy).to.eq(contractAddresses.staticCallProxy);
        });
        it('StakingProxy should be attached', async () => {
            const stakingProxy = await contractWrappers.exchange.protocolFeeCollector().callAsync();
            expect(stakingProxy).to.eq(contractAddresses.stakingProxy);
        });
        it('should have the correct protocol fee multiplier', async () => {
            const protocolFeeMultiplier = await contractWrappers.exchange.protocolFeeMultiplier().callAsync();
            expect(protocolFeeMultiplier).to.bignumber.eq(150000);
        });
    });
    describe('ERC20Proxy', () => {
        const erc20Proxy = new ERC20ProxyContract(contractAddresses.erc20Proxy, env.provider);
        it('should be owned by the ZeroExGovernor ', async () => {
            const owner = await erc20Proxy.owner().callAsync();
            expect(owner).to.eq(contractAddresses.zeroExGovernor);
        });
        it('should have the correct authorized addresses', async () => {
            const authorizedAddresses = await erc20Proxy.getAuthorizedAddresses().callAsync();
            expect(authorizedAddresses.length).to.eq(4);
            expect(authorizedAddresses.includes(contractAddresses.exchangeV2), 'ExchangeV2');
            expect(authorizedAddresses.includes(contractAddresses.exchange), 'Exchange');
            expect(authorizedAddresses.includes(contractAddresses.multiAssetProxy), 'MultiAssetProxy');
            expect(authorizedAddresses.includes(contractAddresses.zrxVault), 'ZrxVault');
        });
    });
    describe('ERC721Proxy', () => {
        const erc721Proxy = new ERC20ProxyContract(contractAddresses.erc721Proxy, env.provider);
        it('should be owned by the ZeroExGovernor ', async () => {
            const owner = await erc721Proxy.owner().callAsync();
            expect(owner).to.eq(contractAddresses.zeroExGovernor);
        });
        it('should have the correct authorized addresses', async () => {
            const authorizedAddresses = await erc721Proxy.getAuthorizedAddresses().callAsync();
            expect(authorizedAddresses.length).to.eq(3);
            expect(authorizedAddresses.includes(contractAddresses.exchangeV2), 'ExchangeV2');
            expect(authorizedAddresses.includes(contractAddresses.exchange), 'Exchange');
            expect(authorizedAddresses.includes(contractAddresses.multiAssetProxy), 'MultiAssetProxy');
        });
    });
    describe('ERC1155Proxy', () => {
        const erc1155Proxy = new ERC20ProxyContract(contractAddresses.erc1155Proxy, env.provider);
        it('should be owned by the ZeroExGovernor ', async () => {
            const owner = await erc1155Proxy.owner().callAsync();
            expect(owner).to.eq(contractAddresses.zeroExGovernor);
        });
        it('should have the correct authorized addresses', async () => {
            const authorizedAddresses = await erc1155Proxy.getAuthorizedAddresses().callAsync();
            expect(authorizedAddresses.length).to.eq(3);
            expect(authorizedAddresses.includes(contractAddresses.exchangeV2), 'ExchangeV2');
            expect(authorizedAddresses.includes(contractAddresses.exchange), 'Exchange');
            expect(authorizedAddresses.includes(contractAddresses.multiAssetProxy), 'MultiAssetProxy');
        });
    });
    describe('ERC20BridgeProxy', () => {
        const erc20BridgeProxy = new ERC20ProxyContract(contractAddresses.erc20BridgeProxy, env.provider);
        it('should be owned by the ZeroExGovernor ', async () => {
            const owner = await erc20BridgeProxy.owner().callAsync();
            expect(owner).to.eq(contractAddresses.zeroExGovernor);
        });
        it('should have the correct authorized addresses', async () => {
            const authorizedAddresses = await erc20BridgeProxy.getAuthorizedAddresses().callAsync();
            expect(authorizedAddresses.length).to.eq(2);
            expect(authorizedAddresses.includes(contractAddresses.exchange), 'Exchange');
            expect(authorizedAddresses.includes(contractAddresses.multiAssetProxy), 'MultiAssetProxy');
        });
    });
    describe('MultiAssetProxy', () => {
        const multiAssetProxy = new MultiAssetProxyContract(contractAddresses.multiAssetProxy, env.provider);
        it('should be owned by the ZeroExGovernor ', async () => {
            const owner = await multiAssetProxy.owner().callAsync();
            expect(owner).to.eq(contractAddresses.zeroExGovernor);
        });
        it('should have the correct authorized addresses', async () => {
            const authorizedAddresses = await multiAssetProxy.getAuthorizedAddresses().callAsync();
            expect(authorizedAddresses.length).to.eq(2);
            expect(authorizedAddresses.includes(contractAddresses.exchangeV2), 'ExchangeV2');
            expect(authorizedAddresses.includes(contractAddresses.exchange), 'Exchange');
        });
        it('ERC20Proxy should be registered', async () => {
            const erc20Proxy = await multiAssetProxy.getAssetProxy(AssetProxyId.ERC20).callAsync();
            expect(erc20Proxy).to.eq(contractAddresses.erc20Proxy);
        });
        it('ERC721Proxy should be registered', async () => {
            const erc721Proxy = await multiAssetProxy.getAssetProxy(AssetProxyId.ERC721).callAsync();
            expect(erc721Proxy).to.eq(contractAddresses.erc721Proxy);
        });
        it('ERC1155Proxy should be registered', async () => {
            const erc1155Proxy = await multiAssetProxy.getAssetProxy(AssetProxyId.ERC1155).callAsync();
            expect(erc1155Proxy).to.eq(contractAddresses.erc1155Proxy);
        });
        it('ERC20BridgeProxy should be registered', async () => {
            const erc20BridgeProxy = await multiAssetProxy.getAssetProxy(AssetProxyId.ERC20Bridge).callAsync();
            expect(erc20BridgeProxy).to.eq(contractAddresses.erc20BridgeProxy);
        });
        it('StaticCallProxy should be registered', async () => {
            const staticCallProxy = await multiAssetProxy.getAssetProxy(AssetProxyId.StaticCall).callAsync();
            expect(staticCallProxy).to.eq(contractAddresses.staticCallProxy);
        });
    });
    describe('StakingProxy', () => {
        const stakingProxy = new StakingProxyContract(contractAddresses.stakingProxy, env.provider);
        it('should be owned by ZeroExGovernor', async () => {
            const owner = await stakingProxy.owner().callAsync();
            expect(owner).to.eq(contractAddresses.zeroExGovernor);
        });
        it('Staking contract should be attached', async () => {
            const staking = await stakingProxy.stakingContract().callAsync();
            expect(staking).to.eq(contractAddresses.staking);
        });
        it('Exchange should be registered', async () => {
            const isRegistered = await contractWrappers.staking.validExchanges(contractAddresses.exchange).callAsync();
            expect(isRegistered).to.be.true();
        });
        it('ZrxVault should be set', async () => {
            const zrxVault = await contractWrappers.staking.getZrxVault().callAsync();
            expect(zrxVault).to.eq(contractAddresses.zrxVault);
        });
        it('WETH should be set', async () => {
            const weth = await contractWrappers.staking.getWethContract().callAsync();
            expect(weth).to.eq(contractAddresses.etherToken);
        });
        it('should have the correct authorized addresses', async () => {
            const authorizedAddresses = await stakingProxy.getAuthorizedAddresses().callAsync();
            expect(authorizedAddresses.length).to.eq(1);
            expect(authorizedAddresses.includes(contractAddresses.zeroExGovernor), 'ZeroExGovernor');
        });
        it('should have the correct params set', async () => {
            const params = await contractWrappers.staking.getParams().callAsync();
            const epochDurationInSeconds = 10 * 24 * 60 * 60;
            const rewardDelegatedStakeWeight = 10 ** 6 * 0.9;
            const mimimumPoolStake = new BigNumber(10).pow(18).times(100);
            const cobbDouglasAlphaNumerator = 2;
            const cobbDouglasAlphaDenominator = 3;
            expect(params[0]).to.bignumber.eq(epochDurationInSeconds, 'epochDurationInSeconds');
            expect(params[1]).to.bignumber.eq(rewardDelegatedStakeWeight, 'rewardDelegatedStakeWeight');
            expect(params[2]).to.bignumber.eq(mimimumPoolStake, 'mimimumPoolStake');
            expect(params[3]).to.bignumber.eq(cobbDouglasAlphaNumerator, 'cobbDouglasAlphaNumerator');
            expect(params[4]).to.bignumber.eq(cobbDouglasAlphaDenominator, 'cobbDouglasAlphaDenominator');
        });
    });
    describe('ZrxVault', () => {
        const zrxVault = new ZrxVaultContract(contractAddresses.zrxVault, env.provider);
        it('should be owned by ZeroExGovernor', async () => {
            const owner = await zrxVault.owner().callAsync();
            expect(owner).to.eq(contractAddresses.zeroExGovernor);
        });
        it('should have the correct authorized addresses', async () => {
            const authorizedAddresses = await zrxVault.getAuthorizedAddresses().callAsync();
            expect(authorizedAddresses.length).to.eq(1);
            expect(authorizedAddresses.includes(contractAddresses.zeroExGovernor), 'ZeroExGovernor');
        });
        it('ERC20Proxy should be set', async () => {
            const erc20Proxy = await zrxVault.zrxAssetProxy().callAsync();
            expect(erc20Proxy).to.eq(contractAddresses.erc20Proxy);
        });
        it('StakingProxy should be set', async () => {
            const stakingProxy = await zrxVault.stakingProxyAddress().callAsync();
            expect(stakingProxy).to.eq(contractAddresses.stakingProxy);
        });
    });
    */

    const data = '0x0000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000106000000000000000000000000000000000000000000000000000000000000012c000000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000240000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000003c000000000000000000000000000000000000000000000000000000000000004800000000000000000000000000000000000000000000000000000000000000540000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000006c000000000000000000000000000000000000000000000000000000000000007800000000000000000000000000000000000000000000000000000000000000840000000000000000000000000000000000000000000000000000000000000090000000000000000000000000000000000000000000000000000000000000009c00000000000000000000000000000000000000000000000000000000000000a800000000000000000000000000000000000000000000000000000000000000b400000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000cc00000000000000000000000000000000000000000000000000000000000000d800000000000000000000000000000000000000000000000000000000000000e400000000000000000000000000000000000000000000000000000000000000f000000000000000000000000000000000000000000000000000000000000000084751ad56000000000000000000000000000000000000000000000000000000000000000018a2e271a00000000000000000000000000000000000000000000000000000000000000000000000000000000a26e80e7dea86279c6d778d702cc413e6cffa7770000000000000000000000000000000000000000000000000000000000127500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000084751ad560000000000000000000000000000000000000000000000000000000000000000101e28d8400000000000000000000000000000000000000000000000000000000000000000000000000000000a26e80e7dea86279c6d778d702cc413e6cffa7770000000000000000000000000000000000000000000000000000000000127500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000084751ad560000000000000000000000000000000000000000000000000000000000000000166615d5600000000000000000000000000000000000000000000000000000000000000000000000000000000a26e80e7dea86279c6d778d702cc413e6cffa7770000000000000000000000000000000000000000000000000000000000127500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000084751ad560000000000000000000000000000000000000000000000000000000000000000137b006a600000000000000000000000000000000000000000000000000000000000000000000000000000000a26e80e7dea86279c6d778d702cc413e6cffa7770000000000000000000000000000000000000000000000000000000000127500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000084751ad56000000000000000000000000000000000000000000000000000000000000000019c3ccc8200000000000000000000000000000000000000000000000000000000000000000000000000000000a26e80e7dea86279c6d778d702cc413e6cffa7770000000000000000000000000000000000000000000000000000000000093a80000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000084751ad560000000000000000000000000000000000000000000000000000000000000000142f1181e00000000000000000000000000000000000000000000000000000000000000000000000000000000a26e80e7dea86279c6d778d702cc413e6cffa7770000000000000000000000000000000000000000000000000000000000127500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000084751ad56000000000000000000000000000000000000000000000000000000000000000017071293900000000000000000000000000000000000000000000000000000000000000000000000000000000a26e80e7dea86279c6d778d702cc413e6cffa7770000000000000000000000000000000000000000000000000000000000127500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000084751ad56000000000000000000000000000000000000000000000000000000000000000019ad2674400000000000000000000000000000000000000000000000000000000000000000000000000000000a26e80e7dea86279c6d778d702cc413e6cffa7770000000000000000000000000000000000000000000000000000000000127500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000084751ad5600000000000000000000000000000000000000000000000000000000000000001f2fde38b00000000000000000000000000000000000000000000000000000000000000000000000000000000a26e80e7dea86279c6d778d702cc413e6cffa7770000000000000000000000000000000000000000000000000000000000127500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000084751ad56000000000000000000000000000000000000000000000000000000000000000016bf3f9e500000000000000000000000000000000000000000000000000000000000000000000000000000000ba7f8b5fb1b19c1211c5d49550fcd149177a5eaf0000000000000000000000000000000000000000000000000000000000127500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000084751ad5600000000000000000000000000000000000000000000000000000000000000001ca5b021800000000000000000000000000000000000000000000000000000000000000000000000000000000ba7f8b5fb1b19c1211c5d49550fcd149177a5eaf0000000000000000000000000000000000000000000000000000000000127500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000084751ad560000000000000000000000000000000000000000000000000000000000000000142f1181e00000000000000000000000000000000000000000000000000000000000000000000000000000000ba7f8b5fb1b19c1211c5d49550fcd149177a5eaf0000000000000000000000000000000000000000000000000000000000127500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000084751ad56000000000000000000000000000000000000000000000000000000000000000017071293900000000000000000000000000000000000000000000000000000000000000000000000000000000ba7f8b5fb1b19c1211c5d49550fcd149177a5eaf0000000000000000000000000000000000000000000000000000000000127500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000084751ad56000000000000000000000000000000000000000000000000000000000000000019ad2674400000000000000000000000000000000000000000000000000000000000000000000000000000000ba7f8b5fb1b19c1211c5d49550fcd149177a5eaf0000000000000000000000000000000000000000000000000000000000127500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000084751ad5600000000000000000000000000000000000000000000000000000000000000001f2fde38b00000000000000000000000000000000000000000000000000000000000000000000000000000000ba7f8b5fb1b19c1211c5d49550fcd149177a5eaf0000000000000000000000000000000000000000000000000000000000127500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000084751ad5600000000000000000000000000000000000000000000000000000000000000001c0fa16cc0000000000000000000000000000000000000000000000000000000000000000000000000000000061935cbdd02287b511119ddb11aeb42f1593b7ef0000000000000000000000000000000000000000000000000000000000127500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000084751ad56000000000000000000000000000000000000000000000000000000000000000019331c7420000000000000000000000000000000000000000000000000000000000000000000000000000000061935cbdd02287b511119ddb11aeb42f1593b7ef0000000000000000000000000000000000000000000000000000000000093a800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a49c3ccc820000000000000000000000000000000000000000000000000000000000093a8000000000000000000000000000000000000000000000000000000000000dbba00000000000000000000000000000000000000000000000056bc75e2d63100000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000120000000000000000000000007d3455421bbc5ed534a83c88fd80387dc82713920000000000000000000000007d3455421bbc5ed534a83c88fd80387dc82713920000000000000000000000007d3455421bbc5ed534a83c88fd80387dc82713920000000000000000000000007d3455421bbc5ed534a83c88fd80387dc82713920000000000000000000000007d3455421bbc5ed534a83c88fd80387dc82713920000000000000000000000007d3455421bbc5ed534a83c88fd80387dc82713920000000000000000000000007d3455421bbc5ed534a83c88fd80387dc82713920000000000000000000000007d3455421bbc5ed534a83c88fd80387dc82713920000000000000000000000007d3455421bbc5ed534a83c88fd80387dc82713920000000000000000000000007d3455421bbc5ed534a83c88fd80387dc82713920000000000000000000000007d3455421bbc5ed534a83c88fd80387dc82713920000000000000000000000007d3455421bbc5ed534a83c88fd80387dc82713920000000000000000000000007d3455421bbc5ed534a83c88fd80387dc82713920000000000000000000000007d3455421bbc5ed534a83c88fd80387dc82713920000000000000000000000007d3455421bbc5ed534a83c88fd80387dc82713920000000000000000000000007d3455421bbc5ed534a83c88fd80387dc82713920000000000000000000000007d3455421bbc5ed534a83c88fd80387dc8271392000000000000000000000000a26e80e7dea86279c6d778d702cc413e6cffa7770000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    describe('this is it', () => {
        it('should be owned by ZeroExGovernor', async () => {
            // Construct mainnet governor contract
            console.log('Constructing Governor...')
            const logDecodeDependencies: {[contractName: string]: AbiDefinition[]} = {};
            const artifacts = {...multisigArtifacts, ...stakingArtifacts};
            for (const key of Object.keys(artifacts)) {
                logDecodeDependencies[((artifacts as any)[key] as any).contractName] = ((artifacts as any)[key] as any).compilerOutput.abi;
            }
            const governor = new ZeroExGovernorContract(contractWrappers.contractAddresses.zeroExGovernor, env.provider, env.txDefaults, logDecodeDependencies);
            const stakingContract = new StakingContract(contractWrappers.contractAddresses.stakingProxy, env.provider, env.txDefaults, logDecodeDependencies);

            // Fetch the owners
            console.log('Fetching Owners...');
            const owners = await governor.getOwners().callAsync();

            // Submit the transaction
            console.log('Submitting TX...');
            const tx1 = await governor.submitTransaction(contractWrappers.contractAddresses.stakingProxy, new BigNumber(0), data).awaitTransactionSuccessAsync({from: owners[0]});
            const txId = (tx1.logs[0] as any).args.transactionId;

            // Confirm the transaction from 2nd/3rd owners.
            console.log('Confirming 1/2...');
            await governor.confirmTransaction(txId).awaitTransactionSuccessAsync({from: owners[1]});
            console.log('Confirming 2/2...');
            await governor.confirmTransaction(txId).awaitTransactionSuccessAsync({from: owners[2]});

            // Fastforward two weeks.
            console.log('Fast-Forwarding 2 weeks...');
            const oneWeekInSeconds = 7 * 24 * 60 * 60;;
            const twoWeeksInSeconds = 2 * oneWeekInSeconds;
            await env.web3Wrapper.increaseTimeAsync(twoWeeksInSeconds + 1);
            await env.web3Wrapper.mineBlockAsync();

            // Fetch Initial Staking Params
            console.log('Fetching Staking Params & End Time...');
            const stakingParamsInitArray = await stakingContract.getParams().callAsync();
            const stakingParamsInit = {
                epochDurationInSeconds: new BigNumber(stakingParamsInitArray[0]),
                rewardDelegatedStakeWeight: new BigNumber(stakingParamsInitArray[1]),
                minimumPoolStake: new BigNumber(stakingParamsInitArray[2]),
                cobbDouglasAlphaNumerator: new BigNumber(stakingParamsInitArray[3]),
                cobbDouglasAlphaDenominator: new BigNumber(stakingParamsInitArray[4])
            }
            const epochEndTimeInit = await stakingContract.getCurrentEpochEarliestEndTimeInSeconds().callAsync();

            console.log(JSON.stringify(stakingParamsInit, null, 4));
            console.log(JSON.stringify(epochEndTimeInit, null, 4));

            // Execute transaction
            console.log('Executing tx...');
            const tx2 = await governor.executeTransaction(txId).awaitTransactionSuccessAsync({from: owners[0]});
            console.log(JSON.stringify(tx2, null, 4));

            // filterLogsToArguments


            // Validate new staking params from events
            verifyEvents(
                tx2,
                [
                    {
                        ...stakingParamsInit,
                        epochDurationInSeconds: new BigNumber(oneWeekInSeconds),
                    }
                ],
                "ParamsSet"
            );

            /*
             // Validate new time-locks from events
             const ZERO = new BigNumber(0);
             const selectors = {
                addExchangeAddress: stakingContract.addExchangeAddress("").getABIEncodedTransactionData().substr(0, 10),
                removeExchangeAddress: stakingContract.removeExchangeAddress("").getABIEncodedTransactionData().substr(0, 10),
                attachStakingContract: (new StakingProxyContract("", env.provider)).attachStakingContract("").getABIEncodedTransactionData().substr(0, 10),
                detachStakingContract: (new StakingProxyContract("", env.provider)).detachStakingContract().getABIEncodedTransactionData().substr(0, 10),
                setParams: stakingContract.setParams(ZERO, ZERO, ZERO, ZERO, ZERO).getABIEncodedTransactionData().substr(0, 10),
                addAuthorizedAddress: stakingContract.addAuthorizedAddress("").getABIEncodedTransactionData().substr(0, 10),
                removeAuthorizedAddress: stakingContract.removeAuthorizedAddress("").getABIEncodedTransactionData().substr(0, 10),
                removeAuthorizedAddressAtIndex: stakingContract.removeAuthorizedAddressAtIndex("", ZERO).getABIEncodedTransactionData().substr(0, 10),
                transferOwnership: stakingContract.transferOwnership("").getABIEncodedTransactionData().substr(0, 10),

                // ZrxVaut
                setStakingProxy: (new ZrxVaultContract("", env.provider)).setStakingProxy("").getABIEncodedTransactionData().substr(0, 10),
                setZrxProxy: (new ZrxVaultContract("", env.provider)).setZrxProxy("").getABIEncodedTransactionData().substr(0, 10),

                // Exchange
                setProtocolFeeCollectorAddress: (new ExchangeContract("", env.provider)).setProtocolFeeCollectorAddress("").getABIEncodedTransactionData().substr(0, 10),
                setProtocolFeeMultiplier: (new ExchangeContract("", env.provider)).setProtocolFeeMultiplier("").getABIEncodedTransactionData().substr(0, 10),
             };
             verifyEvents(
                tx2,
                [
                    // Staking Proxy
                    {
                        destination: contractWrappers.contractAddresses.stakingProxy,
                        functionSelector: selectors.addExchangeAddress,
                        newTimelockSeconds: new BigNumber(twoWeeksInSeconds),
                        hasCustomTimelock: true,
                    },
                    {
                        destination: contractWrappers.contractAddresses.stakingProxy,
                        functionSelector: selectors.removeExchangeAddress,
                        newTimelockSeconds: new BigNumber(twoWeeksInSeconds),
                        hasCustomTimelock: true,
                    },
                    {
                        destination: contractWrappers.contractAddresses.stakingProxy,
                        functionSelector: selectors.attachStakingContract,
                        newTimelockSeconds: new BigNumber(twoWeeksInSeconds),
                        hasCustomTimelock: true,
                    },
                    {
                        destination: contractWrappers.contractAddresses.stakingProxy,
                        functionSelector: selectors.detachStakingContract,
                        newTimelockSeconds: new BigNumber(twoWeeksInSeconds),
                        hasCustomTimelock: true,
                    },
                    {
                        destination: contractWrappers.contractAddresses.stakingProxy,
                        functionSelector: selectors.setParams,
                        newTimelockSeconds: new BigNumber(oneWeeksInSeconds),
                        hasCustomTimelock: true,
                    },
                    {
                        destination: contractWrappers.contractAddresses.stakingProxy,
                        functionSelector: selectors.addAuthorizedAddress,
                        newTimelockSeconds: new BigNumber(twoWeeksInSeconds),
                        hasCustomTimelock: true,
                    },
                    {
                        destination: contractWrappers.contractAddresses.stakingProxy,
                        functionSelector: selectors.removeAuthorizedAddress,
                        newTimelockSeconds: new BigNumber(twoWeeksInSeconds),
                        hasCustomTimelock: true,
                    },
                    {
                        destination: contractWrappers.contractAddresses.stakingProxy,
                        functionSelector: selectors.removeAuthorizedAddressAtIndex,
                        newTimelockSeconds: new BigNumber(twoWeeksInSeconds),
                        hasCustomTimelock: true,
                    },
                     {
                        destination: contractWrappers.contractAddresses.stakingProxy,
                        functionSelector: selectors.transferOwnership,
                        newTimelockSeconds: new BigNumber(twoWeeksInSeconds),
                        hasCustomTimelock: true,
                    },

                    // ZRX Vault
                ],
                "FunctionCallTimeLockRegistration"
            );



            // Fetch Final Staking Params
            const stakingParamsFinal = await stakingContract.getParams().callAsync();
            const epochEndTimeFinal = await stakingContract.getCurrentEpochEarliestEndTimeInSeconds().callAsync();
            */

            // Extra sanity check on Updated Staking Params

            // Fast-Forward to end of epoch

            // Check that epoch can be ended.
        });
    });
});
