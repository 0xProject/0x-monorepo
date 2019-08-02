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

pragma experimental ABIEncoderV2;

pragma solidity ^0.5.5;


contract AbiGenDummy
{

    uint256 constant internal SOME_CONSTANT = 1234;
    string constant internal REVERT_REASON = "REVERT_WITH_CONSTANT";
    string constant internal REQUIRE_REASON = "REQUIRE_WITH_CONSTANT";

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
        revert("SIMPLE_REVERT");
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
        require(0 > 1, "SIMPLE_REQUIRE");
    }

    function requireWithConstant ()
        public
        pure
    {
        require(0 > 1, REQUIRE_REASON);
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

    event  Withdrawal(address indexed _owner, uint _value);

    function withdraw(uint wad) public {
        emit Withdrawal(msg.sender, wad);
    }

    // test: generated code should normalize address inputs to lowercase
    // add extra inputs to make sure it works with address in any position
    function withAddressInput(address x, uint256 a, uint256 b, address y, uint256 c)
        public
        pure
        returns (address z)
    {
        return x;
    }

    event AnEvent(uint8 param);

    function acceptsBytes(bytes memory a) public pure {}

    /// @dev a method that accepts an array of bytes
    /// @param a the array of bytes being accepted
    function acceptsAnArrayOfBytes(bytes[] memory a) public pure {}

    struct Struct {
        bytes someBytes;
        uint32 anInteger;
        bytes[] aDynamicArrayOfBytes;
        string aString;
    }

    function structInput(Struct memory s) public pure {}

    /// @dev a method that returns a struct
    /// @return a Struct struct
    function structOutput() public pure returns(Struct memory s) {
        bytes[] memory byteArray = new bytes[](2);
        byteArray[0] = '0x123';
        byteArray[1] = '0x321';

        return Struct({
            someBytes: '0x123',
            anInteger: 5,
            aDynamicArrayOfBytes: byteArray,
            aString: "abc"
        });
    }

    struct NestedStruct {
        Struct innerStruct;
        string description;
    }

    function nestedStructInput(NestedStruct memory n) public pure {}
    function nestedStructOutput() public pure returns(NestedStruct memory) {}

    uint someState;
    function nonPureMethod() public returns(uint) { return someState += 1; }
    function nonPureMethodThatReturnsNothing() public { someState += 1; }

    // begin tests for `decodeTransactionData`, `decodeReturnData`

    /// @dev complex input is dynamic and more difficult to decode than simple input.
    struct ComplexInput {
        uint256 foo;
        bytes bar;
        string car;
    }

    /// @dev complex input is dynamic and more difficult to decode than simple input.
    struct ComplexOutput {
        ComplexInput input;
        bytes lorem;
        bytes ipsum;
        string dolor;
    }
    
    /// @dev Tests decoding when both input and output are empty.
    function noInputNoOutput()
        public
        pure
    {
        // NOP
        require(true == true);
    }

    /// @dev Tests decoding when input is empty and output is non-empty.
    function noInputSimpleOutput()
        public
        pure
        returns (uint256)
    {
        return 1991;
    }

    /// @dev Tests decoding when input is not empty but output is empty.
    function simpleInputNoOutput(uint256)
        public
        pure
    {
        // NOP
        require(true == true);
    }

    /// @dev Tests decoding when both input and output are non-empty.
    function simpleInputSimpleOutput(uint256)
        public
        pure
        returns (uint256)
    {
        return 1991;
    }

    /// @dev Tests decoding when the input and output are complex.
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

    /// @dev Tests decoding when the input and output are complex and have more than one argument.
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

    // end tests for `decodeTransactionData`, `decodeReturnData`
}
