module.exports = {
    networks: {
        development: {
            host: "localhost",
            port: 8545,
            network_id: "*", // Match any network id
        },
        kovan: {
            host: "localhost",
            port: 8546,
            network_id: "42",
            gas: 4612388,
        },
    },
    test_directory: "lib/test",
    migrations_directory: "lib/migrations",
};
