import { ContractArtifact } from 'ethereum-types';

import * as DummyERC20Token from '../../generated-artifacts/DummyERC20Token.json';
import * as DummyMultipleReturnERC20Token from '../../generated-artifacts/DummyMultipleReturnERC20Token.json';
import * as DummyNoReturnERC20Token from '../../generated-artifacts/DummyNoReturnERC20Token.json';
import * as ERC20Token from '../../generated-artifacts/ERC20Token.json';
import * as IERC20Token from '../../generated-artifacts/IERC20Token.json';
import * as IEtherToken from '../../generated-artifacts/IEtherToken.json';
import * as MintableERC20Token from '../../generated-artifacts/MintableERC20Token.json';
import * as ReentrantERC20Token from '../../generated-artifacts/ReentrantERC20Token.json';
import * as UnlimitedAllowanceERC20Token from '../../generated-artifacts/UnlimitedAllowanceERC20Token.json';
import * as WETH9 from '../../generated-artifacts/WETH9.json';
import * as ZRXToken from '../../generated-artifacts/ZRXToken.json';

// tslint:disable:no-unnecessary-type-assertion
export const artifacts = {
    DummyERC20Token: DummyERC20Token as ContractArtifact,
    DummyMultipleReturnERC20Token: DummyMultipleReturnERC20Token as ContractArtifact,
    DummyNoReturnERC20Token: DummyNoReturnERC20Token as ContractArtifact,
    ReentrantERC20Token: ReentrantERC20Token as ContractArtifact,
    ERC20Token: ERC20Token as ContractArtifact,
    IERC20Token: IERC20Token as ContractArtifact,
    MintableERC20Token: MintableERC20Token as ContractArtifact,
    UnlimitedAllowanceERC20Token: UnlimitedAllowanceERC20Token as ContractArtifact,
    IEtherToken: IEtherToken as ContractArtifact,
    WETH9: WETH9 as ContractArtifact,
    // Note(albrow): "as any" hack still required here because ZRXToken does not
    // conform to the v2 artifact type.
    ZRXToken: (ZRXToken as any) as ContractArtifact,
};
