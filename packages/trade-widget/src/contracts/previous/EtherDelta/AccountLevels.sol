pragma solidity ^0.4.19;

contract AccountLevels {
    //given a user, returns an account level
    //0 = regular user (pays take fee and make fee)
    //1 = market maker silver (pays take fee, no make fee, gets rebate)
    //2 = market maker gold (pays take fee, no make fee, gets entire counterparty's take fee as rebate)
    function accountLevel(address user) constant returns(uint) {
        return 0;
    }
}
