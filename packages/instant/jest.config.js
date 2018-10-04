module.exports = {
    roots: ['<rootDir>/test'],
    coverageDirectory: 'coverage',
    transform: {
        '.*.tsx?$': 'ts-jest',
    },
    testRegex: '(/__test__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/index.tsx'],
};
