/*

  Copyright 2019 ZeroEx Intl.

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

pragma solidity ^0.5.5;
pragma experimental ABIEncoderV2;

import "../src/interfaces/IWallet.sol";

contract OrderScenarioWallet is
    IWallet
{
    address internal _exchangeAddress;
    bool internal _isSignatureValid;

    constructor(address exchangeAddress) {
        _exchangeAddress = exchangeAddress;
        _isSignatureValid = true;
    }

    /// @dev Toggle whether signature validation should always pass or always fail.
    function enableValidSignature(bool isValid) external returns (void) {
        _isSignatureValid = isValid;
    }

    /// @dev Call a function on the Exchange contract from the context of
    ///      this wallet.
    /// @param callData The ABI-encoded Exchange function call.
    function callExchange(bytes calldata callData)
        external
        returns (bool didSucceed, bytes returnData)
    {
        (didSucceed, returnData) = _exchangeAddress.call(callData);
    }

    /// @dev `Wallet` signature type validation callback.
    function isValidSignature(
        bytes32 hash,
        bytes calldata signature
    )
        external
        pure
        returns (bool isValid)
    {
        return _isSignatureValid;
    }
}
