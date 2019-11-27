import { BigNumber } from '@0x/utils';
import * as ethAbi from 'ethereumjs-abi';
import * as ethUtil from 'ethereumjs-util';

export * from './balance_threshold_wrapper';
export * from './dutch_auction_test_wrapper';

// tslint:disable-next-line:completed-docs
export function encodeDutchAuctionAssetData(
    assetData: string,
    beginTimeSeconds: BigNumber,
    beginAmount: BigNumber,
): string {
    const assetDataBuffer = ethUtil.toBuffer(assetData);
    const abiEncodedAuctionData = (ethAbi as any).rawEncode(
        ['uint256', 'uint256'],
        [beginTimeSeconds.toString(), beginAmount.toString()],
    );
    const abiEncodedAuctionDataBuffer = ethUtil.toBuffer(abiEncodedAuctionData);
    const dutchAuctionDataBuffer = Buffer.concat([assetDataBuffer, abiEncodedAuctionDataBuffer]);
    const dutchAuctionData = ethUtil.bufferToHex(dutchAuctionDataBuffer);
    return dutchAuctionData;
}
