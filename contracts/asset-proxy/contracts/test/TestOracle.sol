pragma solidity ^0.5.9;

import "../src/interfaces/IChainlinkOracle.sol";


contract TestOracle is
    IChainlinkOracle
{
    int256 internal answer = 23330504460;

    function setLatestAnswer(int256 answer_)
        external
    {
        answer = answer_;
    }

    function latestAnswer()
        external
        view
        returns (int256)
    {
        return answer;
    }
}
