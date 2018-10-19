import { AbiDecoder, BigNumber } from '@0x/utils';
import { EthRPCClient } from '@0x/eth-rpc-client';
import {
    AbiDefinition,
    ContractArtifact,
    DecodedLogArgs,
    LogEntry,
    LogWithDecodedArgs,
    RawLog,
    TransactionReceiptWithDecodedLogs,
} from 'ethereum-types';
import * as _ from 'lodash';

import { artifacts } from '../../src/artifacts';

import { constants } from './constants';

export class LogDecoder {
    private readonly _ethRPCClient: EthRPCClient;
    private readonly _abiDecoder: AbiDecoder;
    public static wrapLogBigNumbers(log: any): any {
        const argNames = _.keys(log.args);
        for (const argName of argNames) {
            const isWeb3BigNumber = _.startsWith(log.args[argName].constructor.toString(), 'function BigNumber(');
            if (isWeb3BigNumber) {
                log.args[argName] = new BigNumber(log.args[argName]);
            }
        }
    }
    constructor(ethRPCClient: EthRPCClient) {
        this._ethRPCClient = ethRPCClient;
        const abiArrays: AbiDefinition[][] = [];
        _.forEach(artifacts, (artifact: ContractArtifact) => {
            const compilerOutput = artifact.compilerOutput;
            abiArrays.push(compilerOutput.abi);
        });
        this._abiDecoder = new AbiDecoder(abiArrays);
    }
    public decodeLogOrThrow<ArgsType extends DecodedLogArgs>(log: LogEntry): LogWithDecodedArgs<ArgsType> | RawLog {
        const logWithDecodedArgsOrLog = this._abiDecoder.tryToDecodeLogOrNoop(log);
        // tslint:disable-next-line:no-unnecessary-type-assertion
        if (_.isUndefined((logWithDecodedArgsOrLog as LogWithDecodedArgs<ArgsType>).args)) {
            throw new Error(`Unable to decode log: ${JSON.stringify(log)}`);
        }
        LogDecoder.wrapLogBigNumbers(logWithDecodedArgsOrLog);
        return logWithDecodedArgsOrLog;
    }
    public async getTxWithDecodedLogsAsync(txHash: string): Promise<TransactionReceiptWithDecodedLogs> {
        const tx = await this._ethRPCClient.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
        tx.logs = _.map(tx.logs, log => this.decodeLogOrThrow(log));
        return tx;
    }
}
