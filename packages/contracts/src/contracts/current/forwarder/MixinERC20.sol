pragma solidity ^0.4.24;

import "../tokens/ERC20Token/IERC20Token.sol";

contract MixinERC20
{
    string constant ERROR_TRANSFER_FAILED = "TRANSFER_FAILED";
    bytes4 constant ERC20_TRANSFER_SELECTOR = bytes4(keccak256("transfer(address,uint256)"));

    function transferToken(
        address token,
        address to,
        uint256 amount
    )
        internal
    {
        // Transfer tokens.
        // We do a raw call so we can check the success separate
        // from the return data.
        bool success = token.call(abi.encodeWithSelector(
            ERC20_TRANSFER_SELECTOR,
            to,
            amount
        ));
        require(
            success,
            "TRANSFER_FAILED"
        );
        
        // Check return data.
        // If there is no return data, we assume the token incorrectly
        // does not return a bool. In this case we expect it to revert
        // on failure, which was handled above.
        // If the token does return data, we require that it is a single
        // value that evaluates to true.
        assembly {
            if returndatasize {
                success := 0
                if eq(returndatasize, 32) {
                    // First 64 bytes of memory are reserved scratch space
                    returndatacopy(0, 0, 32)
                    success := mload(0)
                }
            }
        }
        require(
            success,
            "TRANSFER_FAILED"
        );
    }
}
