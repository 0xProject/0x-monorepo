import {
    ExchangeCancelEventArgs,
    ExchangeCancelUpToEventArgs,
    ExchangeEventArgs,
    ExchangeFillEventArgs,
} from '@0xproject/contract-wrappers';
import { assetDataUtils } from '@0xproject/order-utils';
import { AssetProxyId, ERC721AssetData } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { LogWithDecodedArgs } from 'ethereum-types';
import * as R from 'ramda';

import { artifacts } from '../../artifacts';
import { EventsResponse } from '../../data_sources/etherscan';
import { ExchangeCancelEvent } from '../../entities/ExchangeCancelEvent';
import { ExchangeCancelUpToEvent } from '../../entities/ExchangeCancelUpToEvent';
import { ExchangeFillEvent } from '../../entities/ExchangeFillEvent';

import { convertResponseToLogEntry, decodeLogEntry } from './event_utils';

export type ExchangeEventEntity = ExchangeFillEvent | ExchangeCancelEvent | ExchangeCancelUpToEvent;

const exchangeContractAbi = artifacts.Exchange.compilerOutput.abi;

export function parseExchangeEvents(rawEventsResponse: EventsResponse): ExchangeEventEntity[] {
    const logEntries = R.map(convertResponseToLogEntry, rawEventsResponse.result);
    const decodedLogEntries = R.map(
        eventResponse => decodeLogEntry<ExchangeEventArgs>(exchangeContractAbi, eventResponse),
        logEntries,
    );
    const filteredLogEntries = R.filter(shouldIncludeLogEntry, decodedLogEntries);
    return R.map(_convertToEntity, filteredLogEntries);
}

export function shouldIncludeLogEntry(logEntry: LogWithDecodedArgs<ExchangeEventArgs>): boolean {
    if (!R.contains(logEntry.event, ['Fill', 'Cancel', 'CancelUpTo'])) {
        return false;
    } else if (logEntry.logIndex == null || isNaN(logEntry.logIndex)) {
        return false;
    }
    return true;
}

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
    exchangeFillEvent.logIndex = eventLog.logIndex as number;
    exchangeFillEvent.address = eventLog.address as string;
    exchangeFillEvent.rawData = eventLog.data as string;
    exchangeFillEvent.blockNumber = eventLog.blockNumber as number;
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
    exchangeCancelEvent.logIndex = eventLog.logIndex as number;
    exchangeCancelEvent.address = eventLog.address as string;
    exchangeCancelEvent.rawData = eventLog.data as string;
    exchangeCancelEvent.blockNumber = eventLog.blockNumber as number;
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
    exchangeCancelUpToEvent.logIndex = eventLog.logIndex as number;
    exchangeCancelUpToEvent.address = eventLog.address as string;
    exchangeCancelUpToEvent.rawData = eventLog.data as string;
    exchangeCancelUpToEvent.blockNumber = eventLog.blockNumber as number;
    exchangeCancelUpToEvent.makerAddress = eventLog.args.makerAddress.toString();
    exchangeCancelUpToEvent.senderAddress = eventLog.args.senderAddress.toString();
    exchangeCancelUpToEvent.orderEpoch = eventLog.args.orderEpoch.toString();
    return exchangeCancelUpToEvent;
}

function bigNumbertoStringOrNull(n: BigNumber): string | null {
    if (n == null) {
        return null;
    }
    return n.toString();
}
