const fs = require('fs');
const path = require('path');
const { read } = require('to-vfile');
const remark = require('remark');
const mdx = require('remark-mdx');
const slugify = require('slugify');
const filter = require('unist-util-filter');
const { selectAll } = require('unist-util-select');
const extractMdxMeta = require('extract-mdx-metadata');

function processContentTree(tree: Node[], url: string, meta: Meta, index: any, settings: Settings): void {
    const filteredTree = filter(tree, () => {
        return (node: Node) => node.type === 'heading' || node.type === 'paragraph';
    });

    const textNodes = selectAll('text', filteredTree);

    if (textNodes) {
        const formattedTextNodes = formatTextNodes(textNodes);
        const content = getContent(meta, url, formattedTextNodes);

        setIndexSettings(index, settings);
        pushObjectsToAlgolia(index, content);
    }
}

function setIndexSettings(index: any, settings: Settings): void {
    index.setSettings(settings, (err: string) => {
        if (err) {
            throw Error(`Error: ${err}`);
        }
    });
}

function pushObjectsToAlgolia(index: any, content: Content): void {
    index
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

function getContent(meta: Meta, url: string, formattedTextNodes: FormattedNode[]): any {
    // META SHAPE TOOLS // const { description, difficulty, isCommunity, tags, title, type } = meta;
    // META SHAPE GUIDES // const {  description, difficulty, tags, title, topics } = meta;
    const content: Content[] = [];

    formattedTextNodes.forEach((node: FormattedNode, index: number) => {
        const titleSlug = slugify(meta.title, { lower: true });

        content.push({
            ...meta,
            url,
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
        const { position, value } = textNode;
        const { line } = position.start; // Line at which textnode starts (and for paragraphs, headings, ends).

        const nodeIndex = formattedTextNodes.findIndex((node: FormattedNode) => node.line === line);
        const isIndexPresent = nodeIndex > -1;

        if (isIndexPresent) {
            formattedTextNodes[nodeIndex].textContent += value; // Merge value with existing text at the given line
        } else {
            formattedTextNodes.push({ line, textContent: value }); // Create text and its start line
        }
    });

    return formattedTextNodes;
}

async function processMdxAsync(
    index: any,
    dirPath: string,
    dirName: string,
    fileName: string,
    settings: Settings,
): Promise<void> {
    const filePath = `${dirPath}/${fileName}`;
    const { name } = path.parse(filePath); // Name without file extension
    const url = `/docs/${dirName}/${name}`;

    const rawContent = fs.readFileSync(filePath);
    const file = await read(filePath);
    const meta = await extractMdxMeta(rawContent);

    await remark()
        .use(mdx)
        .use(() => (tree: Node[]) => processContentTree(tree, url, meta, index, settings))
        .process(file);
}

export async function indexFilesAsync(index: any, dirName: string, settings: Settings): Promise<void> {
    const dirPath = `${__dirname}/${dirName}`;

    fs.readdir(dirPath, async (err: string, items: string[]) => {
        for (const fileName of items) {
            await processMdxAsync(index, dirPath, dirName, fileName, settings);
        }
    });
}

interface Meta {
    title: string;
    description: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    isCommunity?: boolean;
    isFeatured?: boolean;
    tags: string[];
    topics: string[];
    type: string;
}

interface Content extends Meta {
    url: string;
    textContent: string;
    id: string;
    objectID: string;
}

interface Settings {
    distinct: boolean;
    attributeForDistinct: string;
    attributesForFaceting: string[];
    attributesToSnippet: string[];
    searchableAttributes: string[];
    snippetEllipsisText: string;
}

interface FormattedNode {
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
    [key: string]: unknown;
}
