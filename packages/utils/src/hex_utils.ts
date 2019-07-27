export const hexUtils = {
    // Lifted from: https://github.com/SilentCicero/is-hex-prefixed
    isHexPrefixed: (str: string) => {
        if (typeof str !== 'string') {
            throw new Error(
                `[is-hex-prefixed] value must be type 'string', is currently type ${typeof str} while checking isHexPrefixed.`,
            );
        }
        return str.slice(0, 2) === '0x';
    },
    // Lifted from: https://github.com/SilentCicero/strip-hex-prefix
    stripHexPrefix: (str: string) => {
        if (typeof str !== 'string') {
            return str;
        }

        return hexUtils.isHexPrefixed(str) ? str.slice(2) : str;
    },
};
