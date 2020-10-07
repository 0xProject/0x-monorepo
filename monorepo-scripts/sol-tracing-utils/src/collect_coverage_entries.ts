import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';
import * as parser from 'solidity-parser-antlr';

import { ASTVisitor, CoverageEntriesDescription } from './ast_visitor';
import { getOffsetToLocation } from './source_maps';

// Parsing source code for each transaction/code is slow and therefore we cache it
const sourceHashToCoverageEntries: { [sourceHash: string]: CoverageEntriesDescription } = {};

export const collectCoverageEntries = (contractSource: string, ignoreRegexp?: RegExp) => {
    const sourceHash = ethUtil.sha3(contractSource).toString('hex');
    if (sourceHashToCoverageEntries[sourceHash] === undefined && contractSource !== undefined) {
        const ast = parser.parse(contractSource, { range: true });
        const offsetToLocation = getOffsetToLocation(contractSource);
        const ignoreRangesBeginningAt =
            ignoreRegexp === undefined ? [] : gatherRangesToIgnore(contractSource, ignoreRegexp);
        const visitor = new ASTVisitor(offsetToLocation, ignoreRangesBeginningAt);
        parser.visit(ast, visitor);
        sourceHashToCoverageEntries[sourceHash] = visitor.getCollectedCoverageEntries();
    }
    const coverageEntriesDescription = sourceHashToCoverageEntries[sourceHash];
    return coverageEntriesDescription;
};

// Gather the start index of all code blocks preceeded by "/* solcov ignore next */"
function gatherRangesToIgnore(contractSource: string, ignoreRegexp: RegExp): number[] {
    const ignoreRangesStart = [];

    let match;
    do {
        match = ignoreRegexp.exec(contractSource);
        if (match) {
            const matchLen = match[0].length;
            ignoreRangesStart.push(match.index + matchLen);
        }
    } while (match);

    return ignoreRangesStart;
}
