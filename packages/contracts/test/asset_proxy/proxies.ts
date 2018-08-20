import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { assetDataUtils } from '@0xproject/order-utils';
import { RevertReason } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import * as _ from 'lodash';

import { BasketProxyContract } from '../../generated_contract_wrappers/basket_proxy';
import { DummyERC20TokenContract } from '../../generated_contract_wrappers/dummy_erc20_token';
import { DummyERC721ReceiverContract } from '../../generated_contract_wrappers/dummy_erc721_receiver';
import { DummyERC721TokenContract } from '../../generated_contract_wrappers/dummy_erc721_token';
import { ERC20ProxyContract } from '../../generated_contract_wrappers/erc20_proxy';
import { ERC721ProxyContract } from '../../generated_contract_wrappers/erc721_proxy';
import { IAssetProxyContract } from '../../generated_contract_wrappers/i_asset_proxy';
import { artifacts } from '../utils/artifacts';
import { expectTransactionFailedAsync } from '../utils/assertions';
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
    let basketProxy: BasketProxyContract;

    let erc20Wrapper: ERC20Wrapper;
    let erc721Wrapper: ERC721Wrapper;
    let erc721MakerTokenId: BigNumber;
    let erc721MakerTokenId2: BigNumber;

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
        erc721MakerTokenId2 = erc721Balances[makerAddress][erc721Token.address][1];
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
        basketProxy = await BasketProxyContract.deployFrom0xArtifactAsync(
            artifacts.BasketProxy,
            provider,
            txDefaults,
            erc721Proxy.address,
            erc20Proxy.address,
        );
        await web3Wrapper.awaitTransactionSuccessAsync(
            await basketProxy.addAuthorizedAddress.sendTransactionAsync(exchangeAddress, {
                from: owner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await web3Wrapper.awaitTransactionSuccessAsync(
            await erc721Proxy.addAuthorizedAddress.sendTransactionAsync(basketProxy.address, {
                from: owner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await web3Wrapper.awaitTransactionSuccessAsync(
            await erc20Proxy.addAuthorizedAddress.sendTransactionAsync(basketProxy.address, {
                from: owner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe.only('BasketProxy', () => {
        it('should basket proxy transfer', async () => {
            const erc721TokenAddresses = [erc721Token.address, erc721Token.address];
            const erc721TokenIds = [erc721MakerTokenId, erc721MakerTokenId2];
            // const erc721TokenAddresses = [erc721Token.address];
            // const erc721TokenIds = [erc721MakerTokenId];
            for (const token of erc721TokenIds) {
                const newOwner = await erc721Token.ownerOf.callAsync(token);
                console.log('oldOwner', token.toString(), newOwner);
            }
            let currentBalances = await erc20Wrapper.getBalancesAsync();
            console.log('takerBalanceBefore', currentBalances[takerAddress][zrxToken.address].toString());
            const erc20TokenAddresses = [zrxToken.address];
            const erc20TokenAmounts = [new BigNumber(100)];
            const tokenAddresses = [erc721TokenAddresses, erc20TokenAddresses];
            const amount = new BigNumber(1);
            const tokenIdOrAmount = [erc721TokenIds, erc20TokenAmounts];
            const encodedERC721Data = assetDataUtils.encodeERC721AssetData(erc721TokenAddresses[1], erc721TokenIds[1]);
            const encodedERC20Data = assetDataUtils.encodeERC20AssetData(erc20TokenAddresses[0]);
            const encodedERC721TransferFrom = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                encodedERC721Data,
                makerAddress,
                takerAddress,
                amount,
            );
            const encodedERC20TransferFrom = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                encodedERC20Data,
                makerAddress,
                takerAddress,
                erc20TokenAmounts[0],
            );
            console.log('makerAddress', makerAddress);
            console.log('takerAddress', takerAddress);
            console.log('tokenAddresses', tokenAddresses);
            console.log('tokenId1', erc721MakerTokenId.toString(16));
            console.log('tokenId2', erc721MakerTokenId2.toString(16));
            console.log('erc721ProxyId', await erc721Proxy.getProxyId.callAsync());
            console.log('erc20ProxyId', await erc20Proxy.getProxyId.callAsync());
            console.log('');
            console.log('encodedERC721TransferFrom', encodedERC721TransferFrom);
            console.log('encodedERC20TransferFrom', encodedERC20TransferFrom);
            const encodedAbiData = basketProxy.BasketTokens.getABIEncodedTransactionData(
                tokenAddresses,
                tokenIdOrAmount,
            );
            console.log('');
            console.log('basketTokens', encodedAbiData);
            const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                encodedAbiData,
                makerAddress,
                takerAddress,
                amount,
            );
            const callResult = await web3Wrapper.callAsync({
                to: basketProxy.address,
                data,
                from: exchangeAddress,
            });
            console.log('');
            console.log('callResult', callResult);
            console.log('');
            console.log('data', data);
            // expect(callResult).to.equal(encodedERC721TransferFrom);
            expect(callResult).to.equal(encodedERC20TransferFrom);
            web3Wrapper.abiDecoder.addABI(erc721Token.abi);
            const receipt = await web3Wrapper.awaitTransactionSuccessAsync(
                await web3Wrapper.sendTransactionAsync({
                    to: basketProxy.address,
                    data,
                    from: exchangeAddress,
                    gas: 500_000,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            for (const token of erc721TokenIds) {
                const newOwner = await erc721Token.ownerOf.callAsync(token);
                console.log('newOwner', token.toString(), newOwner);
            }
            // console.log(receipt.logs);
            console.log(parseInt(receipt.gasUsed as any, 16));
            currentBalances = await erc20Wrapper.getBalancesAsync();
            console.log('takerBalanceAfter', currentBalances[takerAddress][zrxToken.address].toString());
        });
    });
    describe('Transfer Proxy - ERC20', () => {
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
                // Perform a transfer; expect this to fail.
                await expectTransactionFailedAsync(
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
                const encodedAssetData = assetDataUtils.encodeERC20AssetData(zrxToken.address);
                // Perform a transfer from makerAddress to takerAddress
                const amount = new BigNumber(10);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    makerAddress,
                    takerAddress,
                    amount,
                );
                await expectTransactionFailedAsync(
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
                const encodedAssetData = assetDataUtils.encodeERC721AssetData(erc721Token.address, erc721MakerTokenId);
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

            it('should not call onERC721Received when transferring to a smart contract', async () => {
                // Construct ERC721 asset data
                const encodedAssetData = assetDataUtils.encodeERC721AssetData(erc721Token.address, erc721MakerTokenId);
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
                expect(ownerMakerAsset).to.be.bignumber.equal(makerAddress);
                // Perform a transfer from makerAddress to takerAddress
                const amount = new BigNumber(0);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    makerAddress,
                    takerAddress,
                    amount,
                );
                return expectTransactionFailedAsync(
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
                const encodedAssetData = assetDataUtils.encodeERC721AssetData(erc721Token.address, erc721MakerTokenId);
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
                return expectTransactionFailedAsync(
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
                const encodedAssetData = assetDataUtils.encodeERC721AssetData(erc721Token.address, erc721MakerTokenId);
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
                return expectTransactionFailedAsync(
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
                const encodedAssetData = assetDataUtils.encodeERC721AssetData(erc721Token.address, erc721MakerTokenId);
                // Perform a transfer from makerAddress to takerAddress
                const amount = new BigNumber(1);
                const data = assetProxyInterface.transferFrom.getABIEncodedTransactionData(
                    encodedAssetData,
                    makerAddress,
                    takerAddress,
                    amount,
                );
                return expectTransactionFailedAsync(
                    web3Wrapper.sendTransactionAsync({
                        to: erc721Proxy.address,
                        data,
                        from: notAuthorized,
                    }),
                    RevertReason.SenderNotAuthorized,
                );
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
