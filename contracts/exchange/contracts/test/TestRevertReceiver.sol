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

pragma solidity ^0.5.5;

import "@0x/contracts-erc20/contracts/src/interfaces/IERC20Token.sol";


contract TestRevertReceiver {

    string constant REVERT_REASON = "you shall not pass";

    /// @dev Reverts with `REVERT_REASON`. Intended to be used with `Validator` signature type.
    /// @param hash Message hash that is signed.
    /// @param signerAddress Address that should have signed the given hash.
    /// @param signature Proof of signing.
    /// @return Validity of order signature.
    function isValidSignature(
        bytes32 hash,
        address signerAddress,
        bytes calldata signature
    )
        external
        returns (bool isValid)
    {
        revert(REVERT_REASON);
    }

    /// @dev Reverts with `REVERT_REASON`. Intended to be used with `Wallet` signature type.
    /// @param hash Message hash that is signed.
    /// @param signature Proof of signing.
    /// @return Validity of order signature.
    function isValidSignature(
        bytes32 hash,
        bytes calldata signature
    )
        external
        returns (bool isValid)
    {
        revert(REVERT_REASON);
    }
}
