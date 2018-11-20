import * as hljs from 'highlight.js/lib/highlight';
import * as javascript from 'highlight.js/lib/languages/javascript';
import * as json from 'highlight.js/lib/languages/json';
import * as _ from 'lodash';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('json', json);

interface PatchInterface {
    [key: string]: string;
}

const PATCH_TYPES: PatchInterface = {
    '+': 'addition',
    '-': 'deletion',
    '!': 'change',
};

function diffHighlight(language: string, code: any, gutter: any): string {
    return _.map(code.split(/\r?\n/g), (line: string, index: number) => {
        let type;
        let currentLine = line;

        if (/^-{3} [^-]+ -{4}$|^\*{3} [^*]+ \*{4}$|^@@ [^@]+ @@$/.test(currentLine)) {
            type = 'chunk';
        } else if (/^Index: |^[+\-*]{3}|^[*=]{5,}$/.test(currentLine)) {
            type = 'header';
        } else {
            type = PATCH_TYPES[currentLine[0]] || 'null';
            currentLine = currentLine.replace(/^[+\-! ]/, '');
        }

        const g = gutter[index];

        return `<span data-gutter="${g !== undefined ? `${g}x` : ''}" class="line-${type}">${
            hljs.highlight(language, currentLine).value
        }</span>`;
    }).join('\n');
}

interface HighlightProps {
    language: string;
    code: string;
    isDiff?: boolean;
    gutter?: [];
    isEtc?: boolean;
}

function highlight({ language, code, isDiff, gutter, isEtc }: HighlightProps): string {
    if (isDiff) {
        return diffHighlight(language, code, gutter);
    }

    const hlCode = hljs.highlight(language, code).value;

    if (!isEtc) {
        return hlCode;
    }

    const hc = hlCode.split(/\r?\n/g);
    hc.splice(1, 0, '    ...');
    hc.splice(hc.length - 1, 0, '    ...');

    return hc.join('\n');
}

export { highlight };
