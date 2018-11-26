/* tslint:disable prefer-function-over-method */
import { DataItem } from 'ethereum-types';

import { BigNumber } from '../../configured_bignumber';
import { DataTypeFactory } from '../abstract_data_types';

import { Number } from './number';

export class Int extends Number {
    private static readonly _MATCHER = RegExp(
        '^int(8|16|24|32|40|48|56|64|72|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256){0,1}$',
    );

    public static matchType(type: string): boolean {
        return Int._MATCHER.test(type);
    }

    public constructor(dataItem: DataItem, dataTypeFactory: DataTypeFactory) {
        super(dataItem, Int._MATCHER, dataTypeFactory);
    }

    public getMaxValue(): BigNumber {
        return new BigNumber(2).toPower(this._width - 1).sub(1);
    }

    public getMinValue(): BigNumber {
        return new BigNumber(2).toPower(this._width - 1).times(-1);
    }

    public getSignature(): string {
        return `int${this._width}`;
    }
}
