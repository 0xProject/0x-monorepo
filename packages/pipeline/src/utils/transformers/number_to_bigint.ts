import { BigNumber } from '@0x/utils';
import { ValueTransformer } from 'typeorm/decorator/options/ValueTransformer';

const decimalRadix = 10;

// Can be used to convert a JavaScript number type to a Postgres bigint type and
// vice versa. By default TypeORM will silently convert number types to string
// if the corresponding Postgres type is bigint. See
// https://github.com/typeorm/typeorm/issues/2400 for more information.
export class NumberToBigIntTransformer implements ValueTransformer {
    // tslint:disable-next-line:prefer-function-over-method
    public to(value: number): string | null {
        if (value === null || value === undefined) {
            return null;
        } else {
            return value.toString();
        }
    }

    // tslint:disable-next-line:prefer-function-over-method
    public from(value: string): number {
        if (new BigNumber(value).isGreaterThan(Number.MAX_SAFE_INTEGER)) {
            throw new Error(
                `Attempted to convert PostgreSQL bigint value (${value}) to JavaScript number type but it is too big to safely convert`,
            );
        }
        return Number.parseInt(value, decimalRadix);
    }
}

export const numberToBigIntTransformer = new NumberToBigIntTransformer();
