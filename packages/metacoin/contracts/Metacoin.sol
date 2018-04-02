pragma solidity ^0.4.21;
pragma experimental ABIEncoderV2;

contract Metacoin {
    mapping (address => uint) public balances;

    event Transfer(address indexed _from, address indexed _to, uint256 _value);

    struct TransferData {
        address to;
        uint256 amount;
    }

    function Metacoin() public {
        balances[msg.sender] = 10000;
    }

    function transfer(TransferData transferData) public returns (bool success) {
        if (balances[msg.sender] < transferData.amount) return false;
        balances[msg.sender] -= transferData.amount;
        balances[transferData.to] += transferData.amount;
        Transfer(msg.sender, transferData.to, transferData.amount);
        return true;
    }
}
