import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { DocumentTitle } from 'ts/components/document_title';
import { Column, Section } from 'ts/components/newLayout';
import { SiteWrap } from 'ts/components/siteWrap';
import { Heading, Paragraph } from 'ts/components/text';
import { Proposal, proposals } from 'ts/pages/governance/data';
import { VoteIndexCard } from 'ts/pages/governance/vote_index_card';
import { TallyInterface } from 'ts/types';
import { documentConstants } from 'ts/utils/document_meta_constants';

const ZEIP_IDS = Object.keys(proposals).map(idString => parseInt(idString, 10));
const ZEIP_PROPOSALS: Proposal[] = ZEIP_IDS.map(id => proposals[id]).sort(
    (a, b) => b.voteStartDate.unix() - a.voteStartDate.unix(),
);

export interface VoteIndexProps {}

interface ZeipTallyMap {
    [id: number]: TallyInterface;
}

export interface VoteIndexState {
    tallys?: ZeipTallyMap;
}

export class VoteIndex extends React.Component<VoteIndexProps, VoteIndexState> {
    public state: VoteIndexState = {
        tallys: undefined,
    };

    public componentDidMount(): void {
        // tslint:disable:no-floating-promises
        this._fetchTallysAsync();
    }

    public render(): React.ReactNode {
        return (
            <SiteWrap>
                <DocumentTitle {...documentConstants.VOTE} />
                <Section isTextCentered={true} isPadded={true} padding="150px 0px 110px">
                    <Column>
                        <Heading size="medium" isCentered={true}>
                            0x Protocol Governance
                        </Heading>
                        <Paragraph size="medium" isCentered={true} isMuted={true} marginBottom="0">
                            Level up your favorite trading infrastructure to support new markets and industries
                        </Paragraph>
                    </Column>
                </Section>
                <VoteIndexCardWrapper>
                    {ZEIP_PROPOSALS.map(proposal => {
                        const tally = this.state.tallys && this.state.tallys[proposal.zeipId];
                        return <VoteIndexCard key={proposal.zeipId} tally={tally} {...proposal} />;
                    })}
                </VoteIndexCardWrapper>
            </SiteWrap>
        );
    }

    private async _fetchTallysAsync(): Promise<void> {
        // TODO: Real implementation
        const getRandomInt = (max: string): BigNumber => {
            return new BigNumber(max).times(Math.random());
        };
        const bigNumber = '100000000000000000000000000';
        const generateRandomTally = (): TallyInterface => ({
            yes: getRandomInt(bigNumber),
            no: getRandomInt(bigNumber),
        });
        setTimeout(() => {
            const tallys = {
                23: generateRandomTally(),
                39: generateRandomTally(),
                24: generateRandomTally(),
                25: generateRandomTally(),
            };
            this.setState({ tallys });
        }, 1000);
    }
}

const VoteIndexCardWrapper = styled.div`
    margin-bottom: 150px;
`;
