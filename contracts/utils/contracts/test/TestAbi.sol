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
pragma experimental ABIEncoderV2;


contract TestAbi {

    struct ComplexInput {
        uint256 foo;
        bytes bar;
        string car;
    }

    struct ComplexOutput {
        ComplexInput input;
        bytes lorem;
        bytes ipsum;
        string dolor;
    }
    
    function noInputNoOutput()
        public
        pure
    {
        // NOP
        require(true == true);
    }

    function noInputSimpleOutput()
        public
        pure
        returns (uint256)
    {
        return 1991;
    }

    function simpleInputNoOutput(uint256)
        public
        pure
    {
        // NOP
        require(true == true);
    }

    function simpleInputSimpleOutput(uint256)
        public
        pure
        returns (uint256)
    {
        return 1991;
    }

    function complexInputComplexOutput(ComplexInput memory complexInput)
        public
        pure
        returns (ComplexOutput memory)
    {
        return ComplexOutput({
            input: complexInput,
            lorem: hex'12345678',
            ipsum: hex'87654321',
            dolor: "amet"
        });
    }

    function multiInputMultiOutput(
        uint256,
        bytes memory,
        string memory
    )
        public
        pure
        returns (
            bytes memory,
            bytes memory,
            string memory
        )
    {
        return (
            hex'12345678',
            hex'87654321',
            "amet"
        );
    }

    function ()
        external
    {
        address addr = address(this);
        assembly {
            // copy calldata to memory
            calldatacopy(
                0x0,
                0x0,
                calldatasize()
            )
            // execute transaction
            let success := call(
                gas,                    // send all gas.
                addr,                   // call into this contract.
                0,                      // don't send any ether.
                0x0,                    // input is `txData`.
                calldatasize(),         // input length is that of `txData`.
                0x0,                    // any return data goes at mem address 0x0.
                0                       // there is no fixed return value size.
            )

            // copy return data to memory
            returndatacopy(
                0x0,
                0x0,
                returndatasize()
            )

            // rethrow any exceptions
            if iszero(success) {
                revert(0, returndatasize())
            }

            // return call results
            return(0, returndatasize())
        }
    }
}
