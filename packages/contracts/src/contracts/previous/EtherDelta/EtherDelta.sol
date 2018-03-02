pragma solidity ^0.4.19;

import { SafeMath } from "../../utils/SafeMath/SafeMath.sol";
import { AccountLevels } from "./AccountLevels.sol";
import { Token } from "../../tokens/Token/Token.sol";

contract EtherDelta is SafeMath {
    address public admin; //the admin address
    address public feeAccount; //the account that will receive fees
    address public accountLevelsAddr; //the address of the AccountLevels contract
    uint public feeMake; //percentage times (1 ether)
    uint public feeTake; //percentage times (1 ether)
    uint public feeRebate; //percentage times (1 ether)
    mapping (address => mapping (address => uint)) public tokens; //mapping of token addresses to mapping of account balances (token=0 means Ether)
    mapping (address => mapping (bytes32 => bool)) public orders; //mapping of user accounts to mapping of order hashes to booleans (true = submitted by user, equivalent to offchain signature)
    mapping (address => mapping (bytes32 => uint)) public orderFills; //mapping of user accounts to mapping of order hashes to uints (amount of order that has been filled)

    event Order(address tokenGet, uint amountGet, address tokenGive, uint amountGive, uint expires, uint nonce, address user);
    event Cancel(address tokenGet, uint amountGet, address tokenGive, uint amountGive, uint expires, uint nonce, address user, uint8 v, bytes32 r, bytes32 s);
    event Trade(address tokenGet, uint amountGet, address tokenGive, uint amountGive, address get, address give);
    event Deposit(address token, address user, uint amount, uint balance);
    event Withdraw(address token, address user, uint amount, uint balance);

    function EtherDelta(address admin_, address feeAccount_, address accountLevelsAddr_, uint feeMake_, uint feeTake_, uint feeRebate_) {
        admin = admin_;
        feeAccount = feeAccount_;
        accountLevelsAddr = accountLevelsAddr_;
        feeMake = feeMake_;
        feeTake = feeTake_;
        feeRebate = feeRebate_;
    }

    function() {
        throw;
    }

    function changeAdmin(address admin_) {
        if (msg.sender != admin) throw;
        admin = admin_;
    }

    function changeAccountLevelsAddr(address accountLevelsAddr_) {
        if (msg.sender != admin) throw;
        accountLevelsAddr = accountLevelsAddr_;
    }

    function changeFeeAccount(address feeAccount_) {
        if (msg.sender != admin) throw;
        feeAccount = feeAccount_;
    }

    function changeFeeMake(uint feeMake_) {
        if (msg.sender != admin) throw;
        if (feeMake_ > feeMake) throw;
        feeMake = feeMake_;
    }

    function changeFeeTake(uint feeTake_) {
        if (msg.sender != admin) throw;
        if (feeTake_ > feeTake || feeTake_ < feeRebate) throw;
        feeTake = feeTake_;
    }

    function changeFeeRebate(uint feeRebate_) {
        if (msg.sender != admin) throw;
        if (feeRebate_ < feeRebate || feeRebate_ > feeTake) throw;
        feeRebate = feeRebate_;
    }

    function deposit() payable {
        tokens[0][msg.sender] = safeAdd(tokens[0][msg.sender], msg.value);
        Deposit(0, msg.sender, msg.value, tokens[0][msg.sender]);
    }

    function withdraw(uint amount) {
        if (tokens[0][msg.sender] < amount) throw;
        tokens[0][msg.sender] = safeSub(tokens[0][msg.sender], amount);
        if (!msg.sender.call.value(amount)()) throw;
        Withdraw(0, msg.sender, amount, tokens[0][msg.sender]);
    }

    function depositToken(address token, uint amount) {
        //remember to call Token(address).approve(this, amount) or this contract will not be able to do the transfer on your behalf.
        if (token==0) throw;
        if (!Token(token).transferFrom(msg.sender, this, amount)) throw;
        tokens[token][msg.sender] = safeAdd(tokens[token][msg.sender], amount);
        Deposit(token, msg.sender, amount, tokens[token][msg.sender]);
    }

    function withdrawToken(address token, uint amount) {
        if (token==0) throw;
        if (tokens[token][msg.sender] < amount) throw;
        tokens[token][msg.sender] = safeSub(tokens[token][msg.sender], amount);
        if (!Token(token).transfer(msg.sender, amount)) throw;
        Withdraw(token, msg.sender, amount, tokens[token][msg.sender]);
    }

    function balanceOf(address token, address user) constant returns (uint) {
        return tokens[token][user];
    }

    function order(address tokenGet, uint amountGet, address tokenGive, uint amountGive, uint expires, uint nonce) {
        bytes32 hash = sha256(this, tokenGet, amountGet, tokenGive, amountGive, expires, nonce);
        orders[msg.sender][hash] = true;
        Order(tokenGet, amountGet, tokenGive, amountGive, expires, nonce, msg.sender);
    }

    function trade(address tokenGet, uint amountGet, address tokenGive, uint amountGive, uint expires, uint nonce, address user, uint8 v, bytes32 r, bytes32 s, uint amount) {
        //amount is in amountGet terms
        bytes32 hash = sha256(this, tokenGet, amountGet, tokenGive, amountGive, expires, nonce);
        if (!(
            (orders[user][hash] || ecrecover(sha3("\x19Ethereum Signed Message:\n32", hash),v,r,s) == user) &&
            block.number <= expires &&
            safeAdd(orderFills[user][hash], amount) <= amountGet
        )) throw;
        tradeBalances(tokenGet, amountGet, tokenGive, amountGive, user, amount);
        orderFills[user][hash] = safeAdd(orderFills[user][hash], amount);
        Trade(tokenGet, amount, tokenGive, amountGive * amount / amountGet, user, msg.sender);
    }

    function tradeBalances(address tokenGet, uint amountGet, address tokenGive, uint amountGive, address user, uint amount) private {
        uint feeMakeXfer = safeMul(amount, feeMake) / (1 ether);
        uint feeTakeXfer = safeMul(amount, feeTake) / (1 ether);
        uint feeRebateXfer = 0;
        if (accountLevelsAddr != 0x0) {
            uint accountLevel = AccountLevels(accountLevelsAddr).accountLevel(user);
            if (accountLevel==1) feeRebateXfer = safeMul(amount, feeRebate) / (1 ether);
            if (accountLevel==2) feeRebateXfer = feeTakeXfer;
        }
        tokens[tokenGet][msg.sender] = safeSub(tokens[tokenGet][msg.sender], safeAdd(amount, feeTakeXfer));
        tokens[tokenGet][user] = safeAdd(tokens[tokenGet][user], safeSub(safeAdd(amount, feeRebateXfer), feeMakeXfer));
        tokens[tokenGet][feeAccount] = safeAdd(tokens[tokenGet][feeAccount], safeSub(safeAdd(feeMakeXfer, feeTakeXfer), feeRebateXfer));
        tokens[tokenGive][user] = safeSub(tokens[tokenGive][user], safeMul(amountGive, amount) / amountGet);
        tokens[tokenGive][msg.sender] = safeAdd(tokens[tokenGive][msg.sender], safeMul(amountGive, amount) / amountGet);
    }

    function testTrade(address tokenGet, uint amountGet, address tokenGive, uint amountGive, uint expires, uint nonce, address user, uint8 v, bytes32 r, bytes32 s, uint amount, address sender) constant returns(bool) {
        if (!(
            tokens[tokenGet][sender] >= amount &&
            availableVolume(tokenGet, amountGet, tokenGive, amountGive, expires, nonce, user, v, r, s) >= amount
        )) return false;
        return true;
    }

    function availableVolume(address tokenGet, uint amountGet, address tokenGive, uint amountGive, uint expires, uint nonce, address user, uint8 v, bytes32 r, bytes32 s) constant returns(uint) {
        bytes32 hash = sha256(this, tokenGet, amountGet, tokenGive, amountGive, expires, nonce);
        if (!(
            (orders[user][hash] || ecrecover(sha3("\x19Ethereum Signed Message:\n32", hash),v,r,s) == user) &&
            block.number <= expires
        )) return 0;
        uint available1 = safeSub(amountGet, orderFills[user][hash]);
        uint available2 = safeMul(tokens[tokenGive][user], amountGet) / amountGive;
        if (available1<available2) return available1;
        return available2;
    }

    function amountFilled(address tokenGet, uint amountGet, address tokenGive, uint amountGive, uint expires, uint nonce, address user, uint8 v, bytes32 r, bytes32 s) constant returns(uint) {
        bytes32 hash = sha256(this, tokenGet, amountGet, tokenGive, amountGive, expires, nonce);
        return orderFills[user][hash];
    }

    function cancelOrder(address tokenGet, uint amountGet, address tokenGive, uint amountGive, uint expires, uint nonce, uint8 v, bytes32 r, bytes32 s) {
        bytes32 hash = sha256(this, tokenGet, amountGet, tokenGive, amountGive, expires, nonce);
        if (!(orders[msg.sender][hash] || ecrecover(sha3("\x19Ethereum Signed Message:\n32", hash),v,r,s) == msg.sender)) throw;
        orderFills[msg.sender][hash] = amountGet;
        Cancel(tokenGet, amountGet, tokenGive, amountGive, expires, nonce, msg.sender, v, r, s);
    }
}
