pragma solidity ^0.4.22;
pragma experimental ABIEncoderV2;

import "./MixinForwarderCore.sol";
import "./MixinBuyExactTokens.sol";
import "./MixinMarketBuyTokens.sol";
import "./MixinBuyNFTTokens.sol";
import "../utils/Ownable/Ownable.sol";

contract Forwarder is
    MixinForwarderCore,
    MixinBuyExactTokens,
    MixinMarketBuyTokens,
    MixinBuyNFTTokens,
    Ownable
{
    function Forwarder(
        Exchange _exchange,
        EtherToken _etherToken,
        ZRXToken _zrxToken,
        uint8 assetProxyId)
        public
        Ownable()
    {
        EXCHANGE = _exchange;
        ETHER_TOKEN = _etherToken;
        ZRX_TOKEN = _zrxToken;
        setERC20ProxyApproval(assetProxyId);
    }

    /// @dev Default payabale function, this allows us to withdraw from WETH
    function()
        public
        payable
    {
        require(msg.sender == address(ETHER_TOKEN), "Default function only allowed by WETH");
    }

    /// @dev Sets the allowances on the proxy for this contract
    function setERC20ProxyApproval(uint8 assetProxyId)
        public
        onlyOwner
    {
        address proxyAddress = EXCHANGE.getAssetProxy(assetProxyId);
        if (proxyAddress != address(0)) {
            ETHER_TOKEN.approve(proxyAddress, MAX_UINT);
            ZRX_TOKEN.approve(proxyAddress, MAX_UINT);
        }
    }
}