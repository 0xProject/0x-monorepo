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
import "../errors/LibTransformERC20RichErrors.sol";
import "./IERC20Transformer.sol";
import "./LibERC20Transformer.sol";


/// @dev Abstract base class for transformers.
abstract contract Transformer is
    IERC20Transformer
{
    using LibRichErrorsV06 for bytes;

    /// @dev The address of the deployer.
    address public immutable deployer;
    /// @dev The nonce of the deployer when deploying this contract.
    uint256 public immutable deploymentNonce;
    /// @dev The original address of this contract.
    address private immutable _implementation;

    /// @dev Create this contract.
    /// @param deploymentNonce_ The nonce of the deployer when deploying this contract.
    constructor(uint256 deploymentNonce_) public {
        deploymentNonce = deploymentNonce_;
        deployer = msg.sender;
        _implementation = address(this);
    }

    /// @dev Destruct this contract. Only callable by the deployer and will not
    ///      succeed in the context of a delegatecall (from another contract).
    /// @param ethRecipient The recipient of ETH held in this contract.
    function die(address payable ethRecipient)
        external
        virtual
    {
        // Only the deployer can call this.
        if (msg.sender != deployer) {
            LibTransformERC20RichErrors
                .OnlyCallableByDeployerError(msg.sender, deployer)
                .rrevert();
        }
        // Must be executing our own context.
        if (address(this) != _implementation) {
            LibTransformERC20RichErrors
                .InvalidExecutionContextError(address(this), _implementation)
                .rrevert();
        }
        selfdestruct(ethRecipient);
    }

    /// @dev Get the RLP-encoded deployment nonce of this contract.
    /// @return rlpEncodedNonce The RLP-encoded deployment nonce.
    function _getRLPEncodedDeploymentNonce()
        internal
        view
        returns (bytes memory rlpEncodedNonce)
    {
        return LibERC20Transformer.rlpEncodeNonce(deploymentNonce);
    }
}
