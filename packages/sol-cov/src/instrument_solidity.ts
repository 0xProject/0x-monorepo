import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import * as SolidityParser from 'solidity-parser-sc';

import { ASTVisitor, CoverageEntriesDescription } from './ast_visitor';
import { getLocationByOffset } from './source_maps';

export const collectCoverageEntries = (contractSource: string, fileName: string) => {
    const ast = SolidityParser.parse(contractSource);
    const locationByOffset = getLocationByOffset(contractSource);
    const astVisitor = new ASTVisitor(locationByOffset);
    astVisitor.walkAST(ast);
    const coverageEntries = astVisitor.getCollectedCoverageEntries();
    return coverageEntries;
};
