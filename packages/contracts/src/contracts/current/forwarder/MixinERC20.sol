pragma solidity ^0.4.22;

import "../tokens/ERC20Token/IERC20Token.sol";
contract MixinERC20 {
    string constant ERROR_TRANSFER_FAILED = "TRANSFER_FAILED";

    function transferToken(
        address token,
        address account,
        uint amount)
        internal
    {
        require(IERC20Token(token).transfer(account, amount), ERROR_TRANSFER_FAILED);
    }
}
