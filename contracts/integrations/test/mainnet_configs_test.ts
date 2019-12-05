import { ERC20ProxyContract, MultiAssetProxyContract } from '@0x/contracts-asset-proxy';
import { StakingProxyContract, ZrxVaultContract } from '@0x/contracts-staking';
import { blockchainTests, describe, expect } from '@0x/contracts-test-utils';
import { AssetProxyId } from '@0x/types';
import { BigNumber } from '@0x/utils';

import { contractAddresses, contractWrappers } from './mainnet_fork_utils';

blockchainTests.resets.fork('Mainnet configs tests', env => {
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
});
