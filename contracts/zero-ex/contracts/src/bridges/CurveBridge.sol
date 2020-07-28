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

import "@0x/contracts-erc20/contracts/src/v06/LibERC20TokenV06.sol";

contract CurveBridge
{
    struct CurveBridgeData {
        address curveAddress;
        bytes4 exchangeFunctionSelector;
        address fromTokenAddress;
        int128 fromCoinIdx;
        int128 toCoinIdx;
    }

    function trade(
        address toTokenAdddress,
        uint256 sellAmount,
        bytes calldata bridgeData
    )
        external
        returns (uint256 boughtAmount)
    {
        // Decode the bridge data to get the Curve metadata.
        CurveBridgeData memory data = abi.decode(bridgeData, (CurveBridgeData));
        LibERC20TokenV06.approveIfBelow(data.fromTokenAddress, data.curveAddress, sellAmount);
        {
            (bool didSucceed, bytes memory resultData) =
                data.curveAddress.call(abi.encodeWithSelector(
                    data.exchangeFunctionSelector,
                    data.fromCoinIdx,
                    data.toCoinIdx,
                    // dx
                    sellAmount,
                    // min dy
                    0
                ));
            if (!didSucceed) {
                assembly { revert(add(resultData, 32), mload(resultData)) }
            }
        }
        // TODO event, maybe idk
        return LibERC20TokenV06.balanceOf(toTokenAdddress, address(this));
    }
}
