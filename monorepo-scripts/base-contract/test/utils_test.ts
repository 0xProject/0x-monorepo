import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import { formatABIDataItem } from '../src/utils';

const { expect } = chai;

describe('Utils tests', () => {
    describe('#formatABIDataItem', () => {
        it('correctly handles arrays', () => {
            const calls: Array<{ type: string; value: any }> = [];
            const abi = {
                name: 'values',
                type: 'uint256[]',
            };
            const val = [1, 2, 3];
            const formatted = formatABIDataItem(abi, val, (type: string, value: any) => {
                calls.push({ type, value });
                return value; // no-op
            });
            expect(formatted).to.be.deep.equal(val);
            expect(calls).to.be.deep.equal([
                { type: 'uint256', value: 1 },
                { type: 'uint256', value: 2 },
                { type: 'uint256', value: 3 },
            ]);
        });
        it('correctly handles tuples', () => {
            const calls: Array<{ type: string; value: any }> = [];
            const abi = {
                components: [
                    {
                        name: 'to',
                        type: 'address',
                    },
                    {
                        name: 'amount',
                        type: 'uint256',
                    },
                ],
                name: 'data',
                type: 'tuple',
            };
            const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
            const val = { to: ZERO_ADDRESS, amount: new BigNumber(1) };
            const formatted = formatABIDataItem(abi, val, (type: string, value: any) => {
                calls.push({ type, value });
                return value; // no-op
            });
            expect(formatted).to.be.deep.equal(val);
            expect(calls).to.be.deep.equal([
                {
                    type: 'address',
                    value: val.to,
                },
                {
                    type: 'uint256',
                    value: val.amount,
                },
            ]);
        });
        it('correctly handles nested arrays of tuples', () => {
            const calls: Array<{ type: string; value: any }> = [];
            const abi = {
                components: [
                    {
                        name: 'to',
                        type: 'address',
                    },
                    {
                        name: 'amount',
                        type: 'uint256',
                    },
                ],
                name: 'data',
                type: 'tuple[2][]',
            };
            const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
            const val = [
                [{ to: ZERO_ADDRESS, amount: new BigNumber(1) }, { to: ZERO_ADDRESS, amount: new BigNumber(2) }],
            ];
            const formatted = formatABIDataItem(abi, val, (type: string, value: any) => {
                calls.push({ type, value });
                return value; // no-op
            });
            expect(formatted).to.be.deep.equal(val);
            expect(calls).to.be.deep.equal([
                {
                    type: 'address',
                    value: val[0][0].to,
                },
                {
                    type: 'uint256',
                    value: val[0][0].amount,
                },
                {
                    type: 'address',
                    value: val[0][1].to,
                },
                {
                    type: 'uint256',
                    value: val[0][1].amount,
                },
            ]);
        });
    });
});
