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

import "./Transformer.sol";
import "./LibERC20Transformer.sol";


/// @dev A transformer that just emits an event with an arbitrary byte payload.
contract LogMetadataTransformer is
    Transformer
{
    event TransformerMetadata(bytes32 callDataHash, address sender, address taker, bytes data);

    /// @dev Maximum uint256 value.
    uint256 private constant MAX_UINT256 = uint256(-1);

    /// @dev Emits an event.
    /// @param context Context information.
    /// @return success The success bytes (`LibERC20Transformer.TRANSFORMER_SUCCESS`).
    function transform(TransformContext calldata context)
        external
        override
        returns (bytes4 success)
    {
        emit TransformerMetadata(context.callDataHash, context.sender, context.taker, context.data);
        return LibERC20Transformer.TRANSFORMER_SUCCESS;
    }
}
