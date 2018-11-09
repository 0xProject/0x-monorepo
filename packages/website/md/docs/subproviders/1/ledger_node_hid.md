By default, node-hid transport support is an optional dependency. This is due to the requirement of native usb developer packages on the host system. If these aren't installed the entire `npm install` fails. We also no longer export node-hid transport client factories. To re-create this see our integration tests or follow the example below:

```typescript
import Eth from '@ledgerhq/hw-app-eth';
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid';
async function ledgerEthereumNodeJsClientFactoryAsync(): Promise<LedgerEthereumClient> {
    const ledgerConnection = await TransportNodeHid.create();
    const ledgerEthClient = new Eth(ledgerConnection);
    return ledgerEthClient;
}

// Create a LedgerSubprovider with the node-hid transport
ledgerSubprovider = new LedgerSubprovider({
    networkId,
    ledgerEthereumClientFactoryAsync: ledgerEthereumNodeJsClientFactoryAsync,
});
```
