/*

  Copyright 2018 ZeroEx Intl.

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

pragma solidity 0.4.24;
pragma experimental ABIEncoderV2;

import "../../protocol/Exchange/interfaces/IExchange.sol";
import "../../tokens/ERC721Token/IERC721Token.sol";
import "../../utils/LibBytes/LibBytes.sol";

contract CompliantForwarder {

    using LibBytes for bytes;

    bytes4 constant internal EXCHANGE_FILL_ORDER_SELECTOR = bytes4(keccak256("fillOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),uint256,bytes)"));
    IExchange internal EXCHANGE;
    IERC721Token internal COMPLIANCE_TOKEN;

    constructor(address exchange, address complianceToken)
        public
    {
        EXCHANGE = IExchange(exchange);
        COMPLIANCE_TOKEN = IERC721Token(complianceToken);
    }

    function fillOrder(
        uint256 salt,
        address signerAddress,
        bytes signedFillOrderTransaction,
        bytes signature
    ) 
        public
    {
        // Validate `signedFillOrderTransaction`
        bytes4 selector = signedFillOrderTransaction.readBytes4(0);
        if (selector != EXCHANGE_FILL_ORDER_SELECTOR) {
            revert("EXCHANGE_TRANSACTION_NOT_FILL_ORDER");
        }

        // Extract maker address from fill order transaction
        // Below is the table of calldata offsets into a fillOrder transaction.
        /**
                    ### parameters 
            0x00      ptr<order>                                                                      
            0x20      takerAssetFillAmount                                                            
            0x40      ptr<signature>                                                                  
                    ### order                                                                           
            0x60      makerAddress                                                                    
            0x80      takerAddress                                                                    
            0xa0      feeRecipientAddress                                                             
            0xc0      senderAddress                                                                   
            0xe0      makerAssetAmount                                                                
            0x100     takerAssetAmount                                                                
            0x120     makerFee                                                                        
            0x140     takerFee                                                                        
            0x160     expirationTimeSeconds                                                           
            0x180     salt                                                                            
            0x1a0     ptr<makerAssetData>                                                             
            0x1c0     ptr<takerAssetData>                                                             
            0x1e0     makerAssetData                                                                  
            *         takerAssetData                                                                  
            *         signature
            ------------------------------
            * Context-dependent offsets, unknown at compile time.
        */
        // Add 0x4 to a given offset to account for the fillOrder selector prepended to `signedFillOrderTransaction`.
        // Add 0xc to the makerAddress since abi-encoded addresses are left padded with 12 bytes.
        // Putting this together: makerAddress = 0x60 + 0x4 + 0xc = 0x70
        address makerAddress = signedFillOrderTransaction.readAddress(0x70);
        
        // Verify maker/taker have been verified by the compliance token.
        if (COMPLIANCE_TOKEN.balanceOf(makerAddress) == 0) {
            revert("MAKER_UNVERIFIED");
        } else if (COMPLIANCE_TOKEN.balanceOf(signerAddress) == 0) {
            revert("TAKER_UNVERIFIED");
        }
        
        // All entities are verified. Execute fillOrder.
        EXCHANGE.executeTransaction(
            salt,
            signerAddress,
            signedFillOrderTransaction,
            signature
        );
    }
}