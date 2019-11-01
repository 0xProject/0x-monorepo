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


contract TestLibERC20TokenTarget {

    event ApproveCalled(
        address spender,
        uint256 allowance
    );

    event TransferCalled(
        address to,
        uint256 amount
    );

    event TransferFromCalled(
        address from,
        address to,
        uint256 amount
    );

    bool private _shouldRevert;
    bytes private _revertData;
    bytes private _returnData;

    function setBehavior(
        bool shouldRevert,
        bytes calldata revertData,
        bytes calldata returnData
    )
        external
    {
        _shouldRevert = shouldRevert;
        _revertData = revertData;
        _returnData = returnData;
    }

    function approve(
        address spender,
        uint256 allowance
    )
        external
        returns (bool)
    {
        emit ApproveCalled(spender, allowance);
        _execute();
    }

    function transfer(
        address to,
        uint256 amount
    )
        external
        returns (bool)
    {
        emit TransferCalled(to, amount);
        _execute();
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    )
        external
        returns (bool)
    {
        emit TransferFromCalled(from, to, amount);
        _execute();
    }

    function _execute() private view {
        if (_shouldRevert) {
            bytes memory revertData = _revertData;
            assembly { revert(add(revertData, 0x20), mload(revertData)) }
        }
        bytes memory returnData = _returnData;
        assembly { return(add(returnData, 0x20), mload(returnData)) }
    }
}
