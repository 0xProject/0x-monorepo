declare interface LernaPackage {
    location: string;
    package: {
        private?: boolean;
        version: string;
        name: string;
        main?: string;
        config?: {
            additionalTsTypings?: string[];
        };
    };
}
declare function lernaGetPackages(path: string): LernaPackage[];
declare module 'lerna-get-packages' {
    export = lernaGetPackages;
}
