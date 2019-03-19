"""A Web3 provider for interacting with a hosted node with a local private key."""
from web3 import Web3, HTTPProvider
from web3.middleware import construct_sign_and_send_raw_middleware
from eth_account.messages import defunct_hash_message
from hexbytes import HexBytes


class LocalKeyHTTPProvider(HTTPProvider):
    """
    This provider intercepts all "eth-sign" requests to always sign messages via
    a local private key and includes a middleware that captures transactions,
    signs them, and sends them as raw transactions.
    """
    __name__ = "LocalKeyHTTPProvider"

    def __init__(self, rpc_url, private_key):
        """Create an instance of a Web3 http provider with a private key.

        Keyword arguments:
        rpc_url - - string of the URL of the Web3 service
        private_key - - hex bytes or hex string of private key for signing transactions
            (must be convertible to `HexBytes`)
        """
        super(LocalKeyHTTPProvider, self).__init__(rpc_url)
        self._private_key = private_key
        self._web3_instance = Web3(self)
        self._web3_instance.middleware_stack.add(
            construct_sign_and_send_raw_middleware(private_key)
        )

    def account(self):
        """Get the account address as a hexstr"""
        return self._web3_instance.eth.account.privateKeyToAccount(  # pylint: disable=no-member
            self._private_key
        ).lower()

    def make_request(self, method, params):
        """Intercept "eth-sign" requests to always sign messages with the local private key.
        Messages are always signed via the signHash method in eth-account.

        Implementation of the signHash method:
        https://github.com/ethereum/eth-account/blob/692943d3bdbc3e05aa88cfc9444890b79e3922e1/eth_account/account.py#L333
        """
        if method == "eth_sign":
            msg_hash_hexbytes = defunct_hash_message(HexBytes(params[1]))
            ec_signature = self._web3_instance.eth.account.signHash(  # pylint: disable=no-member
                msg_hash_hexbytes,
                private_key=self._private_key,
            )
            return {"result": ec_signature.signature}
        return super(LocalKeyHTTPProvider, self).make_request(method, params)

    def web3(self):
        """Get the web3 instance of this provider"""
        return self._web3_instance
