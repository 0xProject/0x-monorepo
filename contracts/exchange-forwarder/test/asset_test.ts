import { IAssetDataContract } from '@0x/contracts-asset-proxy';
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
    hexRandom,
    hexSlice,
    randomAddress,
    verifyEventsFromLogs,
} from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';

import { ForwarderRevertErrors } from '../src';

import { artifacts } from './artifacts';
import { TestForwarderContract } from './wrappers';

blockchainTests('Supported asset type unit tests', env => {
    let forwarder: TestForwarderContract;
    let assetDataEncoder: IAssetDataContract;
    let bridgeAddress: string;
    let bridgeData: string;
    let receiver: string;

    let erc20Token: DummyERC20TokenContract;
    let erc721Token: DummyERC721TokenContract;
    let nftId: BigNumber;

    let erc20AssetData: string;
    let erc721AssetData: string;
    let erc20BridgeAssetData: string;

    before(async () => {
        [receiver] = await env.getAccountAddressesAsync();
        assetDataEncoder = new IAssetDataContract(constants.NULL_ADDRESS, env.provider);

        forwarder = await TestForwarderContract.deployFrom0xArtifactAsync(
            artifacts.TestForwarder,
            env.provider,
            env.txDefaults,
            { ...artifacts, ...ERC20Artifacts, ...ERC721Artifacts },
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
        nftId = getRandomInteger(constants.ZERO_AMOUNT, constants.MAX_UINT256);
        erc721AssetData = assetDataEncoder.ERC721Token(erc721Token.address, nftId).getABIEncodedTransactionData();

        bridgeAddress = randomAddress();
        bridgeData = hexRandom();
        erc20BridgeAssetData = assetDataEncoder
            .ERC20Bridge(erc20Token.address, bridgeAddress, bridgeData)
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
        it('returns false if assetData1 == assetData2 are ERC721', async () => {
            const result = await forwarder.areUnderlyingAssetsEqual(erc721AssetData, erc721AssetData).callAsync();
            expect(result).to.be.false();
        });
    });

    describe('_transferAssetToSender', () => {
        const TRANSFER_AMOUNT = new BigNumber(1);
        before(async () => {
            await erc20Token
                .setBalance(forwarder.address, constants.INITIAL_ERC20_BALANCE)
                .awaitTransactionSuccessAsync();
            await erc721Token.mint(forwarder.address, nftId).awaitTransactionSuccessAsync();
        });

        it('transfers an ERC20 token given ERC20 assetData', async () => {
            const txReceipt = await forwarder
                .transferAssetToSender(erc20AssetData, TRANSFER_AMOUNT)
                .awaitTransactionSuccessAsync({ from: receiver });
            verifyEventsFromLogs<ERC20TokenTransferEventArgs>(
                txReceipt.logs,
                [{ _from: forwarder.address, _to: receiver, _value: TRANSFER_AMOUNT }],
                ERC20TokenEvents.Transfer,
            );
        });
        it('transfers an ERC721 token given ERC721 assetData and amount == 1', async () => {
            const txReceipt = await forwarder
                .transferAssetToSender(erc721AssetData, TRANSFER_AMOUNT)
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
                .transferAssetToSender(erc721AssetData, invalidAmount)
                .awaitTransactionSuccessAsync({ from: receiver });
            const expectedError = new ForwarderRevertErrors.Erc721AmountMustEqualOneError(invalidAmount);
            return expect(tx).to.revertWith(expectedError);
        });
        it('transfers an ERC20 token given ERC20Bridge assetData', async () => {
            const txReceipt = await forwarder
                .transferAssetToSender(erc20BridgeAssetData, TRANSFER_AMOUNT)
                .awaitTransactionSuccessAsync({ from: receiver });
            verifyEventsFromLogs<ERC20TokenTransferEventArgs>(
                txReceipt.logs,
                [{ _from: forwarder.address, _to: receiver, _value: TRANSFER_AMOUNT }],
                ERC20TokenEvents.Transfer,
            );
        });
        it('reverts if assetData is unsupported', async () => {
            const randomBytes = hexRandom();
            const tx = forwarder
                .transferAssetToSender(randomBytes, TRANSFER_AMOUNT)
                .awaitTransactionSuccessAsync({ from: receiver });
            const expectedError = new ForwarderRevertErrors.UnsupportedAssetProxyError(hexSlice(randomBytes, 0, 4));
            return expect(tx).to.revertWith(expectedError);
        });
    });
});
