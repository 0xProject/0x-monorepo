const fs = require('fs');
const path = require('path');
const { read } = require('to-vfile');
const remark = require('remark');
const mdx = require('remark-mdx');
const filter = require('unist-util-filter');
const { selectAll } = require('unist-util-select');
const extractMdxMeta = require('extract-mdx-metadata');

function processContentTree(tree, url, meta, index) {
  const filteredTree = filter(tree, node => {
    return node => node.type === 'heading' || node.type === 'paragraph';
  });

  const textNodes = selectAll('text', filteredTree);

  if (textNodes) {
    const formattedTextNodes = formatTextNodes(textNodes);
    const content = getContent(meta, url, formattedTextNodes);

    pushObjectsToAlgolia(index, content);
  }
}

function setIndexSettings(index, settings) {
  index.setSettings(settings, (err, content) => {
    if (err) console.error(`Error: ${err}`);
  });
}

function pushObjectsToAlgolia(index, content) {
  index
    .saveObjects(content)
    .then(({ objectIDs }) =>
      console.log(
        'Pushed content to Algolia with Object IDs:' + objectIDs.join(', ')
      )
    )
    .catch(err => console.error(`Error: ${err}`));
}

function getContent(meta, url, formattedTextNodes) {
  // META SHAPE TOOLS // const { description, difficulty, id, isCommunity, tags, title, type } = meta;
  // META SHAPE GUIDES // const {  description, difficulty, id, tags, title, topics } = meta;
  let content = [];

  formattedTextNodes.forEach((node, index) => {
    content.push({
      ...meta,
      url,
      textContent: node.textContent,
      objectID: `${meta.id}_${index}`
    });
  });

  return content;
}

function formatTextNodes(textNodes) {
  const formattedTextNodes = []; // array structure: [ { line: [LINE_NUMBER], textContent: [MERGED_TEXT_VALUE] } ]

  textNodes.map(textNode => {
    const { position, value } = textNode;
    const { line } = position.start; // Line at which textnode starts (and for paragraphs, headings, ends).

    const nodeIndex = formattedTextNodes.findIndex(node => node.line === line);
    const indexExists = nodeIndex > -1;

    if (indexExists) {
      formattedTextNodes[nodeIndex].textContent += value; // Merge value with existing text at the given line
    } else {
      formattedTextNodes.push({ line, textContent: value }); // Create text and its start line
    }
  });

  return formattedTextNodes;
}

async function processMdx(index, dirName, fileName) {
  const filePath = `${dirName}/${fileName}`;
  const { name } = path.parse(filePath); // Name without file extension
  const url = `/docs/${dirName}/${name}`;

  const rawContent = fs.readFileSync(filePath);
  const file = await read(filePath);
  const meta = await extractMdxMeta(rawContent);

  await remark()
    .use(mdx)
    .use(() => tree => processContentTree(tree, url, meta, index))
    .process(file);
}

async function indexFiles(index, dirName) {
  fs.readdir(dirName, async (err, items) => {
    for (var i = 0; i < items.length; i++) {
      const fileName = items[i];
      await processMdx(index, dirName, fileName);
    }
  });
}

module.exports = {
  indexFiles,
  setIndexSettings
};
