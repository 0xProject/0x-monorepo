# 0x Contract Benchmarks

## Setup
Benchmarking the currently deployed version of the contracts (0x v3) requires
replacing "instanbul" with "constantinople" in all of the "compiler.json" files
in the `contracts/` directory of the monorepo. Additionally, this change must
also be made in `contracts/test-utils/src/web3_wrapper.ts`.

Additionally, the block gas limit can be changed to explore the maximum sizes of
orders with higher block gas limits.

## Exchange

### Multi-Asset Proxy Order Maximum Size

#### NFT Use Case
The NFT use case is characterized by a maker asset data that is multi asset data with
erc721 asset data nested and maker asset data that is erc20 asset data. The maximum
number of nested erc721 asset data that can be included with a 9.6 million block gas
limit is 465. With a block gas limit of 9 million, this number is reduced to 436.
