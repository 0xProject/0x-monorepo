/*

  Copyright 2018 ZeroEx Intl.

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

pragma solidity ^0.4.21;
pragma experimental ABIEncoderV2;

import "../../protocol/Exchange/mixins/MTransactions.sol";
import "../../protocol/Exchange/LibOrder.sol";
import "../../utils/Ownable/Ownable.sol";

contract Whitelist is Ownable {

    mapping (address => bool) public isWhitelisted;
    MTransactions EXCHANGE;

    bytes txOriginSignatureType = new bytes(1);

    function Whitelist(address _exchange)
        public
    {
        EXCHANGE = MTransactions(_exchange);
        txOriginSignatureType[0] = 0x04;
    }

    function updateWhitelistStatus(address target, bool isApproved)
        external
        onlyOwner
    {
        isWhitelisted[target] = isApproved;
    }

    function fillOrderIfWhitelisted(
        LibOrder.Order memory order,
        uint256 takerAssetFillAmount,
        uint256 salt,
        bytes memory signature)
        public
    {
        require(isWhitelisted[msg.sender]);
        bytes memory data = abi.encode(order, takerAssetFillAmount, signature);
        EXCHANGE.executeTransaction(salt, msg.sender, data, txOriginSignatureType);
    }
}