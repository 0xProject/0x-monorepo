import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

export const utils = {
    convertHexToNumber(value: string): number {
        const valueBigNumber = new BigNumber(value);
        const valueNumber = valueBigNumber.toNumber();
        return valueNumber;
    },
    convertHexToNumberOrNull(hex: string | null): number | null {
        if (hex === null) {
            return null;
        }
        const decimal = utils.convertHexToNumber(hex);
        return decimal;
    },
    convertAmountToBigNumber(value: string | number | BigNumber): BigNumber {
        const num = value || 0;
        const isBigNumber = BigNumber.isBigNumber(num);
        if (isBigNumber) {
            return num as BigNumber;
        }

        if (_.isString(num) && (num.indexOf('0x') === 0 || num.indexOf('-0x') === 0)) {
            return new BigNumber(num.replace('0x', ''), 16);
        }

        const baseTen = 10;
        return new BigNumber((num as number).toString(baseTen), baseTen);
    },
    encodeAmountAsHexString(value: string | number | BigNumber): string {
        const valueBigNumber = utils.convertAmountToBigNumber(value);
        const hexBase = 16;
        const valueHex = valueBigNumber.toString(hexBase);

        return valueBigNumber.isLessThan(0) ? `-0x${valueHex.substr(1)}` : `0x${valueHex}`;
    },
    numberToHex(value: number): string {
        if (!isFinite(value) && !utils.isHexStrict(value)) {
            throw new Error(`Given input ${value} is not a number.`);
        }

        const valueBigNumber = new BigNumber(value);
        const hexBase = 16;
        const result = valueBigNumber.toString(hexBase);

        return valueBigNumber.lt(0) ? `-0x${result.substr(1)}` : `0x${result}`;
    },
    isHexStrict(hex: string | number): boolean {
        return (
            (_.isString(hex) || _.isNumber(hex)) && /^(-)?0x[0-9a-f]*$/i.test(_.isNumber(hex) ? hex.toString() : hex)
        );
    },
};
