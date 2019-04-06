import * as chai from 'chai';
import { LogWithDecodedArgs } from 'ethereum-types';
import 'mocha';

import { AbiEncoder, BigNumber } from '../../src/';
import { chaiSetup } from '../utils/chai_setup';

import * as AbiSamples from './abi_samples/event_abis';

chaiSetup.configure();
const expect = chai.expect;

describe('ABI Encoder: Event Decoding', () => {
    const encodingRules: AbiEncoder.EncodingRules = { shouldOptimize: false }; // optimizer is tested separately.
    it('encodes the constructor arguments with the bytecode', async () => {
        const logEvent = {
            address: '0xf5b0a3efb8e8e4c201e2a935f110eaaf3ffecb8d',
            topics: [
                '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925',
                '0x000000000000000000000000f4985070ce32b6b1994329df787d1acc9a2dd9e2',
                '0x0000000000000000000000000000000000000000000000000000000000000000',
            ],
            data: '0x000000000000000000000000000000000000000000000000000000000000a986',
            blockNumber: 1,
            transactionHash: '0x8bf55be2fddbe9a941fd376e571cc0d6270f7b7bb87cb3c7c4476d8ed6e51bb0',
            transactionIndex: 1,
            blockHash: '0x2c14bdc4f78019146ca5fa7aeac6211c055059a00468867c2ccde1b66120e1dc',
            logIndex: 1,
        };
        const event = AbiSamples.erc721ApprovalNoIndexOnTokenIdEvent;
        const encoder = new AbiEncoder.Event(event);
        const decodedLog = encoder.decode(logEvent) as LogWithDecodedArgs<any>;
        expect(decodedLog.args._tokenId).to.eql(
            new BigNumber(parseInt('0x000000000000000000000000000000000000000000000000000000000000a986', 16)),
        );
        expect(decodedLog.args._to).to.eql('0x0000000000000000000000000000000000000000');
        expect(decodedLog.args._from).to.eql('0xf4985070ce32b6b1994329df787d1acc9a2dd9e2');
        expect(decodedLog.event).to.eql('Approval');
    });
    it('throws when decoding fails', async () => {
        const logEvent = {
            address: '0xf5b0a3efb8e8e4c201e2a935f110eaaf3ffecb8d',
            topics: ['0x1111111111111111111111111111111111111111111111111111111111111111'],
            data: '0x000000000000000000000000000000000000000000000000000000000000a986',
            blockNumber: 1,
            transactionHash: '0x8bf55be2fddbe9a941fd376e571cc0d6270f7b7bb87cb3c7c4476d8ed6e51bb0',
            transactionIndex: 1,
            blockHash: '0x2c14bdc4f78019146ca5fa7aeac6211c055059a00468867c2ccde1b66120e1dc',
            logIndex: 1,
        };
        const event = AbiSamples.erc721ApprovalNoIndexOnTokenIdEvent;
        const encoder = new AbiEncoder.Event(event);
        expect(() => encoder.decode(logEvent)).to.throw();
    });
});
