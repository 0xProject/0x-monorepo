import { ERC20TokenApprovalEventArgs } from '@0x/contract-wrappers';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import { LogWithDecodedArgs } from 'ethereum-types';
import 'mocha';

import { ERC20ApprovalEvent } from '../../../src/entities';
import { _convertToERC20ApprovalEvent } from '../../../src/parsers/events/erc20_events';
import { _convertToExchangeFillEvent } from '../../../src/parsers/events/exchange_events';
import { chaiSetup } from '../../utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

// tslint:disable:custom-no-magic-numbers
describe('erc20_events', () => {
    describe('_convertToERC20ApprovalEvent', () => {
        it('converts LogWithDecodedArgs to ERC20ApprovalEvent entity', () => {
            const input: LogWithDecodedArgs<ERC20TokenApprovalEventArgs> = {
                address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                blockHash: '0xd2d7aafaa7102aec0bca8ef026d5a85133e87892334c46ee1e92e42912991c9b',
                blockNumber: 6281577,
                data: '0x000000000000000000000000000000000000000000000002b9cba5ee21ad3df9',
                logIndex: 43,
                topics: [
                    '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925',
                    '0x0000000000000000000000000b65c5f6f3a05d6be5588a72b603360773b3fe04',
                    '0x000000000000000000000000448a5065aebb8e423f0896e6c5d525c040f59af3',
                ],
                transactionHash: '0xcb46b19c786376a0a0140d51e3e606a4c4f926d8ca5434e96d2f69d04d8d9c7f',
                transactionIndex: 103,
                event: 'Approval',
                args: {
                    _owner: '0x0b65c5f6f3a05d6be5588a72b603360773b3fe04',
                    _spender: '0x448a5065aebb8e423f0896e6c5d525c040f59af3',
                    _value: new BigNumber('50281464906893835769'),
                },
            };

            const expected = new ERC20ApprovalEvent();
            expected.tokenAddress = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
            expected.blockNumber = 6281577;
            expected.rawData = '0x000000000000000000000000000000000000000000000002b9cba5ee21ad3df9';
            expected.logIndex = 43;
            expected.transactionHash = '0xcb46b19c786376a0a0140d51e3e606a4c4f926d8ca5434e96d2f69d04d8d9c7f';
            expected.ownerAddress = '0x0b65c5f6f3a05d6be5588a72b603360773b3fe04';
            expected.spenderAddress = '0x448a5065aebb8e423f0896e6c5d525c040f59af3';
            expected.amount = new BigNumber('50281464906893835769');

            const actual = _convertToERC20ApprovalEvent(input);
            expect(actual).deep.equal(expected);
        });
    });
});
