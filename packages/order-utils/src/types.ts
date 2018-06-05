export enum OrderError {
    InvalidSignature = 'INVALID_SIGNATURE',
}

/**
 * The requisite message prefix (is any) to add to an `eth_sign` request.
 */
export enum MessagePrefixType {
    None = 'NONE',
    EthSign = 'ETH_SIGN',
    Trezor = 'TREZOR',
}

/**
 * Options related to message prefixing of messages sent to `eth_sign`
 * Some signers prepend a message prefix (e.g Parity Signer, Ledger, TestRPC), while
 * others require it already be prepended (e.g Metamask). In addition, different signers
 * expect slightly different prefixes (See: https://github.com/ethereum/go-ethereum/issues/14794).
 * Depending on the signer that will receive your signing request, you must specify the
 * desired prefix and whether it should be added before making the `eth_sign` request.
 */
export interface MessagePrefixOpts {
    prefixType: MessagePrefixType;
    shouldAddPrefixBeforeCallingEthSign: boolean;
}

export interface EIP712Parameter {
    name: string;
    type: string;
}

export interface EIP712Schema {
    name: string;
    parameters: EIP712Parameter[];
}
