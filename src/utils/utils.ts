import * as _ from 'lodash';
import * as BN from 'bn.js';

export const utils = {
    /**
     * Converts BigNumber instance to BN
     * The only reason we convert to BN is to remain compatible with `ethABI. soliditySHA3` that
     * expects values of Solidity type `uint` to be passed as type `BN`.
     * We do not use BN anywhere else in the codebase.
     */
    bigNumberToBN(value: BigNumber.BigNumber) {
        return new BN(value.toString(), 10);
    },
    consoleLog(message: string): void {
        // tslint:disable-next-line: no-console
        console.log(message);
    },
    isParityNode(nodeVersion: string): boolean {
        return _.includes(nodeVersion, 'Parity');
    },
    isValidOrderHash(orderHashHex: string) {
        const isValid = /^0x[0-9A-F]{64}$/i.test(orderHashHex);
        return isValid;
    },
    spawnSwitchErr(name: string, value: any) {
        return new Error(`Unexpected switch value: ${value} encountered for ${name}`);
    },
};
