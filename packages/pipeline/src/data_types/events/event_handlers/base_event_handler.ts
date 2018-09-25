import { AbiDefinition, BlockParam, BlockParamLiteral, LogEntry } from 'ethereum-types';
import * as R from 'ramda';
import { BaseEntity } from 'typeorm';

import { Etherscan } from '../../../data_sources/etherscan';
import { convertResponseToLogEntry } from '../event_utils';

export abstract class BaseEventHandler<EntityType extends BaseEntity> {
    protected _abi: AbiDefinition[];
    protected _address: string;
    protected _etherscan: Etherscan;
    constructor(abi: AbiDefinition[], address: string, etherscan: Etherscan) {
        this._abi = abi;
        this._address = address;
        this._etherscan = etherscan;
    }
    public abstract convertLogEntryToEventEntity(logEntry: LogEntry): EntityType;

    public async getEventsAsync(
        fromBlock: BlockParam = BlockParamLiteral.Earliest,
        toBlock: BlockParam = BlockParamLiteral.Latest,
    ): Promise<EntityType[]> {
        const rawEventsResponse = await this._etherscan.getContractEventsAsync(this._address, fromBlock, toBlock);
        const logEntries = R.map(convertResponseToLogEntry, rawEventsResponse.result);
        // Note(albrow): Imperative for loop is required here because we can't
        // bind convertLogEntryToEventEntity without having a specific instance
        // of a sub-class.
        const result = [];
        for (const logEntry of logEntries) {
            result.push(this.convertLogEntryToEventEntity(logEntry));
        }
        return result;
    }
}
