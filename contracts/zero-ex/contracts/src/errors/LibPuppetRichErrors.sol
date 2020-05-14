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


library LibPuppetRichErrors {

    // solhint-disable func-name-mixedcase

    function PuppetExecuteFailedError(
        address puppet,
        address callTarget,
        bytes memory callData,
        uint256 callValue,
        bytes memory errorData
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            bytes4(keccak256("PuppetExecuteFailedError(address,address,bytes,uint256,bytes)")),
            puppet,
            callTarget,
            callData,
            callValue,
            errorData
        );
    }

    function InvalidPuppetInstanceError(address puppet)
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            bytes4(keccak256("InvalidPuppetInstanceError(address)")),
            puppet
        );
    }

    function PuppetNotAcquiredError(address puppet)
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            bytes4(keccak256("PuppetNotAcquiredError(address)")),
            puppet
        );
    }
}
