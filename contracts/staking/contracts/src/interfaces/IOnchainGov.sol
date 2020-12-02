pragma solidity ^0.5.16;

interface IOnchainGov {
    // Creates goverence power
    function mint(address account, uint96 amount) external;
    // Removes goverence power
    function burn(address account, uint96 amount) external;
    // Sets goverence power
    function setVotingPower(address account, uint96 amount) external;
}
