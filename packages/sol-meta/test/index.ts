import * as chai from 'chai';
import * as fs from 'fs';
import * as glob from 'glob';
import * as _ from 'lodash';
import 'mocha';
import * as pathUtils from 'path';
import * as S from 'solidity-parser-antlr';

import { mockContract } from '../src/contract_mocker';
import { parse } from '../src/parser';
import { compile } from '../src/solc_wrapper';
import { readSources, SourceCollection } from '../src/source_reader';
import { unparse } from '../src/unparser';

const expect = chai.expect;

const findContracts = (searchPath: string) =>
    glob.sync(searchPath).map(file => ({
        name: pathUtils.basename(file, '.sol'),
        source: fs.readFileSync(file, 'utf8'),
    }));

const contracts = findContracts('../contracts/contracts/**/*.sol');

describe('Parser', () => {
    it('should have test contracts', () => {
        const MINIMUM_CONTRACTS_FOR_TESTS = 10;
        expect(contracts).to.have.lengthOf.above(MINIMUM_CONTRACTS_FOR_TESTS);
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
            parse(src);
            // Ideally, we would test the following:
            //     expect(parse(src)).to.deep.equal(ast);
            // But this fails on on expressiong like `2 * 3 + 1` which get rewritten
            // to `((2 * 2) + 1)`. This prevents the ASTs from being identicall in
            // syntax, even though they should be identical in meaning.
        }),
    );
});

describe('Mocker', () => {
    const sourcePath = '../contracts/contracts/protocol/Exchange/';
    const toMock = ['Exchange', 'MixinExchangeCore', 'MixinSignatureValidator', 'MixinWrapperFunctions'];
    const path = (name: string) => `${sourcePath}/${name}.sol`;
    let sources: SourceCollection;
    const mocks: { [name: string]: S.SourceUnit } = {};

    it('should read sources', async () => {
        sources = await readSources(_.map(toMock, path));
        _.map(toMock, name => expect(_.keys(sources).some(absPath => absPath.endsWith(`${name}.sol`))));
    });
    _.map(toMock, name =>
        it(`should generate mocks for ${name}`, () => {
            mocks[name] = mockContract(
                sources,
                _.keys(sources).find(absPath => absPath.endsWith(`${name}.sol`)) || '',
                name,
                {
                    constructors: {
                        LibConstants: ['"ZRXASSETSTRING"'],
                        Exchange: ['"ZRXASSETSTRING"'],
                    },
                    scripted: {},
                },
            );
        }),
    );
    // Note(recmo): These tests are slow
    const MAX_TIME_MILLISECONDS = 60000;
    describe.skip('Compiling', () =>
        _.map(toMock, name =>
            it(`should compile mock for ${name}`, async () => {
                await compile(sources, mocks[name]);
            }).timeout(MAX_TIME_MILLISECONDS),
        ));
});
