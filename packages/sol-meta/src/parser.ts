import * as parser from 'solidity-parser-antlr';

export const parse = (source: string): parser.SourceUnit => parser.parse(source, {});

// TODO: Replace [] with empty parameter list on modifiers
// TODO:
// TODO: Push these fixes to upstream and remove them here.
