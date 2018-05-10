export const utils = {
    stringifyWithFormatting(obj: any): string {
        const stringifiedObj = JSON.stringify(obj, null, '\t');
        return stringifiedObj;
    },
};
