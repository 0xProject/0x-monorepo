"""Transaction parameters for use with contract wrappers."""

from typing import Optional

import attr


@attr.s(kw_only=True)
class TxParams:
    """Transaction parameters for use with contract wrappers.

    :param from_: default None, string of account address to initiate tx from
    :param value: default None, integer of amount of ETH in Wei for transfer
    :param gas: default None, integer maximum amount of ETH in Wei for gas
    :param grasPrice: default None, integer price of unit of gas
    :param nonce: default None, integer nonce for account
    """

    from_: Optional[str] = attr.ib(default=None)
    value: Optional[int] = attr.ib(
        default=None, converter=attr.converters.optional(int)
    )
    gas: Optional[int] = attr.ib(
        default=None, converter=attr.converters.optional(int)
    )
    gasPrice: Optional[int] = attr.ib(  # pylint: disable=invalid-name
        default=None, converter=attr.converters.optional(int)
    )
    nonce: Optional[int] = attr.ib(
        default=None, converter=attr.converters.optional(int)
    )

    def as_dict(self):
        """Get transaction params as dict appropriate for web3."""
        res = {k: v for k, v in attr.asdict(self).items() if v is not None}
        if "from_" in res:
            res["from"] = res["from_"]
            del res["from_"]
        return res
