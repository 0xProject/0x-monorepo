import { SourceRange, SourceSnippet } from './types';
import { utils } from './utils';

/**
 * Gets the source range snippet by source range to be used by revert trace.
 * @param sourceRange source range
 * @param sourceCode source code
 */
export function getSourceRangeSnippet(sourceRange: SourceRange, sourceCode: string): SourceSnippet {
    const sourceCodeInRange = utils.getRange(sourceCode, sourceRange.location);
    return {
        range: sourceRange.location,
        source: sourceCodeInRange,
        fileName: sourceRange.fileName,
    };
}
