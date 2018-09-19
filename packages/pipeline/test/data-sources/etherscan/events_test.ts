import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import { DecodedLogArgs, LogEntry, LogWithDecodedArgs } from 'ethereum-types';
import 'mocha';

import {
    _convertResponseToLogEntry,
    _decodeLogEntry,
    EventsResponseResult,
} from '../../../src/data-sources/etherscan/events';
import { chaiSetup } from '../../utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

describe('etherscan#events', () => {
    describe('_convertResponseToLogEntry', () => {
        it('converts EventsResponseResult to LogEntry', () => {
            const input: EventsResponseResult = {
                address: '0x4f833a24e1f95d70f028921e27040ca56e09ab0b',
                topics: [
                    '0x82af639571738f4ebd4268fb0363d8957ebe1bbb9e78dba5ebd69eed39b154f0',
                    '0x00000000000000000000000067032ef7be8fa07c4335d0134099db0f3875e930',
                    '0x0000000000000000000000000000000000000000000000000000000000000000',
                ],
                data: '0x00000000000000000000000000000000000000000000000000000165f2d3f94d',
                blockNumber: '0x61127b',
                timeStamp: '0x5ba2878e',
                gasPrice: '0x1a13b8600',
                gasUsed: '0xd9dc',
                logIndex: '0x63',
                transactionHash: '0xa3f71931ddab6e758b9d1755b2715b376759f49f23fff60755f7e073367d61b5',
                transactionIndex: '0x35',
            };
            const expected: LogEntry = {
                logIndex: 99,
                transactionIndex: 53,
                transactionHash: input.transactionHash,
                blockHash: '',
                blockNumber: 6361723,
                address: input.address,
                data: input.data,
                topics: input.topics,
            };
            const actual = _convertResponseToLogEntry(input);
            expect(actual).deep.equal(expected);
        });
    });
    describe('_decodeLogEntry', () => {
        it('decodes LogEntry into LogWithDecodedArgs', () => {
            const input: LogEntry = {
                logIndex: 96,
                transactionIndex: 52,
                transactionHash: '0x02b59043e9b38b430c8c66abe67ab4a9e5509def8f8552b54231e88db1839831',
                blockHash: '',
                blockNumber: 6361723,
                address: '0x4f833a24e1f95d70f028921e27040ca56e09ab0b',
                data:
                    '0x00000000000000000000000067032ef7be8fa07c4335d0134099db0f3875e93000000000000000000000000067032ef7be8fa07c4335d0134099db0f3875e930000000000000000000000000000000000000000000000000000000174876e8000000000000000000000000000000000000000000000000000000000013ab668000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001600000000000000000000000000000000000000000000000000000000000000024f47261b0000000000000000000000000e41d2489571d322189246dafa5ebde1f4699f498000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024f47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000000000',
                topics: [
                    '0x0bcc4c97732e47d9946f229edb95f5b6323f601300e4690de719993f3c371129',
                    '0x0000000000000000000000003f7f832abb3be28442c0e48b7222e02b322c78f3',
                    '0x000000000000000000000000a258b39954cef5cb142fd567a46cddb31a670124',
                    '0x523404b4e6f847d9aefcf5be024be396449b4635590291fd7a28a8c940843858',
                ],
            };
            const expected: LogWithDecodedArgs<DecodedLogArgs> = {
                ...input,
                event: 'Fill',
                args: {
                    makerAddress: '0x3f7f832abb3be28442c0e48b7222e02b322c78f3',
                    feeRecipientAddress: '0xa258b39954cef5cb142fd567a46cddb31a670124',
                    takerAddress: '0x67032ef7be8fa07c4335d0134099db0f3875e930',
                    senderAddress: '0x67032ef7be8fa07c4335d0134099db0f3875e930',
                    makerAssetFilledAmount: new BigNumber('100000000000'),
                    takerAssetFilledAmount: new BigNumber('330000000'),
                    makerFeePaid: new BigNumber('0'),
                    takerFeePaid: new BigNumber('0'),
                    orderHash: '0x523404b4e6f847d9aefcf5be024be396449b4635590291fd7a28a8c940843858',
                    makerAssetData: '0xf47261b0000000000000000000000000e41d2489571d322189246dafa5ebde1f4699f498',
                    takerAssetData: '0xf47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                },
            };
            const actual = _decodeLogEntry(input);
            expect(actual).deep.equal(expected);
        });
    });
});
