declare module 'whatwg-fetch';
declare module 'react-document-title';
declare module 'highlight.js/lib/highlight';
declare module 'highlight.js/lib/languages/javascript';
declare module 'highlight.js/lib/languages/json';

declare var System: any;

declare module '*.json' {
    const json: any;
    /* tslint:disable */
    export default json;
    /* tslint:enable */
}

declare module '*.css' {
    const css: any;
    export default css;
}

declare module '*.svg' {
    const svg: any;
    export default svg;
}
