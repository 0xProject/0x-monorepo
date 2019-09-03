const visit = require('unist-util-visit');
const extend = require('extend');

const MAX_HEADING_DEPTH = 3;

const content = {
    type: 'element',
    tagName: 'i',
    properties: { className: ['heading-link-icon'] },
};

const linkProperties = { ariaHidden: 'true' };

const hChildren = Array.isArray(content) ? content : [content];

module.exports = plugin;

function plugin() {
    return transform;
}

function transform(tree) {
    for (let depth = MAX_HEADING_DEPTH; depth > 0; depth--) {
        visit(tree, node => node.type === 'heading' && node.depth === depth, autolink);
    }
}

function autolink(node) {
    const { data } = node;
    const id = data && data.hProperties && data.hProperties.id;
    const url = '#' + id;

    if (id) {
        inject(node, url);
    }
}

function inject(node, url) {
    node.children.unshift({
        type: 'link',
        url,
        title: null,
        children: [],
        data: {
            hProperties: extend(true, {}, linkProperties),
            hChildren: extend(true, [], hChildren),
        },
    });
}
