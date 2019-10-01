import {
    artifacts as assetProxyArtifacts,
    ERC1155ProxyContract,
    ERC20ProxyContract,
    ERC721ProxyContract,
    MultiAssetProxyContract,
    StaticCallProxyContract,
} from '@0x/contracts-asset-proxy';
import { artifacts as multisigArtifacts, AssetProxyOwnerContract } from '@0x/contracts-multisig';
import {
    artifacts as stakingArtifacts,
    ReadOnlyProxyContract,
    StakingContract,
    StakingEvents,
    StakingExchangeAddedEventArgs,
    StakingProxyContract,
} from '@0x/contracts-staking';
import { blockchainTests, constants, expect, filterLogsToArguments } from '@0x/contracts-test-utils';
import {
    AuthorizableAuthorizedAddressAddedEventArgs,
    AuthorizableAuthorizedAddressRemovedEventArgs,
    AuthorizableEvents,
} from '@0x/contracts-utils';
import { AssetProxyId } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { TxData } from 'ethereum-types';

import {
    artifacts as exchangeArtifacts,
    AssetProxyDispatcher,
    Authorizable,
    ExchangeAssetProxyRegisteredEventArgs,
    ExchangeContract,
    ExchangeEvents,
    ExchangeProtocolFeeCollectorAddressEventArgs,
    ExchangeProtocolFeeMultiplierEventArgs,
    Ownable,
} from '../../src';

// tslint:disable:no-unnecessary-type-assertion
blockchainTests('Deployment and Configuration End to End Tests', env => {
    // Available Addresses
    let owner: string;

    // Contract Instances
    let assetProxyOwner: AssetProxyOwnerContract;
    let erc20Proxy: ERC20ProxyContract;
    let erc721Proxy: ERC721ProxyContract;
    let erc1155Proxy: ERC1155ProxyContract;
    let exchange: ExchangeContract;
    let multiAssetProxy: MultiAssetProxyContract;
    let readOnlyProxy: ReadOnlyProxyContract;
    let staking: StakingContract;
    let staticCallProxy: StaticCallProxyContract;
    let stakingProxy: StakingProxyContract;
    let stakingWrapper: StakingContract;

    // TxDefaults
    let txDefaults: Partial<TxData>;

    // ChainId of the Exchange
    let chainId: number;

    // Protocol Fees
    const protocolFeeMultiplier = new BigNumber(150000);

    before(async () => {
        // Get the chain ID.
        chainId = await env.getChainIdAsync();

        // Create accounts and tx defaults
        [owner] = await env.getAccountAddressesAsync();
        txDefaults = {
            ...env.txDefaults,
            from: owner,
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
            new BigNumber(chainId),
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

        // Deploy the staking proxy.
        stakingProxy = await StakingProxyContract.deployFrom0xArtifactAsync(
            stakingArtifacts.StakingProxy,
            env.provider,
            txDefaults,
            stakingArtifacts,
            staking.address,
            readOnlyProxy.address,
        );

        // Deploy the asset proxy contracts.
        erc20Proxy = await ERC20ProxyContract.deployFrom0xArtifactAsync(
            assetProxyArtifacts.ERC20Proxy,
            env.provider,
            txDefaults,
            assetProxyArtifacts,
        );
        erc721Proxy = await ERC721ProxyContract.deployFrom0xArtifactAsync(
            assetProxyArtifacts.ERC721Proxy,
            env.provider,
            txDefaults,
            assetProxyArtifacts,
        );
        erc1155Proxy = await ERC1155ProxyContract.deployFrom0xArtifactAsync(
            assetProxyArtifacts.ERC1155Proxy,
            env.provider,
            txDefaults,
            assetProxyArtifacts,
        );
        multiAssetProxy = await MultiAssetProxyContract.deployFrom0xArtifactAsync(
            assetProxyArtifacts.MultiAssetProxy,
            env.provider,
            txDefaults,
            assetProxyArtifacts,
        );
        staticCallProxy = await StaticCallProxyContract.deployFrom0xArtifactAsync(
            assetProxyArtifacts.StaticCallProxy,
            env.provider,
            txDefaults,
            assetProxyArtifacts,
        );

        // Set up the staking wrapper so that the entire staking interface can be accessed
        // easily through the proxy.
        stakingWrapper = new StakingContract(stakingProxy.address, env.provider);
    });

    describe('deployment and configuration', () => {
        describe('exchange specific', () => {
            // Registers an asset proxy in the exchange contract and ensure that the correct state changes occurred.
            async function registerAssetProxyAndAssertSuccessAsync(
                registrationContract: AssetProxyDispatcher,
                assetProxyAddress: string,
                assetProxyId: string,
            ): Promise<void> {
                // Register the asset proxy.
                const receipt = await registrationContract.registerAssetProxy.awaitTransactionSuccessAsync(
                    assetProxyAddress,
                    {
                        from: owner,
                    },
                );

                // Ensure that the correct event was logged.
                const logs = filterLogsToArguments<ExchangeAssetProxyRegisteredEventArgs>(
                    receipt.logs,
                    ExchangeEvents.AssetProxyRegistered,
                );
                expect(logs).to.be.deep.eq([{ id: assetProxyId, assetProxy: assetProxyAddress }]);

                // Ensure that the asset proxy was actually registered.
                const proxyAddress = await registrationContract.getAssetProxy.callAsync(assetProxyId);
                expect(proxyAddress).to.be.eq(assetProxyAddress);
            }

            // Authorizes an address for a given asset proxy using the owner address.
            async function authorizeAddressAndAssertSuccessAsync(
                authorizable: Authorizable,
                newAuthorityAddress: string,
            ): Promise<void> {
                // Authorize the address.
                const receipt = await authorizable.addAuthorizedAddress.awaitTransactionSuccessAsync(
                    newAuthorityAddress,
                    { from: owner },
                );

                // Ensure that the correct log was emitted.
                const logs = filterLogsToArguments<AuthorizableAuthorizedAddressAddedEventArgs>(
                    receipt.logs,
                    AuthorizableEvents.AuthorizedAddressAdded,
                );
                expect(logs).to.be.deep.eq([{ target: newAuthorityAddress, caller: owner }]);

                // Ensure that the address was actually authorized.
                const wasAuthorized = await authorizable.authorized.callAsync(newAuthorityAddress);
                expect(wasAuthorized).to.be.true();
            }

            it('should successfully register the asset proxies in the exchange', async () => {
                // Register the asset proxies in the exchange.
                await registerAssetProxyAndAssertSuccessAsync(exchange, erc20Proxy.address, AssetProxyId.ERC20);
                await registerAssetProxyAndAssertSuccessAsync(exchange, erc721Proxy.address, AssetProxyId.ERC721);
                await registerAssetProxyAndAssertSuccessAsync(exchange, erc1155Proxy.address, AssetProxyId.ERC1155);
                await registerAssetProxyAndAssertSuccessAsync(
                    exchange,
                    multiAssetProxy.address,
                    AssetProxyId.MultiAsset,
                );
                await registerAssetProxyAndAssertSuccessAsync(
                    exchange,
                    staticCallProxy.address,
                    AssetProxyId.StaticCall,
                );
            });

            it('should successfully register the asset proxies in the multi-asset proxy', async () => {
                // Register the asset proxies in the multi-asset proxy.
                await registerAssetProxyAndAssertSuccessAsync(multiAssetProxy, erc20Proxy.address, AssetProxyId.ERC20);
                await registerAssetProxyAndAssertSuccessAsync(
                    multiAssetProxy,
                    erc721Proxy.address,
                    AssetProxyId.ERC721,
                );
                await registerAssetProxyAndAssertSuccessAsync(
                    multiAssetProxy,
                    erc1155Proxy.address,
                    AssetProxyId.ERC1155,
                );
                await registerAssetProxyAndAssertSuccessAsync(
                    multiAssetProxy,
                    staticCallProxy.address,
                    AssetProxyId.StaticCall,
                );
            });

            it('should successfully add the exchange as an authority in the appropriate asset proxies', async () => {
                // Authorize the exchange in all of the asset proxies, except for the static call proxy.
                await authorizeAddressAndAssertSuccessAsync(erc20Proxy, exchange.address);
                await authorizeAddressAndAssertSuccessAsync(erc721Proxy, exchange.address);
                await authorizeAddressAndAssertSuccessAsync(erc1155Proxy, exchange.address);
                await authorizeAddressAndAssertSuccessAsync(multiAssetProxy, exchange.address);
            });

            it('should successfully add the multi asset proxy as an authority in the appropriate asset proxies', async () => {
                // Authorize the multi-asset proxy in the token asset proxies.
                await authorizeAddressAndAssertSuccessAsync(erc20Proxy, multiAssetProxy.address);
                await authorizeAddressAndAssertSuccessAsync(erc721Proxy, multiAssetProxy.address);
                await authorizeAddressAndAssertSuccessAsync(erc1155Proxy, multiAssetProxy.address);
            });
        });

        describe('staking specific', () => {
            it('should have properly configured the staking proxy with the logic contract and read-only proxy', async () => {
                // Ensure that the registered read-only proxy is correct.
                const readOnlyProxyAddress = await stakingProxy.readOnlyProxy.callAsync();
                expect(readOnlyProxyAddress).to.be.eq(readOnlyProxy.address);

                // Ensure that the registered read-only proxy callee is correct.
                const readOnlyProxyCalleeAddress = await stakingProxy.readOnlyProxyCallee.callAsync();
                expect(readOnlyProxyCalleeAddress).to.be.eq(staking.address);

                // Ensure that the registered staking contract is correct.
                const stakingAddress = await stakingProxy.stakingContract.callAsync();
                expect(stakingAddress).to.be.eq(staking.address);
            });

            it('should have initialized the correct parameters in the staking proxy', async () => {
                // Ensure that the correct parameters were set.
                const params = await stakingWrapper.getParams.callAsync();
                expect(params).to.be.deep.eq(
                    [
                        864000, // epochDurationInSeconds
                        900000, // rewardDelegatedStakeWeight
                        100000000000000000000, // minimumPoolStake
                        10, // maximumMakerInPool
                        1, // cobbDouglasAlphaNumerator
                        2, // cobbDouglasAlphaDenominator
                    ].map(value => new BigNumber(value)),
                );
            });
        });

        describe('exchange and staking integration', () => {
            it('should successfully register the exchange in the staking contract', async () => {
                // Register the exchange.
                const receipt = await stakingWrapper.addExchangeAddress.awaitTransactionSuccessAsync(exchange.address, {
                    from: owner,
                });

                // Ensure that the correct events were logged.
                const logs = filterLogsToArguments<StakingExchangeAddedEventArgs>(
                    receipt.logs,
                    StakingEvents.ExchangeAdded,
                );
                expect(logs).to.be.deep.eq([{ exchangeAddress: exchange.address }]);

                // Ensure that the exchange was registered.
                const wasRegistered = await stakingWrapper.validExchanges.callAsync(exchange.address);
                expect(wasRegistered).to.be.true();
            });

            it('should successfully register the staking contract in the exchange', async () => {
                // Register the staking contract.
                const receipt = await exchange.setProtocolFeeCollectorAddress.awaitTransactionSuccessAsync(
                    stakingProxy.address,
                    {
                        from: owner,
                    },
                );

                // Ensure that the correct events were logged.
                const logs = filterLogsToArguments<ExchangeProtocolFeeCollectorAddressEventArgs>(
                    receipt.logs,
                    ExchangeEvents.ProtocolFeeCollectorAddress,
                );
                expect(logs).to.be.deep.eq([
                    {
                        oldProtocolFeeCollector: constants.NULL_ADDRESS,
                        updatedProtocolFeeCollector: stakingProxy.address,
                    },
                ]);

                // Ensure that the staking contract was registered.
                const feeCollector = await exchange.protocolFeeCollector.callAsync();
                expect(feeCollector).to.be.eq(stakingProxy.address);
            });

            it('should successfully update the protocol fee multiplier in the staking contract', async () => {
                // Update the protocol fee multiplier.
                const receipt = await exchange.setProtocolFeeMultiplier.awaitTransactionSuccessAsync(
                    protocolFeeMultiplier,
                );

                // Ensure that the correct events were logged.
                const logs = filterLogsToArguments<ExchangeProtocolFeeMultiplierEventArgs>(
                    receipt.logs,
                    ExchangeEvents.ProtocolFeeMultiplier,
                );
                expect(logs).to.be.deep.eq([
                    {
                        oldProtocolFeeMultiplier: constants.ZERO_AMOUNT,
                        updatedProtocolFeeMultiplier: protocolFeeMultiplier,
                    },
                ]);

                // Ensure that the protocol fee multiplier was set correctly.
                const multiplier = await exchange.protocolFeeMultiplier.callAsync();
                expect(multiplier).bignumber.to.be.eq(protocolFeeMultiplier);
            });
        });
    });

    describe('transferring ownership', () => {
        // Removes authorization of the "externally owned address" owner and transfers the authorization
        // to the asset proxy owner.
        async function transferAuthorizationAndAssertSuccessAsync(contract: Authorizable): Promise<void> {
            // Remove authorization from the old owner.
            let receipt = await contract.removeAuthorizedAddress.awaitTransactionSuccessAsync(owner, { from: owner });

            // Ensure that the correct log was recorded.
            let logs = filterLogsToArguments<AuthorizableAuthorizedAddressRemovedEventArgs>(
                receipt.logs,
                AuthorizableEvents.AuthorizedAddressRemoved,
            );
            expect(logs).to.be.deep.eq([{ target: owner, caller: owner }]);

            // Ensure that the owner was actually removed.
            let isAuthorized = await contract.authorized.callAsync(owner);
            expect(isAuthorized).to.be.false();

            // Authorize the asset-proxy owner.
            receipt = await contract.addAuthorizedAddress.awaitTransactionSuccessAsync(assetProxyOwner.address, {
                from: owner,
            });

            // Ensure that the correct log was recorded.
            logs = filterLogsToArguments<AuthorizableAuthorizedAddressAddedEventArgs>(
                receipt.logs,
                AuthorizableEvents.AuthorizedAddressAdded,
            );
            expect(logs).to.be.deep.eq([{ target: assetProxyOwner.address, caller: owner }]);

            // Ensure that the asset-proxy owner was actually authorized.
            isAuthorized = await contract.authorized.callAsync(assetProxyOwner.address);
            expect(isAuthorized).to.be.true();
        }

        // Transfers ownership of a contract to the asset-proxy owner, and ensures that the change was actually made.
        async function transferOwnershipAndAssertSuccessAsync(contract: Ownable): Promise<void> {
            // Transfer ownership to the new owner.
            await contract.transferOwnership.awaitTransactionSuccessAsync(assetProxyOwner.address, { from: owner });

            // Ensure that the owner address has been updated.
            const ownerAddress = await contract.owner.callAsync();
            expect(ownerAddress).to.be.eq(assetProxyOwner.address);
        }

        it('should transfer authorization of the owner to the asset-proxy owner in the staking contracts', async () => {
            // Transfer authorization of the staking system. We intentionally neglect
            // to add the asset-proxy owner as an authorized address in the asset proxies
            // as a security precaution.
            await transferAuthorizationAndAssertSuccessAsync(readOnlyProxy);
            await transferAuthorizationAndAssertSuccessAsync(staking);
            await transferAuthorizationAndAssertSuccessAsync(stakingProxy);
        });

        it('should transfer ownership of all appropriate contracts to the asset-proxy owner', async () => {
            // Transfer ownership of most contracts (we exclude contracts that are not ownable).
            await transferOwnershipAndAssertSuccessAsync(exchange);
            await transferOwnershipAndAssertSuccessAsync(readOnlyProxy);
            await transferOwnershipAndAssertSuccessAsync(staking);
            await transferOwnershipAndAssertSuccessAsync(stakingProxy);
            await transferOwnershipAndAssertSuccessAsync(erc20Proxy);
            await transferOwnershipAndAssertSuccessAsync(erc721Proxy);
            await transferOwnershipAndAssertSuccessAsync(erc1155Proxy);
            await transferOwnershipAndAssertSuccessAsync(multiAssetProxy);
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
