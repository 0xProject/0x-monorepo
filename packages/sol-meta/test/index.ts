import * as chai from 'chai';
import 'mocha';
import * as glob from 'glob';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from '../src/parser';
import { unparse } from '../src/unparser';

const expect = chai.expect;

const promisify = (func) => (...args) =>
    new Promise((resolve, reject) => 
        func(...args, (error, result) => 
            error ? reject(error) : resolve(result)));

const findContracts = searchPath => 
    glob.sync(searchPath).map(file => ({
        name: path.basename(file, '.sol') + ` (${file})`,
        source: fs.readFileSync(file, 'utf8')
    }));

const contracts = findContracts('../contracts/src/**/*.sol');

describe('Parser', () => {
    
    it('should have test contracts', () => {
        expect(contracts).to.have.lengthOf.above(10);
    });
    
    contracts.forEach(({name, source}) =>
        it(`should parse ${name}`, () => {
            parse(source);
        })
    );
    
});

describe.only('Unparser', () => {
    
    contracts.forEach(({name, source}) =>
        it(`should unparse ${name}`, () => {
            const ast = parse(source);
            const src = unparse(ast) ;
            const ast2 = parse(src);
            //expect(ast2).to.deep.equal(ast);
        })
    );
})
