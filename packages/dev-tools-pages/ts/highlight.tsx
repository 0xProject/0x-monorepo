const hljs = require('highlight.js/lib/highlight');
const javascript = require('highlight.js/lib/languages/javascript');
const json = require('highlight.js/lib/languages/json');

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('json', json);

interface PatchInterface {
    [key: string]: string;
}

var PATCH_TYPES: PatchInterface = {
    '+': 'addition',
    '-': 'deletion',
    '!': 'change',
};

function diffHighlight(language: string, code: any, gutter: any) {
    return code
        .split(/\r?\n/g)
        .map((line: string, index: number) => {
            var type;
            if (/^-{3} [^-]+ -{4}$|^\*{3} [^*]+ \*{4}$|^@@ [^@]+ @@$/.test(line)) {
                type = 'chunk';
            } else if (/^Index: |^[+\-*]{3}|^[*=]{5,}$/.test(line)) {
                type = 'header';
            } else {
                type = PATCH_TYPES[line[0] as string] || 'null';
                line = line.replace(/^[+\-! ]/, '');
            }

            const g = gutter[index];

            return `<span data-test="${g !== undefined ? g + 'x' : ''}" class="line-${type}">${
                hljs.highlight(language, line).value
            }</span>`;
        })
        .join('\n');
}

interface highlightProps {
    language: string;
    code: string;
    diff?: boolean;
    gutter?: boolean;
    etc?: boolean;
}

function highlight({ language, code, diff, gutter, etc }: highlightProps) {
    if (diff) {
        return diffHighlight(language, code, gutter);
    }

    let hlCode = hljs.highlight(language, code).value;

    if (!etc) {
        return hlCode;
    }

    var hc = hlCode.split(/\r?\n/g);
    hc.splice(1, 0, '    ...');
    hc.splice(hc.length - 1, 0, '    ...');

    return hc.join('\n');
}

export default highlight;
