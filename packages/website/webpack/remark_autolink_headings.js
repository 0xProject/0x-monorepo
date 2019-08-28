const visit = require('unist-util-visit');
const extend = require('extend');

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
    visit(tree, 'heading', visitor);
}

function visitor(node) {
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
