import { IAssetDataContract } from '@0x/contracts-asset-proxy';
import {
    artifacts as ERC1155Artifacts,
    ERC1155MintableContract,
    ERC1155TransferBatchEventArgs,
    Erc1155Wrapper,
} from '@0x/contracts-erc1155';
import {
    artifacts as ERC20Artifacts,
    DummyERC20TokenContract,
    ERC20TokenEvents,
    ERC20TokenTransferEventArgs,
} from '@0x/contracts-erc20';
import {
    artifacts as ERC721Artifacts,
    DummyERC721TokenContract,
    ERC721TokenEvents,
    ERC721TokenTransferEventArgs,
} from '@0x/contracts-erc721';
import {
    blockchainTests,
    constants,
    expect,
    getRandomInteger,
    randomAddress,
    verifyEventsFromLogs,
} from '@0x/contracts-test-utils';
import { BigNumber, ExchangeForwarderRevertErrors, hexUtils } from '@0x/utils';
import { LogWithDecodedArgs } from 'ethereum-types';

import { artifacts } from './artifacts';
import { TestForwarderContract } from './wrappers';

// tslint:disable:no-unnecessary-type-assertion
blockchainTests.resets('Supported asset type unit tests', env => {
    let forwarder: TestForwarderContract;
    let assetDataEncoder: IAssetDataContract;
    let bridgeAddress: string;
    let bridgeData: string;
    let receiver: string;

    let erc20Token: DummyERC20TokenContract;
    let erc721Token: DummyERC721TokenContract;
    let erc1155Token: ERC1155MintableContract;
    let erc1155Wrapper: Erc1155Wrapper;
    let nftId: BigNumber;

    let erc20AssetData: string;
    let erc721AssetData: string;
    let erc20BridgeAssetData: string;
    let staticCallAssetData: string;
    let multiAssetData: string;

    before(async () => {
        [receiver] = await env.getAccountAddressesAsync();
        assetDataEncoder = new IAssetDataContract(constants.NULL_ADDRESS, env.provider);

        forwarder = await TestForwarderContract.deployFrom0xArtifactAsync(
            artifacts.TestForwarder,
            env.provider,
            env.txDefaults,
            { ...artifacts, ...ERC20Artifacts, ...ERC721Artifacts, ...ERC1155Artifacts },
        );

        erc20Token = await DummyERC20TokenContract.deployFrom0xArtifactAsync(
            ERC20Artifacts.DummyERC20Token,
            env.provider,
            env.txDefaults,
            ERC20Artifacts,
            constants.DUMMY_TOKEN_NAME,
            constants.DUMMY_TOKEN_SYMBOL,
            constants.DUMMY_TOKEN_DECIMALS,
            constants.DUMMY_TOKEN_TOTAL_SUPPLY,
        );
        erc20AssetData = assetDataEncoder.ERC20Token(erc20Token.address).getABIEncodedTransactionData();

        erc721Token = await DummyERC721TokenContract.deployFrom0xArtifactAsync(
            ERC721Artifacts.DummyERC721Token,
            env.provider,
            env.txDefaults,
            ERC721Artifacts,
            constants.DUMMY_TOKEN_NAME,
            constants.DUMMY_TOKEN_SYMBOL,
        );
        nftId = getRandomInteger(0, constants.MAX_UINT256);
        erc721AssetData = assetDataEncoder.ERC721Token(erc721Token.address, nftId).getABIEncodedTransactionData();

        erc1155Token = await ERC1155MintableContract.deployFrom0xArtifactAsync(
            ERC1155Artifacts.ERC1155Mintable,
            env.provider,
            env.txDefaults,
            ERC1155Artifacts,
        );
        erc1155Wrapper = new Erc1155Wrapper(erc1155Token, receiver);

        bridgeAddress = randomAddress();
        bridgeData = hexUtils.random();
        erc20BridgeAssetData = assetDataEncoder
            .ERC20Bridge(erc20Token.address, bridgeAddress, bridgeData)
            .getABIEncodedTransactionData();

        staticCallAssetData = assetDataEncoder
            .StaticCall(randomAddress(), hexUtils.random(), constants.KECCAK256_NULL)
            .getABIEncodedTransactionData();

        multiAssetData = assetDataEncoder
            .MultiAsset([new BigNumber(1)], [erc20AssetData])
            .getABIEncodedTransactionData();
    });

    describe('_areUnderlyingAssetsEqual', () => {
        it('returns true if assetData1 == assetData2 are ERC20', async () => {
            const result = await forwarder.areUnderlyingAssetsEqual(erc20AssetData, erc20AssetData).callAsync();
            expect(result).to.be.true();
        });
        it('returns true if assetData1 == assetData2 are ERC20Bridge', async () => {
            const result = await forwarder
                .areUnderlyingAssetsEqual(erc20BridgeAssetData, erc20BridgeAssetData)
                .callAsync();
            expect(result).to.be.true();
        });
        it('returns true if assetData2 is the ERC20Bridge equivalent of assetData1', async () => {
            const result = await forwarder.areUnderlyingAssetsEqual(erc20AssetData, erc20BridgeAssetData).callAsync();
            expect(result).to.be.true();
        });
        it('returns false if assetData1 != assetData2 are ERC20', async () => {
            const differentERC20AssetData = assetDataEncoder.ERC20Token(randomAddress()).getABIEncodedTransactionData();
            const result = await forwarder
                .areUnderlyingAssetsEqual(erc20AssetData, differentERC20AssetData)
                .callAsync();
            expect(result).to.be.false();
        });
        it('returns false if assetData1 is ERC20 and assetData2 is ERC721', async () => {
            const result = await forwarder.areUnderlyingAssetsEqual(erc20AssetData, erc721AssetData).callAsync();
            expect(result).to.be.false();
        });
        it('returns false if assetData2 is ERC20Bridge, but for a different token than assetData1', async () => {
            const mismatchedErc20BridgeAssetData = assetDataEncoder
                .ERC20Bridge(randomAddress(), bridgeAddress, bridgeData)
                .getABIEncodedTransactionData();
            const result = await forwarder
                .areUnderlyingAssetsEqual(erc20AssetData, mismatchedErc20BridgeAssetData)
                .callAsync();
            expect(result).to.be.false();
        });
        it('returns true if assetData1 == assetData2 are ERC721', async () => {
            const result = await forwarder.areUnderlyingAssetsEqual(erc721AssetData, erc721AssetData).callAsync();
            expect(result).to.be.true();
        });
        it('returns false if assetData1 != assetData2 are ERC721', async () => {
            const differentErc721AssetData = assetDataEncoder
                .ERC721Token(randomAddress(), getRandomInteger(0, constants.MAX_UINT256))
                .getABIEncodedTransactionData();
            const result = await forwarder
                .areUnderlyingAssetsEqual(erc721AssetData, differentErc721AssetData)
                .callAsync();
            expect(result).to.be.false();
        });
        it('returns true if assetData1 == assetData2 are StaticCall', async () => {
            const result = await forwarder
                .areUnderlyingAssetsEqual(staticCallAssetData, staticCallAssetData)
                .callAsync();
            expect(result).to.be.true();
        });
        it('returns false if assetData1 != assetData2 are StaticCall', async () => {
            const differentStaticCallAssetData = assetDataEncoder
                .StaticCall(randomAddress(), hexUtils.random(), constants.KECCAK256_NULL)
                .getABIEncodedTransactionData();
            const result = await forwarder
                .areUnderlyingAssetsEqual(staticCallAssetData, differentStaticCallAssetData)
                .callAsync();
            expect(result).to.be.false();
        });
        it('returns false if assetData1 is ERC20 and assetData2 is MultiAsset', async () => {
            const result = await forwarder.areUnderlyingAssetsEqual(erc20AssetData, multiAssetData).callAsync();
            expect(result).to.be.false();
        });
        it('returns true if assetData1 == assetData2 are MultiAsset (single nested asset)', async () => {
            const result = await forwarder.areUnderlyingAssetsEqual(multiAssetData, multiAssetData).callAsync();
            expect(result).to.be.true();
        });
        it('returns true if assetData1 == assetData2 are MultiAsset (multiple nested assets)', async () => {
            const assetData = assetDataEncoder
                .MultiAsset(
                    [getRandomInteger(0, constants.MAX_UINT256), new BigNumber(1)],
                    [erc20AssetData, erc721AssetData],
                )
                .getABIEncodedTransactionData();
            const result = await forwarder.areUnderlyingAssetsEqual(assetData, assetData).callAsync();
            expect(result).to.be.true();
        });
        it('returns false if assetData1 != assetData2 are MultiAsset', async () => {
            const differentMultiAssetData = assetDataEncoder
                .MultiAsset([getRandomInteger(0, constants.MAX_UINT256)], [erc721AssetData])
                .getABIEncodedTransactionData();
            const result = await forwarder
                .areUnderlyingAssetsEqual(multiAssetData, differentMultiAssetData)
                .callAsync();
            expect(result).to.be.false();
        });
    });

    describe('transferOut', () => {
        const TRANSFER_AMOUNT = new BigNumber(1);
        before(async () => {
            await erc20Token
                .setBalance(forwarder.address, constants.INITIAL_ERC20_BALANCE)
                .awaitTransactionSuccessAsync();
            await erc721Token.mint(forwarder.address, nftId).awaitTransactionSuccessAsync();
        });

        it('transfers an ERC20 token given ERC20 assetData', async () => {
            const txReceipt = await forwarder
                .transferOut(erc20AssetData, TRANSFER_AMOUNT)
                .awaitTransactionSuccessAsync({ from: receiver });
            verifyEventsFromLogs<ERC20TokenTransferEventArgs>(
                txReceipt.logs,
                [{ _from: forwarder.address, _to: receiver, _value: TRANSFER_AMOUNT }],
                ERC20TokenEvents.Transfer,
            );
        });
        it('transfers an ERC721 token given ERC721 assetData and amount == 1', async () => {
            const txReceipt = await forwarder
                .transferOut(erc721AssetData, TRANSFER_AMOUNT)
                .awaitTransactionSuccessAsync({ from: receiver });
            verifyEventsFromLogs<ERC721TokenTransferEventArgs>(
                txReceipt.logs,
                [{ _from: forwarder.address, _to: receiver, _tokenId: nftId }],
                ERC721TokenEvents.Transfer,
            );
        });
        it('reverts if attempting to transfer an ERC721 token with amount != 1', async () => {
            const invalidAmount = new BigNumber(2);
            const tx = forwarder
                .transferOut(erc721AssetData, invalidAmount)
                .awaitTransactionSuccessAsync({ from: receiver });
            const expectedError = new ExchangeForwarderRevertErrors.Erc721AmountMustEqualOneError(invalidAmount);
            return expect(tx).to.revertWith(expectedError);
        });
        it('transfers a single ERC1155 token', async () => {
            const values = [new BigNumber(1)];
            const amount = new BigNumber(1);
            const ids = [await erc1155Wrapper.mintFungibleTokensAsync([forwarder.address], values)];
            const assetData = assetDataEncoder
                .ERC1155Assets(erc1155Token.address, ids, values, constants.NULL_BYTES)
                .getABIEncodedTransactionData();
            const txReceipt = await forwarder
                .transferOut(assetData, amount)
                .awaitTransactionSuccessAsync({ from: receiver });
            const logArgs = (txReceipt.logs[0] as LogWithDecodedArgs<ERC1155TransferBatchEventArgs>).args;
            expect(logArgs.operator).to.eq(forwarder.address);
            expect(logArgs.from).to.eq(forwarder.address);
            expect(logArgs.to).to.eq(receiver);
            logArgs.ids.forEach((id, i) => expect(new BigNumber(id)).to.bignumber.eq(ids[i]));
            logArgs.values.forEach((value, i) => expect(new BigNumber(value)).to.bignumber.eq(values[i]));
        });
        it('transfers multiple ids of an ERC1155 token', async () => {
            const amount = new BigNumber(1);
            const ids = [
                await erc1155Wrapper.mintFungibleTokensAsync([forwarder.address], [amount]),
                await erc1155Wrapper.mintFungibleTokensAsync([forwarder.address], [amount]),
            ];
            const values = [amount, amount];
            const assetData = assetDataEncoder
                .ERC1155Assets(erc1155Token.address, ids, values, constants.NULL_BYTES)
                .getABIEncodedTransactionData();
            const txReceipt = await forwarder.transferOut(assetData, amount).awaitTransactionSuccessAsync();
            const logArgs = (txReceipt.logs[0] as LogWithDecodedArgs<ERC1155TransferBatchEventArgs>).args;
            expect(logArgs.operator).to.eq(forwarder.address);
            expect(logArgs.from).to.eq(forwarder.address);
            expect(logArgs.to).to.eq(receiver);
            logArgs.ids.forEach((id, i) => expect(new BigNumber(id)).to.bignumber.eq(ids[i]));
            logArgs.values.forEach((value, i) => expect(new BigNumber(value)).to.bignumber.eq(values[i]));
        });
        it('scales up values when transfering ERC1155 tokens', async () => {
            it('transfers multiple ids of an ERC1155 token', async () => {
                const amount = new BigNumber(2);
                const ids = [
                    await erc1155Wrapper.mintFungibleTokensAsync([forwarder.address], [amount]),
                    await erc1155Wrapper.mintFungibleTokensAsync([forwarder.address], [amount]),
                ];
                const values = [new BigNumber(1), new BigNumber(2)];
                const assetData = assetDataEncoder
                    .ERC1155Assets(erc1155Token.address, ids, values, constants.NULL_BYTES)
                    .getABIEncodedTransactionData();
                const txReceipt = await forwarder.transferOut(assetData, amount).awaitTransactionSuccessAsync();
                const scaledValues = values.map(value => value.times(amount));
                const logArgs = (txReceipt.logs[0] as LogWithDecodedArgs<ERC1155TransferBatchEventArgs>).args;
                expect(logArgs.operator).to.eq(forwarder.address);
                expect(logArgs.from).to.eq(forwarder.address);
                expect(logArgs.to).to.eq(receiver);
                logArgs.ids.forEach((id, i) => expect(new BigNumber(id)).to.bignumber.eq(ids[i]));
                logArgs.values.forEach((value, i) => expect(new BigNumber(value)).to.bignumber.eq(scaledValues[i]));
            });
        });
        it('transfers a single ERC20 token wrapped as MultiAsset', async () => {
            const nestedAmount = new BigNumber(1337);
            const erc20MultiAssetData = assetDataEncoder
                .MultiAsset([nestedAmount], [erc20AssetData])
                .getABIEncodedTransactionData();
            const multiAssetAmount = new BigNumber(2);
            const txReceipt = await forwarder
                .transferOut(erc20MultiAssetData, multiAssetAmount)
                .awaitTransactionSuccessAsync({ from: receiver });
            verifyEventsFromLogs<ERC20TokenTransferEventArgs>(
                txReceipt.logs,
                [{ _from: forwarder.address, _to: receiver, _value: multiAssetAmount.times(nestedAmount) }],
                ERC20TokenEvents.Transfer,
            );
        });
        it('transfers ERC20, ERC721, and StaticCall assets wrapped as MultiAsset', async () => {
            const nestedAmounts = [new BigNumber(1337), TRANSFER_AMOUNT, TRANSFER_AMOUNT];
            const assortedMultiAssetData = assetDataEncoder
                .MultiAsset(nestedAmounts, [erc20AssetData, erc721AssetData, staticCallAssetData])
                .getABIEncodedTransactionData();
            const txReceipt = await forwarder
                .transferOut(assortedMultiAssetData, TRANSFER_AMOUNT)
                .awaitTransactionSuccessAsync({ from: receiver });
            expect(txReceipt.logs.length).to.equal(2);
            // tslint:disable:no-unnecessary-type-assertion
            const erc20TransferEvent = (txReceipt.logs[0] as LogWithDecodedArgs<ERC20TokenTransferEventArgs>).args;
            const erc721TransferEvent = (txReceipt.logs[1] as LogWithDecodedArgs<ERC721TokenTransferEventArgs>).args;
            // tslint:enable:no-unnecessary-type-assertion
            expect(erc20TransferEvent).to.deep.equal({
                _from: forwarder.address,
                _to: receiver,
                _value: nestedAmounts[0],
            });
            expect(erc721TransferEvent).to.deep.equal({ _from: forwarder.address, _to: receiver, _tokenId: nftId });
        });
        it('performs nested MultiAsset transfers', async () => {
            const nestedAmounts = [TRANSFER_AMOUNT, TRANSFER_AMOUNT, TRANSFER_AMOUNT];
            const assortedMultiAssetData = assetDataEncoder
                .MultiAsset(nestedAmounts, [multiAssetData, erc721AssetData, staticCallAssetData])
                .getABIEncodedTransactionData();
            const txReceipt = await forwarder
                .transferOut(assortedMultiAssetData, TRANSFER_AMOUNT)
                .awaitTransactionSuccessAsync({ from: receiver });
            expect(txReceipt.logs.length).to.equal(2);
            // tslint:disable:no-unnecessary-type-assertion
            const erc20TransferEvent = (txReceipt.logs[0] as LogWithDecodedArgs<ERC20TokenTransferEventArgs>).args;
            const erc721TransferEvent = (txReceipt.logs[1] as LogWithDecodedArgs<ERC721TokenTransferEventArgs>).args;
            // tslint:enable:no-unnecessary-type-assertion
            expect(erc20TransferEvent).to.deep.equal({
                _from: forwarder.address,
                _to: receiver,
                _value: TRANSFER_AMOUNT,
            });
            expect(erc721TransferEvent).to.deep.equal({ _from: forwarder.address, _to: receiver, _tokenId: nftId });
        });
        it('transfers an ERC20 token given ERC20Bridge assetData', async () => {
            const txReceipt = await forwarder
                .transferOut(erc20BridgeAssetData, TRANSFER_AMOUNT)
                .awaitTransactionSuccessAsync({ from: receiver });
            verifyEventsFromLogs<ERC20TokenTransferEventArgs>(
                txReceipt.logs,
                [{ _from: forwarder.address, _to: receiver, _value: TRANSFER_AMOUNT }],
                ERC20TokenEvents.Transfer,
            );
        });
        it('noops (emits no events) for StaticCall assetData', async () => {
            const txReceipt = await forwarder
                .transferOut(staticCallAssetData, TRANSFER_AMOUNT)
                .awaitTransactionSuccessAsync({ from: receiver });
            expect(txReceipt.logs.length).to.equal(0);
        });
        it('reverts if assetData is unsupported', async () => {
            const randomBytes = hexUtils.random();
            const tx = forwarder
                .transferOut(randomBytes, TRANSFER_AMOUNT)
                .awaitTransactionSuccessAsync({ from: receiver });
            const expectedError = new ExchangeForwarderRevertErrors.UnsupportedAssetProxyError(
                hexUtils.slice(randomBytes, 0, 4),
            );
            return expect(tx).to.revertWith(expectedError);
        });
    });
});
