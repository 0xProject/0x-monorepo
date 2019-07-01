import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { Button } from 'ts/components/button';
import { Heading, Paragraph } from 'ts/components/text';
import { Image } from 'ts/components/ui/image';
import { ExploreAnalyticAction, ExploreProject } from 'ts/types';

export const ExploreGridTile = (props: ExploreProject) => {
    // tslint:disable-next-line:no-unbound-method
    const onAnalytics = props.onAnalytics || _.noop;
    const onInstantClick = !!props.instant
        ? () => {
              props.onInstantClick();
              onAnalytics(ExploreAnalyticAction.InstantClick);
          }
        : undefined;
    const onClick = () => {
        onAnalytics(ExploreAnalyticAction.LinkClick);
    };
    return (
        <ExploreGridTileWrapper style={{ border: 'none' }}>
            {!!onInstantClick && (
                <ExploreGridButtonWrapper className="explore-grid-instant-button-wrapper">
                    <Button onClick={onInstantClick} padding={'12px 18px'} bgColor={'white'}>
                        Instant Trade
                    </Button>
                </ExploreGridButtonWrapper>
            )}
            <ExploreGridTileLink onClick={onClick} href={props.url} target="_blank">
                <ExploreGridHeroWell color={props.theme_color}>
                    <Image src={props.logo_url} height={'90px'} maxWidth={props.logo_max_width || '100px'} />
                </ExploreGridHeroWell>
                <ExploreGridContentWell>
                    <Heading marginBottom={'0.5rem'} size={'small'}>
                        {props.label}
                    </Heading>
                    <Paragraph style={{ minHeight: '4.2rem' }} marginBottom={'0.5rem'}>
                        {props.description}
                    </Paragraph>
                </ExploreGridContentWell>
            </ExploreGridTileLink>
        </ExploreGridTileWrapper>
    );
};

interface ExploreGridHeroWellProps {
    color: string;
}

const ExploreGridHeroWell = styled.div<ExploreGridHeroWellProps>`
    background-color: ${props => props.color};
    height: 14rem;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
`;

const ExploreGridContentWell = styled.div`
    padding: 1.5rem;
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-top: 0;
    flex-grow: 1;
`;

const ExploreGridTileLink = styled.a`
    display: flex;
    flex-direction: column;
    height: 100%;
`;

export const ExploreGridTileWrapper = styled.div`
    display: block;
    position: relative;
    background-color: white;
    height: 100%;
    border: 1px solid rgba(0, 0, 0, 0.15);
    & .explore-grid-instant-button-wrapper {
        transition: opacity 0.2s, visibility 0.2s 0s;
        opacity: 0;
        visibility: hidden;
    }
    &:hover .explore-grid-instant-button-wrapper {
        opacity: 1;
        visibility: visible;
    }
`;

const ExploreGridButtonWrapper = styled.div`
    position: absolute;
    top: 1rem;
    right: 1rem;
    z-index: 1;
`;
