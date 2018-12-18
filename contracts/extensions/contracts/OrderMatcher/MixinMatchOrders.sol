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

import "./libs/LibConstants.sol";
import "@0x/contracts-utils/contracts/utils/Ownable/Ownable.sol";


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

            uint256 leftMakerAssetSpreadAmount = matchedFillResults.leftMakerAssetSpreadAmount;
            uint256 rightOrderTakerAssetAmount = rightOrder.takerAssetAmount;

            // Do not attempt to call `fillOrder` if no spread was taken or `rightOrder` has been completely filled
            if (leftMakerAssetSpreadAmount == 0 || matchedFillResults.right.takerAssetFilledAmount == rightOrderTakerAssetAmount) {
                return;
            }

            // The `assetData` fields of the `rightOrder` could have been null for the `matchOrders` call. We reassign them before calling `fillOrder`.
            rightOrder.makerAssetData = leftOrder.takerAssetData;
            rightOrder.takerAssetData = leftOrder.makerAssetData;

            // Query `rightOrder` info to check if it has been completely filled
            // We need to make this check in case the `rightOrder` was partially filled before the `matchOrders` call
            OrderInfo memory orderInfo = EXCHANGE.getOrderInfo(rightOrder);

            // Do not attempt to call `fillOrder` if order has been completely filled
            if (orderInfo.orderTakerAssetFilledAmount == rightOrderTakerAssetAmount) {
                return;
            }

            // We do not need to pass in a signature since it was already validated in the `matchOrders` call
            EXCHANGE.fillOrder(
                rightOrder,
                leftMakerAssetSpreadAmount,
                ""
            );
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
                calldatacopy(
                    0,              // copy to memory at 0
                    0,              // copy from calldata at 0
                    calldatasize()  // copy all calldata
                )

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
                // | 516                       | 32      | leftMakerAssetData Length                   |
                // | 548                       | a       | leftMakerAssetData Contents                 |
                // | 548 + a                   | 32      | leftTakerAssetData Length                   |
                // | 580 + a                   | b       | leftTakerAssetData Contents                 |
                // |                           | 12 * 32 | rightOrder:                                 |
                // | 580 + a + b               |         |   1.  senderAddress                         |
                // | 612 + a + b               |         |   2.  makerAddress                          |
                // | 644 + a + b               |         |   3.  takerAddress                          |
                // | 676 + a + b               |         |   4.  feeRecipientAddress                   |
                // | 708 + a + b               |         |   5.  makerAssetAmount                      |
                // | 740 + a + b               |         |   6.  takerAssetAmount                      |
                // | 772 + a + b               |         |   7.  makerFeeAmount                        |
                // | 804 + a + b               |         |   8.  takerFeeAmount                        |
                // | 836 + a + b               |         |   9.  expirationTimeSeconds                 |
                // | 868 + a + b               |         |   10. salt                                  |
                // | 900 + a + b               |         |   11. offset to rightMakerAssetData (*)     |
                // | 932 + a + b               |         |   12. offset to rightTakerAssetData (*)     |
                // | 964 + a + b               | 32      | rightMakerAssetData Length                  |
                // | 996 + a + b               | c       | rightMakerAssetData Contents                |
                // | 996 + a + b + c           | 32      | rightTakerAssetData Length                  |
                // | 1028 + a + b + c          | d       | rightTakerAssetData Contents                |
                // | 1028 + a + b + c + d      | 32      | leftSignature Length                        |
                // | 1060 + a + b + c + d      | e       | leftSignature Contents                      |
                // | 1060 + a + b + c + d + e  | 32      | rightSignature Length                       |
                // | 1092 + a + b + c + d + e  | f       | rightSignature Contents                     |

                // Call `EXCHANGE.matchOrders`
                let success := call(
                    gas,             // forward all gas
                    exchange,        // call address of Exchange contract
                    0,               // transfer 0 wei
                    0,               // input starts at 0
                    calldatasize(),  // length of input
                    0,               // write output over input
                    288              // length of output is 288 bytes
                )

                if iszero(success) {
                    // Revert with reason if `EXCHANGE.matchOrders` call was unsuccessful
                    returndatacopy(
                        0,                // copy to memory at 0
                        0,                // copy from return data at 0
                        returndatasize()  // copy all return data
                    )
                    revert(0, returndatasize())
                }

                // After calling `matchOrders`, the return data is layed out in memory as:

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

                let rightOrderStart := add(calldataload(36), 4)
    
                // If no spread was taken or if the entire `rightOrderTakerAssetAmount` has been filled, there is no need to call `EXCHANGE.fillOrder`.
                if or(
                    iszero(mload(256)),                                      // iszero(leftMakerAssetSpreadAmount)
                    eq(mload(160), calldataload(add(rightOrderStart, 160)))  // eq(rightOrderTakerAssetFilledAmount, rightOrderTakerAssetAmount)
                ) {
                    return(0, 0)
                }

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

                // We must call `EXCHANGE.getOrderInfo(rightOrder)` before calling `EXCHANGE.fillOrder` to ensure that the order
                // has not already been entirely filled (which is possible if an order was partially filled before the `matchOrders` call).
                // We want the following layout in memory before calling `getOrderInfo`:

                // | Offset                    | Length  | Contents                                    |
                // |---------------------------|---------|-------------------------------------------- |
                // | 544 + a + b               | 4       | `getOrderInfo` function selector            |
                // |                           | 3 * 32  | function parameters:                        |
                // | 548 + a + b               |         |   1. offset to rightOrder (*)               |
                // |                           | 12 * 32 | rightOrder:                                 |
                // | 580 + a + b               |         |   1.  senderAddress                         |
                // | 612 + a + b               |         |   2.  makerAddress                          |
                // | 644 + a + b               |         |   3.  takerAddress                          |
                // | 676 + a + b               |         |   4.  feeRecipientAddress                   |
                // | 708 + a + b               |         |   5.  makerAssetAmount                      |
                // | 740 + a + b               |         |   6.  takerAssetAmount                      |
                // | 772 + a + b               |         |   7.  makerFeeAmount                        |
                // | 804 + a + b               |         |   8.  takerFeeAmount                        |
                // | 836 + a + b               |         |   9.  expirationTimeSeconds                 |
                // | 868 + a + b               |         |   10. salt                                  |
                // | 900 + a + b               |         |   11. offset to rightMakerAssetData (*)     |
                // | 932 + a + b               |         |   12. offset to rightTakerAssetData (*)     |
                // | 964 + a + b               | 32      | rightMakerAssetData Length                  |
                // | 996 + a + b               | c       | rightMakerAssetData Contents                |
                // | 996 + a + b + c           | 32      | rightTakerAssetData Length                  |
                // | 1028 + a + b + c          | d       | rightTakerAssetData Contents                |

                // function selector (4 bytes) + 1 param (32 bytes) must be stored before `rightOrderStart`
                let cdStart := sub(rightOrderStart, 36)

                // `getOrderInfo` selector = 0xc75e0a81
                mstore(cdStart, 0xc75e0a8100000000000000000000000000000000000000000000000000000000)

                // Write offset to `rightOrder`
                mstore(add(cdStart, 4), 32)

                let rightOrderEnd := add(
                    add(rightOrderStart, 484),
                    add(leftMakerAssetDataLen, leftTakerAssetDataLen)                    
                )

                // Call `EXCHANGE.getOrderInfo(rightOrder)`
                success := staticcall(
                    gas,                          // forward all gas
                    exchange,                     // call address of Exchange contract
                    cdStart,                      // start of input
                    sub(rightOrderEnd, cdStart),  // length of input
                    0,                            // write output over old output
                    96                            // output is 96 bytes
                )

                // After calling `EXCHANGE.getOrderInfo`, the return data is layed out in memory as:

                // | Offset                    | Length  | Contents                                    |
                // |---------------------------|---------|-------------------------------------------- |
                // |                           | 3 * 32  | orderInfo                                   |
                // | 0                         |         |   1. orderStatus                            |
                // | 32                        |         |   2. orderHash                              |
                // | 64                        |         |   3. orderTakerAssetFilledAmount            |

                // We do not need to check if the `getOrderInfo` call was successful because it has no possibility of reverting
                // If order has been entirely filled, there is no need to call `EXCHANGE.fillOrder`
                // eq(orderTakerAssetFilledAmount, rightOrderTakerAssetAmount)
                if eq(mload(64), calldataload(add(rightOrderStart, 160))) {
                    return(0, 0)
                }

                // We want the following layout in memory before calling `EXCHANGE.fillOrder`:

                // | Offset                    | Length  | Contents                                    |
                // |---------------------------|---------|-------------------------------------------- |
                // | 480 + a + b               | 4       | `fillOrder` function selector               |
                // |                           | 3 * 32  | function parameters:                        |
                // | 484 + a + b               |         |   1. offset to rightOrder (*)               |
                // | 516 + a + b               |         |   2. takerAssetFillAmount                   |
                // | 548 + a + b               |         |   3. offset to rightSignature (*)           |
                // |                           | 12 * 32 | rightOrder:                                 |
                // | 580 + a + b               |         |   1.  senderAddress                         |
                // | 612 + a + b               |         |   2.  makerAddress                          |
                // | 644 + a + b               |         |   3.  takerAddress                          |
                // | 676 + a + b               |         |   4.  feeRecipientAddress                   |
                // | 708 + a + b               |         |   5.  makerAssetAmount                      |
                // | 740 + a + b               |         |   6.  takerAssetAmount                      |
                // | 772 + a + b               |         |   7.  makerFeeAmount                        |
                // | 804 + a + b               |         |   8.  takerFeeAmount                        |
                // | 836 + a + b               |         |   9.  expirationTimeSeconds                 |
                // | 868 + a + b               |         |   10. salt                                  |
                // | 900 + a + b               |         |   11. offset to rightMakerAssetData (*)     |
                // | 932 + a + b               |         |   12. offset to rightTakerAssetData (*)     |
                // | 964 + a + b               | 32      | rightMakerAssetData Length                  |
                // | 996 + a + b               | c       | rightMakerAssetData Contents                |
                // | 996 + a + b + c           | 32      | rightTakerAssetData Length                  |
                // | 1028 + a + b + c          | d       | rightTakerAssetData Contents                |
                // | 1028 + a + b + c + d      | 32      | rightSignature Length (always 0)            |

                // Write length of signature (always 0 since signature was previously validated)
                mstore(rightOrderEnd, 0)

                // function selector (4 bytes) + 3 params (3 * 32 bytes) must be stored before `rightOrderStart`
                cdStart := sub(rightOrderStart, 100)

                // `fillOrder` selector = 0xb4be83d5
                mstore(cdStart, 0xb4be83d500000000000000000000000000000000000000000000000000000000)

                // Write offset to `rightOrder`
                mstore(add(cdStart, 4), 96)

                // Write `takerAssetFillAmount`, which will be the `leftMakerAssetSpreadAmount` received from the `matchOrders` call
                mstore(add(cdStart, 36), mload(256))

                // Write offset to `rightSignature`
                mstore(
                    add(cdStart, 68),
                    sub(rightOrderEnd, add(cdStart, 4))
                )

                // Call `EXCHANGE.fillOrder(rightOrder, leftMakerAssetSpreadAmount, "")`
                success := call(
                    gas,                                   // forward all gas
                    exchange,                              // call address of Exchange contract
                    0,                                     // transfer 0 wei
                    cdStart,                               // start of input
                    add(sub(rightOrderEnd, cdStart), 32),  // length of input is end - start
                    0,                                     // write output over input
                    0                                      // do not write output to memory
                )

                if iszero(success) {
                    // Revert with reason if `EXCHANGE.fillOrder` call was unsuccessful
                    returndatacopy(
                        0,                // copy to memory at 0
                        0,                // copy from return data at 0
                        returndatasize()  // copy all return data
                    )
                    revert(0, returndatasize())
                }
                
                // Return if `EXCHANGE.fillOrder` did not revert
                return(0, 0)
            
            }

            // Revert if undefined function is called
            revert(0, 0)
        }
    }
}
