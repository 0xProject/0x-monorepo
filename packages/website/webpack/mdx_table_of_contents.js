const { toJSX } = require('@mdx-js/mdx/mdx-hast-to-jsx');

function mdxTableOfContents(options = {}) {
    let OldCompiler = this.Compiler;
    let tableOfContents;

    this.Compiler = tree => {
        let code = OldCompiler(tree, {}, options);

        code += `\nexport const tableOfContents = (components={}) => ${tableOfContentsListSerializer(
            tableOfContents,
        )}\n`;

        return code;
    };

    return function transformer(node) {
        tableOfContents = getTableOfContents(node, options);
    };
}

function getTableOfContents(root, { minLevel = 0, maxLevel = 2 } = {}) {
    let tableOfContents = [];

    addSections(tableOfContents, root.children, minLevel, maxLevel);

    return tableOfContents;
}

function addSections(parent, children, minLevel, maxLevel) {
    for (let i = 0; i < children.length; i++) {
        let node = children[i];

        if (isSlugifiedSection(node)) {
            let level = node.properties.depth;

            if (level >= minLevel && level <= maxLevel) {
                let id = node.properties.id;

                let item = {
                    id,
                    level,
                    title: toFragment(node.children[0].children),
                    children: [],
                };

                if (parent.children) {
                    parent.children.push(item);
                } else {
                    parent.push(item);
                }

                addSections(item, node.children, minLevel, maxLevel);
            }
        }
    }
}

function isSlugifiedSection(node) {
    return node.tagName === 'section' && node.properties && node.properties.id && node.properties.depth;
}

function toFragment(nodes) {
    if (nodes.length === 1 && nodes[0].type === 'text') {
        return JSON.stringify(nodes[0].value);
    } else {
        return '<React.Fragment>' + nodes.map(toJSX).join('') + '</React.Fragment>';
    }
}

function tableOfContentsListSerializer(nodes, indent = 0) {
    return indentString(
        indent,
        `[
  ${nodes.map(node => tableOfContentsNodeSerializer(node, indent + 2)).join(',\n')}
]`,
    );
}

function tableOfContentsNodeSerializer(node, indent = 0) {
    return indentString(
        indent,
        `{
  id: ${JSON.stringify(node.id)},
  level: ${node.level},
  title: ${node.title},
  children: ${tableOfContentsListSerializer(node.children, indent + 2)}
}`,
    );
}

function indentString(size, string) {
    return string
        .split('\n')
        .map(x => ' '.repeat(size) + x)
        .join('\n')
        .trim();
}

module.exports = mdxTableOfContents;
