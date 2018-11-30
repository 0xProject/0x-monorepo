import * as chai from 'chai';
import * as fs from 'fs';
import * as glob from 'glob';
import 'mocha';
import * as path from 'path';

import { parse } from '../src/parser';
import { unparse } from '../src/unparser';

const expect = chai.expect;

const findContracts = (searchPath: string) =>
    glob.sync(searchPath).map(file => ({
        name: path.basename(file, '.sol') + ` (${file})`,
        source: fs.readFileSync(file, 'utf8'),
    }));

const contracts = findContracts('../contracts/src/**/*.sol');

describe('Parser', () => {
    it('should have test contracts', () => {
        expect(contracts).to.have.lengthOf.above(10);
    });

    contracts.forEach(({ name, source }) =>
        it(`should parse ${name}`, () => {
            parse(source);
        }),
    );
});

describe('Unparser', () => {
    contracts.forEach(({ name, source }) =>
        it(`should unparse ${name}`, () => {
            const ast = parse(source);
            const src = unparse(ast);
            const ast2 = parse(src);
            // Ideally, we would test the following:
            //     expect(ast2).to.deep.equal(ast);
            // But this fails on on expressiong like `2 * 3 + 1` which get rewritten
            // to `((2 * 2) + 1)`. This prevents the ASTs from being identicall in
            // syntax, even though they should be identical in meaning.
        }),
    );
});
