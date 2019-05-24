import { AbiDecoder } from '@0x/utils';
import { ContractAbi, DecodedLogArgs, LogEntry, LogWithDecodedArgs, RawLog } from 'ethereum-types';

const TOKEN_TYPE_COLLISION = `Token can't be marked as ERC20 and ERC721 at the same time`;

/**
 * ERC20 and ERC721 have some events with different args but colliding signature.
 * For exmaple:
 * Transfer(_from address, _to address, _value uint256)
 * Transfer(_from address, _to address, _tokenId uint256)
 * Both have the signature:
 * Transfer(address,address,uint256)
 *
 * In order to correctly decode those events we need to know the token type by address in advance.
 * You can pass it by calling `this.addERC20Token(address)` or `this.addERC721Token(address)`
 */
export class CollisionResistanceAbiDecoder {
    private readonly _erc20AbiDecoder: AbiDecoder;
    private readonly _erc721AbiDecoder: AbiDecoder;
    private readonly _restAbiDecoder: AbiDecoder;
    private readonly _knownERC20Tokens = new Set();
    private readonly _knownERC721Tokens = new Set();
    constructor(erc20Abi: ContractAbi, erc721Abi: ContractAbi, abis: ContractAbi[]) {
        this._erc20AbiDecoder = new AbiDecoder([erc20Abi]);
        this._erc721AbiDecoder = new AbiDecoder([erc721Abi]);
        this._restAbiDecoder = new AbiDecoder(abis);
    }
    public tryToDecodeLogOrNoop<ArgsType extends DecodedLogArgs>(log: LogEntry): LogWithDecodedArgs<ArgsType> | RawLog {
        let maybeDecodedLog = log;
        if (this._knownERC20Tokens.has(log.address)) {
            maybeDecodedLog = this._erc20AbiDecoder.tryToDecodeLogOrNoop(log);
        } else if (this._knownERC721Tokens.has(log.address)) {
            maybeDecodedLog = this._erc721AbiDecoder.tryToDecodeLogOrNoop(log);
        }
        // Fall back to the supplied ABIs for decoding if the ERC20/ERC721 decoding fails
        // This ensures we hit events like Deposit and Withdraw given WETH can be a known ERC20Token
        const isLogDecoded = ((maybeDecodedLog as any) as LogWithDecodedArgs<DecodedLogArgs>).event !== undefined;
        if (!isLogDecoded) {
            maybeDecodedLog = this._restAbiDecoder.tryToDecodeLogOrNoop(log);
        }
        return maybeDecodedLog;
    }
    // Hints the ABI decoder that a particular token address is ERC20 and events from it should be decoded as ERC20 events
    public addERC20Token(address: string): void {
        if (this._knownERC721Tokens.has(address)) {
            throw new Error(TOKEN_TYPE_COLLISION);
        }
        this._knownERC20Tokens.add(address);
    }
    // Hints the ABI decoder that a particular token address is ERC721 and events from it should be decoded as ERC721 events
    public addERC721Token(address: string): void {
        if (this._knownERC20Tokens.has(address)) {
            throw new Error(TOKEN_TYPE_COLLISION);
        }
        this._knownERC721Tokens.add(address);
    }
}
