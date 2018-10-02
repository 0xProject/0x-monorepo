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

pragma solidity 0.4.24;

import "../../utils/Ownable/Ownable.sol";
import "./libs/LibConstants.sol";


contract MixinMatchOrders is
    Ownable,
    LibConstants
{        
    // The below assembly in the fallback function is functionaly equivalent to the following Solidity code:
    /*
        /// @dev Match two complementary orders that have a profitable spread.
        ///      Each order is filled at their respective price point. However, the calculations are
        ///      carried out as though the orders are both being filled at the right order's price point.
        ///      The profit made by the left order is then used to fill the right order as much as possible.
        ///      This results in a spread being taken in terms of both assets. The spread is held within this contract.
        /// @param leftOrder First order to match.
        /// @param rightOrder Second order to match.
        /// @param leftSignature Proof that order was created by the left maker.
        /// @param rightSignature Proof that order was created by the right maker.
        function matchOrders(
            LibOrder.Order memory leftOrder,
            LibOrder.Order memory rightOrder,
            bytes memory leftSignature,
            bytes memory rightSignature
        )
            public
            onlyOwner
        {
            // Match orders, maximally filling `leftOrder`
            LibFillResults.MatchedFillResults memory matchedFillResults = EXCHANGE.matchOrders(
                leftOrder,
                rightOrder,
                leftSignature,
                rightSignature
            );

            // If a spread was taken, use the spread to fill remaining amount of `rightOrder`
            // Only attempt to fill `rightOrder` if a spread was taken and if not already completely filled
            uint256 leftMakerAssetSpreadAmount = matchedFillResults.leftMakerAssetSpreadAmount;
            if (leftMakerAssetSpreadAmount > 0 && matchedFillResults.right.takerAssetFilledAmount < rightOrder.takerAssetAmount) {
                // The `assetData` fields of the `rightOrder` could have been null for the `matchOrders` call. We reassign them before calling `fillOrder`.
                rightOrder.makerAssetData = leftOrder.takerAssetData;
                rightOrder.takerAssetData = leftOrder.makerAssetData;

                // We do not need to pass in a signature since it was already validated in the `matchOrders` call
                EXCHANGE.fillOrder(
                    rightOrder,
                    leftMakerAssetSpreadAmount,
                    ""
                );
            }
        }
    */
    // solhint-disable-next-line payable-fallback
    function ()
        external
    {
        assembly {
            // The first 4 bytes of calldata holds the function selector
            // `matchOrders` selector = 0x3c28d861
            if eq(
                and(calldataload(0), 0xffffffff00000000000000000000000000000000000000000000000000000000),
                0x3c28d86100000000000000000000000000000000000000000000000000000000
            ) {

                // Load address of `owner`
                let owner := sload(owner_slot)

                // Revert if `msg.sender` != `owner`
                if iszero(eq(owner, caller)) {
                    // Revert with `Error("ONLY_CONTRACT_OWNER")`
                    mstore(0, 0x08c379a000000000000000000000000000000000000000000000000000000000)
                    mstore(32, 0x0000002000000000000000000000000000000000000000000000000000000000)
                    mstore(64, 0x000000134f4e4c595f434f4e54524143545f4f574e4552000000000000000000)
                    mstore(96, 0)
                    revert(0, 100)
                }

                // Load address of Exchange contract
                let exchange := sload(EXCHANGE_slot)

                // Copy calldata to memory
                // The calldata should be identical to the the ABIv2 encoded data required to call `EXCHANGE.matchOrders`
                calldatacopy(0, 0, calldatasize())

                // At this point, calldata and memory have the following layout:

                // | Offset                    | Length  | Contents                                    |
                // |---------------------------|---------|-------------------------------------------- |
                // | 0                         | 4       | `matchOrders` function selector             |
                // |                           | 4 * 32  | function parameters:                        |
                // | 4                         |         |   1. offset to leftOrder (*)                |
                // | 36                        |         |   2. offset to rightOrder (*)               |
                // | 68                        |         |   3. offset to leftSignature (*)            |
                // | 100                       |         |   4. offset to rightSignature (*)           |
                // |                           | 12 * 32 | leftOrder:                                  |
                // | 132                       |         |   1.  senderAddress                         |
                // | 164                       |         |   2.  makerAddress                          |
                // | 196                       |         |   3.  takerAddress                          |
                // | 228                       |         |   4.  feeRecipientAddress                   |
                // | 260                       |         |   5.  makerAssetAmount                      |
                // | 292                       |         |   6.  takerAssetAmount                      |
                // | 324                       |         |   7.  makerFeeAmount                        |
                // | 356                       |         |   8.  takerFeeAmount                        |
                // | 388                       |         |   9.  expirationTimeSeconds                 |
                // | 420                       |         |   10. salt                                  |
                // | 452                       |         |   11. offset to leftMakerAssetData (*)      |
                // | 484                       |         |   12. offset to leftTakerAssetData (*)      |
                // |                           | 12 * 32 | rightOrder:                                 |
                // | 516                       |         |   1.  senderAddress                         |
                // | 548                       |         |   2.  makerAddress                          |
                // | 580                       |         |   3.  takerAddress                          |
                // | 612                       |         |   4.  feeRecipientAddress                   |
                // | 644                       |         |   5.  makerAssetAmount                      |
                // | 676                       |         |   6.  takerAssetAmount                      |
                // | 708                       |         |   7.  makerFeeAmount                        |
                // | 740                       |         |   8.  takerFeeAmount                        |
                // | 772                       |         |   9.  expirationTimeSeconds                 |
                // | 804                       |         |   10. salt                                  |
                // | 836                       |         |   11. offset to rightMakerAssetData (*)     |
                // | 868                       |         |   12. offset to rightTakerAssetData (*)     |
                // | 900                       | 32      | leftMakerAssetData Length                   |
                // | 932                       | a       | leftMakerAssetData Contents                 |
                // | 932 + a                   | 32      | leftTakerAssetData Length                   |
                // | 964 + a                   | b       | leftTakerAssetData Contents                 |
                // | 964 + a + b               | 32      | rightMakerAssetData Length                  |
                // | 996 + a + b               | c       | rightMakerAssetData Contents                |
                // | 996 + a + b + c           | 32      | rightTakerAssetData Length                  |
                // | 1028 + a + b + c          | d       | rightTakerAssetData Contents                |
                // | 1028 + a + b + c + d      | 32      | leftSignature Length                        |
                // | 1060 + a + b + c + d      | e       | leftSignature Contents                      |
                // | 1060 + a + b + c + d + e  | 32      | rightSignature Length                       |
                // | 1092 + a + b + c + d + e  | f       | rightSignature Contents                     |

                // Call `EXCHANGE.matchOrders`
                let matchOrdersSuccess := call(
                    gas,             // forward all gas
                    exchange,        // call address of Exchange contract
                    0,               // transfer 0 wei
                    0,               // input starts at 0
                    calldatasize(),  // length of input
                    0,               // write output over output
                    288              // length of output is 288 bytes
                )

                if iszero(matchOrdersSuccess) {
                    // Revert with reason if `matchOrders` call was unsuccessful
                    revert(0, returndatasize())
                }

                // After calling `matchOrders`, the relevant parts of memory are:

                // | Offset                    | Length  | Contents                                    |
                // |---------------------------|---------|-------------------------------------------- |
                // |                           | 9 * 32  | matchedFillResults                          |
                // | 0                         |         |   1. left.makerAssetFilledAmount            |
                // | 32                        |         |   2. left.takerAssetFilledAmount            |
                // | 64                        |         |   3. left.makerFeePaid                      |
                // | 96                        |         |   4. left.takerFeePaid                      |
                // | 128                       |         |   5. right.makerAssetFilledAmount           |
                // | 160                       |         |   6. right.takerAssetFilledAmount           |
                // | 192                       |         |   7. right.makerFeePaid                     |
                // | 224                       |         |   8. right.takerFeePaid                     |
                // | 256                       |         |   9. leftMakerAssetSpreadAmount             |
                // |                           | 12 * 32 | rightOrder:                                 |
                // | 516                       |         |   1.  senderAddress                         |
                // | 548                       |         |   2.  makerAddress                          |
                // | 580                       |         |   3.  takerAddress                          |
                // | 612                       |         |   4.  feeRecipientAddress                   |
                // | 644                       |         |   5.  makerAssetAmount                      |
                // | 676                       |         |   6.  takerAssetAmount                      |
                // | 708                       |         |   7.  makerFeeAmount                        |
                // | 740                       |         |   8.  takerFeeAmount                        |
                // | 772                       |         |   9.  expirationTimeSeconds                 |
                // | 804                       |         |   10. salt                                  |
                // | 836                       |         |   11. offset to rightMakerAssetData (*)     |
                // | 868                       |         |   12. offset to rightTakerAssetData (*)     |

                let rightOrderStart := add(calldataload(36), 4)

                // Only call `fillOrder` if a spread was taken and `rightOrder` has not been completely filled
                if and(
                    gt(mload(256), 0),                                       // gt(leftMakerAssetSpreadAmount, 0)
                    lt(mload(160), calldataload(add(rightOrderStart, 160)))  // lt(rightOrderTakerAssetFilledAmount, rightOrderTakerAssetAmount)
                ) {
                    
                    // We want the following layout in memory before calling `fillOrder`:

                    // | Offset                    | Length  | Contents                                    |
                    // |---------------------------|---------|-------------------------------------------- |
                    // | 416                       | 4       | `fillOrder` function selector               |
                    // |                           | 3 * 32  | function parameters:                        |
                    // | 420                       |         |   1. offset to rightOrder (*)               |
                    // | 452                       |         |   2. takerAssetFillAmount                   |
                    // | 484                       |         |   3. offset to rightSignature (*)           |
                    // |                           | 12 * 32 | rightOrder:                                 |
                    // | 516                       |         |   1.  senderAddress                         |
                    // | 548                       |         |   2.  makerAddress                          |
                    // | 580                       |         |   3.  takerAddress                          |
                    // | 612                       |         |   4.  feeRecipientAddress                   |
                    // | 644                       |         |   5.  makerAssetAmount                      |
                    // | 676                       |         |   6.  takerAssetAmount                      |
                    // | 708                       |         |   7.  makerFeeAmount                        |
                    // | 740                       |         |   8.  takerFeeAmount                        |
                    // | 772                       |         |   9.  expirationTimeSeconds                 |
                    // | 804                       |         |   10. salt                                  |
                    // | 836                       |         |   11. offset to rightMakerAssetData (*)     |
                    // | 868                       |         |   12. offset to rightTakerAssetData (*)     |
                    // | 900                       | 32      | rightMakerAssetData Length                  |
                    // | 932                       | a       | rightMakerAssetData Contents                |
                    // | 932 + a                   | 32      | rightTakerAssetData Length                  |
                    // | 964                       | b       | rightTakerAssetData Contents                |
                    // | 964 + b                   | 32      | rightSigature Length (always 0)             |

                    // We assume that `leftOrder.makerAssetData == rightOrder.takerAssetData` and `leftOrder.takerAssetData == rightOrder.makerAssetData`
                    // `EXCHANGE.matchOrders` already makes this assumption, so it is likely
                    // that the `rightMakerAssetData` and `rightTakerAssetData` in calldata are empty

                    let leftOrderStart := add(calldataload(4), 4)

                    // Calculate locations of `leftMakerAssetData` and `leftTakerAssetData` in calldata
                    let leftMakerAssetDataStart := add(
                        leftOrderStart,
                        calldataload(add(leftOrderStart, 320))  // offset to `leftMakerAssetData`
                    )
                    let leftTakerAssetDataStart := add(
                        leftOrderStart,
                        calldataload(add(leftOrderStart, 352))  // offset to `leftTakerAssetData`
                    )

                    // Load lengths of `leftMakerAssetData` and `leftTakerAssetData`
                    let leftMakerAssetDataLen := calldataload(leftMakerAssetDataStart)
                    let leftTakerAssetDataLen := calldataload(leftTakerAssetDataStart)

                    // Write offset to `rightMakerAssetData` 
                    mstore(add(rightOrderStart, 320), 384)

                    // Write offset to `rightTakerAssetData`
                    let rightTakerAssetDataOffset := add(416, leftTakerAssetDataLen)
                    mstore(add(rightOrderStart, 352), rightTakerAssetDataOffset)

                    // Copy `leftTakerAssetData` from calldata onto `rightMakerAssetData` in memory
                    calldatacopy(
                        add(rightOrderStart, 384),  // `rightMakerAssetDataStart`
                        leftTakerAssetDataStart,
                        add(leftTakerAssetDataLen, 32)
                    )

                    // Copy `leftMakerAssetData` from calldata onto `rightTakerAssetData` in memory
                    calldatacopy(
                        add(rightOrderStart, rightTakerAssetDataOffset),  // `rightTakerAssetDataStart`
                        leftMakerAssetDataStart,
                        add(leftMakerAssetDataLen, 32)
                    )

                    // Write length of signature (always 0 since signature was previously validated)
                    let rightSignatureStart := add(
                        add(rightOrderStart, rightTakerAssetDataOffset),  // `rightTakerAssetDataStart`
                        add(leftMakerAssetDataLen, 32)                    
                    )
                    mstore(rightSignatureStart, 0)

                    let cdStart := sub(rightOrderStart, 100)

                    // `fillOrder` selector = 0xb4be83d5
                    mstore(cdStart, 0xb4be83d500000000000000000000000000000000000000000000000000000000)

                    // Write offset to `rightOrder`
                    mstore(add(cdStart, 4), 96)

                    // Write `takerAssetFillAmount`
                    mstore(add(cdStart, 36), mload(256))

                    // Write offset to `rightSignature`
                    mstore(add(cdStart, 68), sub(rightSignatureStart, add(cdStart, 4)))

                    let fillOrderSuccess := call(
                        gas,                                         // forward all gas
                        exchange,                                    // call address of Exchange contract
                        0,                                           // transfer 0 wei
                        cdStart,                                     // start of input
                        sub(add(rightSignatureStart, 32), cdStart),  // length of input is end - start
                        0,                                           // write output over input
                        128                                          // length of output is 128 bytes
                    )

                    if fillOrderSuccess {
                        return(0, 0)
                    }
                
                    // Revert with reason if `fillOrder` call was unsuccessful
                    revert(0, returndatasize())
                }

                // Return if `matchOrders` call successful and `fillOrder` was not called
                return(0, 0)
            }

            // Revert if undefined function is called
            revert(0, 0)
        }
    }
}
