import {
    AbiDefinition,
    AbiType,
    DecodedLogArgs,
    EventAbi,
    EventParameter,
    LogEntry,
    LogWithDecodedArgs,
    MethodAbi,
    RawLog,
    SolidityTypes,
} from 'ethereum-types';
import * as ethers from 'ethers';
import * as _ from 'lodash';

import { AbiEncoder } from '.';
import { addressUtils } from './address_utils';
import { BigNumber } from './configured_bignumber';
import { FunctionInfoBySelector, TransactionData } from './types';

/**
 * AbiDecoder allows you to decode event logs given a set of supplied contract ABI's. It takes the contract's event
 * signature from the ABI and attempts to decode the logs using it.
 */
export class AbiDecoder {
    private readonly _eventIds: { [signatureHash: string]: { [numIndexedArgs: number]: EventAbi } } = {};
    private readonly _functionInfoBySelector: FunctionInfoBySelector = {};
    /**
     * Retrieves the function selector from tranasction data.
     * @param calldata hex-encoded transaction data.
     * @return hex-encoded function selector.
     */
    private static _getFunctionSelector(calldata: string): string {
        const functionSelectorLength = 10;
        if (!calldata.startsWith('0x') || calldata.length < functionSelectorLength) {
            throw new Error(
                `Malformed transaction data. Must include a hex prefix '0x' and 4-byte function selector. Got '${calldata}'`,
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
        _.each(abiArrays, (abi) => {
            this.addABI(abi);
        });
    }
    /**
     * Attempt to decode a log given the ABI's the AbiDecoder knows about.
     * @param log The log to attempt to decode
     * @return The decoded log if the requisite ABI was available. Otherwise the log unaltered.
     */
    public tryToDecodeLogOrNoop<ArgsType extends DecodedLogArgs>(log: LogEntry): LogWithDecodedArgs<ArgsType> | RawLog {
        const methodId = log.topics[0];
        const numIndexedArgs = log.topics.length - 1;
        if (_.isUndefined(this._eventIds[methodId]) || _.isUndefined(this._eventIds[methodId][numIndexedArgs])) {
            return log;
        }
        const event = this._eventIds[methodId][numIndexedArgs];
        const ethersInterface = new ethers.utils.Interface([event]);
        const decodedParams: DecodedLogArgs = {};
        let topicsIndex = 1;

        let decodedData: any[];
        try {
            decodedData = ethersInterface.events[event.name].decode(log.data);
        } catch (error) {
            if (error.code === ethers.errors.INVALID_ARGUMENT) {
                // Because we index events by Method ID, and Method IDs are derived from the method
                // name and the input parameters, it's possible that the return value of the event
                // does not match our ABI. If that's the case, then ethers will throw an error
                // when we try to parse the event. We handle that case here by returning the log rather
                // than throwing an error.
                return log;
            }
            throw error;
        }
        let didFailToDecode = false;
        _.forEach(event.inputs, (param: EventParameter, i: number) => {
            // Indexed parameters are stored in topics. Non-indexed ones in decodedData
            let value: BigNumber | string | number = param.indexed ? log.topics[topicsIndex++] : decodedData[i];
            if (_.isUndefined(value)) {
                didFailToDecode = true;
                return;
            }
            if (param.type === SolidityTypes.Address) {
                const baseHex = 16;
                value = addressUtils.padZeros(new BigNumber((value as string).toLowerCase()).toString(baseHex));
            } else if (param.type === SolidityTypes.Uint256 || param.type === SolidityTypes.Uint) {
                value = new BigNumber(value);
            } else if (param.type === SolidityTypes.Uint8) {
                value = new BigNumber(value).toNumber();
            }
            decodedParams[param.name] = value;
        });

        if (didFailToDecode) {
            return log;
        } else {
            return {
                ...log,
                event: event.name,
                args: decodedParams,
            };
        }
    }
    /**
     * Decodes transaction data for a known ABI.
     * @param calldata hex-encoded transaction data.
     * @param contractName used to disambiguate similar ABI's (optional).
     * @return Decoded transaction data. Includes: function name and signature, along with the decoded arguments.
     */
    public tryDecodeCalldata(calldata: string, contractName?: string): TransactionData {
        const functionSelector = AbiDecoder._getFunctionSelector(calldata);
        const candidateFunctionInfos = this._functionInfoBySelector[functionSelector];
        if (_.isUndefined(candidateFunctionInfos)) {
            throw new Error(`No functions registered for selector '${functionSelector}'`);
        }
        const functionInfo = _.find(candidateFunctionInfos, txDecoder => {
            return (
                (_.isUndefined(contractName) ||
                    _.toLower(txDecoder.contractName) === _.toLower(contractName)));
        });
        if (_.isUndefined(functionInfo)) {
            throw new Error(`No function registered with selector ${functionSelector} and contract name ${contractName}.`);
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
     * Adds a set of ABI definitions, after which transaction data targeting these ABI's can be decoded.
     * Additional properties can be included to disambiguate similar ABI's. For example, if two functions
     * have the same signature but different parameter names, then their ABI definitions can be disambiguated
     * by specifying a contract name.
     * @param abiDefinitions ABI definitions for a given contract.
     * @param contractName Name of contract that encapsulates the ABI definitions (optional).
     */
    public addABI(
        abiArray: AbiDefinition[],
        contractName?: string
    ): void {
        if (_.isUndefined(abiArray)) {
            return;
        }
        const ethersInterface = new ethers.utils.Interface(abiArray);
        _.map(abiArray, (abi: AbiDefinition) => {
            switch (abi.type) {
                case AbiType.Event:
                    this._addEventABI(abi as EventAbi, ethersInterface);
                    break;

                case AbiType.Function:
                    this._addMethodABI(abi as MethodAbi, contractName);
                    break;

                default:
                    // ignore other types
                    break; 
            }
        });
    }
    private _addEventABI(abi: EventAbi, ethersInterface: ethers.utils.Interface): void {
        // tslint:disable-next-line:no-unnecessary-type-assertion
        const eventAbi = abi as EventAbi;
        const topic = ethersInterface.events[eventAbi.name].topic;
        const numIndexedArgs = _.reduce(eventAbi.inputs, (sum, input) => (input.indexed ? sum + 1 : sum), 0);
        this._eventIds[topic] = {
            ...this._eventIds[topic],
            [numIndexedArgs]: eventAbi,
        };
    }
    private _addMethodABI(methodAbi: MethodAbi, contractName?: string): void {
        const abiEncoder = new AbiEncoder.Method(methodAbi);
        const functionSelector = abiEncoder.getSelector();
        if (!(functionSelector in this._functionInfoBySelector)) {
            this._functionInfoBySelector[functionSelector] = [];
        }
        // Recored a copy of this ABI for each deployment
        const functionSignature = abiEncoder.getSignature();
        this._functionInfoBySelector[functionSelector].push({
            functionSignature,
            abiEncoder,
            contractName,
        });
    }
}
