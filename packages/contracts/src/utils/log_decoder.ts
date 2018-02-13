import { LogWithDecodedArgs, RawLog } from '@0xproject/types';
import { AbiDecoder } from '@0xproject/utils';
import * as _ from 'lodash';
import * as Web3 from 'web3';

import { artifacts } from './artifacts';
import { Artifact } from './types';

export class LogDecoder {
    private _abiDecoder: AbiDecoder;
    constructor(networkIdIfExists?: number) {
        if (_.isUndefined(networkIdIfExists)) {
            throw new Error('networkId not specified');
        }
        const abiArrays: Web3.AbiDefinition[][] = [];
        _.forEach(artifacts, (artifact: Artifact) => {
            const networkIfExists = artifact.networks[networkIdIfExists];
            if (_.isUndefined(networkIfExists)) {
                throw new Error(`Artifact does not exist on network ${networkIdIfExists}`);
            }
            abiArrays.push(networkIfExists.abi);
        });
        this._abiDecoder = new AbiDecoder(abiArrays);
    }
    public decodeLogOrThrow<ArgsType>(log: Web3.LogEntry): LogWithDecodedArgs<ArgsType> | RawLog {
        const logWithDecodedArgsOrLog = this._abiDecoder.tryToDecodeLogOrNoop(log);
        if (_.isUndefined((logWithDecodedArgsOrLog as LogWithDecodedArgs<ArgsType>).args)) {
            throw new Error(`Unable to decode log: ${JSON.stringify(log)}`);
        }
        return logWithDecodedArgsOrLog;
    }
}
