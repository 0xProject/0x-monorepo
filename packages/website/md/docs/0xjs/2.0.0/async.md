0x.js is a promise-based library. This means that whenever an asynchronous call is required, the library method will return a native Javascript promise. You can therefore choose between using `promise` or `async/await` syntax when calling our async methods.

_Async/await syntax (recommended):_

```javascript
try {
    var availableAddresses = await web3Wrapper.getAvailableAddressesAsync();
} catch (error) {
    console.log('Caught error: ', error);
}
```

_Promise syntax:_

```javascript
web3Wrapper
    .getAvailableAddressesAsync()
    .then(function(availableAddresses) {
        console.log(availableAddresses);
    })
    .catch(function(error) {
        console.log('Caught error: ', error);
    });
```

As is the convention with promise-based libraries, if an error occurs, it is thrown. It is the callers responsibility to catch thrown errors and to handle them appropriately.
