declare module 'react-highlight';

// is-mobile declarations
declare function isMobile(): boolean;
declare module 'is-mobile' {
    export = isMobile;
}

declare module '*.json' {
    const json: any;
    /* tslint:disable */
    export default json;
    /* tslint:enable */
}
