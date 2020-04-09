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
import "./IERC20Transformer.sol";
import "./LibERC20Transformer.sol";


/// @dev A transformer that wraps or unwraps WETH.
contract WethTransformer is
    IERC20Transformer
{
    /// @dev Transform data to ABI-encode and pass into `transform()`.
    struct TransformData {
        // The token to wrap/unwrap. Must be either ETH or WETH.
        IERC20TokenV06 token;
        // Amount of `token` to wrap or unwrap.
        // `uint(-1)` will unwrap the entire balance.
        uint256 amount;
    }

    // solhint-disable
    /// @dev The WETH contract address.
    IEtherTokenV06 public immutable weth;
    // solhint-enable

    using LibRichErrorsV06 for bytes;
    using LibSafeMathV06 for uint256;
    using LibERC20Transformer for IERC20TokenV06;

    /// @dev Construct the transformer and store the WETH address in an immutable.
    /// @param weth_ The weth token.
    constructor(IEtherTokenV06 weth_) public {
        weth = weth_;
    }

    /// @dev Wraps and unwraps WETH.
    /// @param data_ ABI-encoded `TransformData`, indicating which token to wrap/umwrap.
    /// @return success `TRANSFORMER_SUCCESS` on success.
    function transform(
        bytes32, // callDataHash,
        address payable, // taker,
        bytes calldata data_
    )
        external
        override
        returns (bytes4 success)
    {
        TransformData memory data = abi.decode(data_, (TransformData));
        if (!data.token.isTokenETH() && data.token != weth) {
            LibTransformERC20RichErrors.InvalidTransformDataError(data_).rrevert();
        }

        uint256 amount = data.amount;
        if (amount == uint256(-1)) {
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
        return LibERC20Transformer.TRANSFORMER_SUCCESS;
    }
}
