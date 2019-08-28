/*

  Copyright 2019 ZeroEx Intl.

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

pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;

import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "./TestProtocolFees.sol";


// Disable solhint to allow for more informative comments.
// solhint-disable
contract TestProtocolFeesReceiver {

    // Attach LibSafeMath to uint256
    using LibSafeMath for uint256;

    /* Testing Constants */

    // A constant to represent a maker address.
    address internal constant makerAddress1 = address(1);

    // A constant to represent a maker address that is distinct from the
    // other maker address.
    address internal constant makerAddress2 = address(2);

    /* Testing State */

    struct TestLog {
        address loggedMaker;
        address loggedPayer;
        uint256 loggedProtocolFeePaid;
        uint256 loggedValue;
    }

    TestLog[] testLogs;

    /* Testing Functions */

    function testFillOrderProtocolFees(
        TestProtocolFees testProtocolFees,
        uint256 protocolFeeMultiplier,
        bool shouldSetProtocolFeeCollector
    )
        external
        payable
    {
        // Set up the exchange state for the test.
        setExchangeState(
            testProtocolFees,
            protocolFeeMultiplier,
            shouldSetProtocolFeeCollector
        );

       // Forward all of the value sent to the contract to `fillOrder()` with empty arguments.
       LibOrder.Order memory order;
       order.makerAddress = makerAddress1;
       order.makerAssetAmount = 1;
       order.takerAssetAmount = 1;
       testProtocolFees.fillOrder.value(msg.value)(order, 0, new bytes(0));

       // Ensure that the results of the test were correct.
       verifyFillOrderTestResults(protocolFeeMultiplier, shouldSetProtocolFeeCollector);

       // Clear all state that was set to ensure that future tests are unaffected by this one.
       clearState(testProtocolFees);
    }

    function verifyFillOrderTestResults(
        uint256 protocolFeeMultiplier,
        bool shouldSetProtocolFeeCollector
    )
        internal
    {
        // If the `protocolFeeCollector` was set, then this contract should have been called.
        if (shouldSetProtocolFeeCollector) {
            // Calculate the protocol fee that should be paid.
            uint256 protocolFee = tx.gasprice.safeMul(protocolFeeMultiplier);

            // Ensure that one TestLog was recorded.
            require(testLogs.length == 1, "Incorrect TestLog length for fillOrder test");

            // Get an alias to the test log.
            TestLog memory log = testLogs[0];

            // If the forwarded value was greater than the protocol fee, the protocol fee should
            // have been sent back to this contract.
            if (msg.value >= protocolFee) {
                // Ensure that the protocolFee was forwarded to this contract.
                require(
                    log.loggedValue == protocolFee,
                    "Incorrect eth was received during fillOrder test when adequate ETH was sent"
                );
            } else {
                // Ensure that the protocolFee was forwarded to this contract.
                require(
                    log.loggedValue == 0,
                    "Incorrect eth was received during fillOrder test when inadequate ETH was sent"
                );
            }

            // Ensure that the correct data was logged during this test.
            require(log.loggedMaker == makerAddress1, "Incorrect maker address was logged for fillOrder test");
            require(log.loggedPayer == address(this), "Incorrect taker address was logged for fillOrder test");
            require(log.loggedProtocolFeePaid == protocolFee, "Incorrect protocol fee was logged for fillOrder test");
        } else {
            // Ensure that `protocolFeePaid()` was not called.
            require(testLogs.length == 0, "protocolFeePaid was called");
        }
    }

    function setExchangeState(
        TestProtocolFees testProtocolFees,
        uint256 protocolFeeMultiplier,
        bool shouldSetProtocolFeeCollector
    )
        internal
    {
        if (shouldSetProtocolFeeCollector) {
            testProtocolFees.setProtocolFeeCollector(address(this));
        }
        testProtocolFees.setProtocolFeeMultiplier(protocolFeeMultiplier);
    }

    function clearState(TestProtocolFees testProtocolFees)
        internal
    {
        // Clear exchange state
        testProtocolFees.setProtocolFeeCollector(address(0));
        testProtocolFees.setProtocolFeeMultiplier(0);
        msg.sender.transfer(address(this).balance);

        // Clear this contract's state
        delete testLogs;
    }

    function payProtocolFee(
        address makerAddress,
        address payerAddress,
        uint256 protocolFeePaid
    )
        external
        payable
    {
        testLogs.push(TestLog({
            loggedMaker: makerAddress,
            loggedPayer: payerAddress,
            loggedProtocolFeePaid: protocolFeePaid,
            loggedValue: msg.value
        }));
    }

    function ()
        external
        payable
    {}
}
