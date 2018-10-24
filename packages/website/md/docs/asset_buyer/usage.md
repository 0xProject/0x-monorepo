#### Construction

Connecting to a standard relayer API compliant url:

```typescript
const provider = web3.currentProvider;
const apiUrl = 'https://api.relayer.com/v2';
const assetBuyer = AssetBuyer.getAssetBuyerForStandardRelayerAPIUrl(provider, apiUrl);
```

Providing your own orders:

```typescript
const provider = web3.currentProvider;
const orders = []; // get these from your own API, a relayer, a friend, from anywhere
const assetBuyer = AssetBuyer.getAssetBuyerForProvidedOrders(provider, orders);
```

#### Get a quote

A [BuyQuote](#types-BuyQuote) object contains enough information to display buy information to an end user

```typescript
const erc20TokenAddress = '0x5fa3c....';
const amountToBuy = new BigNumber(50000000000000000000);
const buyQuote = await assetBuyer.getBuyQuoteForERC20TokenAddressAsync(erc20TokenAddress, amountToBuy);
const quoteInfo = buyQuote.worstCaseQuoteInfo;
console.log(quoteInfo.ethAmount); // the total amount the user needs to pay to buy the desired amount (including ZRX fees)
console.log(quoteInfo.feeAmount); // a portion of the total ethAmount above that was used to buy affiliate fees
console.log(quoteInfo.ethPerAssetPrice); // the rate that this quote provides (e.g. 0.0035ETH / REP)
```

#### Perform a buy

Pass the [BuyQuote](#types-BuyQuote) object from above back to the assetBuyer in order to initiate the buy transaction

```typescript
const txHash = await assetBuyer.executeBuyQuoteAsync(buyQuote); // the hash of the transaction submitted to the Ethereum network
```
