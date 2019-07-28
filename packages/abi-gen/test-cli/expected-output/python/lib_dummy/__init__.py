"""Generated wrapper for LibDummy Solidity contract."""

# pylint: disable=too-many-arguments

import json
from typing import (  # pylint: disable=unused-import
    Any,
    List,
    Optional,
    Tuple,
    Union,
)

from eth_utils import to_checksum_address
from mypy_extensions import TypedDict  # pylint: disable=unused-import
from hexbytes import HexBytes
from web3.contract import ContractFunction
from web3.datastructures import AttributeDict
from web3.providers.base import BaseProvider

from zero_ex.contract_wrappers._base_contract_wrapper import BaseContractWrapper, ValidatorBase
from zero_ex.contract_wrappers.tx_params import TxParams


# Try to import a custom validator class definition; if there isn't one,
# declare one that we can instantiate for the default argument to the
# constructor for LibDummy below.
try:
    # both mypy and pylint complain about what we're doing here, but this
    # works just fine, so their messages have been disabled here.
    from . import (  # type: ignore # pylint: disable=import-self
        LibDummyValidator,
    )
except ImportError:

    class LibDummyValidator(ValidatorBase):  # type: ignore
        """No-op input validator."""





# pylint: disable=too-many-public-methods,too-many-instance-attributes
class LibDummy(BaseContractWrapper):
    """Wrapper class for LibDummy Solidity contract."""

    def __init__(
        self,
        provider: BaseProvider,
        contract_address: str,
        validator: LibDummyValidator = None,
        private_key: str = None,
    ):
        """Get an instance of wrapper for smart contract.

        :param provider: instance of :class:`web3.providers.base.BaseProvider`
        :param contract_address: where the contract has been deployed
        :param private_key: If specified, transactions will be signed locally,
            via Web3.py's `eth.account.signTransaction()`:code:, before being
            sent via `eth.sendRawTransaction()`:code:.
        """
        if not validator:
            validator = LibDummyValidator(provider, contract_address, private_key)

        super().__init__(
            provider=provider,
            contract_address=contract_address,
            validator=validator,
            private_key=private_key,
        )
        functions = self._web3_eth.contract(
            address=to_checksum_address(contract_address), abi=LibDummy.abi()
        ).functions


    @staticmethod
    def abi():
        """Return the ABI to the underlying contract."""
        return json.loads(
            '[]'  # noqa: E501 (line-too-long)
        )

# pylint: disable=too-many-lines
