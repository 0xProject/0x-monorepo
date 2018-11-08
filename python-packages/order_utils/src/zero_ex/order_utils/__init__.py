"""Order utilities for 0x applications.

Some methods require the caller to pass in a `Web3.HTTPProvider` object.  For
local testing one may construct such a provider pointing at an instance of
`ganache-cli <https://www.npmjs.com/package/ganache-cli>`_ which has the 0x
contracts deployed on it.  For convenience, a docker container is provided for
just this purpose.  To start it: ``docker run -d -p 8545:8545 0xorg/ganache-cli
--gasLimit 10000000 --db /snapshot --noVMErrorsOnRPCResponse -p 8545
--networkId 50 -m "concert load couple harbor equip island argue ramp clarify
fence smart topic"``.
"""
