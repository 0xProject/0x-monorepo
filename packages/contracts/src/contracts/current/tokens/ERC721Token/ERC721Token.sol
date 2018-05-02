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

import "./IERC721Token.sol";
import "./IERC721Receiver.sol";
import "../../utils/SafeMath/SafeMath.sol";

/**
 * @title ERC721 Non-Fungible Token Standard basic implementation
 * @dev see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md
 * Modified from https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/contracts/token/ERC721/ERC721BasicToken.sol
 */
contract ERC721Token is
    IERC721Token,
    SafeMath
{
    // Equals to `bytes4(keccak256("onERC721Received(address,uint256,bytes)"))`
    // which can be also obtained as `ERC721Receiver(0).onERC721Received.selector`
    bytes4 constant ERC721_RECEIVED = 0xf0b9e5ba;

    // Mapping from token ID to owner
    mapping (uint256 => address) internal tokenOwner;

    // Mapping from token ID to approved address
    mapping (uint256 => address) internal tokenApprovals;

    // Mapping from owner to number of owned token
    mapping (address => uint256) internal ownedTokensCount;

    // Mapping from owner to operator approvals
    mapping (address => mapping (address => bool)) internal operatorApprovals;

    /**
    * @dev Guarantees msg.sender is owner of the given token
    * @param _tokenId uint256 ID of the token to validate its ownership belongs to msg.sender
    */
    modifier onlyOwnerOf(uint256 _tokenId) {
        require(ownerOf(_tokenId) == msg.sender);
        _;
    }

    /**
    * @dev Checks msg.sender can transfer a token, by being owner, approved, or operator
    * @param _tokenId uint256 ID of the token to validate
    */
    modifier canTransfer(uint256 _tokenId) {
        require(isApprovedOrOwner(msg.sender, _tokenId));
        _;
    }

    function ERC721Token(
        string _name,
        string _symbol)
        public
    {
        name_ = _name;
        symbol_ = _symbol;
    }

    /**
    * @dev Gets the token name
    * @return string representing the token name
    */
    function name()
        public
        view
        returns (string)
    {
        return name_;
    }

    /**
    * @dev Gets the token symbol
    * @return string representing the token symbol
    */
    function symbol()
        public
        view
        returns (string)
    {
        return symbol_;
    }

    /**
    * @dev Gets the balance of the specified address
    * @param _owner address to query the balance of
    * @return uint256 representing the amount owned by the passed address
    */
    function balanceOf(address _owner)
        public
        view
        returns (uint256)
    {
        require(_owner != address(0));
        return ownedTokensCount[_owner];
    }

    /**
    * @dev Gets the owner of the specified token ID
    * @param _tokenId uint256 ID of the token to query the owner of
    * @return owner address currently marked as the owner of the given token ID
    */
    function ownerOf(uint256 _tokenId)
        public
        view
        returns (address)
    {
        address owner = tokenOwner[_tokenId];
        require(owner != address(0));
        return owner;
    }

    /**
    * @dev Returns whether the specified token exists
    * @param _tokenId uint256 ID of the token to query the existance of
    * @return whether the token exists
    */
    function exists(uint256 _tokenId)
        public
        view
        returns (bool)
    {
        address owner = tokenOwner[_tokenId];
        return owner != address(0);
    }

    /**
    * @dev Approves another address to transfer the given token ID
    * @dev The zero address indicates there is no approved address.
    * @dev There can only be one approved address per token at a given time.
    * @dev Can only be called by the token owner or an approved operator.
    * @param _to address to be approved for the given token ID
    * @param _tokenId uint256 ID of the token to be approved
    */
    function approve(address _to, uint256 _tokenId)
        public
    {
        address owner = ownerOf(_tokenId);
        require(_to != owner);
        require(msg.sender == owner || isApprovedForAll(owner, msg.sender));

        if (getApproved(_tokenId) != address(0) || _to != address(0)) {
            tokenApprovals[_tokenId] = _to;
            emit Approval(owner, _to, _tokenId);
        }
    }

    /**
    * @dev Gets the approved address for a token ID, or zero if no address set
    * @param _tokenId uint256 ID of the token to query the approval of
    * @return address currently approved for a the given token ID
    */
    function getApproved(uint256 _tokenId)
        public
        view
        returns (address)
    {
        return tokenApprovals[_tokenId];
    }

    /**
    * @dev Sets or unsets the approval of a given operator
    * @dev An operator is allowed to transfer all tokens of the sender on their behalf
    * @param _to operator address to set the approval
    * @param _approved representing the status of the approval to be set
    */
    function setApprovalForAll(address _to, bool _approved)
        public
    {
        require(_to != msg.sender);
        operatorApprovals[msg.sender][_to] = _approved;
        emit ApprovalForAll(msg.sender, _to, _approved);
    }

    /**
    * @dev Tells whether an operator is approved by a given owner
    * @param _owner owner address which you want to query the approval of
    * @param _operator operator address which you want to query the approval of
    * @return bool whether the given operator is approved by the given owner
    */
    function isApprovedForAll(address _owner, address _operator)
        public
        view
        returns (bool)
    {
        return operatorApprovals[_owner][_operator];
    }

    /**
    * @dev Transfers the ownership of a given token ID to another address
    * @dev Usage of this method is discouraged, use `safeTransferFrom` whenever possible
    * @dev Requires the msg sender to be the owner, approved, or operator
    * @param _from current owner of the token
    * @param _to address to receive the ownership of the given token ID
    * @param _tokenId uint256 ID of the token to be transferred
    */
    function transferFrom(address _from, address _to, uint256 _tokenId)
        public
        canTransfer(_tokenId)
    {
        require(_from != address(0));
        require(_to != address(0));

        clearApproval(_from, _tokenId);
        removeTokenFrom(_from, _tokenId);
        addTokenTo(_to, _tokenId);

        emit Transfer(_from, _to, _tokenId);
    }

    /**
    * @dev Safely transfers the ownership of a given token ID to another address
    * @dev If the target address is a contract, it must implement `onERC721Received`,
    *  which is called upon a safe transfer, and return the magic value
    *  `bytes4(keccak256("onERC721Received(address,uint256,bytes)"))`; otherwise,
    *  the transfer is reverted.
    * @dev Requires the msg sender to be the owner, approved, or operator
    * @param _from current owner of the token
    * @param _to address to receive the ownership of the given token ID
    * @param _tokenId uint256 ID of the token to be transferred
    */
    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _tokenId)
        public
        canTransfer(_tokenId)
    {
        // solium-disable-next-line arg-overflow
        safeTransferFrom(_from, _to, _tokenId, "");
    }

    /**
    * @dev Safely transfers the ownership of a given token ID to another address
    * @dev If the target address is a contract, it must implement `onERC721Received`,
    *  which is called upon a safe transfer, and return the magic value
    *  `bytes4(keccak256("onERC721Received(address,uint256,bytes)"))`; otherwise,
    *  the transfer is reverted.
    * @dev Requires the msg sender to be the owner, approved, or operator
    * @param _from current owner of the token
    * @param _to address to receive the ownership of the given token ID
    * @param _tokenId uint256 ID of the token to be transferred
    * @param _data bytes data to send along with a safe transfer check
    */
    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _tokenId,
        bytes _data)
        public
        canTransfer(_tokenId)
    {
        transferFrom(_from, _to, _tokenId);
        // solium-disable-next-line arg-overflow
        require(checkAndCallSafeTransfer(_from, _to, _tokenId, _data));
    }

    /**
    * @dev Returns whether the given spender can transfer a given token ID
    * @param _spender address of the spender to query
    * @param _tokenId uint256 ID of the token to be transferred
    * @return bool whether the msg.sender is approved for the given token ID,
    *  is an operator of the owner, or is the owner of the token
    */
    function isApprovedOrOwner(address _spender, uint256 _tokenId)
        internal
        view
        returns (bool)
    {
        address owner = ownerOf(_tokenId);
        return _spender == owner || getApproved(_tokenId) == _spender || isApprovedForAll(owner, _spender);
    }

    /**
    * @dev Internal function to mint a new token
    * @dev Reverts if the given token ID already exists
    * @param _to The address that will own the minted token
    * @param _tokenId uint256 ID of the token to be minted by the msg.sender
    */
    function _mint(address _to, uint256 _tokenId)
        internal
    {
        require(_to != address(0));
        addTokenTo(_to, _tokenId);
        emit Transfer(address(0), _to, _tokenId);
    }

    /**
    * @dev Internal function to burn a specific token
    * @dev Reverts if the token does not exist
    * @param _tokenId uint256 ID of the token being burned by the msg.sender
    */
    function _burn(address _owner, uint256 _tokenId)
        internal
    {
        clearApproval(_owner, _tokenId);
        removeTokenFrom(_owner, _tokenId);
        emit Transfer(_owner, address(0), _tokenId);
    }

    /**
    * @dev Internal function to clear current approval of a given token ID
    * @dev Reverts if the given address is not indeed the owner of the token
    * @param _owner owner of the token
    * @param _tokenId uint256 ID of the token to be transferred
    */
    function clearApproval(address _owner, uint256 _tokenId)
        internal
    {
        require(ownerOf(_tokenId) == _owner);
        if (tokenApprovals[_tokenId] != address(0)) {
            tokenApprovals[_tokenId] = address(0);
            emit Approval(_owner, address(0), _tokenId);
        }
    }

    /**
    * @dev Internal function to add a token ID to the list of a given address
    * @param _to address representing the new owner of the given token ID
    * @param _tokenId uint256 ID of the token to be added to the tokens list of the given address
    */
    function addTokenTo(address _to, uint256 _tokenId)
        internal
    {
        require(tokenOwner[_tokenId] == address(0));
        tokenOwner[_tokenId] = _to;
        ownedTokensCount[_to] = safeAdd(ownedTokensCount[_to], 1);
    }

    /**
    * @dev Internal function to remove a token ID from the list of a given address
    * @param _from address representing the previous owner of the given token ID
    * @param _tokenId uint256 ID of the token to be removed from the tokens list of the given address
    */
    function removeTokenFrom(address _from, uint256 _tokenId)
        internal
    {
        require(ownerOf(_tokenId) == _from);
        ownedTokensCount[_from] = safeSub(ownedTokensCount[_from], 1);
        tokenOwner[_tokenId] = address(0);
    }

    /**
    * @dev Internal function to invoke `onERC721Received` on a target address
    * @dev The call is not executed if the target address is not a contract
    * @param _from address representing the previous owner of the given token ID
    * @param _to target address that will receive the tokens
    * @param _tokenId uint256 ID of the token to be transferred
    * @param _data bytes optional data to send along with the call
    * @return whether the call correctly returned the expected magic value
    */
    function checkAndCallSafeTransfer(
        address _from,
        address _to,
        uint256 _tokenId,
        bytes _data)
        internal
        returns (bool)
    {
        if (!isContract(_to)) {
            return true;
        }
        bytes4 retval = IERC721Receiver(_to).onERC721Received(_from, _tokenId, _data);
        return (retval == ERC721_RECEIVED);
    }

    function isContract(address addr)
        internal
        view
        returns (bool)
    {
        uint256 size;
        // XXX Currently there is no better way to check if there is a contract in an address
        // than to check the size of the code at that address.
        // See https://ethereum.stackexchange.com/a/14016/36603
        // for more details about how this works.
        // TODO Check this again before the Serenity release, because all addresses will be
        // contracts then.
        assembly { size := extcodesize(addr) }  // solium-disable-line security/no-inline-assembly
        return size > 0;
    }
}