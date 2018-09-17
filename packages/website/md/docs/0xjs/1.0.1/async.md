0x packages are promise-based libraries. This means that whenever an asynchronous call is required, the library method will return a native Javascript promise. You can therefore choose between using `promise` or `async/await` syntax when calling our async methods.

_Async/await syntax (recommended):_

```javascript
try {
    const signature = await signatureUtils.ecSignOrderHashAsync(
        providerEngine,
        orderHashHex,
        maker,
        SignerType.Default,
    );
} catch (error) {
    console.log('Caught error: ', error);
}
```

_Promise syntax:_

```javascript
signatureUtils
    .ecSignOrderHashAsync(providerEngine, orderHashHex, maker, SignerType.Default)
    .then(function(signature) {
        console.log(signature);
    })
    .catch(function(error) {
        console.log('Caught error: ', error);
    });
```

As is the convention with promise-based libraries, if an error occurs, it is thrown. It is the callers responsibility to catch thrown errors and to handle them appropriately.
