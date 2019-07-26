import { artifacts as erc1155Artifacts } from '@0x/contracts-erc1155';
import { artifacts as erc20Artifacts } from '@0x/contracts-erc20';
import { artifacts as erc721Artifacts } from '@0x/contracts-erc721';

export const dependencyArtifacts = {
    ...erc20Artifacts,
    ...erc721Artifacts,
    ...erc1155Artifacts,
};
