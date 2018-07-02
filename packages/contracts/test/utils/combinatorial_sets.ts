import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

export const BigNumbers = [];

const MAX_256_BIT_NUMBER = new BigNumber(2).pow(256).minus(1);

export const positiveNaturalBigNumbers = [
    new BigNumber(0),
    new BigNumber(1),
    new BigNumber(2),
    new BigNumber(2).pow(64),
    MAX_256_BIT_NUMBER,
    MAX_256_BIT_NUMBER.div(2).floor(),
    MAX_256_BIT_NUMBER.sqrt().floor(),
];

export const negativeNaturalNumbers = _.map(positiveNaturalBigNumbers, n => n.neg());
export const naturalBigNumbers = _.concat(positiveNaturalBigNumbers, negativeNaturalNumbers);

function bigNumbersToNumbers(bigNumbers: BigNumber[]): number[] {
    return _.map(bigNumbers, (x: BigNumber) => x.toNumber());
}
export const positiveNaturalNumbers = bigNumbersToNumbers(positiveNaturalBigNumbers);
export const naturalNumbers = bigNumbersToNumbers(naturalBigNumbers);
