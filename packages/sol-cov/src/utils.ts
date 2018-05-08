import { LineColumn, SingleFileSourceRange } from './types';

export const utils = {
    compareLineColumn(lhs: LineColumn, rhs: LineColumn): number {
        return lhs.line !== rhs.line ? lhs.line - rhs.line : lhs.column - rhs.column;
    },
    removeHexPrefix(hex: string): string {
        const hexPrefix = '0x';
        return hex.startsWith(hexPrefix) ? hex.slice(hexPrefix.length) : hex;
    },
    isRangeInside(childRange: SingleFileSourceRange, parentRange: SingleFileSourceRange): boolean {
        return (
            utils.compareLineColumn(parentRange.start, childRange.start) <= 0 &&
            utils.compareLineColumn(childRange.end, parentRange.end) <= 0
        );
    },
};
