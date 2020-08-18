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

import "@0x/contracts-erc20/contracts/src/v06/LibERC20TokenV06.sol";
import "@0x/contracts-erc20/contracts/src/v06/IERC20TokenV06.sol";

interface IMStable {

    function swap(
        address _input,
        address _output,
        uint256 _quantity,
        address _recipient
    )
        external
        returns (uint256 output);
}

contract MixinMStable {

    using LibERC20TokenV06 for IERC20TokenV06;

    /// @dev Mainnet address of the mStable mUSD contract.
    IMStable private immutable MSTABLE;

    constructor(address mStable)
        public
    {
        MSTABLE = IMStable(mStable);
    }

    function _tradeMStable(
        address toTokenAddress,
        uint256 sellAmount,
        bytes memory bridgeData
    )
        internal
        returns (uint256 boughtAmount)
    {
        // Decode the bridge data to get the `fromTokenAddress`.
        (address fromTokenAddress) = abi.decode(bridgeData, (address));
        // Grant an allowance to the exchange to spend `fromTokenAddress` token.
        IERC20TokenV06(fromTokenAddress).approveIfBelow(address(MSTABLE), sellAmount);

        boughtAmount = MSTABLE.swap(
            fromTokenAddress,
            toTokenAddress,
            sellAmount,
            address(this)
        );
    }
}
