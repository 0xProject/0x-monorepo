import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { Banner } from 'ts/components/banner';
import { Button } from 'ts/components/button';
import { DocumentTitle } from 'ts/components/document_title';
import { Column, FlexWrap, Section } from 'ts/components/newLayout';
import { SiteWrap } from 'ts/components/siteWrap';
import { Heading, Paragraph } from 'ts/components/text';
import { Countdown } from 'ts/pages/governance/countdown';
import { ModalVote } from 'ts/pages/governance/modal_vote';
import { RatingBar } from 'ts/pages/governance/rating_bar';
import { VoteInfo, VoteValue } from 'ts/pages/governance/vote_form';
import { VoteStats } from 'ts/pages/governance/vote_stats';
import { colors } from 'ts/style/colors';
import { configs } from 'ts/utils/configs';
import { documentConstants } from 'ts/utils/document_meta_constants';
import { utils } from 'ts/utils/utils';

interface LabelInterface {
    [key: number]: string;
}

export interface TallyInterface {
    zeip?: string;
    yes?: BigNumber;
    no?: BigNumber;
    blockNumber?: string;
    totalVotes?: string;
    totalBalance?: BigNumber;
}

interface State {
    isVoteModalOpen: boolean;
    isWalletConnected: boolean;
    isVoteReceived: boolean;
    providerName?: string;
    tally?: TallyInterface;
}

const benefitLabels: LabelInterface = {
    1: 'Little Benefit',
    2: 'Medium Benefit',
    3: 'High Benefit',
};

const riskLabels: LabelInterface = {
    1: 'Low Risk',
    2: 'Medium Risk',
    3: 'High Risk',
};

const proposalData = {
    zeipId: 23,
    title: 'ZEIP-23: Trade Bundles of Assets',
    summary: `This ZEIP introduces the MultiAssetProxy, which adds support for trading arbitrary bundles of assets to 0x protocol. Historically, only a single asset could be traded per each side of a trade. With the introduction of the MultiAssetProxy, users will be able to trade multiple ERC721 assets or even mix ERC721 and ERC20 assets within a single order.`,
    url: 'https://blog.0xproject.com/zeip-23-trade-bundles-of-assets-fe69eb3ed960',
    votingDeadline: 1551142800,
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
};

interface Props {
    location: Location;
}

export class Governance extends React.Component<Props> {
    public state: State = {
        isVoteModalOpen: false,
        isWalletConnected: false,
        isVoteReceived: false,
        providerName: 'Metamask',
        tally: {
            totalBalance: new BigNumber(0),
            yes: new BigNumber(0),
            no: new BigNumber(0),
        },
    };
    public componentDidMount(): void {
        // tslint:disable:no-floating-promises
        this._fetchVoteStatusAsync();
    }
    public render(): React.ReactNode {
        const { isVoteReceived, tally } = this.state;
        return (
            <SiteWrap theme="dark">
                <DocumentTitle {...documentConstants.VOTE} />
                <Section maxWidth="1170px" isFlex={true}>
                    <Column width="55%" maxWidth="560px">
                        <Countdown deadline={proposalData.votingDeadline} />
                        <Heading size="medium">{proposalData.title}</Heading>
                        <Paragraph>{proposalData.summary}</Paragraph>
                        <Button
                            href={proposalData.url}
                            target={proposalData.url !== undefined ? '_blank' : undefined}
                            isWithArrow={true}
                            isAccentColor={true}
                        >
                            Learn More
                        </Button>
                    </Column>
                    <Column width="30%" maxWidth="300px">
                        <VoteStats tally={tally} />
                        <VoteButton onClick={this._onOpenVoteModal.bind(this)} isWithArrow={false}>
                            {isVoteReceived ? 'Vote Received' : 'Vote'}
                        </VoteButton>
                    </Column>
                </Section>

                <Section bgColor="dark" maxWidth="1170px">
                    <SectionWrap>
                        <Heading>{proposalData.benefit.title}</Heading>
                        <FlexWrap>
                            <Column width="55%" maxWidth="560px">
                                <Paragraph>{proposalData.benefit.summary}</Paragraph>
                                {_.map(proposalData.benefit.links, (link, index) => (
                                    <MoreLink
                                        href={link.url}
                                        target={link.url !== undefined ? '_blank' : undefined}
                                        isWithArrow={true}
                                        isAccentColor={true}
                                        key={`benefitlink-${index}`}
                                    >
                                        {link.text}
                                    </MoreLink>
                                ))}
                            </Column>
                            <Column width="30%" maxWidth="360px">
                                <RatingBar
                                    color={colors.brandLight}
                                    labels={benefitLabels}
                                    rating={proposalData.benefit.rating}
                                />
                            </Column>
                        </FlexWrap>
                    </SectionWrap>
                    <SectionWrap>
                        <Heading>{proposalData.risks.title}</Heading>
                        <FlexWrap>
                            <Column width="55%" maxWidth="560px">
                                <Paragraph>{proposalData.risks.summary}</Paragraph>
                                {_.map(proposalData.risks.links, (link, index) => (
                                    <MoreLink
                                        href={link.url}
                                        target={link.url !== undefined ? '_blank' : undefined}
                                        isWithArrow={true}
                                        isAccentColor={true}
                                        key={`risklink-${index}`}
                                    >
                                        {link.text}
                                    </MoreLink>
                                ))}
                            </Column>
                            <Column width="30%" maxWidth="360px">
                                <RatingBar color="#AE5400" labels={riskLabels} rating={proposalData.risks.rating} />
                            </Column>
                        </FlexWrap>
                    </SectionWrap>
                </Section>

                <Banner
                    heading="Vote with ZRX on ZEIP-23"
                    subline="Use 0x Instant to quickly purchase ZRX for voting"
                    mainCta={{ text: 'Get ZRX', onClick: this._onLaunchInstantClick.bind(this) }}
                    secondaryCta={{ text: 'Vote', onClick: this._onOpenVoteModal.bind(this) }}
                />
                <ModalVote
                    isOpen={this.state.isVoteModalOpen}
                    onDismiss={this._onDismissVoteModal}
                    onWalletConnected={this._onWalletConnected.bind(this)}
                    onVoted={this._onVoteReceived.bind(this)}
                />
            </SiteWrap>
        );
    }

    private readonly _onLaunchInstantClick = (): void => {
        (window as any).zeroExInstant.render(
            {
                orderSource: configs.VOTE_INSTANT_ORDER_SOURCE,
                availableAssetDatas: configs.VOTE_INSTANT_ASSET_DATAS,
                defaultSelectedAssetData: configs.VOTE_INSTANT_ASSET_DATAS[0],
            },
            'body',
        );
    };

    private readonly _onOpenVoteModal = (): void => {
        this.setState({ ...this.state, isVoteModalOpen: true });
    };

    private readonly _onDismissVoteModal = (): void => {
        this.setState({ ...this.state, isVoteModalOpen: false });
    };

    private readonly _onWalletConnected = (providerName: string): void => {
        this.setState({ ...this.state, isWalletConnected: true, providerName });
    };

    private readonly _onVoteReceived = (voteInfo: VoteInfo): void => {
        const { userBalance, voteValue } = voteInfo;
        const tally = { ...this.state.tally };

        if (voteValue === VoteValue.Yes) {
            tally.yes = tally.yes.plus(userBalance);
        } else {
            tally.no = tally.no.plus(userBalance);
        }

        tally.totalBalance = tally.yes.plus(tally.no);

        this.setState({ ...this.state, isVoteReceived: true, tally });
    };
    private async _fetchVoteStatusAsync(): Promise<void> {
        try {
            const voteDomain = utils.isProduction() ? `https://${configs.DOMAIN_VOTE}` : 'http://localhost:3000';
            const voteEndpoint = `${voteDomain}/v1/tally/${proposalData.zeipId}`;
            const response = await fetch(voteEndpoint, {
                method: 'get',
                mode: 'cors',
                credentials: 'same-origin',
                headers: {
                    'content-type': 'application/json; charset=utf-8',
                },
            });

            if (!response.ok) {
                throw new Error('Request failed');
            }

            const responseData = await response.json();
            let { no, yes } = responseData;
            yes = new BigNumber(yes);
            no = new BigNumber(no);
            const totalBalance = yes.plus(no);
            const tally = {
                ...responseData,
                yes: new BigNumber(yes),
                no: new BigNumber(no),
                totalBalance,
            };

            this.setState({ ...this.state, tally });
        } catch (e) {
            // Empty block
        }
    }
}

const SectionWrap = styled.div`
    & + & {
        padding-top: 50px;
    }
`;

const VoteButton = styled(Button)`
    display: block;
    margin-bottom: 40px;
    width: 100%;
    max-width: 205px;
`;

const MoreLink = styled(Button)`
    & + & {
        margin-left: 30px;
    }
`;
