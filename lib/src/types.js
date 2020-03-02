"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ForwarderError;
(function (ForwarderError) {
    ForwarderError["CompleteFillFailed"] = "COMPLETE_FILL_FAILED";
})(ForwarderError = exports.ForwarderError || (exports.ForwarderError = {}));
var ContractError;
(function (ContractError) {
    ContractError["ContractNotDeployedOnChain"] = "CONTRACT_NOT_DEPLOYED_ON_CHAIN";
    ContractError["InsufficientAllowanceForTransfer"] = "INSUFFICIENT_ALLOWANCE_FOR_TRANSFER";
    ContractError["InsufficientBalanceForTransfer"] = "INSUFFICIENT_BALANCE_FOR_TRANSFER";
    ContractError["InsufficientEthBalanceForDeposit"] = "INSUFFICIENT_ETH_BALANCE_FOR_DEPOSIT";
    ContractError["InsufficientWEthBalanceForWithdrawal"] = "INSUFFICIENT_WETH_BALANCE_FOR_WITHDRAWAL";
    ContractError["InvalidJump"] = "INVALID_JUMP";
    ContractError["OutOfGas"] = "OUT_OF_GAS";
    ContractError["SubscriptionNotFound"] = "SUBSCRIPTION_NOT_FOUND";
    ContractError["SubscriptionAlreadyPresent"] = "SUBSCRIPTION_ALREADY_PRESENT";
    ContractError["ERC721OwnerNotFound"] = "ERC_721_OWNER_NOT_FOUND";
    ContractError["ERC721NoApproval"] = "ERC_721_NO_APPROVAL";
    ContractError["SignatureRequestDenied"] = "SIGNATURE_REQUEST_DENIED";
})(ContractError = exports.ContractError || (exports.ContractError = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus[OrderStatus["Invalid"] = 0] = "Invalid";
    OrderStatus[OrderStatus["InvalidMakerAssetAmount"] = 1] = "InvalidMakerAssetAmount";
    OrderStatus[OrderStatus["InvalidTakerAssetAmount"] = 2] = "InvalidTakerAssetAmount";
    OrderStatus[OrderStatus["Fillable"] = 3] = "Fillable";
    OrderStatus[OrderStatus["Expired"] = 4] = "Expired";
    OrderStatus[OrderStatus["FullyFilled"] = 5] = "FullyFilled";
    OrderStatus[OrderStatus["Cancelled"] = 6] = "Cancelled";
})(OrderStatus = exports.OrderStatus || (exports.OrderStatus = {}));
//# sourceMappingURL=types.js.map