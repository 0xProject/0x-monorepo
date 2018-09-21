import { ExchangeEventArgs, ExchangeFillEventArgs } from '@0xproject/contract-wrappers';
import { assetDataUtils } from '@0xproject/order-utils';
import { AssetProxyId, ERC721AssetData } from '@0xproject/types';
import { AbiDecoder, BigNumber } from '@0xproject/utils';
import { AbiDefinition, LogEntry, LogWithDecodedArgs } from 'ethereum-types';
import * as R from 'ramda';

import { ExchangeFillEvent } from '../../entities/ExchangeFillEvent';

// TODO(albrow): Union with other exchange event entity types
export type ExchangeEventEntity = ExchangeFillEvent;

// Raw events response from etherescan.io
export interface EventsResponse {
    status: string;
    message: string;
    result: EventsResponseResult[];
}

// Events as represented in the response from etherscan.io
export interface EventsResponseResult {
    address: string;
    topics: string[];
    data: string;
    blockNumber: string;
    timeStamp: string;
    gasPrice: string;
    gasUsed: string;
    logIndex: string;
    transactionHash: string;
    transactionIndex: string;
}

const hexRadix = 16;

function hexToInt(hex: string): number {
    return parseInt(hex.replace('0x', ''), hexRadix);
}

// Converts a raw event response to a LogEntry
// tslint:disable-next-line:completed-docs
export function _convertResponseToLogEntry(result: EventsResponseResult): LogEntry {
    return {
        logIndex: hexToInt(result.logIndex),
        transactionIndex: hexToInt(result.transactionIndex),
        transactionHash: result.transactionHash,
        blockHash: '',
        blockNumber: hexToInt(result.blockNumber),
        address: result.address,
        data: result.data,
        topics: result.topics,
    };
}

// Decodes a LogEntry into a LogWithDecodedArgs
// tslint:disable-next-line:completed-docs
export const _decodeLogEntry = R.curry((contractAbi: AbiDefinition[], log: LogEntry): LogWithDecodedArgs<
    ExchangeEventArgs
> => {
    const abiDecoder = new AbiDecoder([contractAbi]);
    const logWithDecodedArgs = abiDecoder.tryToDecodeLogOrNoop(log);
    // tslint:disable-next-line:no-unnecessary-type-assertion
    return logWithDecodedArgs as LogWithDecodedArgs<ExchangeEventArgs>;
});

export function _convertToEntity(eventLog: LogWithDecodedArgs<ExchangeEventArgs>): ExchangeEventEntity {
    switch (eventLog.event) {
        case 'Fill':
            return _convertToExchangeFillEvent(eventLog as LogWithDecodedArgs<ExchangeFillEventArgs>);
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

/**
 * Parses and abi-decodes the raw events response from etherscan.io.
 * @param contractAbi The ABI for the contract that the events where emited from.
 * @param rawEventsResponse The raw events response from etherescan.io.
 * @returns Parsed and decoded event entities, ready to be saved to database.
 */
export function parseRawEventsResponse(
    contractAbi: AbiDefinition[],
    rawEventsResponse: EventsResponse,
): ExchangeEventEntity[] {
    return R.pipe(
        R.map(_convertResponseToLogEntry),
        R.map(_decodeLogEntry(contractAbi)),
        filterEventLogs,
        R.map(_convertToEntity),
    )(rawEventsResponse.result);
}
