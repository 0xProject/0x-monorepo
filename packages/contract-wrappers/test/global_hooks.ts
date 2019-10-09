before('set up mocha', async function(): Promise<void> {
    // HACK: Since the migrations take longer then our global mocha timeout limit
    // we manually increase it for this before hook.
    const mochaTestTimeoutMs = 500000;
    this.timeout(mochaTestTimeoutMs); // tslint:disable-line:no-invalid-this
});
