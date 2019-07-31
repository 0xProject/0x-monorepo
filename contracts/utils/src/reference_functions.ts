import { AnyRevertError, BigNumber, SafeMathRevertErrors } from '@0x/utils';

const MAX_UINT256 = new BigNumber(2).pow(256).minus(1);

export function safeAdd(a: BigNumber, b: BigNumber): BigNumber {
    const r = a.plus(b);
    if (r.isGreaterThan(MAX_UINT256)) {
        throw new SafeMathRevertErrors.SafeMathError(
            SafeMathRevertErrors.SafeMathErrorCodes.Uint256AdditionOverflow,
            a,
            b,
        );
    }
    return r;
}

export function safeSub(a: BigNumber, b: BigNumber): BigNumber {
    const r = a.minus(b);
    if (r.isLessThan(0)) {
        throw new SafeMathRevertErrors.SafeMathError(
            SafeMathRevertErrors.SafeMathErrorCodes.Uint256SubtractionUnderflow,
            a,
            b,
        );
    }
    return r;
}

export function safeMul(a: BigNumber, b: BigNumber): BigNumber {
    const r = a.times(b);
    if (r.isGreaterThan(MAX_UINT256)) {
        // Solidity implementation does not throw a reason.
        throw new AnyRevertError();
    }
    return r;
}

export function safeDiv(a: BigNumber, b: BigNumber): BigNumber {
    if (b.isEqualTo(0)) {
        // Solidity implementation does not throw a reason.
        throw new AnyRevertError();
    }
    return a.dividedToIntegerBy(b);
}
