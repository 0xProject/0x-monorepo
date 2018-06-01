pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "./MixinForwarderCore.sol";
import "./MixinBuyExactAssets.sol";
import "./MixinMarketBuyERC20Tokens.sol";
import "../utils/Ownable/Ownable.sol";

contract Forwarder is
    MixinForwarderCore,
    MixinBuyExactAssets,
    MixinMarketBuyERC20Tokens,
    Ownable
{
    function Forwarder(
        Exchange _exchange,
        EtherToken _etherToken,
        ZRXToken _zrxToken,
        uint8 erc20AssetProxyId)
        public
        Ownable()
    {
        EXCHANGE = _exchange;
        ETHER_TOKEN = _etherToken;
        ZRX_TOKEN = _zrxToken;
        setERC20ProxyApproval(erc20AssetProxyId);
    }

    /// @dev Default payabale function, this allows us to withdraw WETH
    function()
        public
        payable
    {
        require(msg.sender == address(ETHER_TOKEN), DEFAULT_FUNCTION_WETH_CONTRACT_ONLY);
    }

    /// @dev Sets the allowances to the proxy for this contract
    function setERC20ProxyApproval(uint8 erc20AssetProxyId)
        public
        onlyOwner
    {
        address proxyAddress = EXCHANGE.getAssetProxy(erc20AssetProxyId);
        if (proxyAddress != address(0)) {
            ETHER_TOKEN.approve(proxyAddress, MAX_UINT);
            ZRX_TOKEN.approve(proxyAddress, MAX_UINT);
        }
    }
}