import { ExchangeEventArgs, ExchangeFillEventArgs } from '@0xproject/contract-wrappers';
import { assetDataUtils } from '@0xproject/order-utils';
import { AssetProxyId, ERC721AssetData } from '@0xproject/types';
import { AbiDecoder, BigNumber } from '@0xproject/utils';
import { AbiDefinition, LogEntry, LogWithDecodedArgs } from 'ethereum-types';
import * as R from 'ramda';

import { ExchangeFillEvent } from '../../../entities/ExchangeFillEvent';
import { decodeLogEntry } from '../event_utils';

import { BaseEventHandler } from './base_event_handler';

// TODO(albrow): Union with other exchange event entity types
export type ExchangeEventEntity = ExchangeFillEvent;

export class ExchangeEventHandler extends BaseEventHandler<ExchangeEventEntity> {
    public convertLogEntryToEventEntity(logEntry: LogEntry): ExchangeEventEntity {
        const decodedLogEntry = decodeLogEntry<ExchangeEventArgs>(this._abi, logEntry);
        return _convertToEntity(decodedLogEntry);
    }
}

export function _convertToEntity(eventLog: LogWithDecodedArgs<ExchangeEventArgs>): ExchangeEventEntity {
    switch (eventLog.event) {
        case 'Fill':
            return _convertToExchangeFillEvent(eventLog as LogWithDecodedArgs<ExchangeFillEventArgs>);
        default:
            return new ExchangeFillEvent();
        // throw new Error('unexpected eventLog.event type: ' + eventLog.event);
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

function bigNumbertoStringOrNull(n: BigNumber): string | null {
    if (n == null) {
        return null;
    }
    return n.toString();
}

function filterEventLogs(
    eventLogs: Array<LogWithDecodedArgs<ExchangeEventArgs>>,
): Array<LogWithDecodedArgs<ExchangeEventArgs>> {
    return R.filter(eventLog => eventLog.event === 'Fill', eventLogs);
}
