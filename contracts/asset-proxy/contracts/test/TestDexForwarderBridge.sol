/*

  Copyright 2020 ZeroEx Intl.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

*/

pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;

import "../src/bridges/DexForwarderBridge.sol";
import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";


interface ITestDexForwarderBridge {
    event BridgeTransferFromCalled(
        address caller,
        uint256 inputTokenBalance,
        address inputToken,
        address outputToken,
        address from,
        address to,
        uint256 amount
    );

    event TokenTransferCalled(
        address from,
        address to,
        uint256 amount
    );

    function emitBridgeTransferFromCalled(
        address caller,
        uint256 inputTokenBalance,
        address inputToken,
        address outputToken,
        address from,
        address to,
        uint256 amount
    ) external;

    function emitTokenTransferCalled(
        address from,
        address to,
        uint256 amount
    ) external;
}


interface ITestDexForwarderBridgeTestToken {

    function transfer(address to, uint256 amount)
        external
        returns (bool);

    function mint(address to, uint256 amount)
        external;

    function balanceOf(address owner) external view returns (uint256);
}


contract TestDexForwarderBridgeTestBridge {

    bytes4 private _returnCode;
    string private _revertError;
    uint256 private _transferAmount;
    ITestDexForwarderBridge private _testContract;

    constructor(bytes4 returnCode, string memory revertError) public {
        _testContract = ITestDexForwarderBridge(msg.sender);
        _returnCode = returnCode;
        _revertError = revertError;
    }

    function setTransferAmount(uint256 amount) external {
        _transferAmount = amount;
    }

    function bridgeTransferFrom(
        address outputToken,
        address from,
        address to,
        uint256 amount,
        bytes memory bridgeData
    )
        public
        returns (bytes4 success)
    {
        if (bytes(_revertError).length != 0) {
            revert(_revertError);
        }
        address inputToken = abi.decode(bridgeData, (address));
        _testContract.emitBridgeTransferFromCalled(
            msg.sender,
            ITestDexForwarderBridgeTestToken(inputToken).balanceOf(address(this)),
            inputToken,
            outputToken,
            from,
            to,
            amount
        );
        ITestDexForwarderBridgeTestToken(outputToken).mint(to, _transferAmount);
        return _returnCode;
    }
}


contract TestDexForwarderBridgeTestToken {

    using LibSafeMath for uint256;

    mapping(address => uint256) public balanceOf;
    ITestDexForwarderBridge private _testContract;

    constructor() public {
        _testContract = ITestDexForwarderBridge(msg.sender);
    }

    function transfer(address to, uint256 amount)
        external
        returns (bool)
    {
        balanceOf[msg.sender] = balanceOf[msg.sender].safeSub(amount);
        balanceOf[to] = balanceOf[to].safeAdd(amount);
        _testContract.emitTokenTransferCalled(msg.sender, to, amount);
        return true;
    }

    function mint(address owner, uint256 amount)
        external
    {
        balanceOf[owner] = balanceOf[owner].safeAdd(amount);
    }

    function setBalance(address owner, uint256 amount)
        external
    {
        balanceOf[owner] = amount;
    }
}


contract TestDexForwarderBridge is
    ITestDexForwarderBridge,
    DexForwarderBridge
{
    address private AUTHORIZED_ADDRESS; // solhint-disable-line var-name-mixedcase

    function setAuthorized(address authorized)
        public
    {
        AUTHORIZED_ADDRESS = authorized;
    }

    function createBridge(
        bytes4 returnCode,
        string memory revertError
    )
        public
        returns (address bridge)
    {
        return address(new TestDexForwarderBridgeTestBridge(returnCode, revertError));
    }

    function createToken() public returns (address token) {
        return address(new TestDexForwarderBridgeTestToken());
    }

    function setTokenBalance(address token, address owner, uint256 amount) public {
        TestDexForwarderBridgeTestToken(token).setBalance(owner, amount);
    }

    function setBridgeTransferAmount(address bridge, uint256 amount) public {
        TestDexForwarderBridgeTestBridge(bridge).setTransferAmount(amount);
    }

    function emitBridgeTransferFromCalled(
        address caller,
        uint256 inputTokenBalance,
        address inputToken,
        address outputToken,
        address from,
        address to,
        uint256 amount
    )
        public
    {
        emit BridgeTransferFromCalled(
            caller,
            inputTokenBalance,
            inputToken,
            outputToken,
            from,
            to,
            amount
        );
    }

    function emitTokenTransferCalled(
        address from,
        address to,
        uint256 amount
    )
        public
    {
        emit TokenTransferCalled(
            from,
            to,
            amount
        );
    }

    function balanceOf(address token, address owner) public view returns (uint256) {
        return TestDexForwarderBridgeTestToken(token).balanceOf(owner);
    }

    function _getGstAddress()
        internal
        view
        returns (address gst)
    {
        return address(0);
    }

    function _getERC20BridgeProxyAddress()
        internal
        view
        returns (address erc20BridgeProxyAddress)
    {
        return AUTHORIZED_ADDRESS;
    }
}
