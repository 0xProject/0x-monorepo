import * as commandLineArgs from 'command-line-args';

const optionDefinitions = [{ name: 'script', alias: 's', type: String }];

export const cli = commandLineArgs(optionDefinitions);
