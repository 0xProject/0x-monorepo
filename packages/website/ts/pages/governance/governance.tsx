import * as _ from 'lodash';
import * as React from 'react';
import DocumentTitle from 'react-document-title';
import styled from 'styled-components';

import { Banner } from 'ts/components/banner';
import { Button } from 'ts/components/button';
import { Column, FlexWrap, Section, WrapSticky } from 'ts/components/newLayout';
import { SiteWrap } from 'ts/components/siteWrap';
import { Heading, Paragraph } from 'ts/components/text';
import { ConnectedWalletMark } from 'ts/pages/governance/connected_wallet_mark';
import { Countdown, VoteDeadline } from 'ts/pages/governance/countdown';
import { RatingBar } from 'ts/pages/governance/rating_bar';
import { VoteStats } from 'ts/pages/governance/vote_stats';

import { ModalContact } from 'ts/components/modals/modal_contact';
import { ModalVote } from 'ts/pages/governance/modal_vote';
import { colors } from 'ts/style/colors';

import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';

interface LabelInterface {
    [key: number]: string;
}

export interface TallyInterface {
    zeip?: string;
    yes?: string;
    yesPercentage?: number;
    no?: string;
    noPercentage?: number;
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

const complexityLabels: LabelInterface = {
    1: 'Simple',
    2: 'Medium',
    3: 'Complex',
};

const proposalData = {
    zeipId: 1,
    title: 'MultiAssetProxy Approval',
    summary: `MultiAssetProxy brings support for trading arbitrary bundles of assets in 0x protocol. Historically only a single asset could be traded per each side of a trade. With the introduction of the MultiAssetProxy, users will be able to trade multiple ERC721 assets and even mix ERC721 and ERC20 to trade in a single order.`,
    url: '#',
    votingDeadline: 1551584000,
    benefit: {
        title: 'Ecosystem Benefit',
        summary: `Supporting bundled trades is one of the most commonly requested features since the launch of 0x v2. Demand originated from our discussions with gaming and NFT related projects, but this upgrade provides utility to Prediction Markets as well as any relayer that wants to offer baskets of tokens. The MultiAssetProxy will enable new possibilities of trading.  *High benefit 4/5*`,
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
    stakes: {
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
    complexity: {
        title: 'Complexity of Code',
        summary: `The world's assets are becoming tokenized on public blockchains. 0x Protocol is free, open-source infrastracture that developers and businesses utilize to build products that enable the purchasing and trading of crypto tokens.`,
        rating: 1,
        links: [
            {
                text: 'View Code',
                url: '#',
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
            yesPercentage: 0,
            noPercentage: 0,
        },
    };
    public componentDidMount(): void {
        this._fetchVoteStatusAsync();
    }
    public render(): React.ReactNode {
        const { isVoteReceived, isWalletConnected, providerName, tally } = this.state;
        const buildAction = (
            <Button
                href="/docs"
                isWithArrow={true}
                isAccentColor={true}
                isTransparent={true}
                borderColor={colors.brandLight}
            >
                Build on 0x
            </Button>
        );
        return (
            <SiteWrap theme="dark">
                <DocumentTitle title="Features & Benefits - 0x" />
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
                                    <Button
                                        href={link.url}
                                        target={!_.isUndefined(link.url) ? '_blank' : undefined}
                                        isWithArrow={true}
                                        isAccentColor={true}
                                        key={`benefitlink-${index}`}
                                    >
                                        {link.text}
                                    </Button>
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
                        <Heading>{proposalData.stakes.title}</Heading>
                        <FlexWrap>
                            <Column width="55%" maxWidth="560px">
                                <Paragraph>{proposalData.stakes.summary}</Paragraph>
                                {_.map(proposalData.stakes.links, (link, index) => (
                                    <Button
                                        href={link.url}
                                        target={!_.isUndefined(link.url) ? '_blank' : undefined}
                                        isWithArrow={true}
                                        isAccentColor={true}
                                        key={`risklink-${index}`}
                                    >
                                        {link.text}
                                    </Button>
                                ))}
                            </Column>
                            <Column width="30%" maxWidth="360px">
                                <RatingBar color="#AE5400" labels={riskLabels} rating={proposalData.stakes.rating} />
                            </Column>
                        </FlexWrap>
                    </SectionWrap>
                </Section>

                <Banner
                    heading="Ready to get started?"
                    subline="Dive into our docs, or contact us if needed"
                    mainCta={{ text: 'Get Started', href: '/docs' }}
                    secondaryCta={{ text: 'Get in Touch', onClick: this._onOpenContactModal.bind(this) }}
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
    // private _renderSummarySection()
    private _onOpenContactModal = (): void => {
        this.setState({ ...this.state, isContactModalOpen: true });
    };

    private _onDismissContactModal = (): void => {
        this.setState({ ...this.state, isContactModalOpen: false });
    };

    private _onOpenVoteModal = (): void => {
        this.setState({ ...this.state, isVoteModalOpen: true });
    };

    private _onDismissVoteModal = (): void => {
        this.setState({ ...this.state, isVoteModalOpen: false });
    };

    private _onWalletConnected = (providerName: string): void => {
        this.setState({ ...this.state, isWalletConnected: true, providerName });
    };

    private _onVoteReceived = (): void => {
        this.setState({ ...this.state, isVoteReceived: true });
    };
    private async _fetchVoteStatusAsync(): Promise<void> {
        try {
            // Disabling no-unbound method b/c no reason for _.isEmpty to be bound
            // tslint:disable:no-unbound-method
            const isProduction = window.location.host.includes('0x.org');
            const voteEndpoint = isProduction ? 'https://vote.0x.org/v1/tally/' : 'http://localhost:3000/v1/tally/';
            const response = await fetch(`${voteEndpoint}${proposalData.zeipId}`, {
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
            const { no, yes } = responseData;
            const HUNDRED = new BigNumber(100);
            const yesTally = new BigNumber(yes);
            const noTally = new BigNumber(no);
            const totalBalance = yesTally.plus(no);
            const yesPercentage = HUNDRED.times(yesTally.dividedBy(totalBalance))
                .ceil()
                .toNumber();
            const noPercentage = HUNDRED.times(noTally.dividedBy(totalBalance))
                .ceil()
                .toNumber();
            const tally = {
                ...responseData,
                yesPercentage,
                noPercentage,
                totalBalance,
            };

            this.setState({ ...this.state, tally });
        } catch (e) {
            // Empty block
        }
    }
}

interface SectionProps {
    isNotRelative?: boolean;
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
