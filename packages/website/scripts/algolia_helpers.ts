import { ObjectMap } from '@0x/types';
import * as compareVersions from 'compare-versions';
import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';
import slugify from 'slugify';

import { getNameToSearchIndex } from '../ts/utils/algolia_constants';

import { adminClient } from './algolia_admin_client';

// Note (piotr): can't find type definitions for these
const stringify = require('json-stringify-pretty-compact');
const remark = require('remark');
const mdx = require('remark-mdx');
const slug = require('remark-slug');
const { read } = require('to-vfile');
const findAfter = require('unist-util-find-after');
const modifyChildren = require('unist-util-modify-children');
const { selectAll } = require('unist-util-select');

const meta = require('../ts/utils/algolia_meta.json');

export interface IAlgoliaSettings {
    distinct: boolean;
    attributeForDistinct: string;
    attributesForFaceting: string[];
    attributesToSnippet: string[];
    searchableAttributes: string[];
    snippetEllipsisText: string;
}

const sharedSettings = {
    distinct: true,
    attributeForDistinct: 'id',
    attributesForFaceting: [''],
    attributesToSnippet: ['description:20', 'textContent:20'], // attribute:nbWords (number of words to show in a snippet)
    searchableAttributes: ['title', 'textContent'],
    snippetEllipsisText: '…',
};

const settings: ObjectMap<IAlgoliaSettings> = {
    apiExplorer: sharedSettings,
    coreConcepts: sharedSettings,
    guides: {
        ...sharedSettings,
        attributesForFaceting: ['topics', 'difficulty'],
    },
    tools: {
        ...sharedSettings,
        attributesForFaceting: ['type', 'tags', 'difficulty', 'isCommunity'],
    },
};

export async function indexFilesAsync(indexName: string, environment: string): Promise<void> {
    const nameToFile = getNameToFile(indexName); // Get file objects processed to get their meta information (name, path, versions, etc.)

    const nameToSearchIndex = getNameToSearchIndex(environment);
    const algoliaIndex = adminClient.initIndex(nameToSearchIndex[indexName]);
    const algoliaSettings = settings[indexName];

    await clearIndexAsync(algoliaIndex);
    await setIndexSettingsAsync(algoliaIndex, algoliaSettings);

    for (const name of Object.keys(meta[indexName])) {
        const metadata = meta[indexName][name];
        const file = nameToFile[name];

        const isMDX = file !== undefined && file.path !== undefined;
        if (isMDX) {
            updateMetaFile(file, indexName); // Update the meta file shared between algolia and the page rendering the mdx content on the client
            await processMdxAsync(algoliaIndex, file, indexName);
        } else {
            const titleSlug = slugify(metadata.title, { lower: true });
            const content = {
                ...metadata,
                externalUrl: metadata.externalUrl,
                id: titleSlug,
                objectID: titleSlug,
            };
            await pushObjectsToAlgoliaAsync(algoliaIndex, [content]);
        }
    }
}

function getNameToFile(dirName: string): ObjectMap<File> {
    const dirPath = path.join(__dirname, `../../mdx/${dirName}`);
    const paths = glob.sync(`${dirPath}/**/*.mdx`);
    const nameToFile: ObjectMap<File> = {};

    for (const p of paths) {
        if (dirName === 'tools') {
            const name = path.basename(path.join(p, '../../'));
            const version = path.basename(path.dirname(p));
            const url = `/docs/tools/${name}/${version}`;

            const fileIfExists = nameToFile[name];

            const fileObject = { name, path: p, version, versions: [version], url };

            if (fileIfExists !== undefined) {
                if (compareVersions.compare(version, fileIfExists.version, '>')) {
                    const versions = [...fileIfExists.versions, version]; // Add current version to versions array
                    nameToFile[name] = { ...fileObject, versions };
                }
            } else {
                nameToFile[name] = fileObject;
            }
        }

        if (dirName === 'guides') {
            const { name } = path.parse(p);
            const url = `/docs/guides/${name}`;
            nameToFile[name] = { name, path: p, url };
        }

        if (dirName === 'coreConcepts' || dirName === 'apiExplorer') {
            const url = `/docs/${dirName}`;
            nameToFile[dirName] = { name: dirName, path: p, url };
        }
    }

    return nameToFile;
}

function updateMetaFile(file: File, indexName: string): void {
    const [_, relativePath] = file.path.split('mdx/');
    meta[indexName][file.name].path = relativePath;

    if (file.versions) {
        const versionsSortedDesc = file.versions.sort(compareVersions).reverse();
        meta[indexName][file.name].versions = versionsSortedDesc;
    }

    fs.writeFileSync(path.join(__dirname, 'algolia_meta.json'), stringify(meta, { replacer: null, indent: 4 }));
}

async function processMdxAsync(algoliaIndex: any, file: File, indexName: string): Promise<void> {
    const content = await read(file.path);

    await remark()
        .use(slug) // slugify heading text as ids
        .use(mdx)
        .use(() => async (tree: Node[]) => {
            await processContentTreeAsync(tree, file, algoliaIndex, indexName);
        })
        .process(content);
}

async function processContentTreeAsync(tree: Node[], file: File, algoliaIndex: any, indexName: string): Promise<void> {
    const modify = modifyChildren(modifier);
    // We first modify the tree to get slugified ids from headings to all text nodes
    // This is done to be able to link to a certain section in a doc after clicking a search suggestion
    modify(tree);
    // Get all text nodes. I.e. 'heading', 'paragraph', 'list' all can have (nested) child text nodes
    const textNodes = selectAll('text', tree);

    if (textNodes) {
        // Combines text nodes that exist on the same line. I.e. if a paragraph
        // contains 7 text nodes it combines them into 1. This makes text snippets
        // in algolia more descriptive.
        const formattedTextNodes = formatTextNodes(textNodes);
        // Adds meta and formats information on all formatted text nodes
        const content = getContent(file, formattedTextNodes, indexName);

        await pushObjectsToAlgoliaAsync(algoliaIndex, content);
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

function addHashToChildren(item: Node, start: Node): void {
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

async function setIndexSettingsAsync(algoliaIndex: any, algoliaSettings: IAlgoliaSettings): Promise<void> {
    await algoliaIndex.setSettings(algoliaSettings, (err: string) => {
        if (err) {
            throw Error(`Error setting index settings: ${err}`);
        }
    });
}

async function pushObjectsToAlgoliaAsync(algoliaIndex: any, content: Content[]): Promise<void> {
    await algoliaIndex
        .saveObjects(content)
        .then(({ objectIDs }: { objectIDs: string[] }) =>
            console.log(
                `✨ Pushed content to Algolia with Object IDs ${objectIDs[0]} to ${objectIDs[objectIDs.length - 1]}`,
            ),
        )
        .catch((err: string) => {
            throw Error(`Error pushing objects to Algolia: ${err}`);
        });
}

async function clearIndexAsync(algoliaIndex: any): Promise<void> {
    await algoliaIndex.clearIndex((err: string, content: any) => {
        if (err) {
            throw Error(`Error clearing Algolia index: ${err}`);
        }
    });
}

function getContent(file: File, formattedTextNodes: FormattedNode[], indexName: string): Content[] {
    const { name, url } = file;
    const metaData: Meta = meta[indexName][name];
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

interface File {
    name: string;
    path: string;
    version?: string;
    versions?: string[];
    url: string;
}

interface Meta {
    description: string;
    title: string;
    subtitle?: string;
    difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
    isCommunity?: boolean;
    isFeatured?: boolean;
    keywords?: string;
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
