import { ERC1155MintableContract, Erc1155Wrapper } from '@0x/contracts-erc1155';
import {
    artifacts as erc20Artifacts,
    DummyERC20TokenContract,
    DummyERC20TokenTransferEventArgs,
    DummyMultipleReturnERC20TokenContract,
    DummyNoReturnERC20TokenContract,
} from '@0x/contracts-erc20';
import {
    artifacts as erc721Artifacts,
    DummyERC721ReceiverContract,
    DummyERC721TokenContract,
} from '@0x/contracts-erc721';
import {
    chaiSetup,
    constants,
    expectTransactionFailedAsync,
    expectTransactionFailedWithoutReasonAsync,
    LogDecoder,
    provider,
    txDefaults,
    web3Wrapper,
} from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { assetDataUtils } from '@0x/order-utils';
import { AssetProxyId, RevertReason } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import { LogWithDecodedArgs } from 'ethereum-types';
import * as _ from 'lodash';

import {
    artifacts,
    ERC1155ProxyContract,
    ERC1155ProxyWrapper,
    ERC20ProxyContract,
    ERC20Wrapper,
    ERC721ProxyContract,
    ERC721Wrapper,
    IAssetDataContract,
    IAssetProxyContract,
    MultiAssetProxyContract,
} from '../src';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
const assetProxyInterface = new IAssetProxyContract(constants.NULL_ADDRESS, provider);
const assetDataInterface = new IAssetDataContract(constants.NULL_ADDRESS, provider);

// tslint:disable:no-unnecessary-type-assertion
describe('Asset Transfer Proxies', () => {
    let owner: string;
    let notAuthorized: string;
    let authorized: string;
    let fromAddress: string;
    let toAddress: string;

    let erc20TokenA: DummyERC20TokenContract;
    let erc20TokenB: DummyERC20TokenContract;
    let erc721TokenA: DummyERC721TokenContract;
    let erc721TokenB: DummyERC721TokenContract;
    let erc721Receiver: DummyERC721ReceiverContract;
    let erc20Proxy: ERC20ProxyContract;
    let erc721Proxy: ERC721ProxyContract;
    let noReturnErc20Token: DummyNoReturnERC20TokenContract;
    let multipleReturnErc20Token: DummyMultipleReturnERC20TokenContract;
    let multiAssetProxy: MultiAssetProxyContract;

    let erc20Wrapper: ERC20Wrapper;
    let erc721Wrapper: ERC721Wrapper;
    let erc721AFromTokenId: BigNumber;
    let erc721BFromTokenId: BigNumber;

    let erc1155Proxy: ERC1155ProxyContract;
    let erc1155ProxyWrapper: ERC1155ProxyWrapper;
    let erc1155Contract: ERC1155MintableContract;
    let erc1155Contract2: ERC1155MintableContract;
    let erc1155Wrapper: Erc1155Wrapper;
    let erc1155Wrapper2: Erc1155Wrapper;
    let erc1155FungibleTokens: BigNumber[];
    let erc1155NonFungibleTokensOwnedBySpender: BigNumber[];

    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const usedAddresses = ([owner, notAuthorized, authorized, fromAddress, toAddress] = _.slice(accounts, 0, 5));

        erc20Wrapper = new ERC20Wrapper(provider, usedAddresses, owner);
        erc721Wrapper = new ERC721Wrapper(provider, usedAddresses, owner);

        // Deploy AssetProxies
        erc20Proxy = await erc20Wrapper.deployProxyAsync();
        erc721Proxy = await erc721Wrapper.deployProxyAsync();
        multiAssetProxy = await MultiAssetProxyContract.deployFrom0xArtifactAsync(
            artifacts.MultiAssetProxy,
            provider,
            txDefaults,
            artifacts,
        );

        // Configure ERC20Proxy
        await erc20Proxy.addAuthorizedAddress.awaitTransactionSuccessAsync(
            authorized,
            { from: owner },
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await erc20Proxy.addAuthorizedAddress.awaitTransactionSuccessAsync(
            multiAssetProxy.address,
            { from: owner },
            constants.AWAIT_TRANSACTION_MINED_MS,
        );

        // Configure ERC721Proxy
        await erc721Proxy.addAuthorizedAddress.awaitTransactionSuccessAsync(
            authorized,
            { from: owner },
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await erc721Proxy.addAuthorizedAddress.awaitTransactionSuccessAsync(
            multiAssetProxy.address,
            { from: owner },
            constants.AWAIT_TRANSACTION_MINED_MS,
        );

        // Configure ERC115Proxy
        erc1155ProxyWrapper = new ERC1155ProxyWrapper(provider, usedAddresses, owner);
        erc1155Proxy = await erc1155ProxyWrapper.deployProxyAsync();
        await erc1155Proxy.addAuthorizedAddress.awaitTransactionSuccessAsync(
            authorized,
            { from: owner },
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await erc1155Proxy.addAuthorizedAddress.awaitTransactionSuccessAsync(
            multiAssetProxy.address,
            { from: owner },
            constants.AWAIT_TRANSACTION_MINED_MS,
        );

        // Configure MultiAssetProxy
        await multiAssetProxy.addAuthorizedAddress.awaitTransactionSuccessAsync(
            authorized,
            { from: owner },
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await multiAssetProxy.registerAssetProxy.awaitTransactionSuccessAsync(
            erc20Proxy.address,
            { from: owner },
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await multiAssetProxy.registerAssetProxy.awaitTransactionSuccessAsync(
            erc721Proxy.address,
            { from: owner },
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await multiAssetProxy.registerAssetProxy.awaitTransactionSuccessAsync(
            erc1155Proxy.address,
            { from: owner },
            constants.AWAIT_TRANSACTION_MINED_MS,
        );

        // Deploy and configure ERC20 tokens
        const numDummyErc20ToDeploy = 2;
        [erc20TokenA, erc20TokenB] = await erc20Wrapper.deployDummyTokensAsync(
            numDummyErc20ToDeploy,
            constants.DUMMY_TOKEN_DECIMALS,
        );
        noReturnErc20Token = await DummyNoReturnERC20TokenContract.deployFrom0xArtifactAsync(
            erc20Artifacts.DummyNoReturnERC20Token,
            provider,
            txDefaults,
            artifacts,
            constants.DUMMY_TOKEN_NAME,
            constants.DUMMY_TOKEN_SYMBOL,
            constants.DUMMY_TOKEN_DECIMALS,
            constants.DUMMY_TOKEN_TOTAL_SUPPLY,
        );
        multipleReturnErc20Token = await DummyMultipleReturnERC20TokenContract.deployFrom0xArtifactAsync(
            erc20Artifacts.DummyMultipleReturnERC20Token,
            provider,
            txDefaults,
            artifacts,
            constants.DUMMY_TOKEN_NAME,
            constants.DUMMY_TOKEN_SYMBOL,
            constants.DUMMY_TOKEN_DECIMALS,
            constants.DUMMY_TOKEN_TOTAL_SUPPLY,
        );

        await erc20Wrapper.setBalancesAndAllowancesAsync();
        await noReturnErc20Token.setBalance.awaitTransactionSuccessAsync(
            fromAddress,
            constants.INITIAL_ERC20_BALANCE,
            {
                from: owner,
            },
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await noReturnErc20Token.approve.awaitTransactionSuccessAsync(
            erc20Proxy.address,
            constants.INITIAL_ERC20_ALLOWANCE,
            { from: fromAddress },
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await multipleReturnErc20Token.setBalance.awaitTransactionSuccessAsync(
            fromAddress,
            constants.INITIAL_ERC20_BALANCE,
            {
                from: owner,
            },
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await multipleReturnErc20Token.approve.awaitTransactionSuccessAsync(
            erc20Proxy.address,
            constants.INITIAL_ERC20_ALLOWANCE,
            { from: fromAddress },
            constants.AWAIT_TRANSACTION_MINED_MS,
        );

        // Deploy and configure ERC721 tokens and receiver
        [erc721TokenA, erc721TokenB] = await erc721Wrapper.deployDummyTokensAsync();
        erc721Receiver = await DummyERC721ReceiverContract.deployFrom0xArtifactAsync(
            erc721Artifacts.DummyERC721Receiver,
            provider,
            txDefaults,
            artifacts,
        );

        await erc721Wrapper.setBalancesAndAllowancesAsync();
        const erc721Balances = await erc721Wrapper.getBalancesAsync();
        erc721AFromTokenId = erc721Balances[fromAddress][erc721TokenA.address][0];
        erc721BFromTokenId = erc721Balances[fromAddress][erc721TokenB.address][0];

        // Deploy & configure ERC1155 tokens and receiver
        [erc1155Wrapper, erc1155Wrapper2] = await erc1155ProxyWrapper.deployDummyContractsAsync();
        erc1155Contract = erc1155Wrapper.getContract();
        erc1155Contract2 = erc1155Wrapper2.getContract();
        await erc1155ProxyWrapper.setBalancesAndAllowancesAsync();
        erc1155FungibleTokens = erc1155ProxyWrapper.getFungibleTokenIds();
        const nonFungibleTokens = erc1155ProxyWrapper.getNonFungibleTokenIds();
        const tokenBalances = await erc1155ProxyWrapper.getBalancesAsync();
        erc1155NonFungibleTokensOwnedBySpender = [];
        _.each(nonFungibleTokens, (nonFungibleToken: BigNumber) => {
            const nonFungibleTokenAsString = nonFungibleToken.toString();
            const nonFungibleTokenHeldBySpender =
                tokenBalances.nonFungible[fromAddress][erc1155Contract.address][nonFungibleTokenAsString][0];
            erc1155NonFungibleTokensOwnedBySpender.push(nonFungibleTokenHeldBySpender);
        });
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('ERC20Proxy', () => {
        it('should revert if undefined function is called', async () => {
            const undefinedSelector = '0x01020304';
            await expectTransactionFailedWithoutReasonAsync(
                web3Wrapper.sendTransactionAsync({
                    from: owner,
                    to: erc20Proxy.address,
                    value: constants.ZERO_AMOUNT,
                    data: undefinedSelector,
                }),
            );
        });
        it('should have an id of 0xf47261b0', async () => {
            const proxyId = await erc20Proxy.getProxyId.callAsync();
            const expectedProxyId = '0xf47261b0';
            expect(proxyId).to.equal(expectedProxyId);
        });
        describe('transferFrom', () => {
            it('should successfully transfer tokens', async () => {
                // Construct ERC20 asset data
                const encodedAssetData = assetDataUtils.encodeERC20AssetData(erc20TokenA.address);
                // Perform a transfer from fromAddress to toAddress
                const erc20Balances = await erc20Wrapper.getBalancesAsync();
                const amount = new BigNumber(10);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    fromAddress,
                    toAddress,
                    amount,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: erc20Proxy.address,
                        data,
                        from: authorized,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                // Verify transfer was successful
                const newBalances = await erc20Wrapper.getBalancesAsync();
                expect(newBalances[fromAddress][erc20TokenA.address]).to.be.bignumber.equal(
                    erc20Balances[fromAddress][erc20TokenA.address].minus(amount),
                );
                expect(newBalances[toAddress][erc20TokenA.address]).to.be.bignumber.equal(
                    erc20Balances[toAddress][erc20TokenA.address].plus(amount),
                );
            });

            it('should successfully transfer tokens that do not return a value', async () => {
                // Construct ERC20 asset data
                const encodedAssetData = assetDataUtils.encodeERC20AssetData(noReturnErc20Token.address);
                // Perform a transfer from fromAddress to toAddress
                const initialFromBalance = await noReturnErc20Token.balanceOf.callAsync(fromAddress);
                const initialToBalance = await noReturnErc20Token.balanceOf.callAsync(toAddress);
                const amount = new BigNumber(10);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    fromAddress,
                    toAddress,
                    amount,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: erc20Proxy.address,
                        data,
                        from: authorized,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                // Verify transfer was successful
                const newFromBalance = await noReturnErc20Token.balanceOf.callAsync(fromAddress);
                const newToBalance = await noReturnErc20Token.balanceOf.callAsync(toAddress);
                expect(newFromBalance).to.be.bignumber.equal(initialFromBalance.minus(amount));
                expect(newToBalance).to.be.bignumber.equal(initialToBalance.plus(amount));
            });

            it('should successfully transfer tokens and ignore extra assetData', async () => {
                // Construct ERC20 asset data
                const extraData = '0102030405060708';
                const encodedAssetData = `${assetDataUtils.encodeERC20AssetData(erc20TokenA.address)}${extraData}`;
                // Perform a transfer from fromAddress to toAddress
                const erc20Balances = await erc20Wrapper.getBalancesAsync();
                const amount = new BigNumber(10);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    fromAddress,
                    toAddress,
                    amount,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: erc20Proxy.address,
                        data,
                        from: authorized,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                // Verify transfer was successful
                const newBalances = await erc20Wrapper.getBalancesAsync();
                expect(newBalances[fromAddress][erc20TokenA.address]).to.be.bignumber.equal(
                    erc20Balances[fromAddress][erc20TokenA.address].minus(amount),
                );
                expect(newBalances[toAddress][erc20TokenA.address]).to.be.bignumber.equal(
                    erc20Balances[toAddress][erc20TokenA.address].plus(amount),
                );
            });

            it('should do nothing if transferring 0 amount of a token', async () => {
                // Construct ERC20 asset data
                const encodedAssetData = assetDataUtils.encodeERC20AssetData(erc20TokenA.address);
                // Perform a transfer from fromAddress to toAddress
                const erc20Balances = await erc20Wrapper.getBalancesAsync();
                const amount = new BigNumber(0);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    fromAddress,
                    toAddress,
                    amount,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: erc20Proxy.address,
                        data,
                        from: authorized,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                // Verify transfer was successful
                const newBalances = await erc20Wrapper.getBalancesAsync();
                expect(newBalances[fromAddress][erc20TokenA.address]).to.be.bignumber.equal(
                    erc20Balances[fromAddress][erc20TokenA.address],
                );
                expect(newBalances[toAddress][erc20TokenA.address]).to.be.bignumber.equal(
                    erc20Balances[toAddress][erc20TokenA.address],
                );
            });

            it('should revert if allowances are too low', async () => {
                // Construct ERC20 asset data
                const encodedAssetData = assetDataUtils.encodeERC20AssetData(erc20TokenA.address);
                // Create allowance less than transfer amount. Set allowance on proxy.
                const allowance = new BigNumber(0);
                const amount = new BigNumber(10);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    fromAddress,
                    toAddress,
                    amount,
                );
                await erc20TokenA.approve.awaitTransactionSuccessAsync(
                    erc20Proxy.address,
                    allowance,
                    { from: fromAddress },
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                const erc20Balances = await erc20Wrapper.getBalancesAsync();
                // Perform a transfer; expect this to fail.
                await expectTransactionFailedAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: erc20Proxy.address,
                        data,
                        from: authorized,
                    }),
                    RevertReason.TransferFailed,
                );
                const newBalances = await erc20Wrapper.getBalancesAsync();
                expect(newBalances).to.deep.equal(erc20Balances);
            });

            it('should revert if allowances are too low and token does not return a value', async () => {
                // Construct ERC20 asset data
                const encodedAssetData = assetDataUtils.encodeERC20AssetData(noReturnErc20Token.address);
                // Create allowance less than transfer amount. Set allowance on proxy.
                const allowance = new BigNumber(0);
                const amount = new BigNumber(10);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    fromAddress,
                    toAddress,
                    amount,
                );
                await noReturnErc20Token.approve.awaitTransactionSuccessAsync(
                    erc20Proxy.address,
                    allowance,
                    { from: fromAddress },
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                const initialFromBalance = await noReturnErc20Token.balanceOf.callAsync(fromAddress);
                const initialToBalance = await noReturnErc20Token.balanceOf.callAsync(toAddress);
                // Perform a transfer; expect this to fail.
                await expectTransactionFailedAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: erc20Proxy.address,
                        data,
                        from: authorized,
                    }),
                    RevertReason.TransferFailed,
                );
                const newFromBalance = await noReturnErc20Token.balanceOf.callAsync(fromAddress);
                const newToBalance = await noReturnErc20Token.balanceOf.callAsync(toAddress);
                expect(newFromBalance).to.be.bignumber.equal(initialFromBalance);
                expect(newToBalance).to.be.bignumber.equal(initialToBalance);
            });

            it('should revert if caller is not authorized', async () => {
                // Construct ERC20 asset data
                const encodedAssetData = assetDataUtils.encodeERC20AssetData(erc20TokenA.address);
                // Perform a transfer from fromAddress to toAddress
                const amount = new BigNumber(10);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    fromAddress,
                    toAddress,
                    amount,
                );
                const erc20Balances = await erc20Wrapper.getBalancesAsync();
                await expectTransactionFailedAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: erc20Proxy.address,
                        data,
                        from: notAuthorized,
                    }),
                    RevertReason.SenderNotAuthorized,
                );
                const newBalances = await erc20Wrapper.getBalancesAsync();
                expect(newBalances).to.deep.equal(erc20Balances);
            });

            it('should revert if token returns more than 32 bytes', async () => {
                // Construct ERC20 asset data
                const encodedAssetData = assetDataUtils.encodeERC20AssetData(multipleReturnErc20Token.address);
                const amount = new BigNumber(10);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    fromAddress,
                    toAddress,
                    amount,
                );
                const initialFromBalance = await multipleReturnErc20Token.balanceOf.callAsync(fromAddress);
                const initialToBalance = await multipleReturnErc20Token.balanceOf.callAsync(toAddress);
                // Perform a transfer; expect this to fail.
                await expectTransactionFailedAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: erc20Proxy.address,
                        data,
                        from: authorized,
                    }),
                    RevertReason.TransferFailed,
                );
                const newFromBalance = await multipleReturnErc20Token.balanceOf.callAsync(fromAddress);
                const newToBalance = await multipleReturnErc20Token.balanceOf.callAsync(toAddress);
                expect(newFromBalance).to.be.bignumber.equal(initialFromBalance);
                expect(newToBalance).to.be.bignumber.equal(initialToBalance);
            });
        });
    });

    describe('ERC721Proxy', () => {
        it('should revert if undefined function is called', async () => {
            const undefinedSelector = '0x01020304';
            await expectTransactionFailedWithoutReasonAsync(
                web3Wrapper.sendTransactionAsync({
                    from: owner,
                    to: erc721Proxy.address,
                    value: constants.ZERO_AMOUNT,
                    data: undefinedSelector,
                }),
            );
        });
        it('should have an id of 0x02571792', async () => {
            const proxyId = await erc721Proxy.getProxyId.callAsync();
            const expectedProxyId = '0x02571792';
            expect(proxyId).to.equal(expectedProxyId);
        });
        describe('transferFrom', () => {
            it('should successfully transfer tokens', async () => {
                // Construct ERC721 asset data
                const encodedAssetData = assetDataUtils.encodeERC721AssetData(erc721TokenA.address, erc721AFromTokenId);
                // Verify pre-condition
                const ownerFromAsset = await erc721TokenA.ownerOf.callAsync(erc721AFromTokenId);
                expect(ownerFromAsset).to.be.equal(fromAddress);
                // Perform a transfer from fromAddress to toAddress
                const amount = new BigNumber(1);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    fromAddress,
                    toAddress,
                    amount,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: erc721Proxy.address,
                        data,
                        from: authorized,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                // Verify transfer was successful
                const newOwnerFromAsset = await erc721TokenA.ownerOf.callAsync(erc721AFromTokenId);
                expect(newOwnerFromAsset).to.be.bignumber.equal(toAddress);
            });

            it('should successfully transfer tokens and ignore extra assetData', async () => {
                // Construct ERC721 asset data
                const extraData = '0102030405060708';
                const encodedAssetData = `${assetDataUtils.encodeERC721AssetData(
                    erc721TokenA.address,
                    erc721AFromTokenId,
                )}${extraData}`;
                // Verify pre-condition
                const ownerFromAsset = await erc721TokenA.ownerOf.callAsync(erc721AFromTokenId);
                expect(ownerFromAsset).to.be.equal(fromAddress);
                // Perform a transfer from fromAddress to toAddress
                const amount = new BigNumber(1);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    fromAddress,
                    toAddress,
                    amount,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: erc721Proxy.address,
                        data,
                        from: authorized,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                // Verify transfer was successful
                const newOwnerFromAsset = await erc721TokenA.ownerOf.callAsync(erc721AFromTokenId);
                expect(newOwnerFromAsset).to.be.bignumber.equal(toAddress);
            });

            it('should not call onERC721Received when transferring to a smart contract', async () => {
                // Construct ERC721 asset data
                const encodedAssetData = assetDataUtils.encodeERC721AssetData(erc721TokenA.address, erc721AFromTokenId);
                // Verify pre-condition
                const ownerFromAsset = await erc721TokenA.ownerOf.callAsync(erc721AFromTokenId);
                expect(ownerFromAsset).to.be.equal(fromAddress);
                // Perform a transfer from fromAddress to toAddress
                const amount = new BigNumber(1);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    fromAddress,
                    erc721Receiver.address,
                    amount,
                );
                const logDecoder = new LogDecoder(web3Wrapper, { ...artifacts, ...erc721Artifacts });
                const tx = await logDecoder.getTxWithDecodedLogsAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: erc721Proxy.address,
                        data,
                        from: authorized,
                        gas: constants.MAX_TRANSFER_FROM_GAS,
                    }),
                );
                // Verify that no log was emitted by erc721 receiver
                expect(tx.logs.length).to.be.equal(1);
                // Verify transfer was successful
                const newOwnerFromAsset = await erc721TokenA.ownerOf.callAsync(erc721AFromTokenId);
                expect(newOwnerFromAsset).to.be.bignumber.equal(erc721Receiver.address);
            });

            it('should revert if transferring 0 amount of a token', async () => {
                // Construct ERC721 asset data
                const encodedAssetData = assetDataUtils.encodeERC721AssetData(erc721TokenA.address, erc721AFromTokenId);
                // Verify pre-condition
                const ownerFromAsset = await erc721TokenA.ownerOf.callAsync(erc721AFromTokenId);
                expect(ownerFromAsset).to.be.equal(fromAddress);
                // Perform a transfer from fromAddress to toAddress
                const amount = new BigNumber(0);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    fromAddress,
                    toAddress,
                    amount,
                );
                await expectTransactionFailedAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: erc721Proxy.address,
                        data,
                        from: authorized,
                    }),
                    RevertReason.InvalidAmount,
                );
                const newOwner = await erc721TokenA.ownerOf.callAsync(erc721AFromTokenId);
                expect(newOwner).to.be.equal(ownerFromAsset);
            });

            it('should revert if transferring > 1 amount of a token', async () => {
                // Construct ERC721 asset data
                const encodedAssetData = assetDataUtils.encodeERC721AssetData(erc721TokenA.address, erc721AFromTokenId);
                // Verify pre-condition
                const ownerFromAsset = await erc721TokenA.ownerOf.callAsync(erc721AFromTokenId);
                expect(ownerFromAsset).to.be.equal(fromAddress);
                // Perform a transfer from fromAddress to toAddress
                const amount = new BigNumber(500);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    fromAddress,
                    toAddress,
                    amount,
                );
                await expectTransactionFailedAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: erc721Proxy.address,
                        data,
                        from: authorized,
                    }),
                    RevertReason.InvalidAmount,
                );
                const newOwner = await erc721TokenA.ownerOf.callAsync(erc721AFromTokenId);
                expect(newOwner).to.be.equal(ownerFromAsset);
            });

            it('should revert if allowances are too low', async () => {
                // Construct ERC721 asset data
                const encodedAssetData = assetDataUtils.encodeERC721AssetData(erc721TokenA.address, erc721AFromTokenId);
                // Verify pre-condition
                const ownerFromAsset = await erc721TokenA.ownerOf.callAsync(erc721AFromTokenId);
                expect(ownerFromAsset).to.be.equal(fromAddress);
                // Remove transfer approval for fromAddress.
                await erc721TokenA.approve.awaitTransactionSuccessAsync(
                    constants.NULL_ADDRESS,
                    erc721AFromTokenId,
                    { from: fromAddress },
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                // Perform a transfer; expect this to fail.
                const amount = new BigNumber(1);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    fromAddress,
                    toAddress,
                    amount,
                );
                await expectTransactionFailedAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: erc721Proxy.address,
                        data,
                        from: authorized,
                    }),
                    RevertReason.TransferFailed,
                );
                const newOwner = await erc721TokenA.ownerOf.callAsync(erc721AFromTokenId);
                expect(newOwner).to.be.equal(ownerFromAsset);
            });

            it('should revert if caller is not authorized', async () => {
                // Construct ERC721 asset data
                const encodedAssetData = assetDataUtils.encodeERC721AssetData(erc721TokenA.address, erc721AFromTokenId);
                // Verify pre-condition
                const ownerFromAsset = await erc721TokenA.ownerOf.callAsync(erc721AFromTokenId);
                expect(ownerFromAsset).to.be.equal(fromAddress);
                // Perform a transfer from fromAddress to toAddress
                const amount = new BigNumber(1);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    fromAddress,
                    toAddress,
                    amount,
                );
                await expectTransactionFailedAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: erc721Proxy.address,
                        data,
                        from: notAuthorized,
                    }),
                    RevertReason.SenderNotAuthorized,
                );
                const newOwner = await erc721TokenA.ownerOf.callAsync(erc721AFromTokenId);
                expect(newOwner).to.be.equal(ownerFromAsset);
            });
        });
    });
    describe('MultiAssetProxy', () => {
        it('should revert if undefined function is called', async () => {
            const undefinedSelector = '0x01020304';
            await expectTransactionFailedWithoutReasonAsync(
                web3Wrapper.sendTransactionAsync({
                    from: owner,
                    to: multiAssetProxy.address,
                    value: constants.ZERO_AMOUNT,
                    data: undefinedSelector,
                }),
            );
        });
        it('should have an id of 0x94cfcdd7', async () => {
            const proxyId = await multiAssetProxy.getProxyId.callAsync();
            // first 4 bytes of `keccak256('MultiAsset(uint256[],bytes[])')`
            const expectedProxyId = '0x94cfcdd7';
            expect(proxyId).to.equal(expectedProxyId);
        });
        describe('transferFrom', () => {
            it('should transfer a single ERC20 token', async () => {
                const inputAmount = new BigNumber(1);
                const erc20Amount = new BigNumber(10);
                const erc20AssetData = assetDataUtils.encodeERC20AssetData(erc20TokenA.address);
                const amounts = [erc20Amount];
                const nestedAssetData = [erc20AssetData];
                const assetData = assetDataUtils.encodeMultiAssetData(amounts, nestedAssetData);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    assetData,
                    fromAddress,
                    toAddress,
                    inputAmount,
                );
                const erc20Balances = await erc20Wrapper.getBalancesAsync();
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: multiAssetProxy.address,
                        data,
                        from: authorized,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                const newBalances = await erc20Wrapper.getBalancesAsync();
                const totalAmount = inputAmount.times(erc20Amount);
                expect(newBalances[fromAddress][erc20TokenA.address]).to.be.bignumber.equal(
                    erc20Balances[fromAddress][erc20TokenA.address].minus(totalAmount),
                );
                expect(newBalances[toAddress][erc20TokenA.address]).to.be.bignumber.equal(
                    erc20Balances[toAddress][erc20TokenA.address].plus(totalAmount),
                );
            });
            it('should dispatch an ERC20 transfer when input amount is 0', async () => {
                const inputAmount = constants.ZERO_AMOUNT;
                const erc20Amount = new BigNumber(10);
                const erc20AssetData = assetDataUtils.encodeERC20AssetData(erc20TokenA.address);
                const amounts = [erc20Amount];
                const nestedAssetData = [erc20AssetData];
                const assetData = assetDataInterface.MultiAsset.getABIEncodedTransactionData(amounts, nestedAssetData);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    assetData,
                    fromAddress,
                    toAddress,
                    inputAmount,
                );
                const erc20Balances = await erc20Wrapper.getBalancesAsync();
                const logDecoder = new LogDecoder(web3Wrapper, { ...artifacts, ...erc20Artifacts });
                const tx = await logDecoder.getTxWithDecodedLogsAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: multiAssetProxy.address,
                        data,
                        from: authorized,
                    }),
                );
                expect(tx.logs.length).to.be.equal(1);
                const log = tx.logs[0] as LogWithDecodedArgs<DummyERC20TokenTransferEventArgs>;
                const transferEventName = 'Transfer';
                expect(log.event).to.equal(transferEventName);
                expect(log.args._value).to.be.bignumber.equal(constants.ZERO_AMOUNT);
                const newBalances = await erc20Wrapper.getBalancesAsync();
                expect(newBalances).to.deep.equal(erc20Balances);
            });
            it('should successfully transfer multiple of the same ERC20 token', async () => {
                const inputAmount = new BigNumber(1);
                const erc20Amount1 = new BigNumber(10);
                const erc20Amount2 = new BigNumber(20);
                const erc20AssetData1 = assetDataUtils.encodeERC20AssetData(erc20TokenA.address);
                const erc20AssetData2 = assetDataUtils.encodeERC20AssetData(erc20TokenA.address);
                const amounts = [erc20Amount1, erc20Amount2];
                const nestedAssetData = [erc20AssetData1, erc20AssetData2];
                const assetData = assetDataUtils.encodeMultiAssetData(amounts, nestedAssetData);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    assetData,
                    fromAddress,
                    toAddress,
                    inputAmount,
                );
                const erc20Balances = await erc20Wrapper.getBalancesAsync();
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: multiAssetProxy.address,
                        data,
                        from: authorized,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                const newBalances = await erc20Wrapper.getBalancesAsync();
                const totalAmount = inputAmount.times(erc20Amount1).plus(inputAmount.times(erc20Amount2));
                expect(newBalances[fromAddress][erc20TokenA.address]).to.be.bignumber.equal(
                    erc20Balances[fromAddress][erc20TokenA.address].minus(totalAmount),
                );
                expect(newBalances[toAddress][erc20TokenA.address]).to.be.bignumber.equal(
                    erc20Balances[toAddress][erc20TokenA.address].plus(totalAmount),
                );
            });
            it('should successfully transfer multiple different ERC20 tokens', async () => {
                const inputAmount = new BigNumber(1);
                const erc20Amount1 = new BigNumber(10);
                const erc20Amount2 = new BigNumber(20);
                const erc20AssetData1 = assetDataUtils.encodeERC20AssetData(erc20TokenA.address);
                const erc20AssetData2 = assetDataUtils.encodeERC20AssetData(erc20TokenB.address);
                const amounts = [erc20Amount1, erc20Amount2];
                const nestedAssetData = [erc20AssetData1, erc20AssetData2];
                const assetData = assetDataUtils.encodeMultiAssetData(amounts, nestedAssetData);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    assetData,
                    fromAddress,
                    toAddress,
                    inputAmount,
                );
                const erc20Balances = await erc20Wrapper.getBalancesAsync();
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: multiAssetProxy.address,
                        data,
                        from: authorized,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                const newBalances = await erc20Wrapper.getBalancesAsync();
                const totalErc20AAmount = inputAmount.times(erc20Amount1);
                const totalErc20BAmount = inputAmount.times(erc20Amount2);
                expect(newBalances[fromAddress][erc20TokenA.address]).to.be.bignumber.equal(
                    erc20Balances[fromAddress][erc20TokenA.address].minus(totalErc20AAmount),
                );
                expect(newBalances[toAddress][erc20TokenA.address]).to.be.bignumber.equal(
                    erc20Balances[toAddress][erc20TokenA.address].plus(totalErc20AAmount),
                );
                expect(newBalances[fromAddress][erc20TokenB.address]).to.be.bignumber.equal(
                    erc20Balances[fromAddress][erc20TokenB.address].minus(totalErc20BAmount),
                );
                expect(newBalances[toAddress][erc20TokenB.address]).to.be.bignumber.equal(
                    erc20Balances[toAddress][erc20TokenB.address].plus(totalErc20BAmount),
                );
            });
            it('should transfer a single ERC721 token', async () => {
                const inputAmount = new BigNumber(1);
                const erc721Amount = new BigNumber(1);
                const erc721AssetData = assetDataUtils.encodeERC721AssetData(erc721TokenA.address, erc721AFromTokenId);
                const amounts = [erc721Amount];
                const nestedAssetData = [erc721AssetData];
                const assetData = assetDataUtils.encodeMultiAssetData(amounts, nestedAssetData);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    assetData,
                    fromAddress,
                    toAddress,
                    inputAmount,
                );
                const ownerFromAsset = await erc721TokenA.ownerOf.callAsync(erc721AFromTokenId);
                expect(ownerFromAsset).to.be.equal(fromAddress);
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: multiAssetProxy.address,
                        data,
                        from: authorized,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                const newOwnerFromAsset = await erc721TokenA.ownerOf.callAsync(erc721AFromTokenId);
                expect(newOwnerFromAsset).to.be.equal(toAddress);
            });
            it('should successfully transfer multiple of the same ERC721 token', async () => {
                const erc721Balances = await erc721Wrapper.getBalancesAsync();
                const erc721AFromTokenId2 = erc721Balances[fromAddress][erc721TokenA.address][1];
                const erc721AssetData1 = assetDataUtils.encodeERC721AssetData(erc721TokenA.address, erc721AFromTokenId);
                const erc721AssetData2 = assetDataUtils.encodeERC721AssetData(
                    erc721TokenA.address,
                    erc721AFromTokenId2,
                );
                const inputAmount = new BigNumber(1);
                const erc721Amount = new BigNumber(1);
                const amounts = [erc721Amount, erc721Amount];
                const nestedAssetData = [erc721AssetData1, erc721AssetData2];
                const assetData = assetDataUtils.encodeMultiAssetData(amounts, nestedAssetData);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    assetData,
                    fromAddress,
                    toAddress,
                    inputAmount,
                );
                const ownerFromAsset1 = await erc721TokenA.ownerOf.callAsync(erc721AFromTokenId);
                expect(ownerFromAsset1).to.be.equal(fromAddress);
                const ownerFromAsset2 = await erc721TokenA.ownerOf.callAsync(erc721AFromTokenId2);
                expect(ownerFromAsset2).to.be.equal(fromAddress);
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: multiAssetProxy.address,
                        data,
                        from: authorized,
                        gas: constants.MAX_TRANSFER_FROM_GAS,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                const newOwnerFromAsset1 = await erc721TokenA.ownerOf.callAsync(erc721AFromTokenId);
                const newOwnerFromAsset2 = await erc721TokenA.ownerOf.callAsync(erc721AFromTokenId2);
                expect(newOwnerFromAsset1).to.be.equal(toAddress);
                expect(newOwnerFromAsset2).to.be.equal(toAddress);
            });
            it('should successfully transfer multiple different ERC721 tokens', async () => {
                const erc721AssetData1 = assetDataUtils.encodeERC721AssetData(erc721TokenA.address, erc721AFromTokenId);
                const erc721AssetData2 = assetDataUtils.encodeERC721AssetData(erc721TokenB.address, erc721BFromTokenId);
                const inputAmount = new BigNumber(1);
                const erc721Amount = new BigNumber(1);
                const amounts = [erc721Amount, erc721Amount];
                const nestedAssetData = [erc721AssetData1, erc721AssetData2];
                const assetData = assetDataUtils.encodeMultiAssetData(amounts, nestedAssetData);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    assetData,
                    fromAddress,
                    toAddress,
                    inputAmount,
                );
                const ownerFromAsset1 = await erc721TokenA.ownerOf.callAsync(erc721AFromTokenId);
                expect(ownerFromAsset1).to.be.equal(fromAddress);
                const ownerFromAsset2 = await erc721TokenB.ownerOf.callAsync(erc721BFromTokenId);
                expect(ownerFromAsset2).to.be.equal(fromAddress);
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: multiAssetProxy.address,
                        data,
                        from: authorized,
                        gas: constants.MAX_TRANSFER_FROM_GAS,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                const newOwnerFromAsset1 = await erc721TokenA.ownerOf.callAsync(erc721AFromTokenId);
                const newOwnerFromAsset2 = await erc721TokenB.ownerOf.callAsync(erc721BFromTokenId);
                expect(newOwnerFromAsset1).to.be.equal(toAddress);
                expect(newOwnerFromAsset2).to.be.equal(toAddress);
            });
            it('should transfer a fungible ERC1155 token', async () => {
                // setup test parameters
                const tokenHolders = [fromAddress, toAddress];
                const tokensToTransfer = erc1155FungibleTokens.slice(0, 1);
                const valuesToTransfer = [new BigNumber(25)];
                const valueMultiplier = new BigNumber(23);
                const receiverCallbackData = '0x0102030405';
                // check balances before transfer
                const expectedInitialBalances = [
                    // from
                    constants.INITIAL_ERC1155_FUNGIBLE_BALANCE,
                    // to
                    constants.INITIAL_ERC1155_FUNGIBLE_BALANCE,
                ];
                await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedInitialBalances);
                // encode erc1155 asset data
                const erc1155AssetData = assetDataUtils.encodeERC1155AssetData(
                    erc1155Contract.address,
                    tokensToTransfer,
                    valuesToTransfer,
                    receiverCallbackData,
                );
                // encode multi-asset data
                const multiAssetAmount = new BigNumber(5);
                const amounts = [valueMultiplier];
                const nestedAssetData = [erc1155AssetData];
                const assetData = assetDataUtils.encodeMultiAssetData(amounts, nestedAssetData);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    assetData,
                    fromAddress,
                    toAddress,
                    multiAssetAmount,
                );
                // execute transfer
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: multiAssetProxy.address,
                        data,
                        from: authorized,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                // check balances
                const totalValueTransferred = valuesToTransfer[0].times(valueMultiplier).times(multiAssetAmount);
                const expectedFinalBalances = [
                    // from
                    expectedInitialBalances[0].minus(totalValueTransferred),
                    // to
                    expectedInitialBalances[1].plus(totalValueTransferred),
                ];
                await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedFinalBalances);
            });
            it('should successfully transfer multiple fungible tokens of the same ERC1155 contract', async () => {
                // setup test parameters
                const tokenHolders = [fromAddress, toAddress];
                const tokensToTransfer = erc1155FungibleTokens.slice(0, 3);
                const valuesToTransfer = [new BigNumber(25), new BigNumber(35), new BigNumber(45)];
                const valueMultiplier = new BigNumber(23);
                const receiverCallbackData = '0x0102030405';
                // check balances before transfer
                const expectedInitialBalances = [
                    // from
                    constants.INITIAL_ERC1155_FUNGIBLE_BALANCE,
                    constants.INITIAL_ERC1155_FUNGIBLE_BALANCE,
                    constants.INITIAL_ERC1155_FUNGIBLE_BALANCE,
                    // to
                    constants.INITIAL_ERC1155_FUNGIBLE_BALANCE,
                    constants.INITIAL_ERC1155_FUNGIBLE_BALANCE,
                    constants.INITIAL_ERC1155_FUNGIBLE_BALANCE,
                ];
                await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedInitialBalances);
                // encode erc1155 asset data
                const erc1155AssetData = assetDataUtils.encodeERC1155AssetData(
                    erc1155Contract.address,
                    tokensToTransfer,
                    valuesToTransfer,
                    receiverCallbackData,
                );
                // encode multi-asset data
                const multiAssetAmount = new BigNumber(5);
                const amounts = [valueMultiplier];
                const nestedAssetData = [erc1155AssetData];
                const assetData = assetDataUtils.encodeMultiAssetData(amounts, nestedAssetData);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    assetData,
                    fromAddress,
                    toAddress,
                    multiAssetAmount,
                );
                // execute transfer
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: multiAssetProxy.address,
                        data,
                        from: authorized,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                // check balances
                const totalValuesTransferred = _.map(valuesToTransfer, (value: BigNumber) => {
                    return value.times(valueMultiplier).times(multiAssetAmount);
                });
                const expectedFinalBalances = [
                    // from
                    expectedInitialBalances[0].minus(totalValuesTransferred[0]),
                    expectedInitialBalances[1].minus(totalValuesTransferred[1]),
                    expectedInitialBalances[2].minus(totalValuesTransferred[2]),
                    // to
                    expectedInitialBalances[3].plus(totalValuesTransferred[0]),
                    expectedInitialBalances[4].plus(totalValuesTransferred[1]),
                    expectedInitialBalances[5].plus(totalValuesTransferred[2]),
                ];
                await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedFinalBalances);
            });
            it('should successfully transfer multiple fungible/non-fungible tokens of the same ERC1155 contract', async () => {
                // setup test parameters
                const tokenHolders = [fromAddress, toAddress];
                const fungibleTokensToTransfer = erc1155FungibleTokens.slice(0, 1);
                const nonFungibleTokensToTransfer = erc1155NonFungibleTokensOwnedBySpender.slice(0, 1);
                const tokensToTransfer = fungibleTokensToTransfer.concat(nonFungibleTokensToTransfer);
                const valuesToTransfer = [new BigNumber(25), new BigNumber(1)];
                const valueMultiplier = new BigNumber(1);
                const receiverCallbackData = '0x0102030405';
                // check balances before transfer
                const nftOwnerBalance = new BigNumber(1);
                const nftNotOwnerBalance = new BigNumber(0);
                const expectedInitialBalances = [
                    // from
                    constants.INITIAL_ERC1155_FUNGIBLE_BALANCE,
                    nftOwnerBalance,
                    // to
                    constants.INITIAL_ERC1155_FUNGIBLE_BALANCE,
                    nftNotOwnerBalance,
                ];
                await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedInitialBalances);
                // encode erc1155 asset data
                const erc1155AssetData = assetDataUtils.encodeERC1155AssetData(
                    erc1155Contract.address,
                    tokensToTransfer,
                    valuesToTransfer,
                    receiverCallbackData,
                );
                // encode multi-asset data
                const multiAssetAmount = new BigNumber(1);
                const amounts = [valueMultiplier];
                const nestedAssetData = [erc1155AssetData];
                const assetData = assetDataUtils.encodeMultiAssetData(amounts, nestedAssetData);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    assetData,
                    fromAddress,
                    toAddress,
                    multiAssetAmount,
                );
                // execute transfer
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: multiAssetProxy.address,
                        data,
                        from: authorized,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                // check balances
                const totalValuesTransferred = _.map(valuesToTransfer, (value: BigNumber) => {
                    return value.times(valueMultiplier).times(multiAssetAmount);
                });
                const expectedFinalBalances = [
                    // from
                    expectedInitialBalances[0].minus(totalValuesTransferred[0]),
                    expectedInitialBalances[1].minus(totalValuesTransferred[1]),
                    // to
                    expectedInitialBalances[2].plus(totalValuesTransferred[0]),
                    expectedInitialBalances[3].plus(totalValuesTransferred[1]),
                ];
                await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedFinalBalances);
            });
            it('should successfully transfer multiple different ERC1155 tokens', async () => {
                // setup test parameters
                const tokenHolders = [fromAddress, toAddress];
                const tokensToTransfer = erc1155FungibleTokens.slice(0, 1);
                const valuesToTransfer = [new BigNumber(25)];
                const valueMultiplier = new BigNumber(23);
                const receiverCallbackData = '0x0102030405';
                // check balances before transfer
                const expectedInitialBalances = [
                    // from
                    constants.INITIAL_ERC1155_FUNGIBLE_BALANCE,
                    // to
                    constants.INITIAL_ERC1155_FUNGIBLE_BALANCE,
                ];
                await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedInitialBalances);
                await erc1155Wrapper2.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedInitialBalances);
                // encode erc1155 asset data
                const erc1155AssetData1 = assetDataUtils.encodeERC1155AssetData(
                    erc1155Contract.address,
                    tokensToTransfer,
                    valuesToTransfer,
                    receiverCallbackData,
                );
                const erc1155AssetData2 = assetDataUtils.encodeERC1155AssetData(
                    erc1155Contract2.address,
                    tokensToTransfer,
                    valuesToTransfer,
                    receiverCallbackData,
                );
                // encode multi-asset data
                const multiAssetAmount = new BigNumber(5);
                const amounts = [valueMultiplier, valueMultiplier];
                const nestedAssetData = [erc1155AssetData1, erc1155AssetData2];
                const assetData = assetDataUtils.encodeMultiAssetData(amounts, nestedAssetData);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    assetData,
                    fromAddress,
                    toAddress,
                    multiAssetAmount,
                );
                // execute transfer
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: multiAssetProxy.address,
                        data,
                        from: authorized,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                // check balances
                const totalValueTransferred = valuesToTransfer[0].times(valueMultiplier).times(multiAssetAmount);
                const expectedFinalBalances = [
                    // from
                    expectedInitialBalances[0].minus(totalValueTransferred),
                    // to
                    expectedInitialBalances[1].plus(totalValueTransferred),
                ];
                await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedFinalBalances);
                await erc1155Wrapper2.assertBalancesAsync(tokenHolders, tokensToTransfer, expectedFinalBalances);
            });
            it('should successfully transfer a combination of ERC20, ERC721, and ERC1155 tokens', async () => {
                // setup test parameters
                const inputAmount = new BigNumber(1);
                const erc20Amount = new BigNumber(10);
                const erc20AssetData = assetDataUtils.encodeERC20AssetData(erc20TokenA.address);
                const erc721Amount = new BigNumber(1);
                const erc721AssetData = assetDataUtils.encodeERC721AssetData(erc721TokenA.address, erc721AFromTokenId);
                const erc1155TokenHolders = [fromAddress, toAddress];
                const erc1155TokensToTransfer = erc1155FungibleTokens.slice(0, 1);
                const erc1155ValuesToTransfer = [new BigNumber(25)];
                const erc1155Amount = new BigNumber(23);
                const erc1155ReceiverCallbackData = '0x0102030405';
                const erc1155AssetData = assetDataUtils.encodeERC1155AssetData(
                    erc1155Contract.address,
                    erc1155TokensToTransfer,
                    erc1155ValuesToTransfer,
                    erc1155ReceiverCallbackData,
                );
                const amounts = [erc20Amount, erc721Amount, erc1155Amount];
                const nestedAssetData = [erc20AssetData, erc721AssetData, erc1155AssetData];
                const assetData = assetDataUtils.encodeMultiAssetData(amounts, nestedAssetData);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    assetData,
                    fromAddress,
                    toAddress,
                    inputAmount,
                );
                // check balances before transfer
                const erc20Balances = await erc20Wrapper.getBalancesAsync();
                const ownerFromAsset = await erc721TokenA.ownerOf.callAsync(erc721AFromTokenId);
                expect(ownerFromAsset).to.be.equal(fromAddress);
                const erc1155ExpectedInitialBalances = [
                    constants.INITIAL_ERC1155_FUNGIBLE_BALANCE,
                    constants.INITIAL_ERC1155_FUNGIBLE_BALANCE,
                ];
                await erc1155Wrapper.assertBalancesAsync(
                    erc1155TokenHolders,
                    erc1155TokensToTransfer,
                    erc1155ExpectedInitialBalances,
                );
                // execute transfer
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: multiAssetProxy.address,
                        data,
                        from: authorized,
                        gas: 1000000,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                // check balances after transfer
                const newBalances = await erc20Wrapper.getBalancesAsync();
                const totalAmount = inputAmount.times(erc20Amount);
                expect(newBalances[fromAddress][erc20TokenA.address]).to.be.bignumber.equal(
                    erc20Balances[fromAddress][erc20TokenA.address].minus(totalAmount),
                );
                expect(newBalances[toAddress][erc20TokenA.address]).to.be.bignumber.equal(
                    erc20Balances[toAddress][erc20TokenA.address].plus(totalAmount),
                );
                const newOwnerFromAsset = await erc721TokenA.ownerOf.callAsync(erc721AFromTokenId);
                expect(newOwnerFromAsset).to.be.equal(toAddress);
                const erc1155TotalValueTransferred = erc1155ValuesToTransfer[0].times(erc1155Amount).times(inputAmount);
                const expectedFinalBalances = [
                    erc1155ExpectedInitialBalances[0].minus(erc1155TotalValueTransferred),
                    erc1155ExpectedInitialBalances[1].plus(erc1155TotalValueTransferred),
                ];
                await erc1155Wrapper.assertBalancesAsync(
                    erc1155TokenHolders,
                    erc1155TokensToTransfer,
                    expectedFinalBalances,
                );
            });
            it('should successfully transfer a combination of ERC20 and ERC721 tokens', async () => {
                const inputAmount = new BigNumber(1);
                const erc20Amount = new BigNumber(10);
                const erc20AssetData = assetDataUtils.encodeERC20AssetData(erc20TokenA.address);
                const erc721Amount = new BigNumber(1);
                const erc721AssetData = assetDataUtils.encodeERC721AssetData(erc721TokenA.address, erc721AFromTokenId);
                const amounts = [erc20Amount, erc721Amount];
                const nestedAssetData = [erc20AssetData, erc721AssetData];
                const assetData = assetDataUtils.encodeMultiAssetData(amounts, nestedAssetData);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    assetData,
                    fromAddress,
                    toAddress,
                    inputAmount,
                );
                const erc20Balances = await erc20Wrapper.getBalancesAsync();
                const ownerFromAsset = await erc721TokenA.ownerOf.callAsync(erc721AFromTokenId);
                expect(ownerFromAsset).to.be.equal(fromAddress);
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: multiAssetProxy.address,
                        data,
                        from: authorized,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                const newBalances = await erc20Wrapper.getBalancesAsync();
                const totalAmount = inputAmount.times(erc20Amount);
                expect(newBalances[fromAddress][erc20TokenA.address]).to.be.bignumber.equal(
                    erc20Balances[fromAddress][erc20TokenA.address].minus(totalAmount),
                );
                expect(newBalances[toAddress][erc20TokenA.address]).to.be.bignumber.equal(
                    erc20Balances[toAddress][erc20TokenA.address].plus(totalAmount),
                );
                const newOwnerFromAsset = await erc721TokenA.ownerOf.callAsync(erc721AFromTokenId);
                expect(newOwnerFromAsset).to.be.equal(toAddress);
            });
            it('should successfully transfer tokens and ignore extra assetData', async () => {
                const inputAmount = new BigNumber(1);
                const erc20Amount = new BigNumber(10);
                const erc20AssetData = assetDataUtils.encodeERC20AssetData(erc20TokenA.address);
                const erc721Amount = new BigNumber(1);
                const erc721AssetData = assetDataUtils.encodeERC721AssetData(erc721TokenA.address, erc721AFromTokenId);
                const amounts = [erc20Amount, erc721Amount];
                const nestedAssetData = [erc20AssetData, erc721AssetData];
                const extraData = '0102030405060708090001020304050607080900010203040506070809000102';
                const assetData = `${assetDataUtils.encodeMultiAssetData(amounts, nestedAssetData)}${extraData}`;
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    assetData,
                    fromAddress,
                    toAddress,
                    inputAmount,
                );
                const erc20Balances = await erc20Wrapper.getBalancesAsync();
                const ownerFromAsset = await erc721TokenA.ownerOf.callAsync(erc721AFromTokenId);
                expect(ownerFromAsset).to.be.equal(fromAddress);
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: multiAssetProxy.address,
                        data,
                        from: authorized,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                const newBalances = await erc20Wrapper.getBalancesAsync();
                const totalAmount = inputAmount.times(erc20Amount);
                expect(newBalances[fromAddress][erc20TokenA.address]).to.be.bignumber.equal(
                    erc20Balances[fromAddress][erc20TokenA.address].minus(totalAmount),
                );
                expect(newBalances[toAddress][erc20TokenA.address]).to.be.bignumber.equal(
                    erc20Balances[toAddress][erc20TokenA.address].plus(totalAmount),
                );
                const newOwnerFromAsset = await erc721TokenA.ownerOf.callAsync(erc721AFromTokenId);
                expect(newOwnerFromAsset).to.be.equal(toAddress);
            });
            it('should successfully transfer correct amounts when the `amount` > 1', async () => {
                const inputAmount = new BigNumber(100);
                const erc20Amount1 = new BigNumber(10);
                const erc20Amount2 = new BigNumber(20);
                const erc20AssetData1 = assetDataUtils.encodeERC20AssetData(erc20TokenA.address);
                const erc20AssetData2 = assetDataUtils.encodeERC20AssetData(erc20TokenB.address);
                const amounts = [erc20Amount1, erc20Amount2];
                const nestedAssetData = [erc20AssetData1, erc20AssetData2];
                const assetData = assetDataUtils.encodeMultiAssetData(amounts, nestedAssetData);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    assetData,
                    fromAddress,
                    toAddress,
                    inputAmount,
                );
                const erc20Balances = await erc20Wrapper.getBalancesAsync();
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: multiAssetProxy.address,
                        data,
                        from: authorized,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                const newBalances = await erc20Wrapper.getBalancesAsync();
                const totalErc20AAmount = inputAmount.times(erc20Amount1);
                const totalErc20BAmount = inputAmount.times(erc20Amount2);
                expect(newBalances[fromAddress][erc20TokenA.address]).to.be.bignumber.equal(
                    erc20Balances[fromAddress][erc20TokenA.address].minus(totalErc20AAmount),
                );
                expect(newBalances[toAddress][erc20TokenA.address]).to.be.bignumber.equal(
                    erc20Balances[toAddress][erc20TokenA.address].plus(totalErc20AAmount),
                );
                expect(newBalances[fromAddress][erc20TokenB.address]).to.be.bignumber.equal(
                    erc20Balances[fromAddress][erc20TokenB.address].minus(totalErc20BAmount),
                );
                expect(newBalances[toAddress][erc20TokenB.address]).to.be.bignumber.equal(
                    erc20Balances[toAddress][erc20TokenB.address].plus(totalErc20BAmount),
                );
            });
            it('should successfully transfer a large amount of tokens', async () => {
                const inputAmount = new BigNumber(1);
                const erc20Amount1 = new BigNumber(10);
                const erc20Amount2 = new BigNumber(20);
                const erc20AssetData1 = assetDataUtils.encodeERC20AssetData(erc20TokenA.address);
                const erc20AssetData2 = assetDataUtils.encodeERC20AssetData(erc20TokenB.address);
                const erc721Amount = new BigNumber(1);
                const erc721Balances = await erc721Wrapper.getBalancesAsync();
                const erc721AFromTokenId2 = erc721Balances[fromAddress][erc721TokenA.address][1];
                const erc721BFromTokenId2 = erc721Balances[fromAddress][erc721TokenB.address][1];
                const erc721AssetData1 = assetDataUtils.encodeERC721AssetData(erc721TokenA.address, erc721AFromTokenId);
                const erc721AssetData2 = assetDataUtils.encodeERC721AssetData(
                    erc721TokenA.address,
                    erc721AFromTokenId2,
                );
                const erc721AssetData3 = assetDataUtils.encodeERC721AssetData(erc721TokenB.address, erc721BFromTokenId);
                const erc721AssetData4 = assetDataUtils.encodeERC721AssetData(
                    erc721TokenB.address,
                    erc721BFromTokenId2,
                );
                const amounts = [erc721Amount, erc20Amount1, erc721Amount, erc20Amount2, erc721Amount, erc721Amount];
                const nestedAssetData = [
                    erc721AssetData1,
                    erc20AssetData1,
                    erc721AssetData2,
                    erc20AssetData2,
                    erc721AssetData3,
                    erc721AssetData4,
                ];
                const assetData = assetDataUtils.encodeMultiAssetData(amounts, nestedAssetData);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    assetData,
                    fromAddress,
                    toAddress,
                    inputAmount,
                );
                const ownerFromAsset1 = await erc721TokenA.ownerOf.callAsync(erc721AFromTokenId);
                expect(ownerFromAsset1).to.be.equal(fromAddress);
                const ownerFromAsset2 = await erc721TokenA.ownerOf.callAsync(erc721AFromTokenId2);
                expect(ownerFromAsset2).to.be.equal(fromAddress);
                const ownerFromAsset3 = await erc721TokenB.ownerOf.callAsync(erc721BFromTokenId);
                expect(ownerFromAsset3).to.be.equal(fromAddress);
                const ownerFromAsset4 = await erc721TokenB.ownerOf.callAsync(erc721BFromTokenId2);
                expect(ownerFromAsset4).to.be.equal(fromAddress);
                const erc20Balances = await erc20Wrapper.getBalancesAsync();
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: multiAssetProxy.address,
                        data,
                        from: authorized,
                        gas: constants.MAX_EXECUTE_TRANSACTION_GAS,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                const newOwnerFromAsset1 = await erc721TokenA.ownerOf.callAsync(erc721AFromTokenId);
                const newOwnerFromAsset2 = await erc721TokenA.ownerOf.callAsync(erc721AFromTokenId2);
                const newOwnerFromAsset3 = await erc721TokenB.ownerOf.callAsync(erc721BFromTokenId);
                const newOwnerFromAsset4 = await erc721TokenB.ownerOf.callAsync(erc721BFromTokenId2);
                expect(newOwnerFromAsset1).to.be.equal(toAddress);
                expect(newOwnerFromAsset2).to.be.equal(toAddress);
                expect(newOwnerFromAsset3).to.be.equal(toAddress);
                expect(newOwnerFromAsset4).to.be.equal(toAddress);
                const newBalances = await erc20Wrapper.getBalancesAsync();
                const totalErc20AAmount = inputAmount.times(erc20Amount1);
                const totalErc20BAmount = inputAmount.times(erc20Amount2);
                expect(newBalances[fromAddress][erc20TokenA.address]).to.be.bignumber.equal(
                    erc20Balances[fromAddress][erc20TokenA.address].minus(totalErc20AAmount),
                );
                expect(newBalances[toAddress][erc20TokenA.address]).to.be.bignumber.equal(
                    erc20Balances[toAddress][erc20TokenA.address].plus(totalErc20AAmount),
                );
                expect(newBalances[fromAddress][erc20TokenB.address]).to.be.bignumber.equal(
                    erc20Balances[fromAddress][erc20TokenB.address].minus(totalErc20BAmount),
                );
                expect(newBalances[toAddress][erc20TokenB.address]).to.be.bignumber.equal(
                    erc20Balances[toAddress][erc20TokenB.address].plus(totalErc20BAmount),
                );
            });
            it('should revert if a single transfer fails', async () => {
                const inputAmount = new BigNumber(1);
                const erc20Amount = new BigNumber(10);
                const erc20AssetData = assetDataUtils.encodeERC20AssetData(erc20TokenA.address);
                // 2 is an invalid erc721 amount
                const erc721Amount = new BigNumber(2);
                const erc721AssetData = assetDataUtils.encodeERC721AssetData(erc721TokenA.address, erc721AFromTokenId);
                const amounts = [erc20Amount, erc721Amount];
                const nestedAssetData = [erc20AssetData, erc721AssetData];
                const assetData = assetDataUtils.encodeMultiAssetData(amounts, nestedAssetData);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    assetData,
                    fromAddress,
                    toAddress,
                    inputAmount,
                );
                await expectTransactionFailedAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: multiAssetProxy.address,
                        data,
                        from: authorized,
                    }),
                    RevertReason.InvalidAmount,
                );
            });
            it('should revert if an AssetProxy is not registered', async () => {
                const inputAmount = new BigNumber(1);
                const erc20Amount = new BigNumber(10);
                const erc20AssetData = assetDataUtils.encodeERC20AssetData(erc20TokenA.address);
                const erc721Amount = new BigNumber(1);
                const erc721AssetData = assetDataUtils.encodeERC721AssetData(erc721TokenA.address, erc721AFromTokenId);
                const invalidProxyId = '0x12345678';
                const invalidErc721AssetData = `${invalidProxyId}${erc721AssetData.slice(10)}`;
                const amounts = [erc20Amount, erc721Amount];
                const nestedAssetData = [erc20AssetData, invalidErc721AssetData];
                // HACK: This is used to get around validation built into assetDataUtils
                const assetData = assetDataInterface.MultiAsset.getABIEncodedTransactionData(amounts, nestedAssetData);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    assetData,
                    fromAddress,
                    toAddress,
                    inputAmount,
                );
                await expectTransactionFailedAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: multiAssetProxy.address,
                        data,
                        from: authorized,
                    }),
                    RevertReason.AssetProxyDoesNotExist,
                );
            });
            it('should revert if the length of `amounts` does not match the length of `nestedAssetData`', async () => {
                const inputAmount = new BigNumber(1);
                const erc20Amount = new BigNumber(10);
                const erc20AssetData = assetDataUtils.encodeERC20AssetData(erc20TokenA.address);
                const erc721AssetData = assetDataUtils.encodeERC721AssetData(erc721TokenA.address, erc721AFromTokenId);
                const amounts = [erc20Amount];
                const nestedAssetData = [erc20AssetData, erc721AssetData];
                // HACK: This is used to get around validation built into assetDataUtils
                const assetData = assetDataInterface.MultiAsset.getABIEncodedTransactionData(amounts, nestedAssetData);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    assetData,
                    fromAddress,
                    toAddress,
                    inputAmount,
                );
                await expectTransactionFailedAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: multiAssetProxy.address,
                        data,
                        from: authorized,
                    }),
                    RevertReason.LengthMismatch,
                );
            });
            it('should revert if amounts multiplication results in an overflow', async () => {
                const inputAmount = new BigNumber(2).pow(128);
                const erc20Amount = new BigNumber(2).pow(128);
                const erc20AssetData = assetDataUtils.encodeERC20AssetData(erc20TokenA.address);
                const amounts = [erc20Amount];
                const nestedAssetData = [erc20AssetData];
                const assetData = assetDataUtils.encodeMultiAssetData(amounts, nestedAssetData);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    assetData,
                    fromAddress,
                    toAddress,
                    inputAmount,
                );
                await expectTransactionFailedAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: multiAssetProxy.address,
                        data,
                        from: authorized,
                    }),
                    RevertReason.Uint256Overflow,
                );
            });
            it('should revert if an element of `nestedAssetData` is < 4 bytes long', async () => {
                const inputAmount = new BigNumber(1);
                const erc20Amount = new BigNumber(10);
                const erc20AssetData = assetDataUtils.encodeERC20AssetData(erc20TokenA.address);
                const erc721Amount = new BigNumber(1);
                const erc721AssetData = '0x123456';
                const amounts = [erc20Amount, erc721Amount];
                const nestedAssetData = [erc20AssetData, erc721AssetData];
                // HACK: This is used to get around validation built into assetDataUtils
                const assetData = assetDataInterface.MultiAsset.getABIEncodedTransactionData(amounts, nestedAssetData);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    assetData,
                    fromAddress,
                    toAddress,
                    inputAmount,
                );
                await expectTransactionFailedAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: multiAssetProxy.address,
                        data,
                        from: authorized,
                    }),
                    RevertReason.LengthGreaterThan3Required,
                );
            });
            it('should revert if caller is not authorized', async () => {
                const inputAmount = new BigNumber(1);
                const erc20Amount = new BigNumber(10);
                const erc20AssetData = assetDataUtils.encodeERC20AssetData(erc20TokenA.address);
                const erc721Amount = new BigNumber(1);
                const erc721AssetData = assetDataUtils.encodeERC721AssetData(erc721TokenA.address, erc721AFromTokenId);
                const amounts = [erc20Amount, erc721Amount];
                const nestedAssetData = [erc20AssetData, erc721AssetData];
                const assetData = assetDataUtils.encodeMultiAssetData(amounts, nestedAssetData);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    assetData,
                    fromAddress,
                    toAddress,
                    inputAmount,
                );
                await expectTransactionFailedAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: multiAssetProxy.address,
                        data,
                        from: notAuthorized,
                    }),
                    RevertReason.SenderNotAuthorized,
                );
            });
            it('should revert if asset data overflows beyond the bounds of calldata', async () => {
                const inputAmount = new BigNumber(1);
                const erc20Amount = new BigNumber(10);
                const erc20AssetData = assetDataUtils.encodeERC20AssetData(erc20TokenA.address);
                const erc721Amount = new BigNumber(1);
                const erc721AssetData = assetDataUtils.encodeERC721AssetData(erc721TokenA.address, erc721AFromTokenId);
                const amounts = [erc20Amount, erc721Amount];
                const nestedAssetData = [erc20AssetData, erc721AssetData];
                const assetData = assetDataUtils.encodeMultiAssetData(amounts, nestedAssetData);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    assetData,
                    fromAddress,
                    toAddress,
                    inputAmount,
                );
                // append asset data to end of tx data with a length of 0x300 bytes, which will extend past actual calldata.
                const offsetToAssetData = '0000000000000000000000000000000000000000000000000000000000000080';
                const invalidOffsetToAssetData = '00000000000000000000000000000000000000000000000000000000000002a0';
                const newAssetData = '0000000000000000000000000000000000000000000000000000000000000304';
                const badData = `${data.replace(offsetToAssetData, invalidOffsetToAssetData)}${newAssetData}`;
                // execute transfer
                await expectTransactionFailedAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: multiAssetProxy.address,
                        data: badData,
                        from: authorized,
                    }),
                    RevertReason.InvalidAssetDataEnd,
                );
            });
            it('should revert if asset data resolves to a location beyond the bounds of calldata', async () => {
                const inputAmount = new BigNumber(1);
                const erc20Amount = new BigNumber(10);
                const erc20AssetData = assetDataUtils.encodeERC20AssetData(erc20TokenA.address);
                const erc721Amount = new BigNumber(1);
                const erc721AssetData = assetDataUtils.encodeERC721AssetData(erc721TokenA.address, erc721AFromTokenId);
                const amounts = [erc20Amount, erc721Amount];
                const nestedAssetData = [erc20AssetData, erc721AssetData];
                const assetData = assetDataUtils.encodeMultiAssetData(amounts, nestedAssetData);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    assetData,
                    fromAddress,
                    toAddress,
                    inputAmount,
                );
                const offsetToAssetData = '0000000000000000000000000000000000000000000000000000000000000080';
                const invalidOffsetToAssetData = '0000000000000000000000000000000000000000000000000000000000000400';
                const badData = data.replace(offsetToAssetData, invalidOffsetToAssetData);
                // execute transfer
                // note that this triggers `InvalidAssetDataLength` because the length is zero, otherwise it would
                // trigger `InvalidAssetDataEnd`.
                await expectTransactionFailedAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: multiAssetProxy.address,
                        data: badData,
                        from: authorized,
                    }),
                    RevertReason.InvalidAssetDataLength,
                );
            });
            it('should revert if length of assetData, excluding the selector, is not a multiple of 32', async () => {
                // setup test parameters
                const inputAmount = new BigNumber(1);
                const erc20Amount = new BigNumber(10);
                const erc20AssetData = assetDataUtils.encodeERC20AssetData(erc20TokenA.address);
                const erc721Amount = new BigNumber(1);
                const erc721AssetData = assetDataUtils.encodeERC721AssetData(erc721TokenA.address, erc721AFromTokenId);
                const amounts = [erc20Amount, erc721Amount];
                const nestedAssetData = [erc20AssetData, erc721AssetData];
                const assetData = assetDataUtils.encodeMultiAssetData(amounts, nestedAssetData);
                const extraData = '01';
                const assetDataWithExtraData = `${assetData}${extraData}`;
                const badData = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    assetDataWithExtraData,
                    fromAddress,
                    toAddress,
                    inputAmount,
                );
                // execute transfer
                await expectTransactionFailedAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: multiAssetProxy.address,
                        data: badData,
                        from: authorized,
                    }),
                    RevertReason.InvalidAssetDataLength,
                );
            });
            it('should revert if length of assetData is less than 68 bytes', async () => {
                // setup test parameters
                const inputAmount = new BigNumber(1);
                // we'll construct asset data that has a 4 byte selector plus
                // 32 byte payload. This results in asset data that is 36 bytes
                // long and will trigger the `invalid length` error.
                // we must be sure to use a # of bytes that is still %32
                // so that we know the error is not triggered by another check in the code.
                const zeros32Bytes = '0'.repeat(64);
                const assetData36Bytes = `${AssetProxyId.MultiAsset}${zeros32Bytes}`;
                const badData = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    assetData36Bytes,
                    fromAddress,
                    toAddress,
                    inputAmount,
                );
                // execute transfer
                await expectTransactionFailedAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: multiAssetProxy.address,
                        data: badData,
                        from: authorized,
                    }),
                    RevertReason.InvalidAssetDataLength,
                );
            });
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
// tslint:disable:max-file-line-count
