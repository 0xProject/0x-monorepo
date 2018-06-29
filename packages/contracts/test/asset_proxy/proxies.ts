import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { assetProxyUtils, generatePseudoRandomSalt } from '@0xproject/order-utils';
import { RevertReason } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import { LogWithDecodedArgs } from 'ethereum-types';
import ethUtil = require('ethereumjs-util');
import * as _ from 'lodash';

import { DummyERC20TokenContract } from '../../src/generated_contract_wrappers/dummy_e_r_c20_token';
import {
    DummyERC721ReceiverContract,
    TokenReceivedContractEventArgs,
} from '../../src/generated_contract_wrappers/dummy_e_r_c721_receiver';
import { DummyERC721TokenContract } from '../../src/generated_contract_wrappers/dummy_e_r_c721_token';
import { ERC20ProxyContract } from '../../src/generated_contract_wrappers/e_r_c20_proxy';
import { ERC721ProxyContract } from '../../src/generated_contract_wrappers/e_r_c721_proxy';
import { IAssetProxyContract } from '../../src/generated_contract_wrappers/i_asset_proxy';
import { artifacts } from '../../src/utils/artifacts';
import { expectRevertReasonOrAlwaysFailingTransactionAsync } from '../../src/utils/assertions';
import { chaiSetup } from '../../src/utils/chai_setup';
import { constants } from '../../src/utils/constants';
import { ERC20Wrapper } from '../../src/utils/erc20_wrapper';
import { ERC721Wrapper } from '../../src/utils/erc721_wrapper';
import { LogDecoder } from '../../src/utils/log_decoder';
import { provider, txDefaults, web3Wrapper } from '../../src/utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

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
    let assetProxyInterface: IAssetProxyContract;

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
        assetProxyInterface = await IAssetProxyContract.deployFrom0xArtifactAsync(
            artifacts.IAssetProxy,
            provider,
            txDefaults,
        );
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('Transfer Proxy - ERC20', () => {
        describe('transferFrom', () => {
            it('should successfully transfer tokens', async () => {
                // Construct ERC20 asset data
                const encodedAssetData = assetProxyUtils.encodeERC20AssetData(zrxToken.address);
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
                const encodedAssetData = assetProxyUtils.encodeERC20AssetData(zrxToken.address);
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
                const encodedAssetData = assetProxyUtils.encodeERC20AssetData(zrxToken.address);
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
                // Perform a transfer; expect this to fail.
                return expectRevertReasonOrAlwaysFailingTransactionAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: erc20Proxy.address,
                        data,
                        from: exchangeAddress,
                    }),
                    RevertReason.TransferFailed,
                );
            });

            it('should throw if requesting address is not authorized', async () => {
                // Construct ERC20 asset data
                const encodedAssetData = assetProxyUtils.encodeERC20AssetData(zrxToken.address);
                // Perform a transfer from makerAddress to takerAddress
                const amount = new BigNumber(10);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    makerAddress,
                    takerAddress,
                    amount,
                );
                return expectRevertReasonOrAlwaysFailingTransactionAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: erc20Proxy.address,
                        data,
                        from: notAuthorized,
                    }),
                    RevertReason.SenderNotAuthorized,
                );
            });
        });

        it('should have an id of 0xf47261b0', async () => {
            const proxyId = await erc20Proxy.getProxyId.callAsync();
            const expectedProxyId = '0xf47261b0';
            expect(proxyId).to.equal(expectedProxyId);
        });
    });

    describe('Transfer Proxy - ERC721', () => {
        describe('transferFrom', () => {
            it('should successfully transfer tokens', async () => {
                // Construct ERC721 asset data
                const encodedAssetData = assetProxyUtils.encodeERC721AssetData(erc721Token.address, erc721MakerTokenId);
                // Verify pre-condition
                const ownerMakerAsset = await erc721Token.ownerOf.callAsync(erc721MakerTokenId);
                expect(ownerMakerAsset).to.be.bignumber.equal(makerAddress);
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

            it('should call onERC721Received when transferring to a smart contract without receiver data', async () => {
                // Construct ERC721 asset data
                const encodedAssetData = assetProxyUtils.encodeERC721AssetData(erc721Token.address, erc721MakerTokenId);
                // Verify pre-condition
                const ownerMakerAsset = await erc721Token.ownerOf.callAsync(erc721MakerTokenId);
                expect(ownerMakerAsset).to.be.bignumber.equal(makerAddress);
                // Perform a transfer from makerAddress to takerAddress
                const amount = new BigNumber(1);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    makerAddress,
                    erc721Receiver.address,
                    amount,
                );
                const logDecoder = new LogDecoder(web3Wrapper, erc721Receiver.address);
                const tx = await logDecoder.getTxWithDecodedLogsAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: erc721Proxy.address,
                        data,
                        from: exchangeAddress,
                        gas: constants.TRANSFER_FROM_GAS,
                    }),
                );
                // Verify that no log was emitted by erc721 receiver
                expect(tx.logs.length).to.be.equal(1);
                const tokenReceivedLog = tx.logs[0] as LogWithDecodedArgs<TokenReceivedContractEventArgs>;
                expect(tokenReceivedLog.args.from).to.be.equal(makerAddress);
                expect(tokenReceivedLog.args.tokenId).to.be.bignumber.equal(erc721MakerTokenId);
                expect(tokenReceivedLog.args.data).to.be.equal(constants.NULL_BYTES);
                // Verify transfer was successful
                const newOwnerMakerAsset = await erc721Token.ownerOf.callAsync(erc721MakerTokenId);
                expect(newOwnerMakerAsset).to.be.bignumber.equal(erc721Receiver.address);
            });

            it('should call onERC721Received when transferring to a smart contract with receiver data', async () => {
                // Construct ERC721 asset data
                const receiverData = ethUtil.bufferToHex(assetProxyUtils.encodeUint256(generatePseudoRandomSalt()));
                const encodedAssetData = assetProxyUtils.encodeERC721AssetData(
                    erc721Token.address,
                    erc721MakerTokenId,
                    receiverData,
                );
                // Verify pre-condition
                const ownerMakerAsset = await erc721Token.ownerOf.callAsync(erc721MakerTokenId);
                expect(ownerMakerAsset).to.be.bignumber.equal(makerAddress);
                // Perform a transfer from makerAddress to takerAddress
                const amount = new BigNumber(1);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    makerAddress,
                    erc721Receiver.address,
                    amount,
                );
                const logDecoder = new LogDecoder(web3Wrapper, erc721Receiver.address);
                const tx = await logDecoder.getTxWithDecodedLogsAsync(
                    await web3Wrapper.sendTransactionAsync({
                        to: erc721Proxy.address,
                        data,
                        from: exchangeAddress,
                        gas: constants.TRANSFER_FROM_GAS,
                    }),
                );
                // Validate log emitted by erc721 receiver
                expect(tx.logs.length).to.be.equal(1);
                const tokenReceivedLog = tx.logs[0] as LogWithDecodedArgs<TokenReceivedContractEventArgs>;
                expect(tokenReceivedLog.args.from).to.be.equal(makerAddress);
                expect(tokenReceivedLog.args.tokenId).to.be.bignumber.equal(erc721MakerTokenId);
                expect(tokenReceivedLog.args.data).to.be.equal(receiverData);
                // Verify transfer was successful
                const newOwnerMakerAsset = await erc721Token.ownerOf.callAsync(erc721MakerTokenId);
                expect(newOwnerMakerAsset).to.be.bignumber.equal(erc721Receiver.address);
            });

            it('should throw if there is receiver data but contract does not have onERC721Received', async () => {
                // Construct ERC721 asset data
                const receiverData = ethUtil.bufferToHex(assetProxyUtils.encodeUint256(generatePseudoRandomSalt()));
                const encodedAssetData = assetProxyUtils.encodeERC721AssetData(
                    erc721Token.address,
                    erc721MakerTokenId,
                    receiverData,
                );
                // Verify pre-condition
                const ownerMakerAsset = await erc721Token.ownerOf.callAsync(erc721MakerTokenId);
                expect(ownerMakerAsset).to.be.bignumber.equal(makerAddress);
                // Perform a transfer from makerAddress to takerAddress
                const amount = new BigNumber(1);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    makerAddress,
                    erc20Proxy.address, // the ERC20 proxy does not have an ERC721 receiver
                    amount,
                );
                return expectRevertReasonOrAlwaysFailingTransactionAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: erc721Proxy.address,
                        data,
                        from: exchangeAddress,
                        gas: constants.TRANSFER_FROM_GAS,
                    }),
                    RevertReason.TransferFailed,
                );
            });

            it('should throw if transferring 0 amount of a token', async () => {
                // Construct ERC721 asset data
                const encodedAssetData = assetProxyUtils.encodeERC721AssetData(erc721Token.address, erc721MakerTokenId);
                // Verify pre-condition
                const ownerMakerAsset = await erc721Token.ownerOf.callAsync(erc721MakerTokenId);
                expect(ownerMakerAsset).to.be.bignumber.equal(makerAddress);
                // Perform a transfer from makerAddress to takerAddress
                const amount = new BigNumber(0);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    makerAddress,
                    takerAddress,
                    amount,
                );
                return expectRevertReasonOrAlwaysFailingTransactionAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: erc721Proxy.address,
                        data,
                        from: exchangeAddress,
                    }),
                    RevertReason.InvalidAmount,
                );
            });

            it('should throw if transferring > 1 amount of a token', async () => {
                // Construct ERC721 asset data
                const encodedAssetData = assetProxyUtils.encodeERC721AssetData(erc721Token.address, erc721MakerTokenId);
                // Verify pre-condition
                const ownerMakerAsset = await erc721Token.ownerOf.callAsync(erc721MakerTokenId);
                expect(ownerMakerAsset).to.be.bignumber.equal(makerAddress);
                // Perform a transfer from makerAddress to takerAddress
                const amount = new BigNumber(500);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    makerAddress,
                    takerAddress,
                    amount,
                );
                return expectRevertReasonOrAlwaysFailingTransactionAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: erc721Proxy.address,
                        data,
                        from: exchangeAddress,
                    }),
                    RevertReason.InvalidAmount,
                );
            });

            it('should throw if allowances are too low', async () => {
                // Construct ERC721 asset data
                const encodedAssetData = assetProxyUtils.encodeERC721AssetData(erc721Token.address, erc721MakerTokenId);
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
                return expectRevertReasonOrAlwaysFailingTransactionAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: erc721Proxy.address,
                        data,
                        from: exchangeAddress,
                    }),
                    RevertReason.TransferFailed,
                );
            });

            it('should throw if requesting address is not authorized', async () => {
                // Construct ERC721 asset data
                const encodedAssetData = assetProxyUtils.encodeERC721AssetData(erc721Token.address, erc721MakerTokenId);
                // Perform a transfer from makerAddress to takerAddress
                const amount = new BigNumber(1);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    makerAddress,
                    takerAddress,
                    amount,
                );
                return expectRevertReasonOrAlwaysFailingTransactionAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: erc721Proxy.address,
                        data,
                        from: notAuthorized,
                    }),
                    RevertReason.SenderNotAuthorized,
                );
            });
        });

        it('should have an id of 0x08e937fa', async () => {
            const proxyId = await erc721Proxy.getProxyId.callAsync();
            const expectedProxyId = '0x08e937fa';
            expect(proxyId).to.equal(expectedProxyId);
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
// tslint:disable:max-file-line-count
