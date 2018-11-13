import {
    ExchangeCancelEventArgs,
    ExchangeCancelUpToEventArgs,
    ExchangeEventArgs,
    ExchangeFillEventArgs,
} from '@0x/contract-wrappers';
import { assetDataUtils } from '@0x/order-utils';
import { AssetProxyId, ERC721AssetData } from '@0x/types';
import { LogWithDecodedArgs } from 'ethereum-types';
import * as R from 'ramda';

import { ExchangeCancelEvent, ExchangeCancelUpToEvent, ExchangeFillEvent } from '../../entities';
import { bigNumbertoStringOrNull } from '../../utils';

export type ExchangeEventEntity = ExchangeFillEvent | ExchangeCancelEvent | ExchangeCancelUpToEvent;

export const parseExchangeEvents: (
    eventLogs: Array<LogWithDecodedArgs<ExchangeEventArgs>>,
) => ExchangeEventEntity[] = R.map(_convertToEntity);

/**
 * Converts a raw event log to an Entity. Automatically detects the type of
 * event and returns the appropriate entity type. Throws for unknown event
 * types.
 * @param eventLog Raw event log (e.g. returned from contract-wrappers).
 */
export function _convertToEntity(eventLog: LogWithDecodedArgs<ExchangeEventArgs>): ExchangeEventEntity {
    switch (eventLog.event) {
        case 'Fill':
            // tslint has a false positive here. We need to type assert in order
            // to change the type argument to the more specific
            // ExchangeFillEventArgs.
            // tslint:disable-next-line:no-unnecessary-type-assertion
            return _convertToExchangeFillEvent(eventLog as LogWithDecodedArgs<ExchangeFillEventArgs>);
        case 'Cancel':
            // tslint:disable-next-line:no-unnecessary-type-assertion
            return _convertToExchangeCancelEvent(eventLog as LogWithDecodedArgs<ExchangeCancelEventArgs>);
        case 'CancelUpTo':
            // tslint:disable-next-line:no-unnecessary-type-assertion
            return _convertToExchangeCancelUpToEvent(eventLog as LogWithDecodedArgs<ExchangeCancelUpToEventArgs>);
        default:
            // Another false positive here. We are adding two strings, but
            // tslint seems confused about the types.
            // tslint:disable-next-line:restrict-plus-operands
            throw new Error('unexpected eventLog.event type: ' + eventLog.event);
    }
}

/**
 * Converts a raw event log for a fill event into an ExchangeFillEvent entity.
 * @param eventLog Raw event log (e.g. returned from contract-wrappers).
 */
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
    exchangeFillEvent.transactionHash = eventLog.transactionHash;
    exchangeFillEvent.makerAddress = eventLog.args.makerAddress.toString();
    exchangeFillEvent.takerAddress = eventLog.args.takerAddress.toString();
    exchangeFillEvent.feeRecipientAddress = eventLog.args.feeRecipientAddress;
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
    // tslint has a false positive here. Type assertion is required.
    // tslint:disable-next-line:no-unnecessary-type-assertion
    exchangeFillEvent.makerTokenId = bigNumbertoStringOrNull((makerAssetData as ERC721AssetData).tokenId);
    exchangeFillEvent.rawTakerAssetData = eventLog.args.takerAssetData;
    exchangeFillEvent.takerAssetType = takerAssetType;
    exchangeFillEvent.takerAssetProxyId = takerAssetData.assetProxyId;
    exchangeFillEvent.takerTokenAddress = takerAssetData.tokenAddress;
    // tslint:disable-next-line:no-unnecessary-type-assertion
    exchangeFillEvent.takerTokenId = bigNumbertoStringOrNull((takerAssetData as ERC721AssetData).tokenId);
    return exchangeFillEvent;
}

/**
 * Converts a raw event log for a cancel event into an ExchangeCancelEvent
 * entity.
 * @param eventLog Raw event log (e.g. returned from contract-wrappers).
 */
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
    exchangeCancelEvent.feeRecipientAddress = eventLog.args.feeRecipientAddress;
    exchangeCancelEvent.senderAddress = eventLog.args.senderAddress;
    exchangeCancelEvent.orderHash = eventLog.args.orderHash;
    exchangeCancelEvent.rawMakerAssetData = eventLog.args.makerAssetData;
    exchangeCancelEvent.makerAssetType = makerAssetType;
    exchangeCancelEvent.makerAssetProxyId = makerAssetData.assetProxyId;
    exchangeCancelEvent.makerTokenAddress = makerAssetData.tokenAddress;
    // tslint:disable-next-line:no-unnecessary-type-assertion
    exchangeCancelEvent.makerTokenId = bigNumbertoStringOrNull((makerAssetData as ERC721AssetData).tokenId);
    exchangeCancelEvent.rawTakerAssetData = eventLog.args.takerAssetData;
    exchangeCancelEvent.takerAssetType = takerAssetType;
    exchangeCancelEvent.takerAssetProxyId = takerAssetData.assetProxyId;
    exchangeCancelEvent.takerTokenAddress = takerAssetData.tokenAddress;
    // tslint:disable-next-line:no-unnecessary-type-assertion
    exchangeCancelEvent.takerTokenId = bigNumbertoStringOrNull((takerAssetData as ERC721AssetData).tokenId);
    return exchangeCancelEvent;
}

/**
 * Converts a raw event log for a cancelUpTo event into an
 * ExchangeCancelUpToEvent entity.
 * @param eventLog Raw event log (e.g. returned from contract-wrappers).
 */
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
