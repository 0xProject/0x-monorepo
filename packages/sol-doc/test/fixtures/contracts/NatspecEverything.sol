pragma solidity ^0.4.24;

/// @title Contract Title
/// @dev This is a very long documentation comment at the contract level.
/// It actually spans multiple lines, too.
contract NatspecEverything {
    int d;

    /// @dev Constructor @dev
    /// @param p Constructor @param
    constructor(int p) public { d = p; }

    /// @notice publicMethod @notice
    /// @dev publicMethod @dev
    /// @param p publicMethod @param
    /// @return publicMethod @return
    function publicMethod(int p) public pure returns(int r) { return p; }

    /// @dev Fallback @dev
    function () public {}

    /// @notice externalMethod @notice
    /// @dev externalMethod @dev
    /// @param p externalMethod @param
    /// @return externalMethod @return
    function externalMethod(int p) external pure returns(int r) { return p; }

    /// @dev Here is a really long developer documentation comment, which spans
    /// multiple lines, for the purposes of making sure that broken lines are
    /// consolidated into one devdoc comment.
    function methodWithLongDevdoc(int p) public pure returns(int) { return p; }

    /// @dev AnEvent @dev
    /// @param p on this event is an integer.
    event AnEvent(int p);

    /// @dev methodWithSolhintDirective @dev
    // solhint-disable no-empty-blocks
    function methodWithSolhintDirective() public pure {}
}
