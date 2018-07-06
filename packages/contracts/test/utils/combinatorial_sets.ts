import { BigNumber } from '@0xproject/utils';

export const uint256Values = [
    new BigNumber(0),
    new BigNumber(1),
    new BigNumber(2),
    // Non-trivial big number.
    new BigNumber(2).pow(64),
    // Max that does not overflow when squared.
    new BigNumber(2).pow(128).minus(1),
    // Min that does overflow when squared.
    new BigNumber(2).pow(128),
    // Max that does not overflow when doubled.
    new BigNumber(2).pow(255).minus(1),
    // Min that does overflow when doubled.
    new BigNumber(2).pow(255),
    // Max that does not overflow.
    new BigNumber(2).pow(256).minus(1),
    // Min that does overflow.
    new BigNumber(2).pow(256),
];

export const bytes32Values = [
    // Min
    '0x00000000000000000000000000000000',
    '0x00000000000000000000000000000001',
    '0x00000000000000000000000000000002',
    // Non-trivial big number.
    '0x000000000f0000000000000000000000',
    // Max that does not overflow
    '0xffffffffffffffffffffffffffffffff',
    // Min that overflows
    '0x100000000000000000000000000000000',
];
