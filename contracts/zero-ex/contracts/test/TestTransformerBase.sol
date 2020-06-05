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

import "../src/transformers/Transformer.sol";


contract TestTransformerBase is
    Transformer
{
    // solhint-disable no-empty-blocks
    constructor(uint256 deploymentNonce_)
        public
        Transformer(deploymentNonce_)
    {}

    function transform(
        bytes32,
        address payable,
        bytes calldata
    )
        external
        override
        returns (bytes memory rlpDeploymentNonce)
    {
        return hex"";
    }

    function getRLPEncodedDeploymentNonce()
        external
        view
        returns (bytes memory)
    {
        return _getRLPEncodedDeploymentNonce();
    }
}
