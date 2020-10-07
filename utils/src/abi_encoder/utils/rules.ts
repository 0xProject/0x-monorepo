export interface DecodingRules {
    shouldConvertStructsToObjects: boolean;
    isStrictMode: boolean;
}

export interface EncodingRules {
    shouldOptimize?: boolean;
    shouldAnnotate?: boolean;
}
