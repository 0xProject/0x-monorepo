import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { assetProxyUtils, generatePseudoRandomSalt } from '@0xproject/order-utils';
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
import { artifacts } from '../../src/utils/artifacts';
import { expectRevertOrAlwaysFailingTransactionAsync } from '../../src/utils/assertions';
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
        const usedAddresses = ([owner, notAuthorized, exchangeAddress, makerAddress, takerAddress] = accounts);

        erc20Wrapper = new ERC20Wrapper(provider, usedAddresses, owner);
        erc721Wrapper = new ERC721Wrapper(provider, usedAddresses, owner);

        [zrxToken] = await erc20Wrapper.deployDummyTokensAsync();
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
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await erc20Proxy.transferFrom.sendTransactionAsync(
                        encodedAssetData,
                        makerAddress,
                        takerAddress,
                        amount,
                        { from: exchangeAddress },
                    ),
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
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await erc20Proxy.transferFrom.sendTransactionAsync(
                        encodedAssetData,
                        makerAddress,
                        takerAddress,
                        amount,
                        { from: exchangeAddress },
                    ),
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
                const transferAmount = new BigNumber(10);
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await zrxToken.approve.sendTransactionAsync(erc20Proxy.address, allowance, {
                        from: makerAddress,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                // Perform a transfer; expect this to fail.
                return expectRevertOrAlwaysFailingTransactionAsync(
                    erc20Proxy.transferFrom.sendTransactionAsync(
                        encodedAssetData,
                        makerAddress,
                        takerAddress,
                        transferAmount,
                        { from: notAuthorized },
                    ),
                );
            });

            it('should throw if requesting address is not authorized', async () => {
                // Construct ERC20 asset data
                const encodedAssetData = assetProxyUtils.encodeERC20AssetData(zrxToken.address);

                // Perform a transfer from makerAddress to takerAddress
                const amount = new BigNumber(10);
                return expectRevertOrAlwaysFailingTransactionAsync(
                    erc20Proxy.transferFrom.sendTransactionAsync(
                        encodedAssetData,
                        makerAddress,
                        takerAddress,
                        amount,
                        {
                            from: notAuthorized,
                        },
                    ),
                );
            });
        });

        describe('batchTransferFrom', () => {
            it('should succesfully make multiple token transfers', async () => {
                const erc20Balances = await erc20Wrapper.getBalancesAsync();

                const encodedAssetData = assetProxyUtils.encodeERC20AssetData(zrxToken.address);
                const amount = new BigNumber(10);
                const numTransfers = 2;
                const assetData = _.times(numTransfers, () => encodedAssetData);
                const fromAddresses = _.times(numTransfers, () => makerAddress);
                const toAddresses = _.times(numTransfers, () => takerAddress);
                const amounts = _.times(numTransfers, () => amount);

                const txHash = await erc20Proxy.batchTransferFrom.sendTransactionAsync(
                    assetData,
                    fromAddresses,
                    toAddresses,
                    amounts,
                    { from: exchangeAddress },
                );
                const res = await web3Wrapper.awaitTransactionSuccessAsync(
                    txHash,
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                const newBalances = await erc20Wrapper.getBalancesAsync();

                expect(res.logs.length).to.equal(numTransfers);
                expect(newBalances[makerAddress][zrxToken.address]).to.be.bignumber.equal(
                    erc20Balances[makerAddress][zrxToken.address].minus(amount.times(numTransfers)),
                );
                expect(newBalances[takerAddress][zrxToken.address]).to.be.bignumber.equal(
                    erc20Balances[takerAddress][zrxToken.address].add(amount.times(numTransfers)),
                );
            });

            it('should throw if not called by an authorized address', async () => {
                const encodedAssetData = assetProxyUtils.encodeERC20AssetData(zrxToken.address);
                const amount = new BigNumber(10);
                const numTransfers = 2;
                const assetData = _.times(numTransfers, () => encodedAssetData);
                const fromAddresses = _.times(numTransfers, () => makerAddress);
                const toAddresses = _.times(numTransfers, () => takerAddress);
                const amounts = _.times(numTransfers, () => amount);

                return expectRevertOrAlwaysFailingTransactionAsync(
                    erc20Proxy.batchTransferFrom.sendTransactionAsync(assetData, fromAddresses, toAddresses, amounts, {
                        from: notAuthorized,
                    }),
                );
            });
        });

        it('should have an id of 0xf47261b0', async () => {
            const proxyId = await erc20Proxy.getProxyId.callAsync();
            expect(proxyId).to.equal('0xf47261b0');
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
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await erc721Proxy.transferFrom.sendTransactionAsync(
                        encodedAssetData,
                        makerAddress,
                        takerAddress,
                        amount,
                        { from: exchangeAddress },
                    ),
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
                const txHash = await erc721Proxy.transferFrom.sendTransactionAsync(
                    encodedAssetData,
                    makerAddress,
                    erc721Receiver.address,
                    amount,
                    { from: exchangeAddress },
                );
                await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
                // Parse transaction logs
                const logDecoder = new LogDecoder(web3Wrapper, erc721Receiver.address);
                const tx = await logDecoder.getTxWithDecodedLogsAsync(txHash);
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
                const txHash = await erc721Proxy.transferFrom.sendTransactionAsync(
                    encodedAssetData,
                    makerAddress,
                    erc721Receiver.address,
                    amount,
                    { from: exchangeAddress },
                );
                await web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
                // Parse transaction logs
                const logDecoder = new LogDecoder(web3Wrapper, erc721Receiver.address);
                const tx = await logDecoder.getTxWithDecodedLogsAsync(txHash);
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
                return expectRevertOrAlwaysFailingTransactionAsync(
                    erc721Proxy.transferFrom.sendTransactionAsync(
                        encodedAssetData,
                        makerAddress,
                        erc20Proxy.address, // the ERC20 proxy does not have an ERC721 receiver
                        amount,
                        { from: exchangeAddress },
                    ),
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
                return expectRevertOrAlwaysFailingTransactionAsync(
                    erc721Proxy.transferFrom.sendTransactionAsync(
                        encodedAssetData,
                        makerAddress,
                        takerAddress,
                        amount,
                        { from: exchangeAddress },
                    ),
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
                return expectRevertOrAlwaysFailingTransactionAsync(
                    erc721Proxy.transferFrom.sendTransactionAsync(
                        encodedAssetData,
                        makerAddress,
                        takerAddress,
                        amount,
                        { from: exchangeAddress },
                    ),
                );
            });

            it('should throw if allowances are too low', async () => {
                // Construct ERC721 asset data
                const encodedAssetData = assetProxyUtils.encodeERC721AssetData(erc721Token.address, erc721MakerTokenId);
                // Remove transfer approval for makerAddress.
                await web3Wrapper.awaitTransactionSuccessAsync(
                    await erc721Token.setApprovalForAll.sendTransactionAsync(erc721Proxy.address, false, {
                        from: makerAddress,
                    }),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                // Perform a transfer; expect this to fail.
                const amount = new BigNumber(1);
                return expectRevertOrAlwaysFailingTransactionAsync(
                    erc20Proxy.transferFrom.sendTransactionAsync(
                        encodedAssetData,
                        makerAddress,
                        takerAddress,
                        amount,
                        {
                            from: notAuthorized,
                        },
                    ),
                );
            });

            it('should throw if requesting address is not authorized', async () => {
                // Construct ERC721 asset data
                const encodedAssetData = assetProxyUtils.encodeERC721AssetData(erc721Token.address, erc721MakerTokenId);
                // Perform a transfer from makerAddress to takerAddress
                const amount = new BigNumber(1);
                return expectRevertOrAlwaysFailingTransactionAsync(
                    erc721Proxy.transferFrom.sendTransactionAsync(
                        encodedAssetData,
                        makerAddress,
                        takerAddress,
                        amount,
                        { from: notAuthorized },
                    ),
                );
            });
        });

        describe('batchTransferFrom', () => {
            it('should succesfully make multiple token transfers', async () => {
                const erc721TokensById = await erc721Wrapper.getBalancesAsync();
                const [makerTokenIdA, makerTokenIdB] = erc721TokensById[makerAddress][erc721Token.address];

                const numTransfers = 2;
                const assetData = [
                    assetProxyUtils.encodeERC721AssetData(erc721Token.address, makerTokenIdA).slice(0, -2),
                    assetProxyUtils.encodeERC721AssetData(erc721Token.address, makerTokenIdB).slice(0, -2),
                ];
                const fromAddresses = _.times(numTransfers, () => makerAddress);
                const toAddresses = _.times(numTransfers, () => takerAddress);
                const amounts = _.times(numTransfers, () => new BigNumber(1));

                const txHash = await erc721Proxy.batchTransferFrom.sendTransactionAsync(
                    assetData,
                    fromAddresses,
                    toAddresses,
                    amounts,
                    { from: exchangeAddress },
                );
                const res = await web3Wrapper.awaitTransactionSuccessAsync(
                    txHash,
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                expect(res.logs.length).to.equal(numTransfers);

                const newOwnerMakerAssetA = await erc721Token.ownerOf.callAsync(makerTokenIdA);
                const newOwnerMakerAssetB = await erc721Token.ownerOf.callAsync(makerTokenIdB);
                expect(newOwnerMakerAssetA).to.be.bignumber.equal(takerAddress);
                expect(newOwnerMakerAssetB).to.be.bignumber.equal(takerAddress);
            });

            it('should throw if not called by an authorized address', async () => {
                const erc721TokensById = await erc721Wrapper.getBalancesAsync();
                const [makerTokenIdA, makerTokenIdB] = erc721TokensById[makerAddress][erc721Token.address];

                const numTransfers = 2;
                const assetData = [
                    assetProxyUtils.encodeERC721AssetData(erc721Token.address, makerTokenIdA).slice(0, -2),
                    assetProxyUtils.encodeERC721AssetData(erc721Token.address, makerTokenIdB).slice(0, -2),
                ];
                const fromAddresses = _.times(numTransfers, () => makerAddress);
                const toAddresses = _.times(numTransfers, () => takerAddress);
                const amounts = _.times(numTransfers, () => new BigNumber(1));

                return expectRevertOrAlwaysFailingTransactionAsync(
                    erc721Proxy.batchTransferFrom.sendTransactionAsync(assetData, fromAddresses, toAddresses, amounts, {
                        from: notAuthorized,
                    }),
                );
            });
        });

        it('should have an id of 0x08e937fa', async () => {
            const proxyId = await erc721Proxy.getProxyId.callAsync();
            expect(proxyId).to.equal('0x08e937fa');
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
// tslint:disable:max-file-line-count
