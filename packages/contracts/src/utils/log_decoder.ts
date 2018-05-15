import { ContractArtifact } from '@0xproject/sol-compiler';
import { AbiDefinition, LogEntry, LogWithDecodedArgs, RawLog } from '@0xproject/types';
import { AbiDecoder, BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { artifacts } from './artifacts';

export class LogDecoder {
    private _abiDecoder: AbiDecoder;
    constructor(networkIdIfExists?: number) {
        if (_.isUndefined(networkIdIfExists)) {
            throw new Error('networkId not specified');
        }
        const abiArrays: AbiDefinition[][] = [];
        _.forEach(artifacts, (artifact: ContractArtifact) => {
            const compilerOutput = artifact.compilerOutput;
            abiArrays.push(compilerOutput.abi);
        });
        this._abiDecoder = new AbiDecoder(abiArrays);
    }
    public decodeLogOrThrow<ArgsType>(log: LogEntry): LogWithDecodedArgs<ArgsType> | RawLog {
        const logWithDecodedArgsOrLog = this._abiDecoder.tryToDecodeLogOrNoop(log);
        if (_.isUndefined((logWithDecodedArgsOrLog as LogWithDecodedArgs<ArgsType>).args)) {
            throw new Error(`Unable to decode log: ${JSON.stringify(log)}`);
        }
        wrapLogBigNumbers(logWithDecodedArgsOrLog);
        return logWithDecodedArgsOrLog;
    }
}

function wrapLogBigNumbers(log: any): any {
    const argNames = _.keys(log.args);
    for (const argName of argNames) {
        const isWeb3BigNumber = _.startsWith(log.args[argName].constructor.toString(), 'function BigNumber(');
        if (isWeb3BigNumber) {
            log.args[argName] = new BigNumber(log.args[argName]);
        }
    }
}
