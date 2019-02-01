import { BlockchainLifecycle } from '@0x/dev-utils';
import { assetDataUtils } from '@0x/order-utils';
import { RevertReason } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import * as _ from 'lodash';

import { DummyERC20TokenContract } from '../../generated-wrappers/dummy_erc20_token';
import { DummyERC721ReceiverContract } from '../../generated-wrappers/dummy_erc721_receiver';
import { DummyERC721TokenContract } from '../../generated-wrappers/dummy_erc721_token';
import { DummyMultipleReturnERC20TokenContract } from '../../generated-wrappers/dummy_multiple_return_erc20_token';
import { DummyNoReturnERC20TokenContract } from '../../generated-wrappers/dummy_no_return_erc20_token';
import { ERC20ProxyContract } from '../../generated-wrappers/erc20_proxy';
import { ERC721ProxyContract } from '../../generated-wrappers/erc721_proxy';
import { IAssetProxyContract } from '../../generated-wrappers/i_asset_proxy';
import { artifacts } from '../../src/artifacts';
import { expectTransactionFailedAsync, expectTransactionFailedWithoutReasonAsync } from '../utils/assertions';
import { chaiSetup } from '../utils/chai_setup';
import { constants } from '../utils/constants';
import { ERC20Wrapper } from '../utils/erc20_wrapper';
import { ERC721Wrapper } from '../utils/erc721_wrapper';
import { LogDecoder } from '../utils/log_decoder';
import { provider, txDefaults, web3Wrapper } from '../utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
const assetProxyInterface = new IAssetProxyContract(
    artifacts.IAssetProxy.compilerOutput.abi,
    constants.NULL_ADDRESS,
    provider,
);

// tslint:disable:no-unnecessary-type-assertion
describe('Asset Transfer Proxies', () => {
    let owner: string;
    let notAuthorized: string;
    let exchangeAddress: string;
    let makerAddress: string;
    let takerAddress: string;

    let zrxToken: DummyERC20TokenContract;
    let erc721Token: DummyERC721TokenContract;
    let erc721Receiver: DummyERC721ReceiverContract;
    let erc20Proxy: ERC20ProxyContract;
    let erc721Proxy: ERC721ProxyContract;
    let noReturnErc20Token: DummyNoReturnERC20TokenContract;
    let multipleReturnErc20Token: DummyMultipleReturnERC20TokenContract;

    let erc20Wrapper: ERC20Wrapper;
    let erc721Wrapper: ERC721Wrapper;
    let erc721MakerTokenId: BigNumber;

    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const usedAddresses = ([owner, notAuthorized, exchangeAddress, makerAddress, takerAddress] = _.slice(
            accounts,
            0,
            5,
        ));

        erc20Wrapper = new ERC20Wrapper(provider, usedAddresses, owner);
        erc721Wrapper = new ERC721Wrapper(provider, usedAddresses, owner);

        const numDummyErc20ToDeploy = 1;
        [zrxToken] = await erc20Wrapper.deployDummyTokensAsync(numDummyErc20ToDeploy, constants.DUMMY_TOKEN_DECIMALS);
        erc20Proxy = await erc20Wrapper.deployProxyAsync();
        await erc20Wrapper.setBalancesAndAllowancesAsync();
        await web3Wrapper.awaitTransactionSuccessAsync(
            await erc20Proxy.addAuthorizedAddress.sendTransactionAsync(exchangeAddress, {
                from: owner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );

        [erc721Token] = await erc721Wrapper.deployDummyTokensAsync();
        erc721Proxy = await erc721Wrapper.deployProxyAsync();
        await erc721Wrapper.setBalancesAndAllowancesAsync();
        const erc721Balances = await erc721Wrapper.getBalancesAsync();
        erc721MakerTokenId = erc721Balances[makerAddress][erc721Token.address][0];
        await web3Wrapper.awaitTransactionSuccessAsync(
            await erc721Proxy.addAuthorizedAddress.sendTransactionAsync(exchangeAddress, {
                from: owner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        erc721Receiver = await DummyERC721ReceiverContract.deployFrom0xArtifactAsync(
            artifacts.DummyERC721Receiver,
            provider,
            txDefaults,
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
        await web3Wrapper.awaitTransactionSuccessAsync(
            await noReturnErc20Token.setBalance.sendTransactionAsync(makerAddress, constants.INITIAL_ERC20_BALANCE),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await web3Wrapper.awaitTransactionSuccessAsync(
            await noReturnErc20Token.approve.sendTransactionAsync(
                erc20Proxy.address,
                constants.INITIAL_ERC20_ALLOWANCE,
                { from: makerAddress },
            ),
            constants.AWAIT_TRANSACTION_MINED_MS,
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
        await web3Wrapper.awaitTransactionSuccessAsync(
            await multipleReturnErc20Token.setBalance.sendTransactionAsync(
                makerAddress,
                constants.INITIAL_ERC20_BALANCE,
            ),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await web3Wrapper.awaitTransactionSuccessAsync(
            await multipleReturnErc20Token.approve.sendTransactionAsync(
                erc20Proxy.address,
                constants.INITIAL_ERC20_ALLOWANCE,
                { from: makerAddress },
            ),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('Transfer Proxy - ERC20', () => {
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
        describe('transferFrom', () => {
            it('should successfully transfer tokens', async () => {
                // Construct ERC20 asset data
                const encodedAssetData = assetDataUtils.encodeERC20AssetData(zrxToken.address);
                // Perform a transfer from makerAddress to takerAddress
                const erc20Balances = await erc20Wrapper.getBalancesAsync();
                const amount = new BigNumber(10);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    makerAddress,
                    takerAddress,
                    amount,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: erc20Proxy.address,
                        data,
                        from: exchangeAddress,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                // Verify transfer was successful
                const newBalances = await erc20Wrapper.getBalancesAsync();
                expect(newBalances[makerAddress][zrxToken.address]).to.be.bignumber.equal(
                    erc20Balances[makerAddress][zrxToken.address].minus(amount),
                );
                expect(newBalances[takerAddress][zrxToken.address]).to.be.bignumber.equal(
                    erc20Balances[takerAddress][zrxToken.address].add(amount),
                );
            });

            it('should successfully transfer tokens that do not return a value', async () => {
                // Construct ERC20 asset data
                const encodedAssetData = assetDataUtils.encodeERC20AssetData(noReturnErc20Token.address);
                // Perform a transfer from makerAddress to takerAddress
                const initialMakerBalance = await noReturnErc20Token.balanceOf.callAsync(makerAddress);
                const initialTakerBalance = await noReturnErc20Token.balanceOf.callAsync(takerAddress);
                const amount = new BigNumber(10);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    makerAddress,
                    takerAddress,
                    amount,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: erc20Proxy.address,
                        data,
                        from: exchangeAddress,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                // Verify transfer was successful
                const newMakerBalance = await noReturnErc20Token.balanceOf.callAsync(makerAddress);
                const newTakerBalance = await noReturnErc20Token.balanceOf.callAsync(takerAddress);
                expect(newMakerBalance).to.be.bignumber.equal(initialMakerBalance.minus(amount));
                expect(newTakerBalance).to.be.bignumber.equal(initialTakerBalance.plus(amount));
            });

            it('should successfully transfer tokens and ignore extra assetData', async () => {
                // Construct ERC20 asset data
                const extraData = '0102030405060708';
                const encodedAssetData = `${assetDataUtils.encodeERC20AssetData(zrxToken.address)}${extraData}`;
                // Perform a transfer from makerAddress to takerAddress
                const erc20Balances = await erc20Wrapper.getBalancesAsync();
                const amount = new BigNumber(10);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    makerAddress,
                    takerAddress,
                    amount,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: erc20Proxy.address,
                        data,
                        from: exchangeAddress,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                // Verify transfer was successful
                const newBalances = await erc20Wrapper.getBalancesAsync();
                expect(newBalances[makerAddress][zrxToken.address]).to.be.bignumber.equal(
                    erc20Balances[makerAddress][zrxToken.address].minus(amount),
                );
                expect(newBalances[takerAddress][zrxToken.address]).to.be.bignumber.equal(
                    erc20Balances[takerAddress][zrxToken.address].add(amount),
                );
            });

            it('should do nothing if transferring 0 amount of a token', async () => {
                // Construct ERC20 asset data
                const encodedAssetData = assetDataUtils.encodeERC20AssetData(zrxToken.address);
                // Perform a transfer from makerAddress to takerAddress
                const erc20Balances = await erc20Wrapper.getBalancesAsync();
                const amount = new BigNumber(0);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    makerAddress,
                    takerAddress,
                    amount,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: erc20Proxy.address,
                        data,
                        from: exchangeAddress,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                // Verify transfer was successful
                const newBalances = await erc20Wrapper.getBalancesAsync();
                expect(newBalances[makerAddress][zrxToken.address]).to.be.bignumber.equal(
                    erc20Balances[makerAddress][zrxToken.address],
                );
                expect(newBalances[takerAddress][zrxToken.address]).to.be.bignumber.equal(
                    erc20Balances[takerAddress][zrxToken.address],
                );
            });

            it('should throw if allowances are too low', async () => {
                // Construct ERC20 asset data
                const encodedAssetData = assetDataUtils.encodeERC20AssetData(zrxToken.address);
                // Create allowance less than transfer amount. Set allowance on proxy.
                const allowance = new BigNumber(0);
                const amount = new BigNumber(10);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    makerAddress,
                    takerAddress,
                    amount,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await zrxToken.approve.sendTransactionAsync(erc20Proxy.address, allowance, {
                        from: makerAddress,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                const erc20Balances = await erc20Wrapper.getBalancesAsync();
                // Perform a transfer; expect this to fail.
                await expectTransactionFailedAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: erc20Proxy.address,
                        data,
                        from: exchangeAddress,
                    }),
                    RevertReason.TransferFailed,
                );
                const newBalances = await erc20Wrapper.getBalancesAsync();
                expect(newBalances).to.deep.equal(erc20Balances);
            });

            it('should throw if allowances are too low and token does not return a value', async () => {
                // Construct ERC20 asset data
                const encodedAssetData = assetDataUtils.encodeERC20AssetData(noReturnErc20Token.address);
                // Create allowance less than transfer amount. Set allowance on proxy.
                const allowance = new BigNumber(0);
                const amount = new BigNumber(10);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    makerAddress,
                    takerAddress,
                    amount,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await noReturnErc20Token.approve.sendTransactionAsync(erc20Proxy.address, allowance, {
                        from: makerAddress,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                const initialMakerBalance = await noReturnErc20Token.balanceOf.callAsync(makerAddress);
                const initialTakerBalance = await noReturnErc20Token.balanceOf.callAsync(takerAddress);
                // Perform a transfer; expect this to fail.
                await expectTransactionFailedAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: erc20Proxy.address,
                        data,
                        from: exchangeAddress,
                    }),
                    RevertReason.TransferFailed,
                );
                const newMakerBalance = await noReturnErc20Token.balanceOf.callAsync(makerAddress);
                const newTakerBalance = await noReturnErc20Token.balanceOf.callAsync(takerAddress);
                expect(newMakerBalance).to.be.bignumber.equal(initialMakerBalance);
                expect(newTakerBalance).to.be.bignumber.equal(initialTakerBalance);
            });

            it('should throw if requesting address is not authorized', async () => {
                // Construct ERC20 asset data
                const encodedAssetData = assetDataUtils.encodeERC20AssetData(zrxToken.address);
                // Perform a transfer from makerAddress to takerAddress
                const amount = new BigNumber(10);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    makerAddress,
                    takerAddress,
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

            it('should throw if token returns more than 32 bytes', async () => {
                // Construct ERC20 asset data
                const encodedAssetData = assetDataUtils.encodeERC20AssetData(multipleReturnErc20Token.address);
                const amount = new BigNumber(10);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    makerAddress,
                    takerAddress,
                    amount,
                );
                const initialMakerBalance = await multipleReturnErc20Token.balanceOf.callAsync(makerAddress);
                const initialTakerBalance = await multipleReturnErc20Token.balanceOf.callAsync(takerAddress);
                // Perform a transfer; expect this to fail.
                await expectTransactionFailedAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: erc20Proxy.address,
                        data,
                        from: exchangeAddress,
                    }),
                    RevertReason.TransferFailed,
                );
                const newMakerBalance = await multipleReturnErc20Token.balanceOf.callAsync(makerAddress);
                const newTakerBalance = await multipleReturnErc20Token.balanceOf.callAsync(takerAddress);
                expect(newMakerBalance).to.be.bignumber.equal(initialMakerBalance);
                expect(newTakerBalance).to.be.bignumber.equal(initialTakerBalance);
            });
        });

        it('should have an id of 0xf47261b0', async () => {
            const proxyId = await erc20Proxy.getProxyId.callAsync();
            const expectedProxyId = '0xf47261b0';
            expect(proxyId).to.equal(expectedProxyId);
        });
    });

    describe('Transfer Proxy - ERC721', () => {
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
        describe('transferFrom', () => {
            it('should successfully transfer tokens', async () => {
                // Construct ERC721 asset data
                const encodedAssetData = assetDataUtils.encodeERC721AssetData(erc721Token.address, erc721MakerTokenId);
                // Verify pre-condition
                const ownerMakerAsset = await erc721Token.ownerOf.callAsync(erc721MakerTokenId);
                expect(ownerMakerAsset).to.be.equal(makerAddress);
                // Perform a transfer from makerAddress to takerAddress
                const amount = new BigNumber(1);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    makerAddress,
                    takerAddress,
                    amount,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: erc721Proxy.address,
                        data,
                        from: exchangeAddress,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                // Verify transfer was successful
                const newOwnerMakerAsset = await erc721Token.ownerOf.callAsync(erc721MakerTokenId);
                expect(newOwnerMakerAsset).to.be.bignumber.equal(takerAddress);
            });

            it('should successfully transfer tokens and ignore extra assetData', async () => {
                // Construct ERC721 asset data
                const extraData = '0102030405060708';
                const encodedAssetData = `${assetDataUtils.encodeERC721AssetData(
                    erc721Token.address,
                    erc721MakerTokenId,
                )}${extraData}`;
                // Verify pre-condition
                const ownerMakerAsset = await erc721Token.ownerOf.callAsync(erc721MakerTokenId);
                expect(ownerMakerAsset).to.be.equal(makerAddress);
                // Perform a transfer from makerAddress to takerAddress
                const amount = new BigNumber(1);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    makerAddress,
                    takerAddress,
                    amount,
                );
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: erc721Proxy.address,
                        data,
                        from: exchangeAddress,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                // Verify transfer was successful
                const newOwnerMakerAsset = await erc721Token.ownerOf.callAsync(erc721MakerTokenId);
                expect(newOwnerMakerAsset).to.be.bignumber.equal(takerAddress);
            });

            it('should not call onERC721Received when transferring to a smart contract', async () => {
                // Construct ERC721 asset data
                const encodedAssetData = assetDataUtils.encodeERC721AssetData(erc721Token.address, erc721MakerTokenId);
                // Verify pre-condition
                const ownerMakerAsset = await erc721Token.ownerOf.callAsync(erc721MakerTokenId);
                expect(ownerMakerAsset).to.be.equal(makerAddress);
                // Perform a transfer from makerAddress to takerAddress
                const amount = new BigNumber(1);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    makerAddress,
                    erc721Receiver.address,
                    amount,
                );
                const logDecoder = new LogDecoder(web3Wrapper);
                const tx = await logDecoder.getTxWithDecodedLogsAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: erc721Proxy.address,
                        data,
                        from: exchangeAddress,
                        gas: constants.MAX_TRANSFER_FROM_GAS,
                    }),
                );
                // Verify that no log was emitted by erc721 receiver
                expect(tx.logs.length).to.be.equal(1);
                // Verify transfer was successful
                const newOwnerMakerAsset = await erc721Token.ownerOf.callAsync(erc721MakerTokenId);
                expect(newOwnerMakerAsset).to.be.bignumber.equal(erc721Receiver.address);
            });

            it('should throw if transferring 0 amount of a token', async () => {
                // Construct ERC721 asset data
                const encodedAssetData = assetDataUtils.encodeERC721AssetData(erc721Token.address, erc721MakerTokenId);
                // Verify pre-condition
                const ownerMakerAsset = await erc721Token.ownerOf.callAsync(erc721MakerTokenId);
                expect(ownerMakerAsset).to.be.equal(makerAddress);
                // Perform a transfer from makerAddress to takerAddress
                const amount = new BigNumber(0);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    makerAddress,
                    takerAddress,
                    amount,
                );
                await expectTransactionFailedAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: erc721Proxy.address,
                        data,
                        from: exchangeAddress,
                    }),
                    RevertReason.InvalidAmount,
                );
                const newOwner = await erc721Token.ownerOf.callAsync(erc721MakerTokenId);
                expect(newOwner).to.be.equal(ownerMakerAsset);
            });

            it('should throw if transferring > 1 amount of a token', async () => {
                // Construct ERC721 asset data
                const encodedAssetData = assetDataUtils.encodeERC721AssetData(erc721Token.address, erc721MakerTokenId);
                // Verify pre-condition
                const ownerMakerAsset = await erc721Token.ownerOf.callAsync(erc721MakerTokenId);
                expect(ownerMakerAsset).to.be.equal(makerAddress);
                // Perform a transfer from makerAddress to takerAddress
                const amount = new BigNumber(500);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    makerAddress,
                    takerAddress,
                    amount,
                );
                await expectTransactionFailedAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: erc721Proxy.address,
                        data,
                        from: exchangeAddress,
                    }),
                    RevertReason.InvalidAmount,
                );
                const newOwner = await erc721Token.ownerOf.callAsync(erc721MakerTokenId);
                expect(newOwner).to.be.equal(ownerMakerAsset);
            });

            it('should throw if allowances are too low', async () => {
                // Construct ERC721 asset data
                const encodedAssetData = assetDataUtils.encodeERC721AssetData(erc721Token.address, erc721MakerTokenId);
                // Verify pre-condition
                const ownerMakerAsset = await erc721Token.ownerOf.callAsync(erc721MakerTokenId);
                expect(ownerMakerAsset).to.be.equal(makerAddress);
                // Remove transfer approval for makerAddress.
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await erc721Token.approve.sendTransactionAsync(constants.NULL_ADDRESS, erc721MakerTokenId, {
                        from: makerAddress,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                // Perform a transfer; expect this to fail.
                const amount = new BigNumber(1);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    makerAddress,
                    takerAddress,
                    amount,
                );
                await expectTransactionFailedAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: erc721Proxy.address,
                        data,
                        from: exchangeAddress,
                    }),
                    RevertReason.TransferFailed,
                );
                const newOwner = await erc721Token.ownerOf.callAsync(erc721MakerTokenId);
                expect(newOwner).to.be.equal(ownerMakerAsset);
            });

            it('should throw if requesting address is not authorized', async () => {
                // Construct ERC721 asset data
                const encodedAssetData = assetDataUtils.encodeERC721AssetData(erc721Token.address, erc721MakerTokenId);
                // Verify pre-condition
                const ownerMakerAsset = await erc721Token.ownerOf.callAsync(erc721MakerTokenId);
                expect(ownerMakerAsset).to.be.equal(makerAddress);
                // Perform a transfer from makerAddress to takerAddress
                const amount = new BigNumber(1);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    makerAddress,
                    takerAddress,
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
                const newOwner = await erc721Token.ownerOf.callAsync(erc721MakerTokenId);
                expect(newOwner).to.be.equal(ownerMakerAsset);
            });
        });

        it('should have an id of 0x02571792', async () => {
            const proxyId = await erc721Proxy.getProxyId.callAsync();
            const expectedProxyId = '0x02571792';
            expect(proxyId).to.equal(expectedProxyId);
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
// tslint:disable:max-file-line-count
