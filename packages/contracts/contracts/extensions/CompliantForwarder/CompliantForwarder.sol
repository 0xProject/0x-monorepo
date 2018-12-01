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
pragma experimental ABIEncoderV2;

import "../../protocol/Exchange/interfaces/IExchange.sol";
import "../../tokens/ERC721Token/IERC721Token.sol";
import "../../utils/LibBytes/LibBytes.sol";
import "../../utils/ExchangeSelectors/ExchangeSelectors.sol";

contract CompliantForwarder is ExchangeSelectors{

    using LibBytes for bytes;

    IExchange internal EXCHANGE;
    IERC721Token internal COMPLIANCE_TOKEN;

    event ValidatedAddresses (
        bytes32 selector,
        address one,
        address[] addresses
    );

    constructor(address exchange, address complianceToken)
        public
    {
        EXCHANGE = IExchange(exchange);
        COMPLIANCE_TOKEN = IERC721Token(complianceToken);
    }

    function executeTransaction(
        uint256 salt,
        address signerAddress,
        bytes signedExchangeTransaction,
        bytes signature
    ) 
        external
    {
        // Validate `signedFillOrderTransaction`
        address[] memory validatedAddresses;
        bytes32 selectorS;
        address one;
        assembly {
            // Adds address to validate
            function addAddressToValidate(addressToValidate) {
                // Compute `addressesToValidate` memory location
                let addressesToValidate_ := mload(0x40)
                let nAddressesToValidate_ := mload(addressesToValidate_)

                // Increment length
                nAddressesToValidate_ := add(mload(addressesToValidate_), 1)
                mstore(addressesToValidate_, nAddressesToValidate_)

                // Append address to validate
                let offset := mul(32, nAddressesToValidate_)
                mstore(add(addressesToValidate_, offset), addressToValidate)
            }

            function appendMakerAddressFromOrder(paramIndex) -> makerAddress {
                let exchangeTxPtr := calldataload(0x44)
                // Add 0x20 for length offset and 0x04 for selector offset
                let orderPtrRelativeToExchangeTx := calldataload(add(0x4, add(exchangeTxPtr, 0x24))) // 0x60
                let orderPtr := add(0x4,add(exchangeTxPtr, add(0x24, orderPtrRelativeToExchangeTx)))
                makerAddress := calldataload(orderPtr)
                addAddressToValidate(makerAddress)
            }


            // Extract addresses to validate
            let exchangeTxPtr1 := calldataload(0x44)
            let selector := and(calldataload(add(0x4, add(0x20, exchangeTxPtr1))), 0xffffffff00000000000000000000000000000000000000000000000000000000)
            switch selector
            case 0x097bb70b00000000000000000000000000000000000000000000000000000000 /* batchFillOrders */
            {

            }
            case 0x3c28d86100000000000000000000000000000000000000000000000000000000 /* matchOrders */
            {

            }
            case 0xb4be83d500000000000000000000000000000000000000000000000000000000 /* fillOrder */
            {
                one := appendMakerAddressFromOrder(0)
                //appendSignerAddress()
            }
            case 0xd46b02c300000000000000000000000000000000000000000000000000000000 /* cancelOrder */ {}
            default {
                revert(0, 100)
            }

            let addressesToValidate := mload(0x40)
            let nAddressesToValidate := mload(addressesToValidate)
            let newMemFreePtr := add(addressesToValidate, add(0x20, mul(mload(addressesToValidate), 0x20)))
            mstore(0x40, newMemFreePtr)

            // Validate addresses
            /*
            let complianceTokenAddress := sload(COMPLIANCE_TOKEN_slot)
            for {let i := add(32, mload(addressesToValidate))} lt(i, add(addressesToValidate, add(32, mul(nAddressesToValidate, 32)))) {i := add(i, 32)} {
                // call `COMPLIANCE_TOKEN.balanceOf`
                let success := call(
                    gas,                                    // forward all gas
                    complianceTokenAddress,                 // call address of asset proxy
                    0,                                      // don't send any ETH
                    i,                                      // pointer to start of input
                    32,                                     // length of input (one padded address) 
                    0,                                      // write output over memory that won't be reused
                    0                                       // don't copy output to memory
                )
                if eq(success, 0) {
                    revert(0, 100)
                }
            }*/

            validatedAddresses := addressesToValidate
            selectorS := selector
        }

        emit ValidatedAddresses(selectorS, one, validatedAddresses);
        
        // All entities are verified. Execute fillOrder.
        /*
        EXCHANGE.executeTransaction(
            salt,
            signerAddress,
            signedExchangeTransaction,
            signature
        );*/
    }
}