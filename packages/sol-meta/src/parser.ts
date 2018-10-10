import * as parser from 'solidity-parser-antlr';

export const parse = (source) => parser.parse(source, {});
