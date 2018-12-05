import { BigNumber } from '@0x/utils';
import { ValueTransformer } from 'typeorm/decorator/options/ValueTransformer';

export class BigNumberTransformer implements ValueTransformer {
    // tslint:disable-next-line:prefer-function-over-method
    public to(value: BigNumber | null): string | null {
        return value === null ? null : value.toString();
    }

    // tslint:disable-next-line:prefer-function-over-method
    public from(value: string | null): BigNumber | null {
        return value === null ? null : new BigNumber(value);
    }
}

export const bigNumberTransformer = new BigNumberTransformer();
