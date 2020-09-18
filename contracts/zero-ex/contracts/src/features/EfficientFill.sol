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

    uint256 FILL_FEE_GAS = 10000;
    bytes2 constant EIP_191_PREFIX = 0x1901;
    bytes32 constant EIP_712_DOMAIN_HASH = 0x1901; // TODO
    uint8 constant CHAIN_ID = 1; // Ethereum mainnet
    uint8 constant V_OFFSET = CHAIN_ID * 2 + 35;

    mapping (bytes32 => uint256) public orderStates;

    function fillKnownPair(
        uint256 pairExpirationFill,
        uint256 makerTakerAmount,
        bytes32 makerSignatureR,
        bytes32 makerSignatureSV,
    )
        payable external
    {
        // Check protocol fee payment
        // NOTE: Fees are accumulated in the contract in aggegrate. Any
        // attribution to makers should be done off-chain. A governance
        // controlled function should take them out and distribute them
        // to whomever.
        require(msg.value >= FILL_FEE_GAS * gasprice());

        // Unpack maker order
        uint32 expiration = uint32(pairExpirationFill >> 128);
        uint32 storageSlot = uint32(pairExpirationFill >> 160);
        uint32 nonce = uint32(pairExpirationFill >> 192);
        uint32 pair = uint32(pairExpirationFill >> 224);
        uint128 makerAmount = uint128(makerTakerAmount);
        uint128 takerAmount = uint128(makerTakerAmount >> 128);

        // Check expiration (UTC in seconds)
        require(expiration < block.timestamp);

        // Decode pair
        // Not passing the token addresses in calldata saves about 700 gas.
        // TODO: Write a second `fill` function that does take addresses.
        address makerToken;
        address takerToken;
        if (pair == 0) { // WETH-DAI
            makerToken = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
            takerToken = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
        } else if (pair == 1) { // DAI-WETH
            makerToken = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
            takerToken = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
        } else {
            // TODO: Add more popular cases
            revert();
        }

        // Process signature
        // Create a nice use friendly EIP-712 message for signatures.
        bytes32 eip712Hash = keccak256(abi.encode(
            EIP_191_PREFIX,
            EIP_712_DOMAIN_HASH,
            keccak256(abi.encode(
                address(this),
                makerAmount,
                makerToken,
                takerAmount,
                takerToken,
                expiration,
                storageSlot,
                nonce,
                pairExpirationFill >> 128,
            ))
        ));
        // Unpack signature S and V
        // NOTE: The signature S parameter has one bit of maleability, which
        // we can use to force it to an even or odd number. The signature V
        // parameter can have only two values for a given chain. We use this
        // to pack S and V together in a single `uint256`.
        address maker = ecrecover(
            orderHash,
            (makerSignatureSV & 1) + V_OFFSET,
            makerSignatureR,
            makerSignatureSV);
        // NOTE: when the signature is invalid, this will (with cryptographic certainty)
        // produce a non-existing address. In that case, the token transferFrom call is
        // expected to fail.

        // Read the storage slot
        // NOTE: Storage slots are indexed by (maker, storageSlot). This allows
        // a maker to re-use slots, saving 15k gas.
        bytes32 storageLocation = keccak256(abi.encode(maker, storageSlot));
        uint256 orderState = orderStates[storageLocation];
        uint128 fillAmount = uint128(orderState);
        uint32 storageExpiration = uint32(orderState >> 128);

        // Check storage nonce
        // NOTE: Not sure if this is better than the nonce based one. The nonce
        // based allows quicker re-use and implicitely cancels the old order
        // the moment the new one is used.
        if (storageExpiration < block.timestamp) {
            // Storage slot has expired and can be reset
            fillAmount = 0;
        } else {
            // This partially prevents maker from re-using a storage slot.
            // NOTE: It is important that storageExpiration is monotonically
            // increasing, otherwise a situation with conflicting orders can
            // result in the longer-duration one being filled twice.
            require(expiration == storageExpiration);

            // Prevent math underflow when maker accidentaly creates a storage
            // slot collision.
            require(fillAmount <= makerAmount);
        }

        // Unpack taker order
        // NOTE: Taker amount is denominated in makerToken. It is taker's
        // off-chain responsibility to compute this value.
        // TODO: It would be nicer to have this in takerToken.
        uint128 makerFillAmount = uint128(pairExpirationFill);
        address taker = msg.sender;

        // Compute fill amounts
        // NOTE: fillAmount >= makerAmount, so no underflow possible.
        makerFillAmount = min(makerFillAmount, makerAmount - fillAmount);
        // NOTE: It is Taker's off-chain responsibility to take care of potential
        // rounding errors. This is made more complicated by fillAmount being able
        // to change between signing and settlement.
        // NOTE: All amounts are uint128, so no overflows possible here.
        // NOTE: If makerAmount is zero then makerFillAmount and takerFillAmount
        // will both be zero, which is fine.
        // TODO: Might need EVM asm here, to avoid Solidity's build in
        // division by zero protection (we want EVMs native behaviour where the
        // result is zero).
        uint128 takerFillAmount = makerFillAmount * takerAmount / makerAmount;

        // Update fill state
        fillAmount += makerFillAmount;
        orderStates[storageLocation] = (uint256(expiration) << 128) | uint256(fillAmount);

        // Transfer tokens
        ALLOWANCE_TARGET.executeCall(haveToken, abi.encodeWithSelector(
            IERC20TokenV06.transferFrom.selector,
            maker,
            taker,
            makerFillAmount
        ));
        ALLOWANCE_TARGET.executeCall(haveToken, abi.encodeWithSelector(
            IERC20TokenV06.transferFrom.selector,
            taker,
            maker,
            takerFillAmount
        ));

        // NOTE: There is no log event. Events cost a lot of gas and don't add
        // anything on-chain. If you want to track fills you can do so by
        // parsing the transactions or watch the contract state delta.
    }
}
