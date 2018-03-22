## Forwarding Trade Widget

![trade-widget](https://user-images.githubusercontent.com/27389/37170750-b3b211f2-22d9-11e8-8f75-f886790e0f1d.gif)

#### Development
`yarn run start`

### Concepts

#### Forwarding Contract
This contract accepts a set of orders and is payable. It deposits the paid amount into WETH and then performs the trade on behalf of the user. This allows the user to make a token trade simply with just ETH (avoiding allowances and deposits).

#### Liquidity Provider
This responsible for finding orders. This can be from SRA endpoints, or implemented as a market maker (with an additional end to sign orders). Or even to find ERC721 NFT orders elsewhere.

#### Trade Widget Components
This is a react component which can be used on the website to display tokens offered and brings everything together.


