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

pragma solidity ^0.6;

// Keepin everything together
interface IKyberNetwork {


}


interface IKyberNetworkProxy {

    function getExpectedRateAfterFee(
        address src,
        address dest,
        uint256 srcQty,
        uint256 platformFeeBps,
        bytes calldata hint
    )
        external
        view
        returns (uint256 expectedRate);
}

interface IKyberHintHandler {

    enum TradeType {BestOfAll, MaskIn, MaskOut, Split}

    function buildTokenToEthHint(
        address tokenSrc,
        TradeType tokenToEthType,
        bytes32[] calldata tokenToEthReserveIds,
        uint256[] calldata tokenToEthSplits
    )
        external
        view
        returns (bytes memory hint);

    function buildEthToTokenHint(
        address tokenDest,
        TradeType ethToTokenType,
        bytes32[] calldata ethToTokenReserveIds,
        uint256[] calldata ethToTokenSplits
    )
        external
        view
        returns (bytes memory hint);

    function buildTokenToTokenHint(
        address tokenSrc,
        TradeType tokenToEthType,
        bytes32[] calldata tokenToEthReserveIds,
        uint256[] calldata tokenToEthSplits,
        address tokenDest,
        TradeType ethToTokenType,
        bytes32[] calldata ethToTokenReserveIds,
        uint256[] calldata ethToTokenSplits
    )
        external
        view
        returns (bytes memory hint);
}
