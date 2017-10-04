import * as _ from 'lodash';
import * as Web3 from 'web3';
import * as ethUtil from 'ethereumjs-util';
import {Web3Wrapper} from '../web3_wrapper';
import {AbiDecoder} from '../utils/abi_decoder';
import {
    InternalZeroExError,
    Artifact,
    LogWithDecodedArgs,
    RawLog,
    ContractEvents,
    SubscriptionOpts,
    IndexedFilterValues,
} from '../types';
import {utils} from '../utils/utils';

const TOPIC_LENGTH = 32;

export class ContractWrapper {
    protected _web3Wrapper: Web3Wrapper;
    private _abiDecoder?: AbiDecoder;
    constructor(web3Wrapper: Web3Wrapper, abiDecoder?: AbiDecoder) {
        this._web3Wrapper = web3Wrapper;
        this._abiDecoder = abiDecoder;
    }
    protected async _getLogsAsync(address: string, eventName: ContractEvents, subscriptionOpts: SubscriptionOpts,
                                  indexFilterValues: IndexedFilterValues,
                                  abi: Web3.ContractAbi): Promise<LogWithDecodedArgs[]> {
        const eventAbi = _.find(abi, {name: eventName}) as Web3.EventAbi;
        const eventSignature = this._getEventSignatureFromAbiByName(eventAbi, eventName);
        const topicForEventSignature = this._web3Wrapper.keccak256(eventSignature);
        const topicsForIndexedArgs = this._getTopicsForIndexedArgs(eventAbi, indexFilterValues);
        const topics = [topicForEventSignature, ...topicsForIndexedArgs];
        const filter = {
            fromBlock: subscriptionOpts.fromBlock,
            toBlock: subscriptionOpts.toBlock,
            address,
            topics,
        };
        const logs = await this._web3Wrapper.getLogsAsync(filter);
        const logsWithDecodedArguments = _.map(logs, this._tryToDecodeLogOrNoop.bind(this));
        return logsWithDecodedArguments;
    }
    protected _tryToDecodeLogOrNoop(log: Web3.LogEntry): LogWithDecodedArgs|RawLog {
        if (_.isUndefined(this._abiDecoder)) {
            throw new Error(InternalZeroExError.NoAbiDecoder);
        }
        const logWithDecodedArgs = this._abiDecoder.tryToDecodeLogOrNoop(log);
        return logWithDecodedArgs;
    }
    protected async _instantiateContractIfExistsAsync<A extends Web3.ContractInstance>(artifact: Artifact,
                                                                                       addressIfExists?: string,
                                                                                      ): Promise<A> {
        const contractInstance =
            await this._web3Wrapper.getContractInstanceFromArtifactAsync<A>(artifact, addressIfExists);
        return contractInstance;
    }
    protected _getEventSignatureFromAbiByName(eventAbi: Web3.EventAbi, eventName: ContractEvents): string {
        const types = _.map(eventAbi.inputs, 'type');
        const signature = `${eventAbi.name}(${types.join(',')})`;
        return signature;
    }
    private _getTopicsForIndexedArgs(abi: Web3.EventAbi, indexFilterValues: IndexedFilterValues): Array<string|null> {
        const topics: Array<string|null> = [];
        for (const eventInput of abi.inputs) {
            if (!eventInput.indexed) {
                continue;
            }
            if (_.isUndefined(indexFilterValues[eventInput.name])) {
                topics.push(null);
            } else {
                const value = indexFilterValues[eventInput.name] as string;
                const buffer = ethUtil.toBuffer(value);
                const paddedBuffer = ethUtil.setLengthLeft(buffer, TOPIC_LENGTH);
                const topic = ethUtil.bufferToHex(paddedBuffer);
                topics.push(topic);
            }
        }
        return topics;
    }
}
