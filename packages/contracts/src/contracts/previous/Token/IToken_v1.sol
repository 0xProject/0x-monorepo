pragma solidity ^0.4.18;

contract IToken_v1 {

    /// @notice send `value` token to `to` from `msg.sender`
    /// @param to The address of the recipient
    /// @param value The amount of token to be transferred
    /// @return Whether the transfer was successful or not
    function transfer(address to, uint value)
        public
        returns (bool);

    /// @notice send `value` token to `to` from `from` on the condition it is approved by `from`
    /// @param from The address of the sender
    /// @param to The address of the recipient
    /// @param value The amount of token to be transferred
    /// @return Whether the transfer was successful or not
    function transferFrom(address from, address to, uint value)
        public
        returns (bool);
    
    /// @notice `msg.sender` approves `addr` to spend `value` tokens
    /// @param spender The address of the account able to transfer the tokens
    /// @param value The amount of wei to be approved for transfer
    /// @return Whether the approval was successful or not
    function approve(address spender, uint value)
        public
        returns (bool);

    /// @param owner The address from which the balance will be retrieved
    /// @return The balance
    function balanceOf(address owner)
        public view
        returns (uint);

    /// @param owner The address of the account owning tokens
    /// @param spender The address of the account able to transfer the tokens
    /// @return Amount of remaining tokens allowed to spent
    function allowance(address owner, address spender)
        public view
        returns (uint);

    event Transfer(
        address indexed from,
        address indexed to,
        uint value);
    
    event Approval(
        address indexed owner,
        address indexed spender,
        uint value);
}
