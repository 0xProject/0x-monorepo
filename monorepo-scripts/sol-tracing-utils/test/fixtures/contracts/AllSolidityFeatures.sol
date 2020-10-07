// Examples taken from the Solidity documentation online.

// for pragma version numbers, see https://docs.npmjs.com/misc/semver#versions
pragma solidity 0.4.0;
pragma solidity ^0.4.0;

import "SomeFile.sol";
import "SomeFile.sol" as SomeOtherFile;
import * as SomeSymbol from "AnotherFile.sol";
import {symbol1 as alias, symbol2} from "File.sol";

interface i {
  function f();
}

contract c {
  function c()
  {
      val1 = 1 wei;    // 1
      val2 = 1 szabo;  // 1 * 10 ** 12
      val3 = 1 finney; // 1 * 10 ** 15
      val4 = 1 ether;  // 1 * 10 ** 18
 }
  uint256 val1;
  uint256 val2;
  uint256 val3;
  uint256 val4;
}

contract test {
    enum ActionChoices { GoLeft, GoRight, GoStraight, SitStill }

    function test()
    {
        choices = ActionChoices.GoStraight;
    }
    function getChoice() returns (uint d)
    {
        d = uint256(choices);
    }
    ActionChoices choices;
}

contract Base {
    function Base(uint i)
    {
        m_i = i;
    }
    uint public m_i;
}
contract Derived is Base(0) {
    function Derived(uint i) Base(i) {}
}

contract C {
  uint248 x; // 31 bytes: slot 0, offset 0
  uint16 y; // 2 bytes: slot 1, offset 0 (does not fit in slot 0)
  uint240 z; // 30 bytes: slot 1, offset 2 bytes
  uint8 a; // 1 byte: slot 2, offset 0 bytes
  struct S {
    uint8 a; // 1 byte, slot +0, offset 0 bytes
    uint256 b; // 32 bytes, slot +1, offset 0 bytes (does not fit)
  }
  S structData; // 2 slots, slot 3, offset 0 bytes (does not really apply)
  uint8 alpha; // 1 byte, slot 4 (start new slot after struct)
  uint16[3] beta; // 3*16 bytes, slots 5+6 (start new slot for array)
  uint8 gamma; // 1 byte, slot 7 (start new slot after array)
}

contract test {
  function f(uint x, uint y) returns (uint z) {
    var c = x + 3;
    var b = 7 + (c * (8 - 7)) - x;
    return -(-b | 0);
  }
}

contract test {
  function f(uint x, uint y) returns (uint z) {
    return 10;
  }
}

contract c {
  function () returns (uint) { return g(8); }
  function g(uint pos) internal returns (uint) { setData(pos, 8); return getData(pos); }
  function setData(uint pos, uint value) internal { data[pos] = value; }
  function getData(uint pos) internal { return data[pos]; }
  mapping(uint => uint) data;
}

contract Sharer {
    function sendHalf(address addr) returns (uint balance) {
        if (!addr.send(msg.value/2))
            throw; // also reverts the transfer to Sharer
        return address(this).balance;
    }
}

/// @dev Models a modifiable and iterable set of uint values.
library IntegerSet
{
  struct data
  {
    /// Mapping item => index (or zero if not present)
    mapping(uint => uint) index;
    /// Items by index (index 0 is invalid), items with index[item] == 0 are invalid.
    uint[] items;
    /// Number of stored items.
    uint size;
  }
  function insert(data storage self, uint value) returns (bool alreadyPresent)
  {
    uint index = self.index[value];
    if (index > 0)
      return true;
    else
    {
      if (self.items.length == 0) self.items.length = 1;
      index = self.items.length++;
      self.items[index] = value;
      self.index[value] = index;
      self.size++;
      return false;
    }
  }
  function remove(data storage self, uint value) returns (bool success)
  {
    uint index = self.index[value];
    if (index == 0)
      return false;
    delete self.index[value];
    delete self.items[index];
    self.size --;
  }
  function contains(data storage self, uint value) returns (bool)
  {
    return self.index[value] > 0;
  }
  function iterate_start(data storage self) returns (uint index)
  {
    return iterate_advance(self, 0);
  }
  function iterate_valid(data storage self, uint index) returns (bool)
  {
    return index < self.items.length;
  }
  function iterate_advance(data storage self, uint index) returns (uint r_index)
  {
    index++;
    while (iterate_valid(self, index) && self.index[self.items[index]] == index)
      index++;
    return index;
  }
  function iterate_get(data storage self, uint index) returns (uint value)
  {
      return self.items[index];
  }
}

/// How to use it:
contract User
{
  /// Just a struct holding our data.
  IntegerSet.data data;
  /// Insert something
  function insert(uint v) returns (uint size)
  {
    /// Sends `data` via reference, so IntegerSet can modify it.
    IntegerSet.insert(data, v);
    /// We can access members of the struct - but we should take care not to mess with them.
    return data.size;
  }
  /// Computes the sum of all stored data.
  function sum() returns (uint s)
  {
    for (var i = IntegerSet.iterate_start(data); IntegerSet.iterate_valid(data, i); i = IntegerSet.iterate_advance(data, i))
      s += IntegerSet.iterate_get(data, i);
  }
}

// This broke it at one point (namely the modifiers).
contract DualIndex {
  mapping(uint => mapping(uint => uint)) data;
  address public admin;

  modifier restricted { if (msg.sender == admin) _; }

  function DualIndex() {
    admin = msg.sender;
  }

  function set(uint key1, uint key2, uint value) restricted {
    uint[2][4] memory defaults; // "memory" broke things at one time.
    data[key1][key2] = value;
  }

  function transfer_ownership(address _admin) restricted {
    admin = _admin;
  }

  function lookup(uint key1, uint key2) returns(uint) {
    return data[key1][key2];
  }
}

contract A {

}

contract B {

}

contract C is A, B {

}

contract TestPrivate
{
  uint private value;
}

contract TestInternal
{
  uint internal value;
}

contract FromSolparse is A, B, TestPrivate, TestInternal {
  function() {
    uint a = 6 ** 9;
    var (x) = 100;
    uint y = 2 days;
  }
}

contract CommentedOutFunction {
  // FYI: This empty function, as well as the commented
  // out function below (bad code) is important to this test.
  function() {

  }

  // function something()
  //  uint x = 10;
  // }
}

library VarHasBrackets {
	string constant specialRight = "}";
	//string storage specialLeft = "{";
}

library UsingExampleLibrary {
  function sum(uint[] storage self) returns (uint s) {
    for (uint i = 0; i < self.length; i++)
      s += self[i];
  }
}

contract UsingExampleContract {
  using UsingExampleLibrary for uint[];
}

contract NewStuff {
  uint[] b;

  function someFunction() payable {
    string storage a = hex"ab1248fe";
    b[2+2];
  }
}

// modifier with expression
contract MyContract {
  function fun() mymodifier(foo.bar()) {}
}

library GetCode {
    function at(address _addr) returns (bytes o_code) {
        assembly {
            // retrieve the size of the code, this needs assembly
            let size := extcodesize(_addr)
            // allocate output byte array - this could also be done without assembly
            // by using o_code = new bytes(size)
            o_code := mload(0x40)
            // new "memory end" including padding
            mstore(0x40, add(o_code, and(add(add(size, 0x20), 0x1f), not(0x1f))))
            // store length in memory
            mstore(o_code, size)
            // actually retrieve the code, this needs assembly
            extcodecopy(_addr, add(o_code, 0x20), 0, size)
        }
    }
}

contract assemblyLocalBinding {
  function test(){
    assembly {
      let v := 1
      let x := 0x00
      let y := x
      let z := "hello"
    }
  }
}

contract assemblyReturn {
  uint a = 10;

  function get() constant returns(uint) {
    assembly {
        mstore(0x40, sload(0))
        byte(0)
        address(0)
        return(0x40,32)
    }
  }
}

contract usesConst {
  uint const = 0;
}

contract memoryArrays {
  uint seven = 7;

  function returnNumber(uint number) returns (uint){
    return number;
  }

  function alloc() {
    uint[] memory a = new uint[](7);
    uint[] memory b = new uint[](returnNumber(seven));
  }
}

contract DeclarativeExpressions {
  uint a;
  uint b = 7;
  uint b2=0;
  uint public c;
  uint constant public d;
  uint public constant e;
  uint private constant f = 7;
  struct S { uint q;}

  function ham(S storage s1, uint[] storage arr) internal {
    uint x;
    uint y = 7;
    S storage s2 = s1;
    uint[] memory stor;
    uint[] storage stor2 = arr;
  }
}

contract VariableDeclarationTuple {
  function getMyTuple() returns (bool, bool){
    return (true, false);
  }

  function ham (){
    var (x, y) = (10, 20);
    var (a, b) = getMyTuple();
    var (,c) = (10, 20);
    var (d,,) = (10, 20, 30);
    var (,e,,f,) = (10, 20, 30, 40, 50);

    var (
      num1, num2,
      num3, ,num5
    ) = (10, 20, 30, 40, 50);
  }
}

contract TypeIndexSpacing {
  uint [ 7 ] x;
  uint  []  y;
}

contract Ballot {

    struct Voter {
        uint weight;
        bool voted;
    }

    function abstain() returns (bool) {
      return false;
    }

    function foobar() payable owner (myPrice) returns (uint[], address myAdd, string[] names) {}
    function foobar() payable owner (myPrice) returns (uint[], address myAdd, string[] names);

    Voter you = Voter(1, true);

    Voter me = Voter({
        weight: 2,
        voted: abstain()
    });

    Voter airbnb = Voter({
      weight: 2,
      voted: true,
    });
}

contract multilineReturn {
  function a() returns (uint x) {
    return
      5;
  }
}
