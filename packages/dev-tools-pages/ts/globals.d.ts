declare module 'whatwg-fetch';
declare module 'react-document-title';

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
