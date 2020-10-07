import { logUtils } from '@0x/utils';
import * as fs from 'fs';
import * as glob from 'glob';
import 'source-map-support/register';
import { promisify } from 'util';
import * as yargs from 'yargs';

import { extractDocsAsync } from './extract_docs';
import { generateMarkdownFromDocs } from './gen_md';
import { transformDocs } from './transform_docs';

const JSON_TAB_WIDTH = 2;

(async () => {
    const argv = yargs
        .option('source', {
            type: 'string',
            array: true,
            description: 'glob paths of source files to compile',
            demandOption: true,
        })
        .option('contract', {
            type: 'string',
            array: true,
            description: 'generate docs for only a contract',
        })
        .option('complete', {
            type: 'boolean',
            description: 'generate docs for all contracts and private methods',
        })
        .option('noFlatten', {
            type: 'boolean',
            description: 'do not merge inherited contracts',
        })
        .option('json', {
            type: 'string',
            description: 'file to save JSON to',
        })
        .option('root', {
            type: 'string',
            array: true,
            description: 'rewrite paths as relative to these directory',
        })
        .option('md', {
            type: 'string',
            description: 'file to save markdown to',
        })
        .option('mdUrlPrefix', {
            type: 'string',
            description: 'prefix for markdown links',
        })
        .help().argv;
    const sources = await getContractsAsync(argv.source);
    if (!sources.length) {
        throw new Error('no sources found');
    }
    const docs = transformDocs(await extractDocsAsync(sources, argv.root), {
        onlyExposed: !argv.complete,
        flatten: !argv.noFlatten,
        contracts: argv.contract,
    });
    if (argv.json) {
        await writeTextFileAsync(argv.json, JSON.stringify(docs, null, JSON_TAB_WIDTH));
    }
    if (argv.md) {
        await writeTextFileAsync(argv.md, generateMarkdownFromDocs(docs, { urlPrefix: argv.mdUrlPrefix }));
    }
})().catch(err => {
    logUtils.warn(err);
    process.exit(1);
});

async function getContractsAsync(contractsGlobs: string[]): Promise<string[]> {
    let sources: string[] = [];
    for (const g of contractsGlobs) {
        sources = [...sources, ...(await promisify(glob)(g))];
    }
    return sources;
}

async function writeTextFileAsync(file: string, content: string): Promise<void> {
    return promisify(fs.writeFile)(file, content, { encoding: 'utf-8' });
}
