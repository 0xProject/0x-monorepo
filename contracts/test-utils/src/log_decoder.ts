import { AbiDecoder, BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import {
    AbiDefinition,
    ContractArtifact,
    DecodedLogArgs,
    LogEntry,
    LogWithDecodedArgs,
    RawLog,
    TransactionReceipt,
    TransactionReceiptWithDecodedLogs,
} from 'ethereum-types';
import * as _ from 'lodash';

import { constants } from './constants';

export class LogDecoder {
    private readonly _web3Wrapper: Web3Wrapper;
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
    constructor(web3Wrapper: Web3Wrapper, artifacts: { [contractName: string]: ContractArtifact }) {
        this._web3Wrapper = web3Wrapper;
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
        if ((logWithDecodedArgsOrLog as LogWithDecodedArgs<ArgsType>).args === undefined) {
            throw new Error(`Unable to decode log: ${JSON.stringify(log)}`);
        }
        LogDecoder.wrapLogBigNumbers(logWithDecodedArgsOrLog);
        return logWithDecodedArgsOrLog;
    }
    public async getTxWithDecodedLogsAsync(txHash: string): Promise<TransactionReceiptWithDecodedLogs> {
        const receipt = await this._web3Wrapper.awaitTransactionSuccessAsync(txHash);
        return this.decodeReceiptLogs(receipt);
    }
    public decodeReceiptLogs(receipt: TransactionReceipt): TransactionReceiptWithDecodedLogs {
        const decodedLogs = (receipt.logs as LogEntry[]).map(log => this.decodeLogOrThrow(log));
        return _.merge({}, receipt, { logs: decodedLogs });
    }
}
