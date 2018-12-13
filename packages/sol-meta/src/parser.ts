import * as parser from 'solidity-parser-antlr';

export const parse = (source: string): parser.SourceUnit => parser.parse(source, {});

// TODO(recmo): Replace [] with empty parameter list on modifiers
// TODO(recmo): Push these fixes to upstream and remove them here.
