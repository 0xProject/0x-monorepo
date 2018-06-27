import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';
import * as parser from 'solidity-parser-antlr';

import { ASTVisitor, CoverageEntriesDescription } from './ast_visitor';
import { getLocationByOffset } from './source_maps';

const IGNORE_RE = /\/\*\s*solcov\s+ignore\s+next\s*\*\/\s*/gm;

// Parsing source code for each transaction/code is slow and therefore we cache it
const coverageEntriesBySourceHash: { [sourceHash: string]: CoverageEntriesDescription } = {};

export const collectCoverageEntries = (contractSource: string) => {
    const sourceHash = ethUtil.sha3(contractSource).toString('hex');
    if (_.isUndefined(coverageEntriesBySourceHash[sourceHash]) && !_.isUndefined(contractSource)) {
        const ast = parser.parse(contractSource, { range: true });
        const locationByOffset = getLocationByOffset(contractSource);
        const ignoreRangesBegingingAt = gatherRangesToIgnore(contractSource);
        const visitor = new ASTVisitor(locationByOffset, ignoreRangesBegingingAt);
        parser.visit(ast, visitor);
        coverageEntriesBySourceHash[sourceHash] = visitor.getCollectedCoverageEntries();
    }
    const coverageEntriesDescription = coverageEntriesBySourceHash[sourceHash];
    return coverageEntriesDescription;
};

// Gather the start index of all code blocks preceeded by "/* solcov ignore next */"
function gatherRangesToIgnore(contractSource: string): number[] {
    const ignoreRangesStart = [];

    let match;
    do {
        match = IGNORE_RE.exec(contractSource);
        if (match) {
            const matchLen = match[0].length;
            ignoreRangesStart.push(match.index + matchLen);
        }
    } while (match);

    return ignoreRangesStart;
}
