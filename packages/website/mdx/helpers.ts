const fs = require('fs');
const path = require('path');
const { read } = require('to-vfile');
const remark = require('remark');
const mdx = require('remark-mdx');
const filter = require('unist-util-filter');
const { selectAll } = require('unist-util-select');
const extractMdxMeta = require('extract-mdx-metadata');

function processContentTree(tree: any, url: any, meta: any, index: any): void {
    const filteredTree = filter(tree, () => {
        return (node: any) => node.type === 'heading' || node.type === 'paragraph';
    });

    const textNodes = selectAll('text', filteredTree);

    if (textNodes) {
        const formattedTextNodes = formatTextNodes(textNodes);
        const content = getContent(meta, url, formattedTextNodes);

        pushObjectsToAlgolia(index, content);
    }
}

export function setIndexSettings(index: any, settings: any): void {
    index.setSettings(settings, (err: any) => {
        if (err) {
            throw Error(`Error: ${err}`);
        }
    });
}

function pushObjectsToAlgolia(index: any, content: any): void {
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

function getContent(meta: any, url: string, formattedTextNodes: string[]): any {
    // META SHAPE TOOLS // const { description, difficulty, id, isCommunity, tags, title, type } = meta;
    // META SHAPE GUIDES // const {  description, difficulty, id, tags, title, topics } = meta;
    const content: any = [];

    formattedTextNodes.forEach((node: any, index: any) => {
        content.push({
            ...meta,
            url,
            textContent: node.textContent,
            objectID: `${meta.id}_${index}`,
        });
    });

    return content;
}

function formatTextNodes(textNodes: any): string[] {
    const formattedTextNodes: any = []; // array structure: [ { line: [LINE_NUMBER], textContent: [MERGED_TEXT_VALUE] } ]

    textNodes.map((textNode: any) => {
        const { position, value } = textNode;
        const { line } = position.start; // Line at which textnode starts (and for paragraphs, headings, ends).

        const nodeIndex = formattedTextNodes.findIndex((node: any) => node.line === line);
        const isIndexPresent = nodeIndex > -1;

        if (isIndexPresent) {
            formattedTextNodes[nodeIndex].textContent += value; // Merge value with existing text at the given line
        } else {
            formattedTextNodes.push({ line, textContent: value }); // Create text and its start line
        }
    });

    return formattedTextNodes;
}

async function processMdxAsync(index: any, dirName: any, fileName: any): Promise<void> {
    const filePath = `${dirName}/${fileName}`;
    const { name } = path.parse(filePath); // Name without file extension
    const url = `/docs/${dirName}/${name}`;

    const rawContent = fs.readFileSync(filePath);
    const file = await read(filePath);
    const meta = await extractMdxMeta(rawContent);

    await remark()
        .use(mdx)
        .use(() => (tree: any) => processContentTree(tree, url, meta, index))
        .process(file);
}

export async function indexFiles(index: any, dirName: string): Promise<void> {
    fs.readdir(dirName, async (err: string, items: any) => {
        // @ts-ignore
        for (const fileName of items) {
            await processMdxAsync(index, dirName, fileName);
        }
    });
}
