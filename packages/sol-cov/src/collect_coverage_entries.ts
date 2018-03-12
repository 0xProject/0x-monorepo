import * as ethUtil from 'ethereumjs-util';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import * as SolidityParser from 'solidity-parser-sc';

import { ASTVisitor, CoverageEntriesDescription } from './ast_visitor';
import { getLocationByOffset } from './source_maps';

// Parsing source code for each transaction/code is slow and therefore we cache it
const coverageEntriesBySourceHash: { [sourceHash: string]: CoverageEntriesDescription } = {};

export const collectCoverageEntries = (contractSource: string, fileName: string) => {
    const sourceHash = ethUtil.sha3(contractSource).toString('hex');
    if (_.isUndefined(coverageEntriesBySourceHash[sourceHash])) {
        const ast = SolidityParser.parse(contractSource);
        const locationByOffset = getLocationByOffset(contractSource);
        const astVisitor = new ASTVisitor(locationByOffset);
        astVisitor.walkAST(ast);
        coverageEntriesBySourceHash[sourceHash] = astVisitor.getCollectedCoverageEntries();
    }
    const coverageEntriesDescription = coverageEntriesBySourceHash[sourceHash];
    return coverageEntriesDescription;
};
