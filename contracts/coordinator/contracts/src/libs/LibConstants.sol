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

pragma solidity ^0.5.5;

import "../interfaces/ITransactions.sol";


// solhint-disable var-name-mixedcase
contract LibConstants {

    // The 0x Exchange contract.
    ITransactions internal EXCHANGE;
    // The numerical ID of the network this contract is deployed on.
    uint256 internal CHAIN_ID;

    /// @param _exchange Address of the 0x Exchange contract.
    /// @param _chainId Chain ID of the network this contract is deployed on.
    constructor (address _exchange, uint256 _chainId)
        public
    {
        EXCHANGE = ITransactions(_exchange);
        CHAIN_ID = _chainId;
    }
}
