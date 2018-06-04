pragma solidity ^0.4.24;

import "../tokens/ERC20Token/IERC20Token.sol";

contract MixinERC20
{
    string constant ERROR_TRANSFER_FAILED = "TRANSFER_FAILED";

    function transferToken(
        address token,
        address account,
        uint amount
    )
        internal
    {
        // Note we can't mix in the 0x ERC20 proxy functionality as ERC20 doesn't define tokenOwner as a default approved
        // when calling transferFrom. We have to move these tokens using transfer directly.
        // TODO: Some ERC20 implementations don't return a boolean correctly and this fails on newer versions of the solidity compiler.
        // We need to solve for this here
        require(IERC20Token(token).transfer(account, amount), ERROR_TRANSFER_FAILED);
    }
}
