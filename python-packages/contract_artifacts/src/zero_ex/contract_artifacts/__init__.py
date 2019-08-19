"""0x smart contract compilation artifacts.

Setup
-----

Install the package with pip::

    pip install 0x-contract-artifacts
"""

import json
from typing import Dict
from pkg_resources import resource_string


class _ArtifactCache:
    """A cache to facilitate lazy & singular loading of contract artifacts."""

    _contract_name_to_abi: Dict[str, Dict] = {}  # class data, not instance

    @classmethod
    def contract_name_to_abi(cls, contract_name: str) -> Dict:
        """Return the ABI for the given contract name.

        First tries to get data from the class level storage
        `_contract_name_to_abi`.  If it's not there, loads it from disk, stores
        it in the class data (for the next caller), and then returns it.
        """
        try:
            return cls._contract_name_to_abi[contract_name]
        except KeyError:
            cls._contract_name_to_abi[contract_name] = json.loads(
                resource_string(
                    "zero_ex.contract_artifacts",
                    f"artifacts/{contract_name}.json",
                )
            )["compilerOutput"]["abi"]
            return cls._contract_name_to_abi[contract_name]


def abi_by_name(contract_name: str) -> Dict:
    """Return the ABI for the named contract.

    Contract names must correspond to files in the package's `artifacts`:code:
    directory, without the `.json`:code: suffix.

        >>> from pprint import pprint
        >>> pprint(abi_by_name("IValidator"))
        [{'constant': True,
          'inputs': [{'internalType': 'bytes32', 'name': 'hash', 'type': 'bytes32'},
                     {'internalType': 'address',
                      'name': 'signerAddress',
                      'type': 'address'},
                     {'internalType': 'bytes', 'name': 'signature', 'type': 'bytes'}],
          'name': 'isValidSignature',
          'outputs': [{'internalType': 'bytes4', 'name': '', 'type': 'bytes4'}],
          'payable': False,
          'stateMutability': 'view',
          'type': 'function'}]
    """
    return _ArtifactCache.contract_name_to_abi(contract_name)
