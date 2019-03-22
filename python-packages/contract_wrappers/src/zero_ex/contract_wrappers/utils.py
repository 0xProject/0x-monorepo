from eth_utils import remove_0x_prefix


def match_order_maker_with_cancellor(maker_address, cancellor_address):
    if maker_address != cancellor_address:
        raise Exception(
            "Order with makerAddress {} can not be cancelled by {}".format(
                maker_address, cancellor_address
            )
        )


def normalize_signature(signature):
    return bytes.fromhex(remove_0x_prefix(signature))


def normalize_token_amount(fill_amount):
    return int(fill_amount)
