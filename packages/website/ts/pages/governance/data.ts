import { BigNumber } from '@0x/utils';
import * as moment from 'moment';

import { TallyInterface, VoteOutcome, ZeipId } from 'ts/types';

export interface ProposalLink {
    text: string;
    url: string;
}

export interface ProposalProperty {
    title: string;
    summary: string;
    rating: number;
    links: ProposalLink[];
}

export interface Proposal {
    zeipId: ZeipId;
    title: string;
    summary: string;
    url: string;
    voteStartDate: moment.Moment;
    voteEndDate: moment.Moment;
    outcome?: VoteOutcome;
    benefit: ProposalProperty;
    risks: ProposalProperty;
}

export interface Proposals {
    [id: number]: Proposal;
}

export const proposals: Proposals = {
    23: {
        zeipId: 23,
        title: 'Trade Bundles of Assets',
        summary: `This ZEIP introduces the MultiAssetProxy, which adds support for trading arbitrary bundles of assets to 0x protocol. Historically, only a single asset could be traded per each side of a trade. With the introduction of the MultiAssetProxy, users will be able to trade multiple ERC721 assets or even mix ERC721 and ERC20 assets within a single order.`,
        url: 'https://blog.0xproject.com/zeip-23-trade-bundles-of-assets-fe69eb3ed960',
        voteStartDate: moment(1551042800, 'X'),
        voteEndDate: moment(1551142800, 'X'),
        outcome: 'accepted',
        benefit: {
            title: 'Benefit',
            summary: `Supporting trades for bundles of assets has been one of the most commonly requested features since the launch of 0x v2. The idea for this feature originated from discussions with gaming and NFT related projects. However, this upgrade also provides utility to relayers for prediction markets or baskets of tokens. The MultiAssetProxy will enable brand new ways of trading.`,
            rating: 3,
            links: [
                {
                    text: 'Technical detail',
                    url: 'https://github.com/0xProject/ZEIPs/issues/23',
                },
            ],
        },
        risks: {
            title: 'Risk',
            summary: `While the MultiAssetProxy’s code is relatively straightforward and has successfully undergone a full third-party audit, a bug within the code could result in the loss of user funds. Deploying the MultiAssetProxy is a hot upgrade that requires modifying the state of existing contracts within 0x protocol. The contracts being modified contain allowances to many users’ tokens. We encourage the community to verify the code, as well as the state changes.`,
            rating: 2,
            links: [
                {
                    text: 'View Code',
                    url:
                        'https://github.com/0xProject/0x-monorepo/blob/development/contracts/asset-proxy/contracts/src/MultiAssetProxy.sol#L25',
                },
                {
                    text: 'View Audit',
                    url: 'https://github.com/ConsenSys/0x-audit-report-2018-12',
                },
            ],
        },
    },
    39: {
        zeipId: 39,
        title: 'StaticCallAssetProxy',
        summary: `This ZEIP introduces the StaticCallAssetProxy, which adds support for trading arbitrary bundles of assets to 0x protocol. Historically, only a single asset could be traded per each side of a trade. With the introduction of the MultiAssetProxy, users will be able to trade multiple ERC721 assets or even mix ERC721 and ERC20 assets within a single order.`,
        url: 'https://blog.0xproject.com/zeip-23-trade-bundles-of-assets-fe69eb3ed960',
        voteStartDate: moment().add(2, 'days'),
        voteEndDate: moment().add(3, 'days'),
        benefit: {
            title: 'Benefit',
            summary: `Supporting trades for bundles of assets has been one of the most commonly requested features since the launch of 0x v2. The idea for this feature originated from discussions with gaming and NFT related projects. However, this upgrade also provides utility to relayers for prediction markets or baskets of tokens. The MultiAssetProxy will enable brand new ways of trading.`,
            rating: 3,
            links: [
                {
                    text: 'Technical detail',
                    url: 'https://github.com/0xProject/ZEIPs/issues/23',
                },
            ],
        },
        risks: {
            title: 'Risk',
            summary: `While the MultiAssetProxy’s code is relatively straightforward and has successfully undergone a full third-party audit, a bug within the code could result in the loss of user funds. Deploying the MultiAssetProxy is a hot upgrade that requires modifying the state of existing contracts within 0x protocol. The contracts being modified contain allowances to many users’ tokens. We encourage the community to verify the code, as well as the state changes.`,
            rating: 2,
            links: [
                {
                    text: 'View Code',
                    url:
                        'https://github.com/0xProject/0x-monorepo/blob/development/contracts/asset-proxy/contracts/src/MultiAssetProxy.sol#L25',
                },
                {
                    text: 'View Audit',
                    url: 'https://github.com/ConsenSys/0x-audit-report-2018-12',
                },
            ],
        },
    },
    24: {
        zeipId: 24,
        title: 'Support ERC-1155 MultiToken Standard',
        summary: `This ZEIP introduces the StaticCallAssetProxy, which adds support for trading arbitrary bundles of assets to 0x protocol. Historically, only a single asset could be traded per each side of a trade. With the introduction of the MultiAssetProxy, users will be able to trade multiple ERC721 assets or even mix ERC721 and ERC20 assets within a single order.`,
        url: 'https://blog.0xproject.com/zeip-23-trade-bundles-of-assets-fe69eb3ed960',
        voteStartDate: moment().subtract(2, 'days'),
        voteEndDate: moment().add(3, 'days'),
        benefit: {
            title: 'Benefit',
            summary: `Supporting trades for bundles of assets has been one of the most commonly requested features since the launch of 0x v2. The idea for this feature originated from discussions with gaming and NFT related projects. However, this upgrade also provides utility to relayers for prediction markets or baskets of tokens. The MultiAssetProxy will enable brand new ways of trading.`,
            rating: 3,
            links: [
                {
                    text: 'Technical detail',
                    url: 'https://github.com/0xProject/ZEIPs/issues/23',
                },
            ],
        },
        risks: {
            title: 'Risk',
            summary: `While the MultiAssetProxy’s code is relatively straightforward and has successfully undergone a full third-party audit, a bug within the code could result in the loss of user funds. Deploying the MultiAssetProxy is a hot upgrade that requires modifying the state of existing contracts within 0x protocol. The contracts being modified contain allowances to many users’ tokens. We encourage the community to verify the code, as well as the state changes.`,
            rating: 2,
            links: [
                {
                    text: 'View Code',
                    url:
                        'https://github.com/0xProject/0x-monorepo/blob/development/contracts/asset-proxy/contracts/src/MultiAssetProxy.sol#L25',
                },
                {
                    text: 'View Audit',
                    url: 'https://github.com/ConsenSys/0x-audit-report-2018-12',
                },
            ],
        },
    },
    25: {
        zeipId: 25,
        title: 'Support ERC-1155 MultiToken Standard',
        summary: `This ZEIP introduces the StaticCallAssetProxy, which adds support for trading arbitrary bundles of assets to 0x protocol. Historically, only a single asset could be traded per each side of a trade. With the introduction of the MultiAssetProxy, users will be able to trade multiple ERC721 assets or even mix ERC721 and ERC20 assets within a single order.`,
        url: 'https://blog.0xproject.com/zeip-23-trade-bundles-of-assets-fe69eb3ed960',
        voteStartDate: moment().subtract(2, 'days'),
        voteEndDate: moment().add(3, 'days'),
        benefit: {
            title: 'Benefit',
            summary: `Supporting trades for bundles of assets has been one of the most commonly requested features since the launch of 0x v2. The idea for this feature originated from discussions with gaming and NFT related projects. However, this upgrade also provides utility to relayers for prediction markets or baskets of tokens. The MultiAssetProxy will enable brand new ways of trading.`,
            rating: 3,
            links: [
                {
                    text: 'Technical detail',
                    url: 'https://github.com/0xProject/ZEIPs/issues/23',
                },
            ],
        },
        risks: {
            title: 'Risk',
            summary: `While the MultiAssetProxy’s code is relatively straightforward and has successfully undergone a full third-party audit, a bug within the code could result in the loss of user funds. Deploying the MultiAssetProxy is a hot upgrade that requires modifying the state of existing contracts within 0x protocol. The contracts being modified contain allowances to many users’ tokens. We encourage the community to verify the code, as well as the state changes.`,
            rating: 2,
            links: [
                {
                    text: 'View Code',
                    url:
                        'https://github.com/0xProject/0x-monorepo/blob/development/contracts/asset-proxy/contracts/src/MultiAssetProxy.sol#L25',
                },
                {
                    text: 'View Audit',
                    url: 'https://github.com/ConsenSys/0x-audit-report-2018-12',
                },
            ],
        },
    },
};

export const ZERO_TALLY: TallyInterface = {
    yes: new BigNumber(0),
    no: new BigNumber(0),
};
