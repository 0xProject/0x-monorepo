/*

  Copyright 2019 ZeroEx Intl.

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
pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;

import "@0x/contracts-utils/contracts/src/Ownable.sol";
import "../src/immutable/MixinStorage.sol";


contract TestInitTarget is
    Ownable,
    MixinStorage
{

    // We can't store state in this contract before it is attached, so
    // we will grant this predefined address a balance to indicate that
    // `init()`  should revert.
    address public constant SHOULD_REVERT_ADDRESS = 0x5ed6A38c6bEcEd15b0AB58566b6fD7A00463d2F7;
    // Counter that is incremented with every call to `init()`.
    uint256 private _initCounter = 0;
    // `msg.sender` of the last `init()` call.
    address private _initSender = address(0);
    // `address(this)` of the last `init()` call.
    address private _initThisAddress = address(0);

    function init() external {
        if (SHOULD_REVERT_ADDRESS.balance != 0) {
            revert("FORCED_REVERT");
        }
        _initCounter += 1;
        _initSender = msg.sender;
        _initThisAddress = address(this);
    }

    function getInitState()
        external
        view
        returns (
            address initSender,
            address initThisAddress
        )
    {
        initSender = _initSender;
        initThisAddress = _initThisAddress;
    }

    function getInitCounter() external view returns (uint256) {
        return _initCounter;
    }
}
