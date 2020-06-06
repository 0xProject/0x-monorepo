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

import "../src/transformers/LibERC20Transformer.sol";


contract TestTransformerDeployerTransformer {

    address payable public immutable deployer;

    constructor() public payable {
        deployer = msg.sender;
    }

    modifier onlyDeployer() {
        require(msg.sender == deployer, "TestTransformerDeployerTransformer/ONLY_DEPLOYER");
        _;
    }

    function die()
        external
        onlyDeployer
    {
        selfdestruct(deployer);
    }

    function isDeployedByDeployer(uint32 nonce)
        external
        view
        returns (bool)
    {
        return LibERC20Transformer.getDeployedAddress(deployer, nonce) == address(this);
    }
}
