import { ContractArtifact } from 'ethereum-types';

import * as DummyERC20Token from '../../generated-artifacts/DummyERC20Token.json';
import * as DummyERC721Receiver from '../../generated-artifacts/DummyERC721Receiver.json';
import * as DummyERC721Token from '../../generated-artifacts/DummyERC721Token.json';
import * as DummyMultipleReturnERC20Token from '../../generated-artifacts/DummyMultipleReturnERC20Token.json';
import * as DummyNoReturnERC20Token from '../../generated-artifacts/DummyNoReturnERC20Token.json';
import * as ERC20Token from '../../generated-artifacts/ERC20Token.json';
import * as ERC20Token_v1 from '../../generated-artifacts/ERC20Token_v1.json';
import * as ERC721Token from '../../generated-artifacts/ERC721Token.json';
import * as IERC20Token from '../../generated-artifacts/IERC20Token.json';
import * as IERC721Receiver from '../../generated-artifacts/IERC721Receiver.json';
import * as IERC721Token from '../../generated-artifacts/IERC721Token.json';
import * as IEtherToken from '../../generated-artifacts/IEtherToken.json';
import * as InvalidERC721Receiver from '../../generated-artifacts/InvalidERC721Receiver.json';
import * as MintableERC20Token from '../../generated-artifacts/MintableERC20Token.json';
import * as MintableERC721Token from '../../generated-artifacts/MintableERC721Token.json';
import * as ReentrantERC20Token from '../../generated-artifacts/ReentrantERC20Token.json';
import * as Token_v1 from '../../generated-artifacts/Token_v1.json';
import * as UnlimitedAllowanceERC20Token from '../../generated-artifacts/UnlimitedAllowanceERC20Token.json';
import * as UnlimitedAllowanceToken_v1 from '../../generated-artifacts/UnlimitedAllowanceToken_v1.json';
import * as WETH9 from '../../generated-artifacts/WETH9.json';
import * as ZRXToken from '../../generated-artifacts/ZRXToken.json';

export const artifacts = {
    DummyERC20Token: DummyERC20Token as ContractArtifact,
    DummyMultipleReturnERC20Token: DummyMultipleReturnERC20Token as ContractArtifact,
    DummyNoReturnERC20Token: DummyNoReturnERC20Token as ContractArtifact,
    DummyERC721Receiver: DummyERC721Receiver as ContractArtifact,
    InvalidERC721Receiver: InvalidERC721Receiver as ContractArtifact,
    DummyERC721Token: DummyERC721Token as ContractArtifact,
    ReentrantERC20Token: ReentrantERC20Token as ContractArtifact,
    ERC20Token: ERC20Token as ContractArtifact,
    IERC20Token: IERC20Token as ContractArtifact,
    MintableERC20Token: MintableERC20Token as ContractArtifact,
    UnlimitedAllowanceERC20Token: UnlimitedAllowanceERC20Token as ContractArtifact,
    ERC721Token: ERC721Token as ContractArtifact,
    IERC721Receiver: IERC721Receiver as ContractArtifact,
    IERC721Token: IERC721Token as ContractArtifact,
    MintableERC721Token: MintableERC721Token as ContractArtifact,
    IEtherToken: IEtherToken as ContractArtifact,
    WETH9: WETH9 as ContractArtifact,
    ERC20Token_v1: ERC20Token_v1 as ContractArtifact,
    Token_v1: Token_v1 as ContractArtifact,
    UnlimitedAllowanceToken_v1: UnlimitedAllowanceToken_v1 as ContractArtifact,
    // Note(albrow): "as any" hack still required here because ZRXToken does not
    // conform to the v2 artifact type.
    ZRXToken: (ZRXToken as any) as ContractArtifact,
};
