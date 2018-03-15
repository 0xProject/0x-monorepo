export const utils = {
    spawnSwitchErr(name: string, value: any) {
        return new Error(`Unexpected switch value: ${value} encountered for ${name}`);
    },
};
