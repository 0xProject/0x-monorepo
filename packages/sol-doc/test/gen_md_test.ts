import { chaiSetup } from '@0x/dev-utils';
import { expect } from 'chai';
import * as _ from 'lodash';

import { FunctionKind, SolidityDocs } from '../src/extract_docs';
import { generateMarkdownFromDocs } from '../src/gen_md';

import { randomContract, randomWord } from './utils/random_docs';

chaiSetup.configure();

// tslint:disable: custom-no-magic-numbers
describe('generateMarkdownFromDocs()', () => {
    const URL_PREFIX = randomWord();
    const DOCS: SolidityDocs = {
        contracts: {
            ..._.mapValues(
                _.groupBy(
                    _.times(_.random(2, 8), () =>
                        ((name: string) => ({ name, ...randomContract(name) }))(`${randomWord()}Contract`),
                    ),
                    'name',
                ),
                g => g[0],
            ),
        },
    };

    let md: string;
    let mdLines: string[];

    function getMarkdownHeaders(level: number): string[] {
        const lines = mdLines.filter(line => new RegExp(`^\\s*#{${level}}[^#]`).test(line));
        // tslint:disable-next-line: no-non-null-assertion
        return lines.map(line => /^\s*#+\s*(.+?)\s*$/.exec(line)![1]);
    }

    function getMarkdownLinks(): string[] {
        const links: string[] = [];
        for (const line of mdLines) {
            const re = /\[[^\]]+\]\(([^)]+)\)/g;
            let m: string[] | undefined | null;
            do {
                m = re.exec(line);
                if (m) {
                    links.push(m[1]);
                }
            } while (m);
        }
        return links;
    }

    before(() => {
        md = generateMarkdownFromDocs(DOCS, { urlPrefix: URL_PREFIX });
        mdLines = md.split('\n');
    });

    it('generates entries for all contracts', () => {
        const headers = getMarkdownHeaders(1);
        for (const [contractName, contract] of Object.entries(DOCS.contracts)) {
            expect(headers).to.include(`${contract.kind} \`${contractName}\``);
        }
    });

    it('generates entries for all enums', () => {
        const headers = getMarkdownHeaders(3);
        for (const contract of Object.values(DOCS.contracts)) {
            for (const enumName of Object.keys(contract.enums)) {
                expect(headers).to.include(`\`${enumName}\``);
            }
        }
    });

    it('generates entries for all structs', () => {
        const headers = getMarkdownHeaders(3);
        for (const contract of Object.values(DOCS.contracts)) {
            for (const structName of Object.keys(contract.structs)) {
                expect(headers).to.include(`\`${structName}\``);
            }
        }
    });

    it('generates entries for all events', () => {
        const headers = getMarkdownHeaders(3);
        for (const contract of Object.values(DOCS.contracts)) {
            for (const event of contract.events) {
                expect(headers).to.include(`\`${event.name}\``);
            }
        }
    });

    it('generates entries for all methods', () => {
        const headers = getMarkdownHeaders(3);
        for (const contract of Object.values(DOCS.contracts)) {
            for (const method of contract.methods) {
                if (method.kind === FunctionKind.Fallback) {
                    expect(headers).to.include(`\`<fallback>\``);
                } else if (method.kind === FunctionKind.Constructor) {
                    expect(headers).to.include(`\`constructor\``);
                } else {
                    expect(headers).to.include(`\`${method.name}\``);
                }
            }
        }
    });

    it('prefixes all URLs with the prefix', () => {
        const urls = getMarkdownLinks();
        for (const url of urls) {
            expect(url.startsWith(URL_PREFIX)).to.be.true();
        }
    });
});
// tslint:disable: max-file-line-count
