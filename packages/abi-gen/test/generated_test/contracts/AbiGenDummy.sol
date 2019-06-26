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


contract AbiGenDummy
{

    uint256 constant internal SOME_CONSTANT = 1234;
    string constant internal REVERT_REASON = "VALIDATOR_ERROR";

    function simplePureFunction ()
        public
        pure
        returns (uint256 result)
    {
        return 1;
    }

    function simplePureFunctionWithInput (uint256 x)
        public
        pure
        returns (uint256 sum)
    {
        return 1 + x;
    }

    function pureFunctionWithConstant ()
        public
        pure
        returns (uint256 someConstant)
    {
        return SOME_CONSTANT;
    }

    function simpleRevert ()
        public
        pure
    {
        revert("VALIDATOR_ERROR");
    }

    function revertWithConstant ()
        public
        pure
    {
        revert(REVERT_REASON);
    }

    function simpleRequire ()
        public
        pure
    {
        require(0 > 1, "VALIDATOR_ERROR");
    }

    function requireWithConstant ()
        public
        pure
    {
        require(0 > 1, REVERT_REASON);
    }

    function ecrecoverFn(bytes32 hash, uint8 v, bytes32 r, bytes32 s)
        public
        pure
        returns (address signerAddress)
    {
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        bytes32 prefixedHash = keccak256(abi.encodePacked(prefix, hash));
        return ecrecover(prefixedHash, v, r, s);
    }

}
