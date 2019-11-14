import { ExchangeFunctionName } from '@0x/contracts-test-utils';

export const constants = {
    // These are functions not secured by the `nonReentrant`, directly or
    // indirectly (by calling a function that has the modifier).
    REENTRANT_FUNCTIONS: [
        ExchangeFunctionName.BatchExecuteTransactions,
        ExchangeFunctionName.ExecuteTransaction,
        ExchangeFunctionName.RegisterAssetProxy,
        ExchangeFunctionName.SimulateDispatchTransferFromCalls,
        ExchangeFunctionName.TransferOwnership,
        ExchangeFunctionName.SetProtocolFeeMultiplier,
        ExchangeFunctionName.SetProtocolFeeCollectorAddress,
        ExchangeFunctionName.DetachProtocolFeeCollector,
    ],
};

export enum ValidatorWalletAction {
    Reject = 0,
    Accept = 1,
    Revert = 2,
    UpdateState = 3,
    MatchSignatureHash = 4,
    ReturnTrue = 5,
    ReturnNothing = 6,
    NTypes = 7,
}
