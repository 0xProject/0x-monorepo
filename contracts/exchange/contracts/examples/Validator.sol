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
pragma experimental ABIEncoderV2;

import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "../src/interfaces/IValidator.sol";


contract Validator is
    IValidator
{

    // The single valid signer for this validator.
    // solhint-disable-next-line var-name-mixedcase
    address internal VALID_SIGNER;

    /// @dev constructs a new `Validator` with a single valid signer.
    /// @param validSigner The sole, valid signer.
    constructor (address validSigner) public {
        VALID_SIGNER = validSigner;
    }

    // solhint-disable no-unused-vars
    /// @dev Verifies that a signature is valid. `signer` must match `VALID_SIGNER`.
    /// @param hash Message hash that is signed.
    /// @param signerAddress Address that should have signed the given hash.
    /// @param signature Proof of signing.
    /// @return Validity of signature.
    function isValidSignature(
        bytes32 hash,
        address signerAddress,
        bytes calldata signature
    )
        external
        view
        returns (bool isValid)
    {
        return (signerAddress == VALID_SIGNER);
    }
    // solhint-enable no-unused-vars

    // solhint-disable no-unused-vars
    /// @dev Verifies that a signature is valid. `signer` must match `VALID_SIGNER`.
    /// @param order The order.
    /// @param signerAddress Address that should have signed the given hash.
    /// @param signature Proof of signing.
    /// @return Validity of signature.
    function isValidOrder(
        LibOrder.Order calldata order,
        address signerAddress,
        bytes calldata signature
    )
        external
        view
        returns (bool isValid)
    {
        return (signerAddress == VALID_SIGNER);
    }
    // solhint-enable no-unused-vars
}
