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

pragma solidity ^0.4.24;

contract LibConstants {
   
    // Asset data for ZRX token. Used for fee transfers.
    // ERC20 proxy id is 0xf47261b0.
    // Kovan ZRX address is 0x6ff6c0ff1d68b964901f986d4c9fa3ac68346570.
    // If we ABI encode these, we get 0xf47261b00000000000000000000000006ff6c0ff1d68b964901f986d4c9fa3ac68346570
    bytes constant public ZRX_ASSET_DATA = "\xf4\x72\x61\xb0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x6f\xf6\xc0\xff\x1d\x68\xb9\x64\x90\x1f\x98\x6d\x4c\x9f\xa3\xac\x68\x34\x65\x70";
}
