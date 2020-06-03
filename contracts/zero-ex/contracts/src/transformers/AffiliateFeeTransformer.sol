/*

  Copyright 2020 ZeroEx Intl.

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

pragma solidity ^0.6.5;
pragma experimental ABIEncoderV2;

import "@0x/contracts-utils/contracts/src/v06/errors/LibRichErrorsV06.sol";
import "@0x/contracts-utils/contracts/src/v06/LibSafeMathV06.sol";
import "@0x/contracts-erc20/contracts/src/v06/IERC20TokenV06.sol";
import "@0x/contracts-erc20/contracts/src/v06/LibERC20TokenV06.sol";
import "../errors/LibTransformERC20RichErrors.sol";
import "./Transformer.sol";
import "./LibERC20Transformer.sol";


/// @dev A transformer that transfers tokens to arbitrary addresses.
contract AffiliateFeeTransformer is
    Transformer
{
    // solhint-disable no-empty-blocks
    using LibRichErrorsV06 for bytes;
    using LibSafeMathV06 for uint256;
    using LibERC20Transformer for IERC20TokenV06;

    /// @dev Transform data to ABI-encode and pass into `transform()`.
    struct TransformData {
        // The tokens to transfer to each respective address in `recipients`.
        IERC20TokenV06[] tokens;
        // Amount of each token in `tokens` to transfer to the affiliate.
        uint256[] amounts;
        // Recipient of each token in `tokens`.
        address payable[] recipients;
    }

    /// @dev Create this contract.
    /// @param deploymentNonce_ The nonce of the deployer when deploying this contract.
    constructor(uint256 deploymentNonce_)
        public
        Transformer(deploymentNonce_)
    {}

    /// @dev Transfers tokens to recipients.
    /// @param data_ ABI-encoded `TransformData`, indicating which tokens to transfer.
    /// @return rlpDeploymentNonce RLP-encoded deployment nonce of the deployer
    ///         when this transformer was deployed. This is used to verify that
    ///         this transformer was deployed by a trusted contract.
    function transform(
        bytes32, // callDataHash,
        address payable, // taker,
        bytes calldata data_
    )
        external
        override
        returns (bytes memory rlpDeploymentNonce)
    {
        TransformData memory data = abi.decode(data_, (TransformData));

        // All arrays must be the same length.
        if (data.tokens.length != data.amounts.length ||
            data.tokens.length != data.recipients.length)
        {
            LibTransformERC20RichErrors.InvalidTransformDataError(
                LibTransformERC20RichErrors.InvalidTransformDataErrorCode.INVALID_ARRAY_LENGTH,
                data_
            ).rrevert();
        }

        // Transfer tokens to recipients.
        for (uint256 i = 0; i < data.tokens.length; ++i) {
            data.tokens[i].transformerTransfer(data.recipients[i], data.amounts[i]);
        }

        return _getRLPEncodedDeploymentNonce();
    }
}
