import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';
import * as parser from 'solidity-parser-antlr';

import { ASTVisitor, CoverageEntriesDescription } from './ast_visitor';
import { getLocationByOffset } from './source_maps';

// Parsing source code for each transaction/code is slow and therefore we cache it
const coverageEntriesBySourceHash: { [sourceHash: string]: CoverageEntriesDescription } = {};

export const collectCoverageEntries = (contractSource: string) => {
    const sourceHash = ethUtil.sha3(contractSource).toString('hex');
    if (_.isUndefined(coverageEntriesBySourceHash[sourceHash])) {
        const ast = parser.parse(contractSource, { range: true });
        const locationByOffset = getLocationByOffset(contractSource);
        const visitor = new ASTVisitor(locationByOffset);
        parser.visit(ast, visitor);
        coverageEntriesBySourceHash[sourceHash] = visitor.getCollectedCoverageEntries();
    }
    const coverageEntriesDescription = coverageEntriesBySourceHash[sourceHash];
    return coverageEntriesDescription;
};
