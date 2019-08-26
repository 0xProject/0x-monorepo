import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { Button } from 'ts/components/button';
import { DocumentTitle } from 'ts/components/document_title';
import { Column, Section } from 'ts/components/newLayout';
import { SiteWrap } from 'ts/components/siteWrap';
import { Heading, Paragraph } from 'ts/components/text';
import { Proposal, proposals } from 'ts/pages/governance/data';
import { VoteIndexCard } from 'ts/pages/governance/vote_index_card';
import { TallyInterface } from 'ts/types';
import { configs } from 'ts/utils/configs';
import { constants } from 'ts/utils/constants';
import { documentConstants } from 'ts/utils/document_meta_constants';
import { environments } from 'ts/utils/environments';

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
                        <SubtitleContentWrap>
                            <Paragraph size="medium" isCentered={true} isMuted={true} marginBottom="0">
                                Vote on 0x Improvement Proposals (ZEIPs) using ZRX tokens.
                            </Paragraph>
                            <ButtonWrapper>
                                <Button
                                    href={constants.URL_VOTE_FAQ}
                                    isWithArrow={true}
                                    isAccentColor={true}
                                    shouldUseAnchorTag={true}
                                    target="_blank"
                                >
                                    FAQ
                                </Button>
                            </ButtonWrapper>
                        </SubtitleContentWrap>
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
    private async _fetchVoteStatusAsync(zeipId: number): Promise<TallyInterface> {
        try {
            const voteDomain = environments.isProduction()
                ? `https://${configs.DOMAIN_VOTE}`
                : `https://${configs.DOMAIN_VOTE}/staging`;
            const voteEndpoint = `${voteDomain}/v1/tally/${zeipId}`;
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
            const tally = {
                ...responseData,
                yes: new BigNumber(yes),
                no: new BigNumber(no),
            };
            return tally;
        } catch (e) {
            // Empty block
            return {
                yes: new BigNumber(0),
                no: new BigNumber(0),
            };
        }
    }

    private async _fetchTallysAsync(): Promise<void> {
        const tallyResponses = await Promise.all(ZEIP_IDS.map(async zeipId => this._fetchVoteStatusAsync(zeipId)));
        const tallys: { [key: number]: TallyInterface } = {};
        ZEIP_IDS.forEach((zeipId, i) => (tallys[zeipId] = tallyResponses[i]));
        this.setState({ tallys });
    }
}

const VoteIndexCardWrapper = styled.div`
    margin-bottom: 150px;
`;

const SubtitleContentWrap = styled.div`
    & > * {
        display: inline;
    }
`;

const ButtonWrapper = styled.div`
    margin-left: 0.5rem;
`;
