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

import "@0x/contracts-erc20/contracts/src/v06/IERC20TokenV06.sol";
import "../external/IAllowanceTarget.sol";

contract EfficientFill {

    IAllowanceTarget constant ALLOWANCE_TARGET = IAllowanceTarget(0xF740B67dA229f2f10bcBd38A7979992fCC71B8Eb);

    uint8 constant CHAIN_ID = 1; // Ethereum mainnet
    uint8 constant V_OFFSET = CHAIN_ID * 2 + 35;

    mapping (uint32 => address) public tokens;
    mapping (bytes32 => uint128) public fillState;

    // Note: Re-useable storage slots. (saves 15k gas)
    // (address, slot_id) => (version, expiry, cancelled, fillAmount)
    // Clearable storage slots (contain expiry)

    bytes2 constant EIP_191_PREFIX = 0x1901;
    bytes32 constant EIP_712_DOMAIN_HASH = 0x1901;

    function fillKnownPair(
        uint256 pairExpirationFill,
        uint256 haveAndWantAmount,
        bytes32 makerSignatureR,
        bytes32 makerSignatureSV,
    )
        payable external
    {
        // Unpack maker order
        uint32 expiration = uint32(pairExpirationFill >> 128);
        uint32 storageSlot = uint32(pairExpirationFill >> 160);
        uint32 slotNonce = uint32(pairExpirationFill >> 192)
        uint32 pair = uint32(pairExpirationFill >> 224);
        uint128 haveAmount = uint128(haveAndWantAmount);
        uint128 wantAmount = uint128(haveAndWantAmount >> 128);

        // Decode pair
        address makerToken;
        address takerToken;
        if (pair == 0) {
            makerToken = 0x;
        } else if (pair == 1) {
            
        } else {
            revert();
        }

        // Process signature
        // Note: R and S are the two SecP256k1 ECDSA signature parameters.
        // They should be reduced mod p = 2^256 - 2^32 - 29 - 28 - 27 - 26 - 24 - 1.
        // For a given value of S, p - S is also a valid value. We can use
        // this to normalize S to an even value, and use the lowest bit to store
        // the y-coordinate recovery bit for the V parameter.
        bytes32 eip712Hash = keccak256(abi.encode(
            EIP_191_PREFIX,
            EIP_712_DOMAIN_HASH,
            keccak256(abi.encode(
                haveToken,
                wantToken,
                haveAmount,
                wantAmount,
                expiration,
                storageSlot,
                nonce,
                pairExpirationFill >> 128,
            ))
        ));
        uint256 makerSignatureS = makerSignatureSV - (makerSignatureSV & 1);
        uint256 makerSignatureSV = V_OFFSET + (makerSignatureSV & 1);
        address maker = ecrecover(
            orderHash,
            makerSignatureV + V_OFFSET,
            makerSignatureR,
            makerSignatureS);
        // Note: when the signature is invalid, this will (with cryptographic certainty)
        // produce a non-existing address. In that case, the token transferFrom call is
        // expected to fail.

        // Storage slot
        bytes32 storageHash = keccak256(abi.encode(
           maker, storageSlot
        ));

        // TODO: 

        // Unpack taker order
        uint128 fillAmount = uint128(pairExpirationFill);
        address taker = msg.sender;

        // Check expiration timestamp in nanoseconds.
        // Note: The fractional part of the timestamp can be used as a nonce.
        require(uint256(expiration) < uint256(block.timestamp) * 1e9);

        // Compute fill amounts
        uint128 fillAmount = fillState[orderHash];

        // Update fill state

        // Transfer tokens
        // Note: This doesn't affect the pair's reserve amounts.
        ALLOWANCE_TARGET.executeCall(haveToken, abi.encodeWithSelector(
            IERC20TokenV06.transferFrom.selector,
            msg.sender,
            pair,
            haveAmount
        ));

        ALLOWANCE_TARGET.executeCall(haveToken, abi.encodeWithSelector(
            IERC20TokenV06.transferFrom.selector,
            msg.sender,
            pair,
            haveAmount
        ));
    }

    function clearExpired(
        address[] addresses,
        bytes32[] slots
    ) {
    }
}
