import { readFile } from 'fs';
import { promisify } from 'util';

interface Whitelist {
    [networkId: number]: string[];
}

/**
 * Indicate whether the given address is on the CFL whitelist for the given network.
 */
export async function isAddressWhitelistedAsync(networkId: number, address: string): Promise<boolean> {
    const whitelist: Whitelist = JSON.parse(
        (await promisify(readFile)(`${__dirname}/../../whitelist.json`)).toString(),
    );
    if (!whitelist[networkId]) {
        throw new Error(`Unknown network ID ${networkId}`);
    }
    return whitelist[networkId].includes(address);
}
