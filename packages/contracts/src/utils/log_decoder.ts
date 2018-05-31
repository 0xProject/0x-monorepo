import { ContractArtifact } from '@0xproject/sol-compiler';
import { AbiDecoder, BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import {
    AbiDefinition,
    DecodedLogArgs,
    LogEntry,
    LogWithDecodedArgs,
    RawLog,
    TransactionReceiptWithDecodedLogs,
} from 'ethereum-types';
import * as _ from 'lodash';

import { artifacts } from './artifacts';
import { constants } from './constants';

export class LogDecoder {
    private _web3Wrapper: Web3Wrapper;
    private _contractAddress: string;
    private _abiDecoder: AbiDecoder;
    public static wrapLogBigNumbers(log: any): any {
        const argNames = _.keys(log.args);
        for (const argName of argNames) {
            const isWeb3BigNumber = _.startsWith(log.args[argName].constructor.toString(), 'function BigNumber(');
            if (isWeb3BigNumber) {
                log.args[argName] = new BigNumber(log.args[argName]);
            }
        }
    }
    constructor(web3Wrapper: Web3Wrapper, contractAddress: string) {
        this._web3Wrapper = web3Wrapper;
        this._contractAddress = contractAddress;
        const abiArrays: AbiDefinition[][] = [];
        _.forEach(artifacts, (artifact: ContractArtifact) => {
            const compilerOutput = artifact.compilerOutput;
            abiArrays.push(compilerOutput.abi);
        });
        this._abiDecoder = new AbiDecoder(abiArrays);
    }
    public decodeLogOrThrow<ArgsType extends DecodedLogArgs>(log: LogEntry): LogWithDecodedArgs<ArgsType> | RawLog {
        const logWithDecodedArgsOrLog = this._abiDecoder.tryToDecodeLogOrNoop(log);
        if (_.isUndefined((logWithDecodedArgsOrLog as LogWithDecodedArgs<ArgsType>).args)) {
            throw new Error(`Unable to decode log: ${JSON.stringify(log)}`);
        }
        LogDecoder.wrapLogBigNumbers(logWithDecodedArgsOrLog);
        return logWithDecodedArgsOrLog;
    }
    public async getTxWithDecodedLogsAsync(txHash: string): Promise<TransactionReceiptWithDecodedLogs> {
        const tx = await this._web3Wrapper.awaitTransactionSuccessAsync(txHash, constants.AWAIT_TRANSACTION_MINED_MS);
        tx.logs = _.filter(tx.logs, log => log.address === this._contractAddress);
        tx.logs = _.map(tx.logs, log => this.decodeLogOrThrow(log));
        return tx;
    }
}
