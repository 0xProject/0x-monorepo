pragma solidity ^0.5.3;

// Contract to test safe transfer behavior.
contract ERC1155MockReceiver {
    bytes4 constant public ERC1155_RECEIVED = 0xf23a6e61;
    bytes4 constant public ERC1155_BATCH_RECEIVED = 0xbc197c81;
    bytes4 constant public NOT_ERC1155_RECEIVED = 0xa23a6e60; // Some random value

    // Keep values from last received contract.
    bool public shouldReject;

    bytes public lastData;
    address public lastOperator;
    address public lastFrom;
    uint256 public lastId;
    uint256 public lastValue;

    function setShouldReject(bool _value) public {
        shouldReject = _value;
    }

    function onERC1155Received(address _operator, address _from, uint256 _id, uint256 _value, bytes calldata _data) external returns(bytes4) {
        lastOperator = _operator;
        lastFrom = _from;
        lastId = _id;
        lastValue = _value;
        lastData = _data;
        if (shouldReject == true) {
            return NOT_ERC1155_RECEIVED;
        } else {
            return ERC1155_RECEIVED;
        }
    }

    function onERC1155BatchReceived(address _operator, address _from, uint256[] calldata _ids, uint256[] calldata _values, bytes calldata _data) external returns(bytes4) {
        lastOperator = _operator;
        lastFrom = _from;
        lastId = _ids[0];
        lastValue = _values[0];
        lastData = _data;
        if (shouldReject == true) {
            return NOT_ERC1155_RECEIVED;
        } else {
            return ERC1155_BATCH_RECEIVED;
        }
    }
}
