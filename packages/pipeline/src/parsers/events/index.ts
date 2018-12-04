import {
    ExchangeCancelEventArgs,
    ExchangeCancelUpToEventArgs,
    ExchangeEventArgs,
    ExchangeFillEventArgs,
} from '@0xproject/contract-wrappers';
import { assetDataUtils } from '@0xproject/order-utils';
import { AssetProxyId, ERC721AssetData } from '@0xproject/types';
import { LogWithDecodedArgs } from 'ethereum-types';
import * as R from 'ramda';

import { ExchangeCancelEvent } from '../../entities/ExchangeCancelEvent';
import { ExchangeCancelUpToEvent } from '../../entities/ExchangeCancelUpToEvent';
import { ExchangeFillEvent } from '../../entities/ExchangeFillEvent';
import { bigNumbertoStringOrNull } from '../../utils';

export type ExchangeEventEntity = ExchangeFillEvent | ExchangeCancelEvent | ExchangeCancelUpToEvent;

export const parseExchangeEvents: (
    eventLogs: Array<LogWithDecodedArgs<ExchangeEventArgs>>,
) => ExchangeEventEntity[] = R.map(_convertToEntity);

export function _convertToEntity(eventLog: LogWithDecodedArgs<ExchangeEventArgs>): ExchangeEventEntity {
    switch (eventLog.event) {
        case 'Fill':
            return _convertToExchangeFillEvent(eventLog as LogWithDecodedArgs<ExchangeFillEventArgs>);
        case 'Cancel':
            return _convertToExchangeCancelEvent(eventLog as LogWithDecodedArgs<ExchangeCancelEventArgs>);
        case 'CancelUpTo':
            return _convertToExchangeCancelUpToEvent(eventLog as LogWithDecodedArgs<ExchangeCancelUpToEventArgs>);
        default:
            throw new Error('unexpected eventLog.event type: ' + eventLog.event);
    }
}

export function _convertToExchangeFillEvent(eventLog: LogWithDecodedArgs<ExchangeFillEventArgs>): ExchangeFillEvent {
    const makerAssetData = assetDataUtils.decodeAssetDataOrThrow(eventLog.args.makerAssetData);
    const makerAssetType = makerAssetData.assetProxyId === AssetProxyId.ERC20 ? 'erc20' : 'erc721';
    const takerAssetData = assetDataUtils.decodeAssetDataOrThrow(eventLog.args.takerAssetData);
    const takerAssetType = takerAssetData.assetProxyId === AssetProxyId.ERC20 ? 'erc20' : 'erc721';
    const exchangeFillEvent = new ExchangeFillEvent();
    exchangeFillEvent.contractAddress = eventLog.address as string;
    exchangeFillEvent.blockNumber = eventLog.blockNumber as number;
    exchangeFillEvent.logIndex = eventLog.logIndex as number;
    exchangeFillEvent.rawData = eventLog.data as string;
    exchangeFillEvent.makerAddress = eventLog.args.makerAddress.toString();
    exchangeFillEvent.takerAddress = eventLog.args.takerAddress.toString();
    exchangeFillEvent.feeRecepientAddress = eventLog.args.feeRecipientAddress;
    exchangeFillEvent.senderAddress = eventLog.args.senderAddress;
    exchangeFillEvent.makerAssetFilledAmount = eventLog.args.makerAssetFilledAmount.toString();
    exchangeFillEvent.takerAssetFilledAmount = eventLog.args.takerAssetFilledAmount.toString();
    exchangeFillEvent.makerFeePaid = eventLog.args.makerFeePaid.toString();
    exchangeFillEvent.takerFeePaid = eventLog.args.takerFeePaid.toString();
    exchangeFillEvent.orderHash = eventLog.args.orderHash;
    exchangeFillEvent.rawMakerAssetData = eventLog.args.makerAssetData;
    exchangeFillEvent.makerAssetType = makerAssetType;
    exchangeFillEvent.makerAssetProxyId = makerAssetData.assetProxyId;
    exchangeFillEvent.makerTokenAddress = makerAssetData.tokenAddress;
    exchangeFillEvent.makerTokenId = bigNumbertoStringOrNull((makerAssetData as ERC721AssetData).tokenId);
    exchangeFillEvent.rawTakerAssetData = eventLog.args.takerAssetData;
    exchangeFillEvent.takerAssetType = takerAssetType;
    exchangeFillEvent.takerAssetProxyId = takerAssetData.assetProxyId;
    exchangeFillEvent.takerTokenAddress = takerAssetData.tokenAddress;
    exchangeFillEvent.takerTokenId = bigNumbertoStringOrNull((takerAssetData as ERC721AssetData).tokenId);
    return exchangeFillEvent;
}

export function _convertToExchangeCancelEvent(
    eventLog: LogWithDecodedArgs<ExchangeCancelEventArgs>,
): ExchangeCancelEvent {
    const makerAssetData = assetDataUtils.decodeAssetDataOrThrow(eventLog.args.makerAssetData);
    const makerAssetType = makerAssetData.assetProxyId === AssetProxyId.ERC20 ? 'erc20' : 'erc721';
    const takerAssetData = assetDataUtils.decodeAssetDataOrThrow(eventLog.args.takerAssetData);
    const takerAssetType = takerAssetData.assetProxyId === AssetProxyId.ERC20 ? 'erc20' : 'erc721';
    const exchangeCancelEvent = new ExchangeCancelEvent();
    exchangeCancelEvent.contractAddress = eventLog.address as string;
    exchangeCancelEvent.blockNumber = eventLog.blockNumber as number;
    exchangeCancelEvent.logIndex = eventLog.logIndex as number;
    exchangeCancelEvent.rawData = eventLog.data as string;
    exchangeCancelEvent.makerAddress = eventLog.args.makerAddress.toString();
    exchangeCancelEvent.takerAddress =
        eventLog.args.takerAddress == null ? null : eventLog.args.takerAddress.toString();
    exchangeCancelEvent.feeRecepientAddress = eventLog.args.feeRecipientAddress;
    exchangeCancelEvent.senderAddress = eventLog.args.senderAddress;
    exchangeCancelEvent.orderHash = eventLog.args.orderHash;
    exchangeCancelEvent.rawMakerAssetData = eventLog.args.makerAssetData;
    exchangeCancelEvent.makerAssetType = makerAssetType;
    exchangeCancelEvent.makerAssetProxyId = makerAssetData.assetProxyId;
    exchangeCancelEvent.makerTokenAddress = makerAssetData.tokenAddress;
    exchangeCancelEvent.makerTokenId = bigNumbertoStringOrNull((makerAssetData as ERC721AssetData).tokenId);
    exchangeCancelEvent.rawTakerAssetData = eventLog.args.takerAssetData;
    exchangeCancelEvent.takerAssetType = takerAssetType;
    exchangeCancelEvent.takerAssetProxyId = takerAssetData.assetProxyId;
    exchangeCancelEvent.takerTokenAddress = takerAssetData.tokenAddress;
    exchangeCancelEvent.takerTokenId = bigNumbertoStringOrNull((takerAssetData as ERC721AssetData).tokenId);
    return exchangeCancelEvent;
}

export function _convertToExchangeCancelUpToEvent(
    eventLog: LogWithDecodedArgs<ExchangeCancelUpToEventArgs>,
): ExchangeCancelUpToEvent {
    const exchangeCancelUpToEvent = new ExchangeCancelUpToEvent();
    exchangeCancelUpToEvent.contractAddress = eventLog.address as string;
    exchangeCancelUpToEvent.blockNumber = eventLog.blockNumber as number;
    exchangeCancelUpToEvent.logIndex = eventLog.logIndex as number;
    exchangeCancelUpToEvent.rawData = eventLog.data as string;
    exchangeCancelUpToEvent.makerAddress = eventLog.args.makerAddress.toString();
    exchangeCancelUpToEvent.senderAddress = eventLog.args.senderAddress.toString();
    exchangeCancelUpToEvent.orderEpoch = eventLog.args.orderEpoch.toString();
    return exchangeCancelUpToEvent;
}
