import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import { aggregateOrders, GenericRawOrder } from '../../../src/parsers/utils';
import { chaiSetup } from '../../utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

// tslint:disable:custom-no-magic-numbers
describe('aggregateOrders', () => {
    it('aggregates order by price point', () => {
        const input = [
            { price: '1', amount: '20', orderHash: 'testtest', total: '20' },
            { price: '1', amount: '30', orderHash: 'testone', total: '30' },
            { price: '2', amount: '100', orderHash: 'testtwo', total: '200' },
        ];
        const expected = [['1', new BigNumber(50)], ['2', new BigNumber(100)]];
        const actual = aggregateOrders(input);
        expect(actual).deep.equal(expected);
    });

    it('handles empty orders gracefully', () => {
        const input: GenericRawOrder[] = [];
        const expected: Array<[string, BigNumber]> = [];
        const actual = aggregateOrders(input);
        expect(actual).deep.equal(expected);
    });
});
