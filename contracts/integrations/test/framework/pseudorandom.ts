import { Numberish } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import * as seedrandom from 'seedrandom';

class PRNGWrapper {
    public readonly seed = process.env.UUID || Math.random().toString();
    private readonly _rng = seedrandom(this.seed);

    /*
     * Pseudorandom version of _.sample. Picks an element of the given array with uniform probability.
     * Return undefined if the array is empty.
     */
    public sample<T>(arr: T[]): T | undefined {
        if (arr.length === 0) {
            return undefined;
        }
        const index = Math.abs(this._rng.int32()) % arr.length;
        return arr[index];
    }

    // tslint:disable:unified-signatures
    /*
     * Pseudorandom version of getRandomPortion/getRandomInteger. If two arguments are provided,
     * treats those arguments as the min and max (inclusive) of the desired range. If only one
     * argument is provided, picks an integer between 0 and the argument. 
     */
    public integer(max: Numberish): BigNumber;
    public integer(min: Numberish, max: Numberish): BigNumber;
    public integer(a: Numberish, b?: Numberish): BigNumber {
        if (b === undefined) {
            return new BigNumber(this._rng()).times(a).integerValue(BigNumber.ROUND_HALF_UP);
        } else {
            const range = new BigNumber(b).minus(a);
            return this.integer(range).plus(a);
        }
    }
}

export const Pseudorandom = new PRNGWrapper();
