import * as compareVersions from 'compare-versions';
import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';
import slugify from 'slugify';

import { adminClient, IAlgoliaSettings, searchIndices, settings } from './algolia_constants';
const meta = require('./algolia_meta.json');

// Note (piotr): can't find type definitions for these
const stringify = require('json-stringify-pretty-compact');
const remark = require('remark');
const mdx = require('remark-mdx');
const slug = require('remark-slug');
const { read } = require('to-vfile');
const findAfter = require('unist-util-find-after');
const modifyChildren = require('unist-util-modify-children');
const { selectAll } = require('unist-util-select');

function processContentTree(tree: Node[], file: any, indexName: string): void {
    const modify = modifyChildren(modifier);
    // We first modify the tree to get slugified ids from headings to all text nodes
    modify(tree);
    // Get all text nodes. I.e. 'heading', 'paragraph', 'list' all can have (nested) child text nodes
    const textNodes = selectAll('text', tree);

    if (textNodes) {
        const formattedTextNodes = formatTextNodes(textNodes);
        const content = getContent(file, formattedTextNodes);

        const algoliaIndex = adminClient.initIndex(searchIndices[indexName]);
        const algoliaSettings = settings[indexName];

        // setIndexSettings(algoliaIndex, algoliaSettings);
        // pushObjectsToAlgolia(algoliaIndex, content);
    }
}

function modifier(node: Node, index: number, parent: Node): void {
    if (node.type === 'heading') {
        const start = node;
        const isEnd = (node: Node) => node.type === 'heading' && node.depth <= start.depth;
        const end = findAfter(parent, start, isEnd);

        const startIndex = parent.children.indexOf(start);
        const endIndex = parent.children.indexOf(end);
        // Find all nodes between and including the heading and all nodes before the next heading
        const between = parent.children.slice(startIndex, endIndex > 0 ? endIndex : undefined);
        // We add the id of the heading as hash part of the url to all text nodes
        for (const item of between) {
            addHashToChildren(item, start);
        }
    }
}

function addHashToChildren(item: any, start: any): void {
    if (item.children) {
        for (const child of item.children) {
            if (child.type === 'text') {
                child.data = child.data || {};
                child.data.hash = `#${start.data.id}`;
            }
            addHashToChildren(child, start);
        }
    }
}

function setIndexSettings(algoliaIndex: any, algoliaSettings: IAlgoliaSettings): void {
    algoliaIndex.setSettings(algoliaSettings, (err: string) => {
        if (err) {
            throw Error(`Error: ${err}`);
        }
    });
}

function pushObjectsToAlgolia(algoliaIndex: any, content: Content): void {
    algoliaIndex
        .saveObjects(content)
        .then(({ objectIDs }: { objectIDs: string[] }) =>
            console.log(
                `✨ Pushed content to Algolia with Object IDs ${objectIDs[0]} to ${objectIDs[objectIDs.length - 1]}`,
            ),
        )
        .catch((err: string) => {
            throw Error(`Error: ${err}`);
        });
}

function getContent(file: any, formattedTextNodes: FormattedNode[]): any {
    const { name, url }: { name: string; url: string } = file;
    const metaData: Meta = meta[name];
    const content: Content[] = [];

    formattedTextNodes.forEach((node: FormattedNode, index: number) => {
        const titleSlug = slugify(metaData.title, { lower: true });

        content.push({
            ...metaData,
            url,
            urlWithHash: url + node.hash,
            hash: node.hash,
            textContent: node.textContent,
            id: titleSlug,
            objectID: `${titleSlug}_${index}`,
        });
    });

    return content;
}

function formatTextNodes(textNodes: Node[]): FormattedNode[] {
    const formattedTextNodes: FormattedNode[] = []; // array structure: [ { line: [LINE_NUMBER], textContent: [MERGED_TEXT_VALUE] } ]

    textNodes.map((textNode: Node) => {
        const { data, position, value } = textNode;
        // If data (hash) is not present on the node it means that the text node occurs before any headings. I.e. in an intro text without a heading.
        const hash = data ? data.hash : '';

        const { line } = position.start; // Line at which textnode starts (and for paragraphs, headings, ends).

        const nodeIndex = formattedTextNodes.findIndex((node: FormattedNode) => node.line === line);
        const isIndexPresent = nodeIndex > -1;

        if (isIndexPresent) {
            formattedTextNodes[nodeIndex].textContent += value; // Merge value with existing text at the given line
        } else {
            formattedTextNodes.push({ line, hash, textContent: value }); // Create text, hash part of the url, and its start line
        }
    });

    return formattedTextNodes;
}

async function processMdxAsync(indexName: any, file: any): Promise<void> {
    const content = await read(file.path);

    await remark()
        .use(slug) // slugify heading text as ids
        .use(mdx)
        .use(() => (tree: Node[]) => processContentTree(tree, file, indexName))
        .process(content);
}

function getFiles(dirName: string): any {
    const dirPath = path.join(__dirname, `../../mdx/${dirName}`);
    const files = glob.sync(dirPath + '/**/*.mdx');
    const processedFiles: any[] = [];

    for (const file of files) {
        if (dirName === 'tools') {
            const name = path.basename(path.join(file, '../../'));
            const version = path.basename(path.dirname(file));
            const url = `/docs/tools/${name}/${version}`;

            const fileIndex = processedFiles.findIndex((tool: any) => tool.name === name);
            const isIndexPresent = fileIndex > -1;

            const fileObject = { name, path: file, version, versions: [version], url };

            if (isIndexPresent) {
                if (compareVersions.compare(version, processedFiles[fileIndex].version, '>')) {
                    const versions = [...processedFiles[fileIndex].versions, version];
                    processedFiles[fileIndex] = { ...fileObject, versions };
                }
            } else {
                processedFiles.push(fileObject);
            }
        }

        if (dirName === 'guides') {
            const { name } = path.parse(file);
            const url = `/docs/guides/${name}`;
            processedFiles.push({ name, path: file, url });
        }

        if (dirName === 'core-concepts' || dirName === 'api-explorer') {
            const url = `/docs/${dirName}`;
            processedFiles.push({ name: dirName, path: file, url });
        }
    }

    return processedFiles;
}

function updateMetaFile(file: any): void {
    const [_, relativePath] = file.path.split('mdx/');
    meta[file.name].path = relativePath;

    if (file.versions) {
        const versionsSortedDesc = file.versions.sort(compareVersions).reverse();
        meta[file.name].versions = versionsSortedDesc;
    }

    fs.writeFileSync(path.join(__dirname, 'algolia_meta.json'), stringify(meta, { replacer: null, indent: 4 }));
}

export async function indexFilesAsync(indexName: string): Promise<void> {
    const files = getFiles(indexName);

    for (const file of files) {
        updateMetaFile(file);
        await processMdxAsync(indexName, file);
    }
}

interface Meta {
    description: string;
    title: string;
    subtitle?: string;
    difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
    isCommunity?: boolean;
    isFeatured?: boolean;
    tags?: string[];
    topics?: string[];
    type?: string;
}

interface Content extends Meta {
    url: string;
    urlWithHash: string;
    hash: string;
    textContent: string;
    id: string;
    objectID: string;
}

interface FormattedNode {
    hash: string;
    line: number;
    textContent: string;
}

// Syntactic units in unist syntax trees are called nodes.
interface Node {
    type: string;
    children?: Node[];
    data?: Data;
    depth?: number;
    lang?: string;
    ordered?: boolean;
    position?: Position;
    spread?: boolean;
    value?: string;
}

// Location of a node in a source file.
interface Position {
    start: Point; // Place of the first character of the parsed source region.
    end: Point; // Place of the first character after the parsed source region.
    indent: number[]; // Start column at each index (plus start line) in the source region
}

// One place in a source file.
interface Point {
    line: number; // Line in a source file (1-indexed integer).
    column: number; // Column in a source file (1-indexed integer).
    offset: number; // Character in a source file (0-indexed integer).
}

// Information associated by the ecosystem with the node.
// Space is guaranteed to never be specified by unist or specifications
// implementing unist.
interface Data {
    [key: string]: any;
}
