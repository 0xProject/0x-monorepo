import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import * as React from 'react';
import DocumentTitle from 'react-document-title';
import styled from 'styled-components';
import { Banner } from 'ts/components/banner';
import { Button } from 'ts/components/button';
import { ModalContact } from 'ts/components/modals/modal_contact';
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
    isContactModalOpen: boolean;
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
    title: 'ZEIP23: Trading Bundles of Assets',
    summary: `This ZEIP introduces the MultiAssetProxy which brings support for trading arbitrary bundles of assets in 0x protocol. Historically only a single asset could be traded per each side of a trade. With the introduction of the MultiAssetProxy, users will be able to trade multiple ERC721 assets and even mix ERC721 and ERC20 to trade in a single order.`,
    url: 'https://blog.0xproject.com/zeip-23-trade-bundles-of-assets-fe69eb3ed960',
    votingDeadline: 1551584000,
    benefit: {
        title: 'Benefit',
        summary: `Supporting bundled trades is one of the most commonly requested features since the launch of 0x v2. Demand originated from our discussions with gaming and NFT related projects, but this upgrade provides utility to Prediction Markets as well as any relayer that wants to offer baskets of tokens. The MultiAssetProxy will enable new possibilities of trading.`,
        rating: 3,
        links: [
            {
                text: 'Learn More',
                url: 'https://0xproject.quip.com/k1ERAXnUj2ay/ZEIP23-Support-for-MultiAssetProxy',
            },
            {
                text: 'Technical detail',
                url: 'https://github.com/0xProject/ZEIPs/issues/23',
            },
        ],
    },
    risks: {
        title: 'Risk',
        summary: `Deploying the MultiAssetProxy is a hot upgrade to 0x protocol where the state of active contracts is modified. The contracts being modified contain allowances to users tokens. As such the MultiAssetProxy has successfully undergone a third party audit. We encourage the community to verify the MultiAssetProxy code along with the state changes.`,
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

export class Governance extends React.Component {
    public state: State = {
        isContactModalOpen: false,
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
                <DocumentTitle title="Governance Vote - 0x" />
                <Section maxWidth="1170px" isFlex={true}>
                    <Column width="55%" maxWidth="560px">
                        <Countdown deadline={proposalData.votingDeadline} />
                        <Heading size="medium">{proposalData.title}</Heading>
                        <Paragraph>{proposalData.summary}</Paragraph>
                        <Button
                            href={proposalData.url}
                            target={!_.isUndefined(proposalData.url) ? '_blank' : undefined}
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
                                        target={!_.isUndefined(link.url) ? '_blank' : undefined}
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
                                        target={!_.isUndefined(link.url) ? '_blank' : undefined}
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
                    heading="Need ZRX to vote?"
                    subline="Use 0x Instant to quickly trade ETH to ZRX for voting"
                    secondaryCta={{ text: 'Launch Instant', onClick: this._onLaunchInstantClick.bind(this) }}
                />
                <ModalContact isOpen={this.state.isContactModalOpen} onDismiss={this._onDismissContactModal} />
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

    private readonly _onDismissContactModal = (): void => {
        this.setState({ ...this.state, isContactModalOpen: false });
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
