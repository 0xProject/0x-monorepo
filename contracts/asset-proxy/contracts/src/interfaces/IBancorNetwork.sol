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

pragma solidity ^0.5.9;

import "@0x/contracts-erc20/contracts/src/interfaces/IERC20Token.sol";


contract IContractRegistry {
    function addressOf(
        bytes32 contractName
    ) external returns(address);
}


contract IBancorNetwork {
    function convertByPath(
        IERC20Token[] calldata _path,
        uint256 _amount,
        uint256 _minReturn,
        address _beneficiary,
        address _affiliateAccount,
        uint256 _affiliateFee
    ) external payable returns (uint256);

    function rateByPath(
        IERC20Token[] calldata _path,
        uint256 _amount
    ) external view returns (uint256);

    function conversionPath(
        IERC20Token _sourceToken,
        IERC20Token _targetToken
    ) external view returns (address[] memory);
}
