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
import { RevertReason } from '@0x/types';
import { BigNumber, AbiEncoder } from '@0x/utils';
import * as chai from 'chai';
import { LogWithDecodedArgs } from 'ethereum-types';
import * as _ from 'lodash';

import {
    artifacts,
    DummyERC20TokenContract,
    DummyERC20TokenTransferEventArgs,
    DummyERC721ReceiverContract,
    DummyERC721TokenContract,
    DummyMultipleReturnERC20TokenContract,
    DummyNoReturnERC20TokenContract,
    ERC20ProxyContract,
    ERC20Wrapper,
    ERC721ProxyContract,
    ERC721Wrapper,
    ERC1155ProxyWrapper,
    ERC1155ProxyContract,
    IAssetDataContract,
    IAssetProxyContract,
    MultiAssetProxyContract,
    ERC1155MintableContract,
    DummyERC1155ReceiverContract,
    DummyERC1155ReceiverBatchTokenReceivedEventArgs,
} from '../src';
import values from 'ramda/es/values';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
const assetProxyInterface = new IAssetProxyContract(
    artifacts.IAssetProxy.compilerOutput.abi,
    constants.NULL_ADDRESS,
    provider,
);
const assetDataInterface = new IAssetDataContract(
    artifacts.IAssetData.compilerOutput.abi,
    constants.NULL_ADDRESS,
    provider,
);

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
    let erc1155Proxy: ERC721ProxyContract;
    let erc1155Receiver: DummyERC1155ReceiverContract;
    let noReturnErc20Token: DummyNoReturnERC20TokenContract;
    let multipleReturnErc20Token: DummyMultipleReturnERC20TokenContract;
    let multiAssetProxy: MultiAssetProxyContract;

    let erc20Wrapper: ERC20Wrapper;
    let erc721Wrapper: ERC721Wrapper;
    let erc1155ProxyWrapper: ERC1155ProxyWrapper;
    let erc721AFromTokenId: BigNumber;
    let erc721BFromTokenId: BigNumber;

    let erc1155Token: ERC1155MintableContract;
    let erc1155FungibleTokenIds: BigNumber[];
    let erc1155NonFungibleTokenIds: BigNumber[];

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
        erc1155ProxyWrapper = new ERC1155ProxyWrapper(provider, usedAddresses, owner);

        // Deploy AssetProxies
        erc20Proxy = await erc20Wrapper.deployProxyAsync();
        erc721Proxy = await erc721Wrapper.deployProxyAsync();
        erc1155Proxy = await erc1155ProxyWrapper.deployProxyAsync();
        multiAssetProxy = await MultiAssetProxyContract.deployFrom0xArtifactAsync(
            artifacts.MultiAssetProxy,
            provider,
            txDefaults,
        );

        // Configure ERC20Proxy
        await web3Wrapper.awaitTransactionSuccessAsync(
            await erc20Proxy.addAuthorizedAddress.sendTransactionAsync(authorized, {
                from: owner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await web3Wrapper.awaitTransactionSuccessAsync(
            await erc20Proxy.addAuthorizedAddress.sendTransactionAsync(multiAssetProxy.address, {
                from: owner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );

        // Configure ERC721Proxy
        await web3Wrapper.awaitTransactionSuccessAsync(
            await erc721Proxy.addAuthorizedAddress.sendTransactionAsync(authorized, {
                from: owner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await web3Wrapper.awaitTransactionSuccessAsync(
            await erc721Proxy.addAuthorizedAddress.sendTransactionAsync(multiAssetProxy.address, {
                from: owner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );

        // Configure ERC1155Proxy
        await web3Wrapper.awaitTransactionSuccessAsync(
            await erc1155Proxy.addAuthorizedAddress.sendTransactionAsync(authorized, {
                from: owner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await web3Wrapper.awaitTransactionSuccessAsync(
            await erc1155Proxy.addAuthorizedAddress.sendTransactionAsync(multiAssetProxy.address, {
                from: owner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );

        // Configure MultiAssetProxy
        await web3Wrapper.awaitTransactionSuccessAsync(
            await multiAssetProxy.addAuthorizedAddress.sendTransactionAsync(authorized, {
                from: owner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await web3Wrapper.awaitTransactionSuccessAsync(
            await multiAssetProxy.registerAssetProxy.sendTransactionAsync(erc20Proxy.address, {
                from: owner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await web3Wrapper.awaitTransactionSuccessAsync(
            await multiAssetProxy.registerAssetProxy.sendTransactionAsync(erc721Proxy.address, {
                from: owner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );

        // Deploy and configure ERC20 tokens
        const numDummyErc20ToDeploy = 2;
        [erc20TokenA, erc20TokenB] = await erc20Wrapper.deployDummyTokensAsync(
            numDummyErc20ToDeploy,
            constants.DUMMY_TOKEN_DECIMALS,
        );
        noReturnErc20Token = await DummyNoReturnERC20TokenContract.deployFrom0xArtifactAsync(
            artifacts.DummyNoReturnERC20Token,
            provider,
            txDefaults,
            constants.DUMMY_TOKEN_NAME,
            constants.DUMMY_TOKEN_SYMBOL,
            constants.DUMMY_TOKEN_DECIMALS,
            constants.DUMMY_TOKEN_TOTAL_SUPPLY,
        );
        multipleReturnErc20Token = await DummyMultipleReturnERC20TokenContract.deployFrom0xArtifactAsync(
            artifacts.DummyMultipleReturnERC20Token,
            provider,
            txDefaults,
            constants.DUMMY_TOKEN_NAME,
            constants.DUMMY_TOKEN_SYMBOL,
            constants.DUMMY_TOKEN_DECIMALS,
            constants.DUMMY_TOKEN_TOTAL_SUPPLY,
        );

        await erc20Wrapper.setBalancesAndAllowancesAsync();
        await web3Wrapper.awaitTransactionSuccessAsync(
            await noReturnErc20Token.setBalance.sendTransactionAsync(fromAddress, constants.INITIAL_ERC20_BALANCE),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await web3Wrapper.awaitTransactionSuccessAsync(
            await noReturnErc20Token.approve.sendTransactionAsync(
                erc20Proxy.address,
                constants.INITIAL_ERC20_ALLOWANCE,
                { from: fromAddress },
            ),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await web3Wrapper.awaitTransactionSuccessAsync(
            await multipleReturnErc20Token.setBalance.sendTransactionAsync(
                fromAddress,
                constants.INITIAL_ERC20_BALANCE,
            ),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await web3Wrapper.awaitTransactionSuccessAsync(
            await multipleReturnErc20Token.approve.sendTransactionAsync(
                erc20Proxy.address,
                constants.INITIAL_ERC20_ALLOWANCE,
                { from: fromAddress },
            ),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );

        // Deploy and configure ERC721 tokens and receiver
        [erc721TokenA, erc721TokenB] = await erc721Wrapper.deployDummyTokensAsync();
        erc721Receiver = await DummyERC721ReceiverContract.deployFrom0xArtifactAsync(
            artifacts.DummyERC721Receiver,
            provider,
            txDefaults,
        );
        await erc721Wrapper.setBalancesAndAllowancesAsync();
        const erc721Balances = await erc721Wrapper.getBalancesAsync();
        erc721AFromTokenId = erc721Balances[fromAddress][erc721TokenA.address][0];
        erc721BFromTokenId = erc721Balances[fromAddress][erc721TokenB.address][0];

        // Deploy and configure ERC1155 tokens and receiver
        const [erc1155Wrapper] = await erc1155ProxyWrapper.deployDummyTokensAsync();
        erc1155Token = erc1155Wrapper.getContract();
        erc1155Receiver = await DummyERC1155ReceiverContract.deployFrom0xArtifactAsync(
            artifacts.DummyERC1155Receiver,
            provider,
            txDefaults,
        );
        await erc1155ProxyWrapper.setBalancesAndAllowancesAsync();
        erc1155FungibleTokenIds = erc1155ProxyWrapper.getFungibleTokenIds();
        erc1155NonFungibleTokenIds = erc1155ProxyWrapper.getNonFungibleTokenIds();
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
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await erc20TokenA.approve.sendTransactionAsync(erc20Proxy.address, allowance, {
                        from: fromAddress,
                    }),
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
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await noReturnErc20Token.approve.sendTransactionAsync(erc20Proxy.address, allowance, {
                        from: fromAddress,
                    }),
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
                const logDecoder = new LogDecoder(web3Wrapper, artifacts);
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
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await erc721TokenA.approve.sendTransactionAsync(constants.NULL_ADDRESS, erc721AFromTokenId, {
                        from: fromAddress,
                    }),
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
                const logDecoder = new LogDecoder(web3Wrapper, artifacts);
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
                const extraData = '0102030405060708';
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
        });
    });
    describe.only('ERC1155Proxy', () => {
        it('should revert if undefined function is called', async () => {
            const undefinedSelector = '0x01020304';
            await expectTransactionFailedWithoutReasonAsync(
                web3Wrapper.sendTransactionAsync({
                    from: owner,
                    to: erc1155Proxy.address,
                    value: constants.ZERO_AMOUNT,
                    data: undefinedSelector,
                }),
            );
        });
        it('should have an id of 0x9645780d', async () => {
            const proxyId = await erc1155Proxy.getProxyId.callAsync();
            // proxy computed using -- bytes4(keccak256("ERC1155Token(address,uint256[],uint256[],bytes)"));
            const expectedProxyId = '0x9645780d';
            expect(proxyId).to.equal(expectedProxyId);
        });
        describe('transferFrom', () => {
            it('should successfully transfer value for a single token', async () => {
                // Construct ERC1155 asset data
                const callbackData = "0x";
                const fungibleTokenIdToTransfer = erc1155FungibleTokenIds[0];
                const tokenIdsToTransfer = [fungibleTokenIdToTransfer];
                const tokenValuesToTransfer = [new BigNumber(10)];
                const encodedAssetData = assetDataUtils.encodeERC1155AssetData(erc1155Token.address, tokenIdsToTransfer, tokenValuesToTransfer, callbackData);
                // Verify pre-condition
                const initialHoldingsByOwner = await erc1155ProxyWrapper.getBalancesAsync();
                const initialSenderBalance = initialHoldingsByOwner.fungible[fromAddress][erc1155Token.address][fungibleTokenIdToTransfer.toString()];
                const initialReceiverBalance = initialHoldingsByOwner.fungible[toAddress][erc1155Token.address][fungibleTokenIdToTransfer.toString()];
                // Perform a transfer from fromAddress to toAddress
                const perUnitValue = new BigNumber(1000);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    fromAddress,
                    toAddress,
                    perUnitValue,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: erc1155Proxy.address,
                        data,
                        from: authorized,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                // Verify transfer was successful
                const totalValueTransferred = tokenValuesToTransfer[0].times(perUnitValue);
                const newHoldingsByOwner = await erc1155ProxyWrapper.getBalancesAsync();
                const newSenderBalance = newHoldingsByOwner.fungible[fromAddress][erc1155Token.address][fungibleTokenIdToTransfer.toString()];
                const expectedNewSenderBalance = initialSenderBalance.minus(totalValueTransferred);
                const newReceiverBalance = newHoldingsByOwner.fungible[toAddress][erc1155Token.address][fungibleTokenIdToTransfer.toString()];
                const expectedNewReceiverBalance = initialReceiverBalance.plus(totalValueTransferred);
                expect(newSenderBalance).to.be.bignumber.equal(expectedNewSenderBalance);
                expect(newReceiverBalance).to.be.bignumber.equal(expectedNewReceiverBalance);
            });
            it('should successfully transfer value for a collection of fungible tokens of the same id', async () => {
                // Construct ERC1155 asset data
                const callbackData = "0x";
                const fungibleTokenIdToTransfer = erc1155FungibleTokenIds[0];
                const tokenIdsToTransfer = [fungibleTokenIdToTransfer, fungibleTokenIdToTransfer, fungibleTokenIdToTransfer];
                const tokenValuesToTransfer = [new BigNumber(10), new BigNumber(20), new BigNumber(30)];
                const encodedAssetData = assetDataUtils.encodeERC1155AssetData(erc1155Token.address, tokenIdsToTransfer, tokenValuesToTransfer, callbackData);
                // Verify pre-condition
                const initialHoldingsByOwner = await erc1155ProxyWrapper.getBalancesAsync();
                const initialSenderBalance = initialHoldingsByOwner.fungible[fromAddress][erc1155Token.address][fungibleTokenIdToTransfer.toString()];
                const initialReceiverBalance = initialHoldingsByOwner.fungible[toAddress][erc1155Token.address][fungibleTokenIdToTransfer.toString()];
                // Perform a transfer from fromAddress to toAddress
                const perUnitValue = new BigNumber(1000);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    fromAddress,
                    toAddress,
                    perUnitValue,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: erc1155Proxy.address,
                        data,
                        from: authorized,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                // Verify transfer was successful
                const totalValueTransferred = _.reduce(tokenValuesToTransfer, (sum: BigNumber, value: BigNumber) => {return sum.plus(value)}, new BigNumber(0)).times(perUnitValue);
                const newHoldingsByOwner = await erc1155ProxyWrapper.getBalancesAsync();
                const newSenderBalance = newHoldingsByOwner.fungible[fromAddress][erc1155Token.address][fungibleTokenIdToTransfer.toString()];
                const expectedNewSenderBalance = initialSenderBalance.minus(totalValueTransferred);
                const newReceiverBalance = newHoldingsByOwner.fungible[toAddress][erc1155Token.address][fungibleTokenIdToTransfer.toString()];
                const expectedNewReceiverBalance = initialReceiverBalance.plus(totalValueTransferred);
                expect(newSenderBalance).to.be.bignumber.equal(expectedNewSenderBalance);
                expect(newReceiverBalance).to.be.bignumber.equal(expectedNewReceiverBalance);
            });
            it('should successfully transfer value for a collection of fungible tokens of different ids', async () => {
                // Construct ERC1155 asset data
                const callbackData = "0x";
                const tokenIdsToTransfer = erc1155FungibleTokenIds.slice(0, 2);
                const tokenValuesToTransfer = [new BigNumber(10), new BigNumber(20)];
                const encodedAssetData = assetDataUtils.encodeERC1155AssetData(erc1155Token.address, tokenIdsToTransfer, tokenValuesToTransfer, callbackData);
                // Verify pre-condition
                const initialHoldingsByOwner = await erc1155ProxyWrapper.getBalancesAsync();
                const initialSenderBalances: BigNumber[] = [];
                const initialReceiverBalances: BigNumber[] = [];
                _.each(tokenIdsToTransfer, (tokenIdToTransfer: BigNumber) => {
                    initialSenderBalances.push(initialHoldingsByOwner.fungible[fromAddress][erc1155Token.address][tokenIdToTransfer.toString()]);
                    initialReceiverBalances.push(initialHoldingsByOwner.fungible[toAddress][erc1155Token.address][tokenIdToTransfer.toString()]);
                });
                // Perform a transfer from fromAddress to toAddress
                const perUnitValue = new BigNumber(1000);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    fromAddress,
                    toAddress,
                    perUnitValue,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: erc1155Proxy.address,
                        data,
                        from: authorized,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                // Verify transfer was successful
                const newHoldingsByOwner = await erc1155ProxyWrapper.getBalancesAsync();
                _.each(tokenIdsToTransfer, (tokenIdToTransfer: BigNumber, i: number) => {
                    const totalValueTransferred = tokenValuesToTransfer[i].times(perUnitValue);
                    const newSenderBalance = newHoldingsByOwner.fungible[fromAddress][erc1155Token.address][tokenIdToTransfer.toString()];
                    const expectedNewSenderBalance = initialSenderBalances[i].minus(totalValueTransferred);
                    const newReceiverBalance = newHoldingsByOwner.fungible[toAddress][erc1155Token.address][tokenIdToTransfer.toString()];
                    const expectedNewReceiverBalance = initialReceiverBalances[i].plus(totalValueTransferred);
                    expect(newSenderBalance).to.be.bignumber.equal(expectedNewSenderBalance);
                    expect(newReceiverBalance).to.be.bignumber.equal(expectedNewReceiverBalance);
                });
            });
            it('should successfully transfer a non-fungible token', async () => {
                // Construct ERC1155 asset data
                const callbackData = "0x";
                const nonFungibleTokenIdToTransfer = erc1155NonFungibleTokenIds[0];
                const initialHoldingsByOwner = await erc1155ProxyWrapper.getBalancesAsync();
                const nftToTransfer = initialHoldingsByOwner.nonFungible[fromAddress][erc1155Token.address][nonFungibleTokenIdToTransfer.toString()][0];
                const tokenIdsToTransfer = [nftToTransfer];
                const tokenValuesToTransfer = [new BigNumber(1)];
                const encodedAssetData = assetDataUtils.encodeERC1155AssetData(erc1155Token.address, tokenIdsToTransfer, tokenValuesToTransfer, callbackData);
                // Verify precondition
                const nftHolder = await erc1155ProxyWrapper.ownerOfNonFungibleAsync(erc1155Token.address, nftToTransfer);
                expect(nftHolder).to.be.equal(fromAddress);
                // Perform a transfer from fromAddress to toAddress
                const perUnitValue = new BigNumber(1);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    fromAddress,
                    toAddress,
                    perUnitValue,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: erc1155Proxy.address,
                        data,
                        from: authorized,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                // Verify transfer was successful
                const newNftHolder = await erc1155ProxyWrapper.ownerOfNonFungibleAsync(erc1155Token.address, nftToTransfer);
                expect(newNftHolder).to.be.equal(toAddress);
                // Verify balances updated successfully
                const newHoldingsByOwner = await erc1155ProxyWrapper.getBalancesAsync();
                const newNftsForFromAddress = newHoldingsByOwner.nonFungible[fromAddress][erc1155Token.address][nonFungibleTokenIdToTransfer.toString()];
                const newNftsForToAddress = newHoldingsByOwner.nonFungible[toAddress][erc1155Token.address][nonFungibleTokenIdToTransfer.toString()];
                expect(_.find(newNftsForFromAddress, nftToTransfer)).to.be.undefined();
                expect(_.find(newNftsForToAddress, nftToTransfer)).to.be.not.undefined();
            });
            it('should successfully transfer value for a combination of fungible/non-fungible tokens', async () => {
                // Construct ERC1155 asset data
                const callbackData = "0x";
                const fungibleTokenIdToTransfer = erc1155FungibleTokenIds[0];
                const nonFungibleTokenIdToTransfer = erc1155NonFungibleTokenIds[0];
                const initialHoldingsByOwner = await erc1155ProxyWrapper.getBalancesAsync();
                const nftToTransfer = initialHoldingsByOwner.nonFungible[fromAddress][erc1155Token.address][nonFungibleTokenIdToTransfer.toString()][0];
                const tokenIdsToTransfer = [fungibleTokenIdToTransfer, nftToTransfer];
                const tokenValuesToTransfer = [new BigNumber(10), new BigNumber(1)];
                const encodedAssetData = assetDataUtils.encodeERC1155AssetData(erc1155Token.address, tokenIdsToTransfer, tokenValuesToTransfer, callbackData);
                // Verify precondition
                const initialSenderBalance = initialHoldingsByOwner.fungible[fromAddress][erc1155Token.address][fungibleTokenIdToTransfer.toString()];
                const initialReceiverBalance = initialHoldingsByOwner.fungible[toAddress][erc1155Token.address][fungibleTokenIdToTransfer.toString()];
                const nftHolder = await erc1155ProxyWrapper.ownerOfNonFungibleAsync(erc1155Token.address, nftToTransfer);
                expect(nftHolder).to.be.equal(fromAddress);
                // Perform a transfer from fromAddress to toAddress
                const perUnitValue = new BigNumber(1);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    fromAddress,
                    toAddress,
                    perUnitValue,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: erc1155Proxy.address,
                        data,
                        from: authorized,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                // Verify non-fungible transfer was successful
                const newNftHolder = await erc1155ProxyWrapper.ownerOfNonFungibleAsync(erc1155Token.address, nftToTransfer);
                expect(newNftHolder).to.be.equal(toAddress);
                // Verify non-fungible balances updated successfully
                const newHoldingsByOwner = await erc1155ProxyWrapper.getBalancesAsync();
                const newNftsForFromAddress = newHoldingsByOwner.nonFungible[fromAddress][erc1155Token.address][nonFungibleTokenIdToTransfer.toString()];
                const newNftsForToAddress = newHoldingsByOwner.nonFungible[toAddress][erc1155Token.address][nonFungibleTokenIdToTransfer.toString()];
                expect(_.find(newNftsForFromAddress, nftToTransfer)).to.be.undefined();
                expect(_.find(newNftsForToAddress, nftToTransfer)).to.be.not.undefined();
                // Verify fungible transfer was successful
                const totalValueTransferred = tokenValuesToTransfer[0].times(perUnitValue);
                const newSenderBalance = newHoldingsByOwner.fungible[fromAddress][erc1155Token.address][fungibleTokenIdToTransfer.toString()];
                const expectedNewSenderBalance = initialSenderBalance.minus(totalValueTransferred);
                const newReceiverBalance = newHoldingsByOwner.fungible[toAddress][erc1155Token.address][fungibleTokenIdToTransfer.toString()];
                const expectedNewReceiverBalance = initialReceiverBalance.plus(totalValueTransferred);
                expect(newSenderBalance).to.be.bignumber.equal(expectedNewSenderBalance);
                expect(newReceiverBalance).to.be.bignumber.equal(expectedNewReceiverBalance);
            });
            it('should successfully transfer value for a combination of several fungible/non-fungible tokens', async () => {
                // Check inital balances and construct asset data
                const erc1155Wrapper = erc1155ProxyWrapper.getTokenWrapper(erc1155Token.address);
                const spenderInitialFungibleBalance = constants.INITIAL_ERC1155_FUNGIBLE_BALANCE;
                const receiverInitialFungibleBalance = constants.INITIAL_ERC1155_FUNGIBLE_BALANCE;
                const expectedInitialBalances = [
                    // spender balances
                    spenderInitialFungibleBalance,
                    spenderInitialFungibleBalance,
                    spenderInitialFungibleBalance,
                    new BigNumber(1),
                    new BigNumber(1),
                    // receiver balances
                    receiverInitialFungibleBalance,
                    receiverInitialFungibleBalance,
                    receiverInitialFungibleBalance,
                    new BigNumber(0),
                    new BigNumber(0),
                ];
                const tokenHolders = [
                    fromAddress,
                    toAddress,
                ];
                const fungibleTokenIdsToTransfer = erc1155FungibleTokenIds.slice(0, 3);
                const nonFungibleTokenIdsToTransfer = erc1155NonFungibleTokenIds.slice(0, 2);
                const initialHoldingsByOwner = await erc1155ProxyWrapper.getBalancesAsync();
                const nftsToTransfer = [
                    initialHoldingsByOwner.nonFungible[fromAddress][erc1155Token.address][nonFungibleTokenIdsToTransfer[0].toString()][0],
                    initialHoldingsByOwner.nonFungible[fromAddress][erc1155Token.address][nonFungibleTokenIdsToTransfer[1].toString()][0],
                ];
                const tokenIdsToTransfer = fungibleTokenIdsToTransfer.concat(nftsToTransfer);
                await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokenIdsToTransfer, expectedInitialBalances);
                const callbackData = "0x";
                const tokenValuesToTransfer = [spenderInitialFungibleBalance, spenderInitialFungibleBalance, spenderInitialFungibleBalance, new BigNumber(1),new BigNumber(1)];
                const encodedAssetData = assetDataUtils.encodeERC1155AssetData(erc1155Token.address, tokenIdsToTransfer, tokenValuesToTransfer, callbackData);
                // Perform a transfer from fromAddress to toAddress
                const perUnitValue = new BigNumber(1);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    fromAddress,
                    toAddress,
                    perUnitValue,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: erc1155Proxy.address,
                        data,
                        from: authorized,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                // Check final balances
                const expectedFinalBalances = [
                    // spender balances
                    new BigNumber(0),
                    new BigNumber(0),
                    new BigNumber(0),
                    new BigNumber(0),
                    new BigNumber(0),
                    // receiver balances
                    receiverInitialFungibleBalance.plus(spenderInitialFungibleBalance),
                    receiverInitialFungibleBalance.plus(spenderInitialFungibleBalance),
                    receiverInitialFungibleBalance.plus(spenderInitialFungibleBalance),
                    new BigNumber(1),
                    new BigNumber(1),
                ];
                await erc1155Wrapper.assertBalancesAsync(tokenHolders, tokenIdsToTransfer, expectedFinalBalances);
            });
            it('should successfully transfer value and ignore extra assetData', async () => {
                // Construct ERC1155 asset data
                const callbackData = "0x";
                const fungibleTokenIdToTransfer = erc1155FungibleTokenIds[0];
                const tokenIdsToTransfer = [fungibleTokenIdToTransfer];
                const tokenValuesToTransfer = [new BigNumber(10)];
                const encodedAssetData = assetDataUtils.encodeERC1155AssetData(erc1155Token.address, tokenIdsToTransfer, tokenValuesToTransfer, callbackData);
                const extraData = '0102030405060708';
                const encodedAssetDataPlusExtraData = `${encodedAssetData}${extraData}`;
                // Verify pre-condition
                const initialHoldingsByOwner = await erc1155ProxyWrapper.getBalancesAsync();
                const initialSenderBalance = initialHoldingsByOwner.fungible[fromAddress][erc1155Token.address][fungibleTokenIdToTransfer.toString()];
                const initialReceiverBalance = initialHoldingsByOwner.fungible[toAddress][erc1155Token.address][fungibleTokenIdToTransfer.toString()];
                // Perform a transfer from fromAddress to toAddress
                const perUnitValue = new BigNumber(1000);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetDataPlusExtraData,
                    fromAddress,
                    toAddress,
                    perUnitValue,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: erc1155Proxy.address,
                        data,
                        from: authorized,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                // Verify transfer was successful
                const totalValueTransferred = tokenValuesToTransfer[0].times(perUnitValue);
                const newHoldingsByOwner = await erc1155ProxyWrapper.getBalancesAsync();
                const newSenderBalance = newHoldingsByOwner.fungible[fromAddress][erc1155Token.address][fungibleTokenIdToTransfer.toString()];
                const expectedNewSenderBalance = initialSenderBalance.minus(totalValueTransferred);
                const newReceiverBalance = newHoldingsByOwner.fungible[toAddress][erc1155Token.address][fungibleTokenIdToTransfer.toString()];
                const expectedNewReceiverBalance = initialReceiverBalance.plus(totalValueTransferred);
                expect(newSenderBalance).to.be.bignumber.equal(expectedNewSenderBalance);
                expect(newReceiverBalance).to.be.bignumber.equal(expectedNewReceiverBalance);
            });
            it('should successfully execute callback when transferring to a smart contract', async () => {
                // Construct ERC1155 asset data
                const callbackData = "0x";
                const nonFungibleTokenIdToTransfer = erc1155NonFungibleTokenIds[0];
                const initialHoldingsByOwner = await erc1155ProxyWrapper.getBalancesAsync();
                const nftToTransfer = initialHoldingsByOwner.nonFungible[fromAddress][erc1155Token.address][nonFungibleTokenIdToTransfer.toString()][0];
                const tokenIdsToTransfer = [nftToTransfer];
                const tokenValuesToTransfer = [new BigNumber(1)];
                const encodedAssetData = assetDataUtils.encodeERC1155AssetData(erc1155Token.address, tokenIdsToTransfer, tokenValuesToTransfer, callbackData);
                // Verify precondition
                const nftHolder = await erc1155ProxyWrapper.ownerOfNonFungibleAsync(erc1155Token.address, nftToTransfer);
                expect(nftHolder).to.be.equal(fromAddress);
                // Perform a transfer from fromAddress to toAddress
                const perUnitValue = new BigNumber(1);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    fromAddress,
                    erc1155Receiver.address,
                    perUnitValue,
                );
                const logDecoder = new LogDecoder(web3Wrapper, artifacts);
                const txReceipt = await logDecoder.getTxWithDecodedLogsAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: erc1155Proxy.address,
                        data,
                        from: authorized,
                    })
                );
                // Verify logs
                expect(txReceipt.logs.length).to.be.equal(2);
                const receiverLog = txReceipt.logs[1] as LogWithDecodedArgs<DummyERC1155ReceiverBatchTokenReceivedEventArgs>;
                expect(receiverLog.args.operator).to.be.equal(erc1155Proxy.address);
                expect(receiverLog.args.from).to.be.equal(fromAddress);
                expect(receiverLog.args.tokenIds.length).to.be.deep.equal(1);
                expect(receiverLog.args.tokenIds[0]).to.be.bignumber.equal(tokenIdsToTransfer[0]);
                expect(receiverLog.args.tokenValues.length).to.be.deep.equal(1);
                expect(receiverLog.args.tokenValues[0]).to.be.bignumber.equal(tokenValuesToTransfer[0]);
                expect(receiverLog.args.data).to.be.deep.equal(callbackData);
                // Verify transfer was successful
                const newNftHolder = await erc1155ProxyWrapper.ownerOfNonFungibleAsync(erc1155Token.address, nftToTransfer);
                expect(newNftHolder).to.be.equal(erc1155Receiver.address);
            });
            it('should successfully execute callback when transferring to a smart contract when there is callback data', async () => {
                // Construct ERC1155 asset data
                const callbackData = "0x12345678";
                const nonFungibleTokenIdToTransfer = erc1155NonFungibleTokenIds[0];
                const initialHoldingsByOwner = await erc1155ProxyWrapper.getBalancesAsync();
                const nftToTransfer = initialHoldingsByOwner.nonFungible[fromAddress][erc1155Token.address][nonFungibleTokenIdToTransfer.toString()][0];
                const tokenIdsToTransfer = [nftToTransfer];
                const tokenValuesToTransfer = [new BigNumber(1)];
                const encodedAssetData = assetDataUtils.encodeERC1155AssetData(erc1155Token.address, tokenIdsToTransfer, tokenValuesToTransfer, callbackData);
                // Verify precondition
                const nftHolder = await erc1155ProxyWrapper.ownerOfNonFungibleAsync(erc1155Token.address, nftToTransfer);
                expect(nftHolder).to.be.equal(fromAddress);
                // Perform a transfer from fromAddress to toAddress
                const perUnitValue = new BigNumber(1);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    fromAddress,
                    erc1155Receiver.address,
                    perUnitValue,
                );
                const logDecoder = new LogDecoder(web3Wrapper, artifacts);
                const txReceipt = await logDecoder.getTxWithDecodedLogsAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: erc1155Proxy.address,
                        data,
                        from: authorized,
                    })
                );
                // Verify logs
                expect(txReceipt.logs.length).to.be.equal(2);
                const receiverLog = txReceipt.logs[1] as LogWithDecodedArgs<DummyERC1155ReceiverBatchTokenReceivedEventArgs>;
                expect(receiverLog.args.operator).to.be.equal(erc1155Proxy.address);
                expect(receiverLog.args.from).to.be.equal(fromAddress);
                expect(receiverLog.args.tokenIds.length).to.be.deep.equal(1);
                expect(receiverLog.args.tokenIds[0]).to.be.bignumber.equal(tokenIdsToTransfer[0]);
                expect(receiverLog.args.tokenValues.length).to.be.deep.equal(1);
                expect(receiverLog.args.tokenValues[0]).to.be.bignumber.equal(tokenValuesToTransfer[0]);
                expect(receiverLog.args.data).to.be.deep.equal(callbackData);
                // Verify transfer was successful
                const newNftHolder = await erc1155ProxyWrapper.ownerOfNonFungibleAsync(erc1155Token.address, nftToTransfer);
                expect(newNftHolder).to.be.equal(erc1155Receiver.address);
            });
            it('should propagate revert reason from erc1155 contract failure', async () => {
                // Disable transfers
                const shouldRejectTransfer = true;
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await erc1155Receiver.setRejectTransferFlag.sendTransactionAsync(shouldRejectTransfer),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                // Construct ERC1155 asset data
                const callbackData = "0x12345678";
                const nonFungibleTokenIdToTransfer = erc1155NonFungibleTokenIds[0];
                const initialHoldingsByOwner = await erc1155ProxyWrapper.getBalancesAsync();
                const nftToTransfer = initialHoldingsByOwner.nonFungible[fromAddress][erc1155Token.address][nonFungibleTokenIdToTransfer.toString()][0];
                const tokenIdsToTransfer = [nftToTransfer];
                const tokenValuesToTransfer = [new BigNumber(1)];
                const encodedAssetData = assetDataUtils.encodeERC1155AssetData(erc1155Token.address, tokenIdsToTransfer, tokenValuesToTransfer, callbackData);
                // Perform a transfer from fromAddress to toAddress
                const perUnitValue = new BigNumber(1);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    fromAddress,
                    erc1155Receiver.address,
                    perUnitValue,
                );
                await expectTransactionFailedAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: erc1155Proxy.address,
                        data,
                        from: authorized,
                    }),
                    RevertReason.TransferRejected,
                );
            });
            it('should revert if transferring the same non-fungible token more than once', async () => {
                // Construct ERC1155 asset data
                const callbackData = "0x12345678";
                const nonFungibleTokenIdToTransfer = erc1155NonFungibleTokenIds[0];
                const initialHoldingsByOwner = await erc1155ProxyWrapper.getBalancesAsync();
                const nftToTransfer = initialHoldingsByOwner.nonFungible[fromAddress][erc1155Token.address][nonFungibleTokenIdToTransfer.toString()][0];
                const tokenIdsToTransfer = [nftToTransfer, nftToTransfer];
                const tokenValuesToTransfer = [new BigNumber(1), new BigNumber(1)];
                const encodedAssetData = assetDataUtils.encodeERC1155AssetData(erc1155Token.address, tokenIdsToTransfer, tokenValuesToTransfer, callbackData);
                // Verify precondition
                const nftHolder = await erc1155ProxyWrapper.ownerOfNonFungibleAsync(erc1155Token.address, nftToTransfer);
                expect(nftHolder).to.be.equal(fromAddress);
                // Perform a transfer from fromAddress to toAddress
                const perUnitValue = new BigNumber(1);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    fromAddress,
                    erc1155Receiver.address,
                    perUnitValue,
                );
                await expectTransactionFailedAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: erc1155Proxy.address,
                        data,
                        from: authorized,
                    }),
                    RevertReason.nftNotOwnedByFromAddress,
                );
            });
            it('should revert if tansferring 0 amount of any token', async () => {
                // Construct ERC1155 asset data
                const callbackData = "0x12345678";
                const initialHoldingsByOwner = await erc1155ProxyWrapper.getBalancesAsync();
                const tokenIdsToTransfer = [
                    initialHoldingsByOwner.nonFungible[fromAddress][erc1155Token.address][erc1155NonFungibleTokenIds[0].toString()][0],
                    initialHoldingsByOwner.nonFungible[fromAddress][erc1155Token.address][erc1155NonFungibleTokenIds[1].toString()][0],
                    initialHoldingsByOwner.nonFungible[fromAddress][erc1155Token.address][erc1155NonFungibleTokenIds[2].toString()][0],
                ];
                const tokenValuesToTransfer = [new BigNumber(1), new BigNumber(0), new BigNumber(1)];
                const encodedAssetData = assetDataUtils.encodeERC1155AssetData(erc1155Token.address, tokenIdsToTransfer, tokenValuesToTransfer, callbackData);
                // Perform a transfer from fromAddress to toAddress
                const perUnitValue = new BigNumber(1);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    fromAddress,
                    erc1155Receiver.address,
                    perUnitValue,
                );
                await expectTransactionFailedAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: erc1155Proxy.address,
                        data,
                        from: authorized,
                    }),
                    RevertReason.transferGreaterThanZeroRequired,
                );
            });
            it('should revert if there is a multiplication overflow', async () => {
                // Construct ERC1155 asset data
                const callbackData = "0x";
                const fungibleTokenIdToTransfer = erc1155FungibleTokenIds[0];
                const tokenIdsToTransfer = [fungibleTokenIdToTransfer];
                const maxUintValue = (new BigNumber(2)).pow(256).minus(1);
                const tokenValuesToTransfer = [maxUintValue];
                const encodedAssetData = assetDataUtils.encodeERC1155AssetData(erc1155Token.address, tokenIdsToTransfer, tokenValuesToTransfer, callbackData);
                // Perform a transfer from fromAddress to toAddress
                const perUnitValue = new BigNumber(2);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    fromAddress,
                    toAddress,
                    perUnitValue,
                );
                await expectTransactionFailedAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: erc1155Proxy.address,
                        data,
                        from: authorized,
                    }),
                    RevertReason.Uint256Overflow,
                );
            });
            it('should revert if there is a multiplication overflow, when transferring multiple tokens', async () => {
                // Construct ERC1155 asset data
                const callbackData = "0x";
                const tokenIdsToTransfer = erc1155FungibleTokenIds.slice(3);
                const maxUintValue = (new BigNumber(2)).pow(256).minus(1);
                // Note - the second token will fail
                const tokenValuesToTransfer = [new BigNumber(1), maxUintValue, new BigNumber(1)];
                const encodedAssetData = assetDataUtils.encodeERC1155AssetData(erc1155Token.address, tokenIdsToTransfer, tokenValuesToTransfer, callbackData);
                // Perform a transfer from fromAddress to toAddress
                const perUnitValue = new BigNumber(2);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    fromAddress,
                    toAddress,
                    perUnitValue,
                );
                await expectTransactionFailedAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: erc1155Proxy.address,
                        data,
                        from: authorized,
                    }),
                    RevertReason.Uint256Overflow,
                );
            });
            it('should revert if transferring > 1 instances of a non-fungible token (amount field >1)', async () => {
                // Construct ERC1155 asset data
                const callbackData = "0x";
                const nonFungibleTokenIdToTransfer = erc1155NonFungibleTokenIds[0];
                const initialHoldingsByOwner = await erc1155ProxyWrapper.getBalancesAsync();
                const nftToTransfer = initialHoldingsByOwner.nonFungible[fromAddress][erc1155Token.address][nonFungibleTokenIdToTransfer.toString()][0];
                const tokenIdsToTransfer = [nftToTransfer];
                const tokenValuesToTransfer = [new BigNumber(1)];
                const encodedAssetData = assetDataUtils.encodeERC1155AssetData(erc1155Token.address, tokenIdsToTransfer, tokenValuesToTransfer, callbackData);
                // Perform a transfer from fromAddress to toAddress
                const perUnitValue = new BigNumber(2);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    fromAddress,
                    toAddress,
                    perUnitValue,
                );
                await expectTransactionFailedAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: erc1155Proxy.address,
                        data,
                        from: authorized,
                    }),
                    RevertReason.amountEqualToOneRequired,
                );
            });
            it('should revert if transferring > 1 instances of a non-fungible token (value field >1)', async () => {
                // Construct ERC1155 asset data
                const callbackData = "0x";
                const nonFungibleTokenIdToTransfer = erc1155NonFungibleTokenIds[0];
                const initialHoldingsByOwner = await erc1155ProxyWrapper.getBalancesAsync();
                const nftToTransfer = initialHoldingsByOwner.nonFungible[fromAddress][erc1155Token.address][nonFungibleTokenIdToTransfer.toString()][0];
                const tokenIdsToTransfer = [nftToTransfer];
                const tokenValuesToTransfer = [new BigNumber(2)];
                const encodedAssetData = assetDataUtils.encodeERC1155AssetData(erc1155Token.address, tokenIdsToTransfer, tokenValuesToTransfer, callbackData);
                // Perform a transfer from fromAddress to toAddress
                const perUnitValue = new BigNumber(1);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    fromAddress,
                    toAddress,
                    perUnitValue,
                );
                await expectTransactionFailedAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: erc1155Proxy.address,
                        data,
                        from: authorized,
                    }),
                    RevertReason.amountEqualToOneRequired,
                );
            });
            it('should revert if sender balance is insufficient', async () => {
                // Verify pre-condition
                const fungibleTokenIdToTransfer = erc1155FungibleTokenIds[0];
                const initialHoldingsByOwner = await erc1155ProxyWrapper.getBalancesAsync();
                const initialSenderBalance = initialHoldingsByOwner.fungible[fromAddress][erc1155Token.address][fungibleTokenIdToTransfer.toString()];
                // Construct ERC1155 asset data
                const callbackData = "0x";
                const tokenIdsToTransfer = [fungibleTokenIdToTransfer];
                const tokenValuesToTransfer = [initialSenderBalance.plus(1)];
                const encodedAssetData = assetDataUtils.encodeERC1155AssetData(erc1155Token.address, tokenIdsToTransfer, tokenValuesToTransfer, callbackData);
                // Perform a transfer from fromAddress to toAddress
                const perUnitValue = new BigNumber(1);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    fromAddress,
                    toAddress,
                    perUnitValue,
                );
                await expectTransactionFailedAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: erc1155Proxy.address,
                        data,
                        from: authorized,
                    }),
                    RevertReason.Uint256Underflow,
                );
            });
            it('should revert if sender allowance is insufficient', async () => {
                // Unapprove ERC1155 proxy
                const wrapper = erc1155ProxyWrapper.getTokenWrapper(erc1155Token.address);
                const isApproved = false;
                await wrapper.setApprovalForAllAsync(fromAddress, erc1155Proxy.address, isApproved);
                const isApprovedActualValue = await wrapper.isApprovedForAllAsync(fromAddress, erc1155Proxy.address);
                expect(isApprovedActualValue).to.be.equal(isApproved);
                // Verify pre-condition
                const fungibleTokenIdToTransfer = erc1155FungibleTokenIds[0];
                const initialHoldingsByOwner = await erc1155ProxyWrapper.getBalancesAsync();
                const initialSenderBalance = initialHoldingsByOwner.fungible[fromAddress][erc1155Token.address][fungibleTokenIdToTransfer.toString()];
                // Construct ERC1155 asset data
                const callbackData = "0x";
                const tokenIdsToTransfer = [fungibleTokenIdToTransfer];
                const tokenValuesToTransfer = [initialSenderBalance];
                const encodedAssetData = assetDataUtils.encodeERC1155AssetData(erc1155Token.address, tokenIdsToTransfer, tokenValuesToTransfer, callbackData);
                // Perform a transfer from fromAddress to toAddress
                const perUnitValue = new BigNumber(1);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    fromAddress,
                    toAddress,
                    perUnitValue,
                );
                await expectTransactionFailedAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: erc1155Proxy.address,
                        data,
                        from: authorized,
                    }),
                    RevertReason.InsufficientAllowance,
                );
            });
            it('should revert if caller is not authorized', async () => {
                // Construct ERC1155 asset data
                const callbackData = "0x12345678";
                const nonFungibleTokenIdToTransfer = erc1155NonFungibleTokenIds[0];
                const initialHoldingsByOwner = await erc1155ProxyWrapper.getBalancesAsync();
                const nftToTransfer = initialHoldingsByOwner.nonFungible[fromAddress][erc1155Token.address][nonFungibleTokenIdToTransfer.toString()][0];
                const tokenIdsToTransfer = [nftToTransfer];
                const tokenValuesToTransfer = [new BigNumber(1)];
                const encodedAssetData = assetDataUtils.encodeERC1155AssetData(erc1155Token.address, tokenIdsToTransfer, tokenValuesToTransfer, callbackData);
                // Perform a transfer from fromAddress to toAddress
                const perUnitValue = new BigNumber(1);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    fromAddress,
                    erc1155Receiver.address,
                    perUnitValue,
                );
                await expectTransactionFailedAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: erc1155Proxy.address,
                        data,
                        from: notAuthorized,
                    }),
                    RevertReason.SenderNotAuthorized,
                );
            });
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
// tslint:disable:max-file-line-count
