pragma solidity ^0.5.9;

import "../src/Ownable.sol";


contract TestOwnable is
    Ownable
{
    function externalOnlyOwner()
        external
        onlyOwner
    {} // solhint-disable-line no-empty-blocks
}
