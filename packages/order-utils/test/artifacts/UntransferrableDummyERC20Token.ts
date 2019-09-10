export const UntransferrableDummyERC20Token = {
    schemaVersion: '2.0.0',
    contractName: 'UntransferrableDummyERC20Token',
    compilerOutput: {
        abi: [
            {
                constant: true,
                inputs: [],
                name: 'name',
                outputs: [
                    {
                        name: '',
                        type: 'string',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: '_spender',
                        type: 'address',
                    },
                    {
                        name: '_value',
                        type: 'uint256',
                    },
                ],
                name: 'approve',
                outputs: [
                    {
                        name: '',
                        type: 'bool',
                    },
                ],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'totalSupply',
                outputs: [
                    {
                        name: '',
                        type: 'uint256',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: '_from',
                        type: 'address',
                    },
                    {
                        name: '_to',
                        type: 'address',
                    },
                    {
                        name: '_value',
                        type: 'uint256',
                    },
                ],
                name: 'transferFrom',
                outputs: [
                    {
                        name: '',
                        type: 'bool',
                    },
                ],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'decimals',
                outputs: [
                    {
                        name: '',
                        type: 'uint256',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: '_owner',
                        type: 'address',
                    },
                ],
                name: 'balanceOf',
                outputs: [
                    {
                        name: '',
                        type: 'uint256',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'owner',
                outputs: [
                    {
                        name: '',
                        type: 'address',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'symbol',
                outputs: [
                    {
                        name: '',
                        type: 'string',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: '_value',
                        type: 'uint256',
                    },
                ],
                name: 'mint',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: '_to',
                        type: 'address',
                    },
                    {
                        name: '_value',
                        type: 'uint256',
                    },
                ],
                name: 'transfer',
                outputs: [
                    {
                        name: '',
                        type: 'bool',
                    },
                ],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [
                    {
                        name: '_owner',
                        type: 'address',
                    },
                    {
                        name: '_spender',
                        type: 'address',
                    },
                ],
                name: 'allowance',
                outputs: [
                    {
                        name: '',
                        type: 'uint256',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: '_target',
                        type: 'address',
                    },
                    {
                        name: '_value',
                        type: 'uint256',
                    },
                ],
                name: 'setBalance',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: false,
                inputs: [
                    {
                        name: 'newOwner',
                        type: 'address',
                    },
                ],
                name: 'transferOwnership',
                outputs: [],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                constant: true,
                inputs: [],
                name: 'MAX_MINT_AMOUNT',
                outputs: [
                    {
                        name: '',
                        type: 'uint256',
                    },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
            },
            {
                inputs: [
                    {
                        name: '_name',
                        type: 'string',
                    },
                    {
                        name: '_symbol',
                        type: 'string',
                    },
                    {
                        name: '_decimals',
                        type: 'uint256',
                    },
                    {
                        name: '_totalSupply',
                        type: 'uint256',
                    },
                ],
                payable: false,
                stateMutability: 'nonpayable',
                type: 'constructor',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        indexed: true,
                        name: '_from',
                        type: 'address',
                    },
                    {
                        indexed: true,
                        name: '_to',
                        type: 'address',
                    },
                    {
                        indexed: false,
                        name: '_value',
                        type: 'uint256',
                    },
                ],
                name: 'Transfer',
                type: 'event',
            },
            {
                anonymous: false,
                inputs: [
                    {
                        indexed: true,
                        name: '_owner',
                        type: 'address',
                    },
                    {
                        indexed: true,
                        name: '_spender',
                        type: 'address',
                    },
                    {
                        indexed: false,
                        name: '_value',
                        type: 'uint256',
                    },
                ],
                name: 'Approval',
                type: 'event',
            },
        ],
        evm: {
            bytecode: {
                linkReferences: {},
                object:
                    '0x60806040523480156200001157600080fd5b5060405162000e2738038062000e27833981018060405260808110156200003757600080fd5b8101908080516401000000008111156200005057600080fd5b820160208101848111156200006457600080fd5b81516401000000008111828201871017156200007f57600080fd5b505092919060200180516401000000008111156200009c57600080fd5b82016020810184811115620000b057600080fd5b8151640100000000811182820187101715620000cb57600080fd5b505060208083015160409093015160008054600160a060020a03191633179055865192955092935085918591859185916200010c9160049187019062000146565b5082516200012290600590602086019062000146565b506006919091553360009081526001602052604090205550620001eb945050505050565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f106200018957805160ff1916838001178555620001b9565b82800160010185558215620001b9579182015b82811115620001b95782518255916020019190600101906200019c565b50620001c7929150620001cb565b5090565b620001e891905b80821115620001c75760008155600101620001d2565b90565b610c2c80620001fb6000396000f3fe608060405234801561001057600080fd5b5060043610610107576000357c01000000000000000000000000000000000000000000000000000000009004806395d89b41116100a9578063dd62ed3e11610083578063dd62ed3e146102ff578063e30443bc1461033a578063f2fde38b14610373578063fa9b7018146103a657610107565b806395d89b411461029f578063a0712d68146102a7578063a9059cbb146102c657610107565b806323b872dd116100e557806323b872dd146101f0578063313ce5671461023357806370a082311461023b5780638da5cb5b1461026e57610107565b806306fdde031461010c578063095ea7b31461018957806318160ddd146101d6575b600080fd5b6101146103ae565b6040805160208082528351818301528351919283929083019185019080838360005b8381101561014e578181015183820152602001610136565b50505050905090810190601f16801561017b5780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6101c26004803603604081101561019f57600080fd5b5073ffffffffffffffffffffffffffffffffffffffff813516906020013561045a565b604080519115158252519081900360200190f35b6101de6104cd565b60408051918252519081900360200190f35b6101c26004803603606081101561020657600080fd5b5073ffffffffffffffffffffffffffffffffffffffff8135811691602081013590911690604001356104d3565b6101de61053c565b6101de6004803603602081101561025157600080fd5b503573ffffffffffffffffffffffffffffffffffffffff16610542565b61027661056a565b6040805173ffffffffffffffffffffffffffffffffffffffff9092168252519081900360200190f35b610114610586565b6102c4600480360360208110156102bd57600080fd5b50356105ff565b005b6101c2600480360360408110156102dc57600080fd5b5073ffffffffffffffffffffffffffffffffffffffff8135169060200135610685565b6101de6004803603604081101561031557600080fd5b5073ffffffffffffffffffffffffffffffffffffffff81358116916020013516610814565b6102c46004803603604081101561035057600080fd5b5073ffffffffffffffffffffffffffffffffffffffff813516906020013561084c565b6102c46004803603602081101561038957600080fd5b503573ffffffffffffffffffffffffffffffffffffffff16610960565b6101de610a47565b6004805460408051602060026001851615610100027fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0190941693909304601f810184900484028201840190925281815292918301828280156104525780601f1061042757610100808354040283529160200191610452565b820191906000526020600020905b81548152906001019060200180831161043557829003601f168201915b505050505081565b33600081815260026020908152604080832073ffffffffffffffffffffffffffffffffffffffff8716808552908352818420869055815186815291519394909390927f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925928290030190a350600192915050565b60035490565b6000604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601160248201527f5452414e534645525f44495341424c4544000000000000000000000000000000604482015290519081900360640190fd5b60065481565b73ffffffffffffffffffffffffffffffffffffffff1660009081526001602052604090205490565b60005473ffffffffffffffffffffffffffffffffffffffff1681565b6005805460408051602060026001851615610100027fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0190941693909304601f810184900484028201840190925281815292918301828280156104525780601f1061042757610100808354040283529160200191610452565b69021e19e0c9bab240000081111561067857604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152600f60248201527f56414c55455f544f4f5f4c415247450000000000000000000000000000000000604482015290519081900360640190fd5b6106823382610a55565b50565b3360009081526001602052604081205482111561070357604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601a60248201527f45524332305f494e53554646494349454e545f42414c414e4345000000000000604482015290519081900360640190fd5b73ffffffffffffffffffffffffffffffffffffffff8316600090815260016020526040902054828101101561079957604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601060248201527f55494e543235365f4f564552464c4f5700000000000000000000000000000000604482015290519081900360640190fd5b3360008181526001602090815260408083208054879003905573ffffffffffffffffffffffffffffffffffffffff871680845292819020805487019055805186815290519293927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef929181900390910190a350600192915050565b73ffffffffffffffffffffffffffffffffffffffff918216600090815260026020908152604080832093909416825291909152205490565b60005473ffffffffffffffffffffffffffffffffffffffff1633146108d257604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601360248201527f4f4e4c595f434f4e54524143545f4f574e455200000000000000000000000000604482015290519081900360640190fd5b73ffffffffffffffffffffffffffffffffffffffff82166000908152600160205260409020548082101561091d576109156003546109108385610b0e565b610b0e565b600355610936565b61093260035461092d8484610b0e565b610b85565b6003555b5073ffffffffffffffffffffffffffffffffffffffff909116600090815260016020526040902055565b60005473ffffffffffffffffffffffffffffffffffffffff1633146109e657604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601360248201527f4f4e4c595f434f4e54524143545f4f574e455200000000000000000000000000604482015290519081900360640190fd5b73ffffffffffffffffffffffffffffffffffffffff811615610682576000805473ffffffffffffffffffffffffffffffffffffffff83167fffffffffffffffffffffffff000000000000000000000000000000000000000090911617905550565b69021e19e0c9bab240000081565b73ffffffffffffffffffffffffffffffffffffffff8216600090815260016020526040902054610a86908290610b85565b73ffffffffffffffffffffffffffffffffffffffff8316600090815260016020526040902055600354610ab99082610b85565b60035560408051828152905173ffffffffffffffffffffffffffffffffffffffff8416916000917fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9181900360200190a35050565b600082821115610b7f57604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601160248201527f55494e543235365f554e444552464c4f57000000000000000000000000000000604482015290519081900360640190fd5b50900390565b600082820183811015610bf957604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601060248201527f55494e543235365f4f564552464c4f5700000000000000000000000000000000604482015290519081900360640190fd5b939250505056fea165627a7a723058204cebdef97829ef903902bc1f15ea8041119e2f2735acfe65aeda451b3f21c4f10029',
            },
        },
    },
    sources: {
        'test/UntransferrableDummyERC20Token.sol': {
            id: 5,
        },
        'test/DummyERC20Token.sol': {
            id: 4,
        },
        '@0x/contracts-utils/contracts/src/Ownable.sol': {
            id: 6,
        },
        '@0x/contracts-utils/contracts/src/interfaces/IOwnable.sol': {
            id: 8,
        },
        'src/MintableERC20Token.sol': {
            id: 1,
        },
        '@0x/contracts-utils/contracts/src/SafeMath.sol': {
            id: 7,
        },
        'src/UnlimitedAllowanceERC20Token.sol': {
            id: 2,
        },
        'src/ERC20Token.sol': {
            id: 0,
        },
        'src/interfaces/IERC20Token.sol': {
            id: 3,
        },
    },
    sourceCodes: {
        'test/UntransferrableDummyERC20Token.sol':
            '/*\n\n  Copyright 2018 ZeroEx Intl.\n\n  Licensed under the Apache License, Version 2.0 (the "License");\n  you may not use this file except in compliance with the License.\n  You may obtain a copy of the License at\n\n    http://www.apache.org/licenses/LICENSE-2.0\n\n  Unless required by applicable law or agreed to in writing, software\n  distributed under the License is distributed on an "AS IS" BASIS,\n  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n  See the License for the specific language governing permissions and\n  limitations under the License.\n\n*/\n\npragma solidity ^0.5.5;\n\nimport "./DummyERC20Token.sol";\n\n\n// solhint-disable no-empty-blocks\ncontract UntransferrableDummyERC20Token is\n    DummyERC20Token\n{\n    bool internal _paused;\n\n    constructor (\n        string memory _name,\n        string memory _symbol,\n        uint256 _decimals,\n        uint256 _totalSupply\n    )\n        public\n        DummyERC20Token(\n            _name,\n            _symbol,\n            _decimals,\n            _totalSupply\n        )\n    {}\n\n    /// @dev send `value` token to `to` from `msg.sender`\n    /// @param _to The address of the recipient\n    /// @param _value The amount of token to be transferred\n    function transfer(address _to, uint256 _value)\n        external\n        returns (bool)\n    {\n        require(\n            false,\n            "TRANSFER_DISABLED"\n        );\n    }\n\n    /// @dev send `value` token to `to` from `from` on the condition it is approved by `from`\n    /// @param _from The address of the sender\n    /// @param _to The address of the recipient\n    /// @param _value The amount of token to be transferred\n    function transferFrom(\n        address _from,\n        address _to,\n        uint256 _value\n    )\n        external\n        returns (bool)\n    {\n        require(\n            false,\n            "TRANSFER_DISABLED"\n        );\n    }\n}\n\n',
        'test/DummyERC20Token.sol':
            '/*\n\n  Copyright 2018 ZeroEx Intl.\n\n  Licensed under the Apache License, Version 2.0 (the "License");\n  you may not use this file except in compliance with the License.\n  You may obtain a copy of the License at\n\n    http://www.apache.org/licenses/LICENSE-2.0\n\n  Unless required by applicable law or agreed to in writing, software\n  distributed under the License is distributed on an "AS IS" BASIS,\n  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n  See the License for the specific language governing permissions and\n  limitations under the License.\n\n*/\n\npragma solidity ^0.5.5;\n\nimport "@0x/contracts-utils/contracts/src/Ownable.sol";\nimport "../src/MintableERC20Token.sol";\n\n\ncontract DummyERC20Token is \n    Ownable,\n    MintableERC20Token\n{\n    string public name;\n    string public symbol;\n    uint256 public decimals;\n    uint256 public constant MAX_MINT_AMOUNT = 10000000000000000000000;\n\n    constructor (\n        string memory _name,\n        string memory _symbol,\n        uint256 _decimals,\n        uint256 _totalSupply\n    )\n        public\n    {\n        name = _name;\n        symbol = _symbol;\n        decimals = _decimals;\n        _totalSupply = _totalSupply;\n        balances[msg.sender] = _totalSupply;\n    }\n\n    /// @dev Sets the balance of target address\n    /// @param _target Address or which balance will be updated\n    /// @param _value New balance of target address\n    function setBalance(address _target, uint256 _value)\n        external\n        onlyOwner\n    {\n        uint256 currBalance = balances[_target];\n        if (_value < currBalance) {\n            _totalSupply = safeSub(_totalSupply, safeSub(currBalance, _value));\n        } else {\n            _totalSupply = safeAdd(_totalSupply, safeSub(_value, currBalance));\n        }\n        balances[_target] = _value;\n    }\n\n    /// @dev Mints new tokens for sender\n    /// @param _value Amount of tokens to mint\n    function mint(uint256 _value)\n        external\n    {\n        require(\n            _value <= MAX_MINT_AMOUNT,\n            "VALUE_TOO_LARGE"\n        );\n\n        _mint(msg.sender, _value);\n    }\n}\n',
        '@0x/contracts-utils/contracts/src/Ownable.sol':
            'pragma solidity ^0.5.5;\n\nimport "./interfaces/IOwnable.sol";\n\n\ncontract Ownable is\n    IOwnable\n{\n    address public owner;\n\n    constructor ()\n        public\n    {\n        owner = msg.sender;\n    }\n\n    modifier onlyOwner() {\n        require(\n            msg.sender == owner,\n            "ONLY_CONTRACT_OWNER"\n        );\n        _;\n    }\n\n    function transferOwnership(address newOwner)\n        public\n        onlyOwner\n    {\n        if (newOwner != address(0)) {\n            owner = newOwner;\n        }\n    }\n}\n',
        '@0x/contracts-utils/contracts/src/interfaces/IOwnable.sol':
            'pragma solidity ^0.5.5;\n\n\ncontract IOwnable {\n\n    function transferOwnership(address newOwner)\n        public;\n}\n',
        'src/MintableERC20Token.sol':
            '/*\n\n  Copyright 2018 ZeroEx Intl.\n\n  Licensed under the Apache License, Version 2.0 (the "License");\n  you may not use this file except in compliance with the License.\n  You may obtain a copy of the License at\n\n    http://www.apache.org/licenses/LICENSE-2.0\n\n  Unless required by applicable law or agreed to in writing, software\n  distributed under the License is distributed on an "AS IS" BASIS,\n  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n  See the License for the specific language governing permissions and\n  limitations under the License.\n\n*/\n\npragma solidity ^0.5.5;\n\nimport "@0x/contracts-utils/contracts/src/SafeMath.sol";\nimport "./UnlimitedAllowanceERC20Token.sol";\n\n\ncontract MintableERC20Token is \n    SafeMath,\n    UnlimitedAllowanceERC20Token\n{\n    /// @dev Mints new tokens\n    /// @param _to Address of the beneficiary that will own the minted token\n    /// @param _value Amount of tokens to mint\n    function _mint(address _to, uint256 _value)\n        internal\n    {\n        balances[_to] = safeAdd(_value, balances[_to]);\n        _totalSupply = safeAdd(_totalSupply, _value);\n\n        emit Transfer(\n            address(0),\n            _to,\n            _value\n        );\n    }\n\n    /// @dev Mints new tokens\n    /// @param _owner Owner of tokens that will be burned\n    /// @param _value Amount of tokens to burn\n    function _burn(address _owner, uint256 _value)\n        internal\n    {\n        balances[_owner] = safeSub(balances[_owner], _value);\n        _totalSupply = safeSub(_totalSupply, _value);\n\n        emit Transfer(\n            _owner,\n            address(0),\n            _value\n        );\n    }\n}\n',
        '@0x/contracts-utils/contracts/src/SafeMath.sol':
            'pragma solidity ^0.5.5;\n\n\ncontract SafeMath {\n\n    function safeMul(uint256 a, uint256 b)\n        internal\n        pure\n        returns (uint256)\n    {\n        if (a == 0) {\n            return 0;\n        }\n        uint256 c = a * b;\n        require(\n            c / a == b,\n            "UINT256_OVERFLOW"\n        );\n        return c;\n    }\n\n    function safeDiv(uint256 a, uint256 b)\n        internal\n        pure\n        returns (uint256)\n    {\n        uint256 c = a / b;\n        return c;\n    }\n\n    function safeSub(uint256 a, uint256 b)\n        internal\n        pure\n        returns (uint256)\n    {\n        require(\n            b <= a,\n            "UINT256_UNDERFLOW"\n        );\n        return a - b;\n    }\n\n    function safeAdd(uint256 a, uint256 b)\n        internal\n        pure\n        returns (uint256)\n    {\n        uint256 c = a + b;\n        require(\n            c >= a,\n            "UINT256_OVERFLOW"\n        );\n        return c;\n    }\n\n    function max64(uint64 a, uint64 b)\n        internal\n        pure\n        returns (uint256)\n    {\n        return a >= b ? a : b;\n    }\n\n    function min64(uint64 a, uint64 b)\n        internal\n        pure\n        returns (uint256)\n    {\n        return a < b ? a : b;\n    }\n\n    function max256(uint256 a, uint256 b)\n        internal\n        pure\n        returns (uint256)\n    {\n        return a >= b ? a : b;\n    }\n\n    function min256(uint256 a, uint256 b)\n        internal\n        pure\n        returns (uint256)\n    {\n        return a < b ? a : b;\n    }\n}\n',
        'src/UnlimitedAllowanceERC20Token.sol':
            '/*\n\n  Copyright 2018 ZeroEx Intl.\n\n  Licensed under the Apache License, Version 2.0 (the "License");\n  you may not use this file except in compliance with the License.\n  You may obtain a copy of the License at\n\n    http://www.apache.org/licenses/LICENSE-2.0\n\n  Unless required by applicable law or agreed to in writing, software\n  distributed under the License is distributed on an "AS IS" BASIS,\n  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n  See the License for the specific language governing permissions and\n  limitations under the License.\n\n*/\n\npragma solidity ^0.5.5;\n\nimport "./ERC20Token.sol";\n\n\ncontract UnlimitedAllowanceERC20Token is\n    ERC20Token\n{\n    uint256 constant internal MAX_UINT = 2**256 - 1;\n\n    /// @dev ERC20 transferFrom, modified such that an allowance of MAX_UINT represents an unlimited allowance. See https://github.com/ethereum/EIPs/issues/717\n    /// @param _from Address to transfer from.\n    /// @param _to Address to transfer to.\n    /// @param _value Amount to transfer.\n    /// @return Success of transfer.\n    function transferFrom(\n        address _from,\n        address _to,\n        uint256 _value\n    )\n        external\n        returns (bool)\n    {\n        uint256 allowance = allowed[_from][msg.sender];\n        require(\n            balances[_from] >= _value,\n            "ERC20_INSUFFICIENT_BALANCE"\n        );\n        require(\n            allowance >= _value,\n            "ERC20_INSUFFICIENT_ALLOWANCE"\n        );\n        require(\n            balances[_to] + _value >= balances[_to],\n            "UINT256_OVERFLOW"\n        );\n\n        balances[_to] += _value;\n        balances[_from] -= _value;\n        if (allowance < MAX_UINT) {\n            allowed[_from][msg.sender] -= _value;\n        }\n\n        emit Transfer(\n            _from,\n            _to,\n            _value\n        );\n\n        return true;\n    }\n}\n',
        'src/ERC20Token.sol':
            '/*\n\n  Copyright 2018 ZeroEx Intl.\n\n  Licensed under the Apache License, Version 2.0 (the "License");\n  you may not use this file except in compliance with the License.\n  You may obtain a copy of the License at\n\n    http://www.apache.org/licenses/LICENSE-2.0\n\n  Unless required by applicable law or agreed to in writing, software\n  distributed under the License is distributed on an "AS IS" BASIS,\n  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n  See the License for the specific language governing permissions and\n  limitations under the License.\n\n*/\n\npragma solidity ^0.5.5;\n\nimport "./interfaces/IERC20Token.sol";\n\n\ncontract ERC20Token is\n    IERC20Token\n{\n    mapping (address => uint256) internal balances;\n    mapping (address => mapping (address => uint256)) internal allowed;\n\n    uint256 internal _totalSupply;\n\n    /// @dev send `value` token to `to` from `msg.sender`\n    /// @param _to The address of the recipient\n    /// @param _value The amount of token to be transferred\n    /// @return True if transfer was successful\n    function transfer(address _to, uint256 _value)\n        external\n        returns (bool)\n    {\n        require(\n            balances[msg.sender] >= _value,\n            "ERC20_INSUFFICIENT_BALANCE"\n        );\n        require(\n            balances[_to] + _value >= balances[_to],\n            "UINT256_OVERFLOW"\n        );\n\n        balances[msg.sender] -= _value;\n        balances[_to] += _value;\n\n        emit Transfer(\n            msg.sender,\n            _to,\n            _value\n        );\n\n        return true;\n    }\n\n    /// @dev send `value` token to `to` from `from` on the condition it is approved by `from`\n    /// @param _from The address of the sender\n    /// @param _to The address of the recipient\n    /// @param _value The amount of token to be transferred\n    /// @return True if transfer was successful\n    function transferFrom(\n        address _from,\n        address _to,\n        uint256 _value\n    )\n        external\n        returns (bool)\n    {\n        require(\n            balances[_from] >= _value,\n            "ERC20_INSUFFICIENT_BALANCE"\n        );\n        require(\n            allowed[_from][msg.sender] >= _value,\n            "ERC20_INSUFFICIENT_ALLOWANCE"\n        );\n        require(\n            balances[_to] + _value >= balances[_to],\n            "UINT256_OVERFLOW"\n        );\n\n        balances[_to] += _value;\n        balances[_from] -= _value;\n        allowed[_from][msg.sender] -= _value;\n    \n        emit Transfer(\n            _from,\n            _to,\n            _value\n        );\n    \n        return true;\n    }\n\n    /// @dev `msg.sender` approves `_spender` to spend `_value` tokens\n    /// @param _spender The address of the account able to transfer the tokens\n    /// @param _value The amount of wei to be approved for transfer\n    /// @return Always true if the call has enough gas to complete execution\n    function approve(address _spender, uint256 _value)\n        external\n        returns (bool)\n    {\n        allowed[msg.sender][_spender] = _value;\n        emit Approval(\n            msg.sender,\n            _spender,\n            _value\n        );\n        return true;\n    }\n\n    /// @dev Query total supply of token\n    /// @return Total supply of token\n    function totalSupply()\n        external\n        view\n        returns (uint256)\n    {\n        return _totalSupply;\n    }\n\n    /// @dev Query the balance of owner\n    /// @param _owner The address from which the balance will be retrieved\n    /// @return Balance of owner\n    function balanceOf(address _owner)\n        external\n        view\n        returns (uint256)\n    {\n        return balances[_owner];\n    }\n\n    /// @param _owner The address of the account owning tokens\n    /// @param _spender The address of the account able to transfer the tokens\n    /// @return Amount of remaining tokens allowed to spent\n    function allowance(address _owner, address _spender)\n        external\n        view\n        returns (uint256)\n    {\n        return allowed[_owner][_spender];\n    }\n}\n',
        'src/interfaces/IERC20Token.sol':
            '/*\n\n  Copyright 2018 ZeroEx Intl.\n\n  Licensed under the Apache License, Version 2.0 (the "License");\n  you may not use this file except in compliance with the License.\n  You may obtain a copy of the License at\n\n    http://www.apache.org/licenses/LICENSE-2.0\n\n  Unless required by applicable law or agreed to in writing, software\n  distributed under the License is distributed on an "AS IS" BASIS,\n  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n  See the License for the specific language governing permissions and\n  limitations under the License.\n\n*/\n\npragma solidity ^0.5.5;\n\n\ncontract IERC20Token {\n\n    // solhint-disable no-simple-event-func-name\n    event Transfer(\n        address indexed _from,\n        address indexed _to,\n        uint256 _value\n    );\n\n    event Approval(\n        address indexed _owner,\n        address indexed _spender,\n        uint256 _value\n    );\n\n    /// @dev send `value` token to `to` from `msg.sender`\n    /// @param _to The address of the recipient\n    /// @param _value The amount of token to be transferred\n    /// @return True if transfer was successful\n    function transfer(address _to, uint256 _value)\n        external\n        returns (bool);\n\n    /// @dev send `value` token to `to` from `from` on the condition it is approved by `from`\n    /// @param _from The address of the sender\n    /// @param _to The address of the recipient\n    /// @param _value The amount of token to be transferred\n    /// @return True if transfer was successful\n    function transferFrom(\n        address _from,\n        address _to,\n        uint256 _value\n    )\n        external\n        returns (bool);\n    \n    /// @dev `msg.sender` approves `_spender` to spend `_value` tokens\n    /// @param _spender The address of the account able to transfer the tokens\n    /// @param _value The amount of wei to be approved for transfer\n    /// @return Always true if the call has enough gas to complete execution\n    function approve(address _spender, uint256 _value)\n        external\n        returns (bool);\n\n    /// @dev Query total supply of token\n    /// @return Total supply of token\n    function totalSupply()\n        external\n        view\n        returns (uint256);\n    \n    /// @param _owner The address from which the balance will be retrieved\n    /// @return Balance of owner\n    function balanceOf(address _owner)\n        external\n        view\n        returns (uint256);\n\n    /// @param _owner The address of the account owning tokens\n    /// @param _spender The address of the account able to transfer the tokens\n    /// @return Amount of remaining tokens allowed to spent\n    function allowance(address _owner, address _spender)\n        external\n        view\n        returns (uint256);\n}\n',
    },
    sourceTreeHashHex: '0x1fe42c8f253c28a74058cb82ccc63d561a91271e813cb576ee4f2a43175b0f3f',
    compiler: {
        name: 'solc',
        version: '0.5.6+commit.b259423e.Linux.g++',
        settings: {
            optimizer: {
                enabled: true,
                runs: 1000000,
                details: {
                    yul: true,
                    deduplicate: true,
                    cse: true,
                    constantOptimizer: true,
                },
            },
            outputSelection: {
                '*': {
                    '*': [
                        'abi',
                        'evm.bytecode.object',
                        'evm.bytecode.sourceMap',
                        'evm.deployedBytecode.object',
                        'evm.deployedBytecode.sourceMap',
                    ],
                },
            },
            evmVersion: 'byzantium',
            remappings: [
                '@0x/contracts-utils=/Users/jacob/projects/ethdev/0x/0x.js/contracts/erc20/node_modules/@0x/contracts-utils',
            ],
        },
    },
    networks: {},
};
