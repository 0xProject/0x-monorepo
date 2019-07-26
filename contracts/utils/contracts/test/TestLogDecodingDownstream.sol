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


contract ITestLogDecodingDownstream {

    /// @dev Emits a local event
    function emitEvent() external;
}


contract TestLogDecodingDownstream is
    ITestLogDecodingDownstream
{

    /// @dev event with fields different than those in `TestLogDecoding.TestEvent`
    /// Note: do not include this in the interface
    /// For testing, we want to emit an event that is
    /// not known by the calling contract.
    event TestEvent2(
        uint256 lorem,
        string ipsum
    );

    /// @dev Emits a local event
    function emitEvent()
        external
    {
        emit TestEvent2(256, "4321");
    }
}