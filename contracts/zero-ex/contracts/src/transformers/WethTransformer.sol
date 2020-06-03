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
import "@0x/contracts-erc20/contracts/src/v06/IEtherTokenV06.sol";
import "../errors/LibTransformERC20RichErrors.sol";
import "./Transformer.sol";
import "./LibERC20Transformer.sol";


/// @dev A transformer that wraps or unwraps WETH.
contract WethTransformer is
    Transformer
{
    using LibRichErrorsV06 for bytes;
    using LibSafeMathV06 for uint256;
    using LibERC20Transformer for IERC20TokenV06;

    /// @dev Transform data to ABI-encode and pass into `transform()`.
    struct TransformData {
        // The token to wrap/unwrap. Must be either ETH or WETH.
        IERC20TokenV06 token;
        // Amount of `token` to wrap or unwrap.
        // `uint(-1)` will unwrap the entire balance.
        uint256 amount;
    }

    /// @dev The WETH contract address.
    IEtherTokenV06 public immutable weth;
    /// @dev Maximum uint256 value.
    uint256 private constant MAX_UINT256 = uint256(-1);

    /// @dev Construct the transformer and store the WETH address in an immutable.
    /// @param weth_ The weth token.
    /// @param deploymentNonce_ The nonce of the deployer when deploying this contract.
    constructor(IEtherTokenV06 weth_, uint256 deploymentNonce_)
        public
        Transformer(deploymentNonce_)
    {
        weth = weth_;
    }

    /// @dev Wraps and unwraps WETH.
    /// @param data_ ABI-encoded `TransformData`, indicating which token to wrap/umwrap.
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
        if (!data.token.isTokenETH() && data.token != weth) {
            LibTransformERC20RichErrors.InvalidTransformDataError(
                LibTransformERC20RichErrors.InvalidTransformDataErrorCode.INVALID_TOKENS,
                data_
            ).rrevert();
        }

        uint256 amount = data.amount;
        if (amount == MAX_UINT256) {
            amount = data.token.getTokenBalanceOf(address(this));
        }

        if (amount != 0) {
            if (data.token.isTokenETH()) {
                // Wrap ETH.
                weth.deposit{value: amount}();
            } else {
                // Unwrap WETH.
                weth.withdraw(amount);
            }
        }
        return _getRLPEncodedDeploymentNonce();
    }
}
