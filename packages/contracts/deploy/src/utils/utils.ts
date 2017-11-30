export const utils = {
    consoleLog(message: string): void {
        /* tslint:disable */
        console.log(message);
        /* tslint:enable */
    },
    stringifyWithFormatting(obj: any): string {
        const jsonReplacer: null = null;
        const numberOfJsonSpaces = 4;
        const stringifiedObj = JSON.stringify(obj, jsonReplacer, numberOfJsonSpaces);
        return stringifiedObj;
    },
};
