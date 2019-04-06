import {
    AbiDefinition,
    AbiType,
    DecodedLogArgs,
    EventAbi,
    LogEntry,
    LogWithDecodedArgs,
    MethodAbi,
    RawLog,
} from 'ethereum-types';
import * as _ from 'lodash';

import { AbiEncoder } from '.';
import { DecodedCalldata, SelectorToFunctionInfo } from './types';

/**
 * AbiDecoder allows you to decode event logs given a set of supplied contract ABI's. It takes the contract's event
 * signature from the ABI and attempts to decode the logs using it.
 */
export class AbiDecoder {
    private readonly _eventIds: { [signatureHash: string]: { [numIndexedArgs: number]: EventAbi } } = {};
    private readonly _selectorToFunctionInfo: SelectorToFunctionInfo = {};
    /**
     * Retrieves the function selector from calldata.
     * @param calldata hex-encoded calldata.
     * @return hex-encoded function selector.
     */
    private static _getFunctionSelector(calldata: string): string {
        const functionSelectorLength = 10;
        if (!calldata.startsWith('0x') || calldata.length < functionSelectorLength) {
            throw new Error(
                `Malformed calldata. Must include a hex prefix '0x' and 4-byte function selector. Got '${calldata}'`,
            );
        }
        const functionSelector = calldata.substr(0, functionSelectorLength);
        return functionSelector;
    }
    /**
     * Instantiate an AbiDecoder
     * @param abiArrays An array of contract ABI's
     * @return AbiDecoder instance
     */
    constructor(abiArrays: AbiDefinition[][]) {
        _.each(abiArrays, abi => {
            this.addABI(abi);
        });
    }
    /**
     * Attempt to decode a log given the ABI's the AbiDecoder knows about.
     * @param log The log to attempt to decode
     * @return The decoded log if the requisite ABI was available. Otherwise the log unaltered.
     */
    public tryToDecodeLogOrNoop<ArgsType extends DecodedLogArgs>(log: LogEntry): LogWithDecodedArgs<ArgsType> | RawLog {
        const eventId = log.topics[0];
        const numIndexedArgs = log.topics.length - 1;
        if (_.isUndefined(this._eventIds[eventId]) || _.isUndefined(this._eventIds[eventId][numIndexedArgs])) {
            return log;
        }
        const event = this._eventIds[eventId][numIndexedArgs];
        const encoder = new AbiEncoder.Event(event);
        try {
            const decodedLog = encoder.decode(log);
            return decodedLog;
        } catch (e) {
            return log;
        }
    }
    /**
     * Decodes calldata for a known ABI.
     * @param calldata hex-encoded calldata.
     * @param contractName used to disambiguate similar ABI's (optional).
     * @return Decoded calldata. Includes: function name and signature, along with the decoded arguments.
     */
    public decodeCalldataOrThrow(calldata: string, contractName?: string): DecodedCalldata {
        const functionSelector = AbiDecoder._getFunctionSelector(calldata);
        const candidateFunctionInfos = this._selectorToFunctionInfo[functionSelector];
        if (_.isUndefined(candidateFunctionInfos)) {
            throw new Error(`No functions registered for selector '${functionSelector}'`);
        }
        const functionInfo = _.find(candidateFunctionInfos, candidateFunctionInfo => {
            return (
                _.isUndefined(contractName) || _.toLower(contractName) === _.toLower(candidateFunctionInfo.contractName)
            );
        });
        if (_.isUndefined(functionInfo)) {
            throw new Error(
                `No function registered with selector ${functionSelector} and contract name ${contractName}.`,
            );
        } else if (_.isUndefined(functionInfo.abiEncoder)) {
            throw new Error(
                `Function ABI Encoder is not defined, for function registered with selector ${functionSelector} and contract name ${contractName}.`,
            );
        }
        const functionName = functionInfo.abiEncoder.getDataItem().name;
        const functionSignature = functionInfo.abiEncoder.getSignatureType();
        const functionArguments = functionInfo.abiEncoder.decode(calldata);
        const decodedCalldata = {
            functionName,
            functionSignature,
            functionArguments,
        };
        return decodedCalldata;
    }
    /**
     * Adds a set of ABI definitions, after which calldata and logs targeting these ABI's can be decoded.
     * Additional properties can be included to disambiguate similar ABI's. For example, if two functions
     * have the same signature but different parameter names, then their ABI definitions can be disambiguated
     * by specifying a contract name.
     * @param abiDefinitions ABI definitions for a given contract.
     * @param contractName Name of contract that encapsulates the ABI definitions (optional).
     *                     This can be used when decoding calldata to disambiguate methods with
     *                     the same signature but different parameter names.
     */
    public addABI(abiArray: AbiDefinition[], contractName?: string): void {
        if (_.isUndefined(abiArray)) {
            return;
        }
        _.map(abiArray, (abi: AbiDefinition) => {
            switch (abi.type) {
                case AbiType.Event:
                    // tslint:disable-next-line:no-unnecessary-type-assertion
                    this._addEventABI(abi as EventAbi);
                    break;

                case AbiType.Function:
                    // tslint:disable-next-line:no-unnecessary-type-assertion
                    this._addMethodABI(abi as MethodAbi, contractName);
                    break;

                default:
                    // ignore other types
                    break;
            }
        });
    }
    private _addEventABI(eventAbi: EventAbi): void {
        // TODO(FFF): Replace with events decoder
        const encoder = new AbiEncoder.Event(eventAbi);
        const topic = encoder.getSelector();
        const numIndexedArgs = _.reduce(eventAbi.inputs, (sum, input) => (input.indexed ? sum + 1 : sum), 0);
        this._eventIds[topic] = {
            ...this._eventIds[topic],
            [numIndexedArgs]: eventAbi,
        };
    }
    private _addMethodABI(methodAbi: MethodAbi, contractName?: string): void {
        const abiEncoder = new AbiEncoder.Method(methodAbi);
        const functionSelector = abiEncoder.getSelector();
        if (!(functionSelector in this._selectorToFunctionInfo)) {
            this._selectorToFunctionInfo[functionSelector] = [];
        }
        // Recored a copy of this ABI for each deployment
        const functionSignature = abiEncoder.getSignature();
        this._selectorToFunctionInfo[functionSelector].push({
            functionSignature,
            abiEncoder,
            contractName,
        });
    }
}
