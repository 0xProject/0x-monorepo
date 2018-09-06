import { web3Factory } from '@0xproject/dev-utils';
import { assetDataUtils } from '@0xproject/order-utils';
import * as chai from 'chai';
import * as _ from 'lodash';

import { AssetProxyOwnerContract } from '../src/2.0.0/contract_wrappers/asset_proxy_owner';
import { ERC20ProxyContract } from '../src/2.0.0/contract_wrappers/erc20_proxy';
import { ERC721ProxyContract } from '../src/2.0.0/contract_wrappers/erc721_proxy';
import { ExchangeContract } from '../src/2.0.0/contract_wrappers/exchange';

import { artifacts } from '../src/2.0.0/artifacts';
import { networks } from '../src/2.0.0/networks';
import { chaiSetup } from '../src/utils/chai_setup';
import { constants } from '../src/utils/constants';

chaiSetup.configure();
const expect = chai.expect;

describe('Deployed contracts', () => {
    _.forEach(networks, (network, networkName) => {
        describe(`Testing ${networkName} deployment`, () => {
            const providerConfigs = { rpcUrl: network.rpcUrl };
            const provider = web3Factory.getRpcProvider(providerConfigs);
            describe('Exchange', () => {
                const exchange = new ExchangeContract(
                    artifacts.Exchange.compilerOutput.abi,
                    network.exchange,
                    provider,
                );
                it('should have the correct ZRX_ASSET_DATA', async () => {
                    const zrxAssetData = await exchange.ZRX_ASSET_DATA.callAsync();
                    expect(zrxAssetData).to.be.equal(assetDataUtils.encodeERC20AssetData(network.zrx));
                });
                it('should have registered the ERC20Proxy', async () => {
                    const registeredERC20Proxy = await exchange.getAssetProxy.callAsync(constants.ERC20_PROXY_ID);
                    expect(registeredERC20Proxy).to.be.equal(network.erc20Proxy);
                });
                it('should have registered the ERC721Proxy', async () => {
                    const registeredERC721Proxy = await exchange.getAssetProxy.callAsync(constants.ERC721_PROXY_ID);
                    expect(registeredERC721Proxy).to.be.equal(network.erc721Proxy);
                });
                it('should be owned by the AssetProxyOwner', async () => {
                    const owner = await exchange.owner.callAsync();
                    expect(owner).to.be.equal(network.assetProxyOwner);
                });
            });
            describe('ERC20Proxy', () => {
                const erc20Proxy = new ERC20ProxyContract(
                    artifacts.ERC20Proxy.compilerOutput.abi,
                    network.erc20Proxy,
                    provider,
                );
                it('should have the correct id', async () => {
                    const erc20ProxyId = await erc20Proxy.getProxyId.callAsync();
                    expect(erc20ProxyId).to.be.equal(constants.ERC20_PROXY_ID);
                });
                it('should have a single authorized address', async () => {
                    const authorities = await erc20Proxy.getAuthorizedAddresses.callAsync();
                    expect(authorities.length).to.be.equal(1);
                });
                it('should have the Exchange as an authorized address', async () => {
                    const isAuthorized = await erc20Proxy.authorized.callAsync(network.exchange);
                    expect(isAuthorized).to.be.equal(true);
                });
                it('should be owned by the AssetProxyOwner', async () => {
                    const owner = await erc20Proxy.owner.callAsync();
                    expect(owner).to.be.equal(network.assetProxyOwner);
                });
            });
            describe('ERC721Proxy', () => {
                const erc721Proxy = new ERC721ProxyContract(
                    artifacts.ERC721Proxy.compilerOutput.abi,
                    network.erc721Proxy,
                    provider,
                );
                it('should have the correct id', async () => {
                    const erc721ProxyId = await erc721Proxy.getProxyId.callAsync();
                    expect(erc721ProxyId).to.be.equal(constants.ERC721_PROXY_ID);
                });
                it('should have a single authorized address', async () => {
                    const authorities = await erc721Proxy.getAuthorizedAddresses.callAsync();
                    expect(authorities.length).to.be.equal(1);
                });
                it('should have the Exchange as an authorized address', async () => {
                    const isAuthorized = await erc721Proxy.authorized.callAsync(network.exchange);
                    expect(isAuthorized).to.be.equal(true);
                });
                it('should be owned by the AssetProxyOwner', async () => {
                    const owner = await erc721Proxy.owner.callAsync();
                    expect(owner).to.be.equal(network.assetProxyOwner);
                });
            });
            describe('AssetProxyOwner', () => {
                const assetProxyOwner = new AssetProxyOwnerContract(
                    artifacts.AssetProxyOwner.compilerOutput.abi,
                    network.assetProxyOwner,
                    provider,
                );
                it('should have registered the ERC20Proxy', async () => {
                    const isRegistered = await assetProxyOwner.isAssetProxyRegistered.callAsync(network.erc20Proxy);
                    expect(isRegistered).to.be.equal(true);
                });
                it('should have registered the ERC721Proxy', async () => {
                    const isRegistered = await assetProxyOwner.isAssetProxyRegistered.callAsync(network.erc721Proxy);
                    expect(isRegistered).to.be.equal(true);
                });
                it('should have the correct owners', async () => {
                    const owners = await assetProxyOwner.getOwners.callAsync();
                    expect(owners).to.deep.equal(network.assetProxyOwnerOwners);
                });
                it('should have the correct required confirmations', async () => {
                    const requiredConfirmations = await assetProxyOwner.required.callAsync();
                    expect(requiredConfirmations).to.be.bignumber.equal(network.assetProxyOwnerRequiredConfirmations);
                });
                it('should have the correct timelock', async () => {
                    const secondsTimeLocked = await assetProxyOwner.secondsTimeLocked.callAsync();
                    expect(secondsTimeLocked).to.be.bignumber.equal(network.assetProxyOwnerSecondsTimeLocked);
                });
            });
        });
    });
});
