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

import "../src/features/TransformERC20.sol";


contract TestMetaTransactionsTransformERC20Feature is
    TransformERC20
{
    event TransformERC20Called(
        address sender,
        uint256 value,
        address taker,
        IERC20TokenV06 inputToken,
        IERC20TokenV06 outputToken,
        uint256 inputTokenAmount,
        uint256 minOutputTokenAmount,
        Transformation[] transformations,
        bytes32 callDataHash,
        bytes callDataSignature
    );

    function _transformERC20(TransformERC20Args memory args)
        public
        override
        payable
        returns (uint256 outputTokenAmount)
    {
        if (msg.value == 666) {
            revert('FAIL');
        }

        emit TransformERC20Called(
            msg.sender,
            msg.value,
            args.taker,
            args.inputToken,
            args.outputToken,
            args.inputTokenAmount,
            args.minOutputTokenAmount,
            args.transformations,
            args.callDataHash,
            args.callDataSignature
        );
        return 1337;
    }
}
