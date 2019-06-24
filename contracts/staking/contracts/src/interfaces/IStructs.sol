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


interface IStructs {

    // Allowed signature types.
    enum SignatureType {
        Illegal,            // 0x00, default value
        Invalid,            // 0x01
        EIP712,             // 0x02
        EthSign,            // 0x03
        Wallet,             // 0x04
        NSignatureTypes     // 0x05, number of signature types. Always leave at end.
    }

    struct StakingPoolApproval {
        bytes32 poolId;
        address makerAddress;
    }

    struct Timelock {
        uint64 lockedAt;
        uint96 total;
        uint96 pending;
    }

    struct Pool {
        address payable operatorAddress;
        uint8 operatorShare;
    }

    struct ActivePool {
        bytes32 poolId;
        uint256 feesCollected;
    }
}