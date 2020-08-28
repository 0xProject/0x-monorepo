object "YulUniswap" {
    // This is the constructor code of the contract.
    code {
        // Deploy the contract
        datacopy(0, dataoffset("runtime"), datasize("runtime"))
        return(0, datasize("runtime"))
    }

    object "runtime" {
        code {
            // Copy call templates to memory
            datacopy(0, dataoffset("CALL_TEMPLATES"), datasize("CALL_TEMPLATES"))

            // Call ALLOWANCE_TARGET.executeCall(HAVE_TOKEN,
            //  "transferFrom(msg.sender, PAIR, haveAmount)")
            // No need to check result, if transfer failed the UniswapV2Pair will
            // reject our trade (or it may succeed if somehow the reserve was out of sync)
            // this is fine for the taker.
            mstore(0x68, caller())
            mstore(0xA8, calldataload(0x04)) // haveAmount
            if call(gas(), 0xF740B67dA229f2f10bcBd38A7979992fCC71B8Eb, 0, 0, 0xE4, 0, 0) {
                // Call PAIR.getReserves()
                // Call never fails (PAIR is trusted)
                // Results are in range (0, 2¹¹²) stored in:
                // wantReserve = mload(0x00)
                // haveReserve = mload(0x20)
                if call(gas(), 0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11, 0, 0xE4, 4, 0, 0x40) {

                    // Call PAIR.swap(wantAmount, 0, msg.sender, new bytes(0))
                    let haveAmountWithFee := mul(calldataload(0x04), 997)
                    mstore(0xED, div(
                        mul(haveAmountWithFee, mload(0x20)),
                        add(haveAmountWithFee, mul(mload(0x00), 1000))
                    ))
                    mstore(0x124, caller())
                    if call(gas(), 0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11, 0, 0, 0xA4, 0, 0) {
                        // Success
                        stop()
                    }
                }
            }

            // A call failed, pass along result
            returndatacopy(
                0,                // copy to memory at 0
                0,                // copy from return data at 0
                returndatasize()  // copy all return data
            )
            revert(0, returndatasize())
        }

        data "CALL_TEMPLATES" hex"bca8c7b5000000000000000000000000C02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc20000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000006423b872dd0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000A478c2975Ab1Ea89e8196811F51A7B7Ade33eB1100000000000000000000000000000000000000000000000000000000000000000902f1ac022c0d9f"
        /*
        bca8c7b5 // executeCall(address, bytes)
        000000000000000000000000C02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
        0000000000000000000000000000000000000000000000000000000000000040
        0000000000000000000000000000000000000000000000000000000000000064
        23b872dd // transferFrom(address, address, uint256)
        0000000000000000000000000000000000000000000000000000000000000000
        000000000000000000000000A478c2975Ab1Ea89e8196811F51A7B7Ade33eB11
        0000000000000000000000000000000000000000000000000000000000000000
        0902f1ac // getReserves()
        022c0d9f // swap(uint256, uint256, address)
        0000000000000000000000000000000000000000000000000000000000000000
        0000000000000000000000000000000000000000000000000000000000000000
        0000000000000000000000000000000000000000000000000000000000000000
        */
    }
}
