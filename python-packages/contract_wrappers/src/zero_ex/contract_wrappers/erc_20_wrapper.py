from eth_utils import to_checksum_address
from web3.providers.base import BaseProvider
from zero_ex.contract_artifacts import abi_by_name
from zero_ex.contract_wrappers.contract_wrapper import ContractWrapper


class ERC20Wrapper(ContractWrapper):
    __name__ = "ERC20Wrapper"

    def __init__(
        self,
        provider: BaseProvider,
        account_address: str = None,
        private_key: str = None,
    ):
        super(ERC20Wrapper, self).__init__(
            provider=provider,
            account_address=account_address,
            private_key=private_key,
        )

    def _erc20(self, token_address):
        return self._web3.eth.contract(
            address=to_checksum_address(token_address),
            abi=abi_by_name("ERC20Token"),
        )

    def transfer(
        self, token_address, to, value, tx_opts=None, validate_only=False
    ):
        token_address = self._validate_and_checksum_address(token_address)
        to = self._validate_and_checksum_address(to)
        value = int(value)
        func = self._erc20(token_address).functions.transfer(to, value)
        return self._invoke_function_call(
            func=func, tx_opts=tx_opts, validate_only=validate_only
        )

    def approve(
        self, token_address, spender, value, tx_opts=None, validate_only=False
    ):
        token_address = self._validate_and_checksum_address(token_address)
        spender = self._validate_and_checksum_address(spender)
        value = int(value)
        func = self._erc20(token_address).functions.approve(spender, value)
        return self._invoke_function_call(
            func=func, tx_opts=tx_opts, validate_only=validate_only
        )

    def transfer_from(
        self,
        token_address,
        from_,
        to,
        value,
        tx_opts=None,
        validate_only=False,
    ):
        token_address = self._validate_and_checksum_address(token_address)
        from_ = self._validate_and_checksum_address(from_)
        to = self._validate_and_checksum_address(to)
        value = int(value)
        func = self._erc20(token_address).functions.transferFrom(
            from_, to, value
        )
        return self._invoke_function_call(
            func=func, tx_opts=tx_opts, validate_only=validate_only
        )

    def total_supply(self, token_address):
        token_address = self._validate_and_checksum_address(token_address)
        func = self._erc20(token_address).functions.totalSupply()
        return self._invoke_function_call(
            func=func, tx_opts=None, validate_only=True
        )

    def balance_of(self, token_address, who):
        token_address = self._validate_and_checksum_address(token_address)
        who = self._validate_and_checksum_address(who)
        func = self._erc20(token_address).functions.balanceOf(who)
        return self._invoke_function_call(
            func=func, tx_opts=None, validate_only=True
        )

    def allowance(self, token_address, owner, spender):
        token_address = self._validate_and_checksum_address(token_address)
        owner = self._validate_and_checksum_address(owner)
        spender = self._validate_and_checksum_address(spender)
        func = self._erc20(token_address).functions.allowance(owner, spender)
        return self._invoke_function_call(
            func=func, tx_opts=None, validate_only=True
        )

    def get_transfer_event(self, token_address, tx_hash):
        token_address = self._validate_and_checksum_address(token_address)
        return (
            self._erc20(token_address)
            .events.Transfer()
            .processReceipt(tx_hash)
        )

    def get_approval_event(self, token_address, tx_hash):
        token_address = self._validate_and_checksum_address(token_address)
        return (
            self._erc20(token_address)
            .events.Approval()
            .processReceipt(tx_hash)
        )
