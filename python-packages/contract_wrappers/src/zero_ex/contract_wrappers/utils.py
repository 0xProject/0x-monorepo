from eth_utils import remove_0x_prefix


def normalize_signature(signature):
    return bytes.fromhex(remove_0x_prefix(signature))


def normalize_token_amount(fill_amount):
    return int(fill_amount)
