/*
The MIT License (MIT)

Copyright (c) 2016 Smart Contract Solutions, Inc.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

pragma solidity ^0.4.23;

/**
 * @title ERC721 Non-Fungible Token Standard basic interface
 * @dev see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md
 * Modified from https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/contracts/token/ERC721/ERC721Basic.sol
 */
contract IERC721Token {
    string internal name_;
    string internal symbol_;

    event Transfer(
        address indexed _from,
        address indexed _to,
        uint256 _tokenId
    );
    event Approval(
        address indexed _owner,
        address indexed _approved,
        uint256 _tokenId
    );
    event ApprovalForAll(
        address indexed _owner,
        address indexed _operator,
        bool _approved
    );

    function name()
        public
        view
        returns (string);
    function symbol()
        public
        view
        returns (string);

    function balanceOf(address _owner)
        public
        view
        returns (uint256 _balance);
    function ownerOf(uint256 _tokenId)
        public
        view
        returns (address _owner);
    function exists(uint256 _tokenId)
        public
        view
        returns (bool _exists);

    function approve(address _to, uint256 _tokenId)
        public;
    function getApproved(uint256 _tokenId)
        public
        view
        returns (address _operator);

    function setApprovalForAll(address _operator, bool _approved)
        public;
    function isApprovedForAll(address _owner, address _operator)
        public
        view
        returns (bool);

    function transferFrom(
        address _from,
        address _to,
        uint256 _tokenId)
        public;
    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _tokenId)
        public;
    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _tokenId,
        bytes _data)
        public;
}