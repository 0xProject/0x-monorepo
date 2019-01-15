from eth_abi import encode_abi
from ethereum.utils import sha3 as keccak256, encode_hex, safe_ord, big_endian_to_int, ecrecover_to_pub

EIP191_HEADER = b"\x19\x01"
EIP712_DOMAIN_NAME = b"0x V0x"
EIP712_DOMAIN_VERSION = b"1"
EIP712_DOMAIN_SEPARATOR_SCHEMA_HASH = keccak256(
    b"EIP712Domain(" +
    b"string name," +
    b"string version" +
    b")")
EIP712_DOMAIN_HASH = keccak256(encode_abi(
    ['bytes32', 'bytes32', 'bytes32'],
    [EIP712_DOMAIN_SEPARATOR_SCHEMA_HASH,
     keccak256(EIP712_DOMAIN_NAME),
     keccak256(EIP712_DOMAIN_VERSION)]))
EIP712_VOTE_TYPE_HASH = keccak256(
    b"Vote(" +
    b"uint256 campaignId," +
    b"string preference" +
    b")")

def verify_signature(campaign_id, voter_address, preference, signature):
    # encode and hash vote
    encoded = encode_abi(
        ['bytes32', 'uint256', 'bytes32'],
        [EIP712_VOTE_TYPE_HASH, campaign_id,
         keccak256(preference.encode('utf-8'))])
    hash_struct = keccak256(encoded)
    hashed = keccak256(EIP191_HEADER +
                       EIP712_DOMAIN_HASH +
                       hash_struct)

    # ecrecover
    v = safe_ord(signature[64])
    r = big_endian_to_int(signature[0:32])
    s = big_endian_to_int(signature[32:64])
    if v == 0 or v == 1:
        v += 27

    pub = ecrecover_to_pub(hashed, v, r, s)

    recovered_address = '0x' + encode_hex(keccak256(pub)[-20:])
    return recovered_address == voter_address
