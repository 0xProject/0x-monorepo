declare function toSnakeCase(str: string): string;
declare module 'to-snake-case' {
    export = toSnakeCase;
}

declare module '*.json' {
    const json: any;
    /* tslint:disable */
    export default json;
    /* tslint:enable */
}
