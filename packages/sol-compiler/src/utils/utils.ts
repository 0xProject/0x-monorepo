export const utils = {
    stringifyWithFormatting(obj: any): string {
        const jsonReplacer: null = null;
        const numberOfJsonSpaces = 4;
        const stringifiedObj = JSON.stringify(obj, jsonReplacer, numberOfJsonSpaces);
        return stringifiedObj;
    },
};
