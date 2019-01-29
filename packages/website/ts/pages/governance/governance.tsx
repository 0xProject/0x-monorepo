import * as _ from 'lodash';
import * as React from 'react';
import DocumentTitle from 'react-document-title';
import styled from 'styled-components';

import { Banner } from 'ts/components/banner';
import { Button } from 'ts/components/button';
import { Column, FlexWrap, Section, WrapSticky } from 'ts/components/newLayout';
import { SiteWrap } from 'ts/components/siteWrap';
import { Heading, Paragraph } from 'ts/components/text';
import { Countdown, VoteDeadline } from 'ts/pages/governance/countdown';

import { ModalContact } from 'ts/components/modals/modal_contact';
import { ModalVote } from 'ts/pages/governance/modal_vote';
import { colors } from 'ts/style/colors';

interface LabelInterface {
    [key: number]: string;
}

interface RatingBarProps {
    rating: number;
    color?: string;
    labels: LabelInterface;
}

interface RatingBulletProps {
    color: string;
    isFilled: boolean;
}

interface VoteBarProps {
    label: string;
    color: string;
    totalVotes: number;
    votes: number;
}

interface VoteColumnProps {
    color: string;
    width: number;
}

interface ConnectedWalletMarkProps {
    isConnected: boolean;
    providerName?: string;
}

const benefitLabels: LabelInterface = {
    1: 'little benefit',
    2: 'little benefit',
    3: 'little benefit',
    4: 'high benefit',
    5: 'extreme benefit',
};

const riskLabels: LabelInterface = {
    1: 'little risk',
    2: 'little risk',
    3: 'little risk',
    4: 'high risk',
    5: 'extreme risk',
};

const complexityLabels: LabelInterface = {
    1: 'simple',
    2: 'simple',
    3: 'simple',
    4: 'very complex',
    5: 'extremely complex',
};

const proposalData = {
    title: 'MultiAssetProxy Approval',
    summary: `The world's assets are becoming tokenized on public blockchains. 0x Protocol is free, open-source infrastracture that developers and businesses utilize to build products that enable the purchasing and trading of crypto tokens.`,
    url: '#',
    votingDeadline: 1609459200,
    results: {
        total: 2887000,
        votes: [
            {
                label: 'Yes',
                total: 2165250,
            },
            {
                label: 'No',
                total: 721750,
            },
        ],
    },
    benefit: {
        title: 'Ecosystem Benefit',
        summary: `The world's assets are becoming tokenized on public blockchains. 0x Protocol is free, open-source infrastracture that developers and businesses utilize to build products that enable the purchasing and trading of crypto tokens.`,
        rating: 4,
        links: [
            {
                text: 'Learn More',
                url: '#',
            },
        ],
    },
    stakes: {
        title: 'Stakes',
        summary: `The MultiAssetProxy allows for smart contracts to take control of a user’s funds. If there is a bug in the contract, it will allow potential attackers to gain control of large amounts of assets. We rate this as high risk, and despite our extensive internal and external audits, we encourage as many people as possible to check our code. `,
        rating: 4,
        links: [
            {
                text: 'View Audit',
                url: '#',
            },
            {
                text: 'View Code',
                url: '#',
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

const RatingBar: React.StatelessComponent<RatingBarProps> = ({ rating, color, labels }) => {
    const id =  Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const ratingLabel = labels[rating];
    const ratingPlaceholders = Array.from(new Array(5), (value, index) => index + 1);
    const fillCheck = (currentIndex: number) => currentIndex <= rating;

    return (
        <div>
            <div style={{ display: 'flex', marginBottom: '12px' }}>
                {ratingPlaceholders.map((currentIndex: number) => <RatingBullet color={color} key={`${id}-${currentIndex}`} isFilled={fillCheck(currentIndex)} />)}
            </div>
            <Paragraph>{ratingLabel}</Paragraph>
        </div>
    );
};

const VoteColumn = styled.div<VoteColumnProps>`
    background-color: ${props => props.color};
    width: calc(${props => props.width}% - 45px);
    height: 13px;
    margin-right: 10px;
`;

const VoteColumnPrefix = styled.span`
    font-size: 1rem;
    line-height: 1;
    width: 40px;
    margin-right: 5px;
    font-weight: 300;
`;

const VoteColumnLabel = styled.span`
    font-size: 1rem;
    line-height: 1;
    font-weight: 300;
`;

const VoteBar: React.StatelessComponent<VoteBarProps> = ({ totalVotes, votes, color, label }) => {
    const percentage = (100 / totalVotes) * votes;
    const percentageLabel = `${percentage}%`;

    return (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', marginLeft: '-50px' }}>
            <VoteColumnPrefix>{label}</VoteColumnPrefix>
            <div style={{ display: 'flex', flex: 1, alignItems: 'center' }}>
                <VoteColumn color={color} width={percentage} />
                <VoteColumnLabel>{percentageLabel}</VoteColumnLabel>
            </div>
        </div>
    );
};

const ConnectedWalletMark: React.StatelessComponent<ConnectedWalletMarkProps> = ({ isConnected, providerName }) => {
    const typeLabel = isConnected ? providerName || 'Wallet connected' : 'Connect your wallet';

    const Wrapper = styled.div`
        display: flex;
        align-items: center;
        margin-bottom: 20px;
        justify-content: flex-end;
    `;
    const Status = styled.span<ConnectedWalletMarkProps>`
        background: ${props => props.isConnected ? colors.brandLight : '#FF2828'};
        border-radius: 50%;
        width: 8px;
        height: 8px;
        display: inline-block;
        margin-right: 5px;
    `;

    const Label = styled.span`
        font-size: 12px;
    `;

    return (
        <Wrapper>
            <Status isConnected={isConnected} />
            <Label>{typeLabel}</Label>
        </Wrapper>
    );
};

export class Governance extends React.Component {
    public state = {
        isContactModalOpen: false,
        isVoteModalOpen: false,
        isWalletConnected: false,
        isVoteReceived: false,
        providerName: 'Metamask',
    };
    public render(): React.ReactNode {
        const { isVoteReceived, isWalletConnected, providerName } = this.state;
        const buildAction = (
            <Button href="/docs" isWithArrow={true} isAccentColor={true} isTransparent={true} borderColor={colors.brandLight}>
                Build on 0x
            </Button>
        );
        return (
            <SiteWrap theme="dark">
                <DocumentTitle title="Features & Benefits - 0x" />
                <Section maxWidth="1170px" isFlex={true}>
                    <Column width="55%" maxWidth="560px">
                        <Countdown deadline={proposalData.votingDeadline} />
                        <Heading size="medium">
                            {proposalData.title}
                        </Heading>
                        <Paragraph>
                            {proposalData.summary}
                        </Paragraph>
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
                        <VoteDeadline deadline={proposalData.votingDeadline} />
                        <ConnectedWalletMark isConnected={isWalletConnected} providerName={providerName} />
                        <VoteButton onClick={this._onOpenVoteModal.bind(this)} isWithArrow={false} isAccentColor={true} isTransparent={true} borderColor={colors.brandLight}>
                            {isVoteReceived ? 'Vote Received' : 'Vote'}
                        </VoteButton>
                        <Paragraph marginBottom="10px">Results (2,887,000 ZRX total vote)</Paragraph>
                        <VoteBar label="Yes" color={colors.brandLight} totalVotes={2887000} votes={2165250} />
                        <VoteBar label="No" color="#AE5400" totalVotes={2887000} votes={721750} />
                    </Column>
                </Section>

                <Section bgColor="dark" maxWidth="1170px">
                    <SectionWrap>
                        <Heading>
                            {proposalData.benefit.title}
                        </Heading>
                        <FlexWrap>
                            <Column width="55%" maxWidth="560px">
                                <Paragraph>{proposalData.benefit.summary}</Paragraph>
                                <Button
                                    href={proposalData.url}
                                    target={!_.isUndefined(proposalData.url) ? '_blank' : undefined}
                                    isWithArrow={true}
                                    isAccentColor={true}
                                >
                                    Audit Code
                                </Button>
                            </Column>
                            <Column width="30%" maxWidth="360px">
                                <RatingBar color={colors.brandLight} labels={benefitLabels} rating={proposalData.benefit.rating} />
                            </Column>
                        </FlexWrap>
                    </SectionWrap>
                    <SectionWrap>
                        <Heading>
                            {proposalData.stakes.title}
                        </Heading>
                        <FlexWrap>
                            <Column width="55%" maxWidth="560px">
                                <Paragraph>{proposalData.stakes.summary}</Paragraph>
                            </Column>
                            <Column width="30%" maxWidth="360px">
                                <RatingBar color="#AE5400" labels={riskLabels} rating={proposalData.stakes.rating} />
                            </Column>
                        </FlexWrap>
                    </SectionWrap>
                    <SectionWrap>
                        <Heading>
                            {proposalData.complexity.title}
                        </Heading>
                        <FlexWrap>
                            <Column width="55%" maxWidth="560px">
                                <Paragraph>{proposalData.complexity.summary}</Paragraph>
                            </Column>
                            <Column width="30%" maxWidth="360px">
                                <RatingBar labels={complexityLabels} rating={proposalData.complexity.rating} />
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
                <ModalVote isOpen={this.state.isVoteModalOpen} onDismiss={this._onDismissVoteModal} onWalletConnected={this._onWalletConnected.bind(this)} onVoted={this._onVoteReceived.bind(this)} />
            </SiteWrap>
        );
    }

    public _onOpenContactModal = (): void => {
        this.setState({ ...this.state, isContactModalOpen: true });
    };

    public _onDismissContactModal = (): void => {
        this.setState({ ...this.state, isContactModalOpen: false });
    };

    public _onOpenVoteModal = (): void => {
        this.setState({ ...this.state, isVoteModalOpen: true });
    };

    public _onDismissVoteModal = (): void => {
        this.setState({ ...this.state, isVoteModalOpen: false });
    };

    public _onWalletConnected = (providerName: string): void => {
        this.setState({ ...this.state, isWalletConnected: true, providerName });
    };

    public _onVoteReceived = (): void => {
        this.setState({ ...this.state, isVoteReceived: true });
    };
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
`;

const RatingBullet = styled.div<RatingBulletProps>`
    background-color: ${props => props.isFilled && props.color};
    border: 1px solid ${props => props.color};
    border-radius: 50%;
    width: 12px;
    height: 12px;

    & + & {
        margin-left: 8px;
    }
`;

RatingBullet.defaultProps = {
    color: colors.white,
};
