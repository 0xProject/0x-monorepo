declare interface XML2JSONOpts {
    compact?: boolean;
    spaces?: number;
}
declare module 'xml-js' {
    const xml2json: (xml: string, opts: XML2JSONOpts) => string;
}
