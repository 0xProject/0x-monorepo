import { ContractAbi, EventAbi, FilterObject, LogEntry } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as jsSHA3 from 'js-sha3';
import * as _ from 'lodash';
import * as uuid from 'uuid/v4';

import { BlockRange, ContractEvents, IndexedFilterValues } from '../types';

const TOPIC_LENGTH = 32;

export const filterUtils = {
    generateUUID(): string {
        return uuid();
    },
    getFilter(
        address: string,
        eventName: ContractEvents,
        indexFilterValues: IndexedFilterValues,
        abi: ContractAbi,
        blockRange?: BlockRange,
    ): FilterObject {
        const eventAbi = _.find(abi, { name: eventName }) as EventAbi;
        const eventSignature = filterUtils.getEventSignatureFromAbiByName(eventAbi);
        const topicForEventSignature = ethUtil.addHexPrefix(jsSHA3.keccak256(eventSignature));
        const topicsForIndexedArgs = filterUtils.getTopicsForIndexedArgs(eventAbi, indexFilterValues);
        const topics = [topicForEventSignature, ...topicsForIndexedArgs];
        let filter: FilterObject = {
            address,
            topics,
        };
        if (!_.isUndefined(blockRange)) {
            filter = {
                ...blockRange,
                ...filter,
            };
        }
        return filter;
    },
    getEventSignatureFromAbiByName(eventAbi: EventAbi): string {
        const types = _.map(eventAbi.inputs, 'type');
        const signature = `${eventAbi.name}(${types.join(',')})`;
        return signature;
    },
    getTopicsForIndexedArgs(abi: EventAbi, indexFilterValues: IndexedFilterValues): Array<string | null> {
        const topics: Array<string | null> = [];
        for (const eventInput of abi.inputs) {
            if (!eventInput.indexed) {
                continue;
            }
            if (_.isUndefined(indexFilterValues[eventInput.name])) {
                // Null is a wildcard topic in a JSON-RPC call
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
    },
    matchesFilter(log: LogEntry, filter: FilterObject): boolean {
        if (!_.isUndefined(filter.address) && log.address !== filter.address) {
            return false;
        }
        if (!_.isUndefined(filter.topics)) {
            return filterUtils.doesMatchTopics(log.topics, filter.topics);
        }
        return true;
    },
    doesMatchTopics(logTopics: string[], filterTopics: Array<string[] | string | null>): boolean {
        const matchesTopic = _.zipWith(logTopics, filterTopics, filterUtils.matchesTopic.bind(filterUtils));
        const doesMatchTopics = _.every(matchesTopic);
        return doesMatchTopics;
    },
    matchesTopic(logTopic: string, filterTopic: string[] | string | null): boolean {
        if (_.isArray(filterTopic)) {
            return _.includes(filterTopic, logTopic);
        }
        if (_.isString(filterTopic)) {
            return filterTopic === logTopic;
        }
        // null topic is a wildcard
        return true;
    },
};
