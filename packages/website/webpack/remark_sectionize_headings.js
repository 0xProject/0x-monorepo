const findAfter = require('unist-util-find-after');
const visit = require('unist-util-visit-parents');

const MAX_HEADING_DEPTH = 2;

module.exports = plugin;

function plugin() {
    return transform;
}

function transform(tree) {
    for (let depth = MAX_HEADING_DEPTH; depth > 0; depth--) {
        visit(tree, node => node.type === 'heading' && node.depth === depth, sectionize);
    }
}

function sectionize(node, ancestors) {
    const start = node;
    const parent = ancestors[ancestors.length - 1];

    const isEnd = node => {
        if (start.depth < MAX_HEADING_DEPTH) {
            return node.type === 'section' || (node.type === 'heading' && node.depth <= start.depth);
        }
        return node.type === 'heading' && node.depth <= start.depth;
    };
    const end = findAfter(parent, start, isEnd);

    const startIndex = parent.children.indexOf(start);
    const endIndex = parent.children.indexOf(end);

    const between = parent.children.slice(startIndex, endIndex > 0 ? endIndex : undefined);
    // We want to grab the ids created by remark-slug based on heading values
    // node (heading) data has this shape now:
    // { hProperties: { id: 'some-id' }, id: 'some-id' } }
    // depth is the heading size (i.e. 2 for h2)
    const { data, depth } = node;
    // We combine the two for section data
    const sectionData = { ...data, hProperties: { ...data.hProperties, depth } };
    // and then remove data (ids) from the heading nodes
    node.data = {};
    // A section node is created with the data grabbed above
    const section = {
        type: 'section',
        children: between,
        data: {
            ...sectionData,
            hName: 'section',
        },
    };

    parent.children.splice(startIndex, section.children.length, section);
}
