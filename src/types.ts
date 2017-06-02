import * as _ from 'lodash';

// Utility function to create a K:V from a list of strings
// Adapted from: https://basarat.gitbooks.io/typescript/content/docs/types/literal-types.html
function strEnum(values: string[]): {[key: string]: string} {
    return _.reduce(values, (result, key) => {
        result[key] = key;
        return result;
    }, Object.create(null));
}

export const ZeroExError = strEnum([
  'CONTRACT_DOES_NOT_EXIST',
  'UNHANDLED_ERROR',
  'USER_HAS_NO_ASSOCIATED_ADDRESSES',
  'INVALID_SIGNATURE',
  'CONTRACT_NOT_DEPLOYED_ON_NETWORK',
]);
export type ZeroExError = keyof typeof ZeroExError;

/**
 * Elliptic Curve signature
 */
export interface ECSignature {
    v: number;
    r: string;
    s: string;
}

export interface ExchangeContract {
    isValidSignature: any;
}

export interface TokenContract {
    balanceOf: {
        call: (address: string) => Promise<BigNumber.BigNumber>;
    };
    allowance: {
        call: (ownerAddress: string, allowedAddress: string) => Promise<BigNumber.BigNumber>;
    };
    transfer: (to: string, amountInBaseUnits: BigNumber.BigNumber, txOpts: TxOpts) => Promise<boolean>;
    approve: (proxyAddress: string, amountInBaseUnits: BigNumber.BigNumber, txOpts: TxOpts) => void;
}

export interface TokenRegistryContract {
    getTokenMetaData: {
        call: (address: string) => Promise<TokenMetadata>;
    };
    getTokenAddresses: {
        call: () => Promise<string[]>;
    };
}

export const SolidityTypes = strEnum([
    'address',
    'uint256',
]);
export type SolidityTypes = keyof typeof SolidityTypes;

//                          [address, name, symbol, projectUrl, decimals, ipfsHash, swarmHash]
export type TokenMetadata = [string, string, string, string, BigNumber.BigNumber, string, string];

export interface Token {
    name: string;
    address: string;
    symbol: string;
    decimals: number;
    url: string;
}

export interface TxOpts {
    from: string;
    gas?: number;
}
