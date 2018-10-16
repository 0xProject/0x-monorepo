/*

  Copyright 2018 ZeroEx Intl.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

*/

// solhint-disable
pragma solidity 0.4.24;


/// This contract is intended to serve as a reference, but is not actually used for efficiency reasons.
contract LibForwarderErrors {
    string constant FEE_PERCENTAGE_TOO_LARGE = "FEE_PROPORTION_TOO_LARGE";                        // Provided fee percentage greater than 5%.
    string constant INSUFFICIENT_ETH_REMAINING = "INSUFFICIENT_ETH_REMAINING";                    // Not enough ETH remaining to pay feeRecipient.
    string constant OVERSOLD_WETH = "OVERSOLD_WETH";                                              // More WETH sold than provided with current message call.
    string constant COMPLETE_FILL_FAILED = "COMPLETE_FILL_FAILED";                                // Desired purchase amount not completely filled (required for ZRX fees only).
    string constant TRANSFER_FAILED = "TRANSFER_FAILED";                                          // Asset transfer failed.
    string constant UNSUPPORTED_ASSET_PROXY = "UNSUPPORTED_ASSET_PROXY";                          // Proxy in assetData not supported.
    string constant DEFAULT_FUNCTION_WETH_CONTRACT_ONLY = "DEFAULT_FUNCTION_WETH_CONTRACT_ONLY";  // Fallback function may only be used for WETH withdrawals.
    string constant INVALID_MSG_VALUE = "INVALID_MSG_VALUE";                                      // msg.value must be greater than 0.
    string constant INVALID_AMOUNT = "INVALID_AMOUNT";                                            // Amount must equal 1.
}
