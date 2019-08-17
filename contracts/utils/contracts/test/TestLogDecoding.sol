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

import "./TestLogDecodingDownstream.sol";


contract TestLogDecoding {

    /// @dev arbitrary event; fields to not matter.
    event TestEvent(
        uint256 foo,
        bytes bar,
        string car
    );

    /// @dev Emits a local event
    function emitEvent()
        public
    {
        emit TestEvent(256, hex'1234', "4321");
    }

    /// @dev Emits an event in a downstream contract
    function emitEventDownstream()
        public
    {
        TestLogDecodingDownstream testLogDecodingDownstream = new TestLogDecodingDownstream();
        ITestLogDecodingDownstream(testLogDecodingDownstream).emitEvent();
    }

    /// @dev Emits a local event and a downstream event
    function emitEventsLocalAndDownstream()
        public
    {
        emitEvent();
        emitEventDownstream();
    }
}