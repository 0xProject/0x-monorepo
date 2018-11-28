import { BigNumber } from '@0x/utils';
import { ValueTransformer } from 'typeorm/decorator/options/ValueTransformer';

const decimalRadix = 10;

export class NumberToBigIntTransformer implements ValueTransformer {
    // tslint:disable-next-line:prefer-function-over-method
    public to(value: number): string {
        return value.toString();
    }

    // tslint:disable-next-line:prefer-function-over-method
    public from(value: string): number {
        if (new BigNumber(value).greaterThan(Number.MAX_SAFE_INTEGER)) {
            throw new Error(
                `Attempted to convert PostgreSQL bigint value (${value}) to JavaScript number type but it is too big to safely convert`,
            );
        }
        return Number.parseInt(value, decimalRadix);
    }
}

export const numberToBigIntTransformer = new NumberToBigIntTransformer();
