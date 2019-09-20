module.exports = {
    roots: ['<rootDir>/test'],
    coverageDirectory: 'coverage',
    transform: {
        '.*.ts?$': 'ts-jest',
    },
    testRegex: '(/__test__/.*|(\\.|/)(test|spec))\\.(js|ts)$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/index.tsx'],
};
