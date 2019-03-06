import * as React from 'react';
import styled from 'styled-components';

import { Button } from 'ts/components/button';
import { Heading, Paragraph } from 'ts/components/text';
import { Image } from 'ts/components/ui/image';
import { RicherExploreEntry } from 'ts/types';

export const ExploreGridTile = (props: RicherExploreEntry) => {
    return (<ExploreGridTileWrapper>
        {!!props.instant && (<ExploreGridButtonWrapper>
            <Button onClick={props.onInstantClick} padding={'12px 18px'} bgColor={'white'}>Instant Trade</Button>
        </ExploreGridButtonWrapper>)}
        <ExploreGridTileLink href={props.url} target="_blank">
            <ExploreGridHeroWell color={props.theme_color}>
                <Image
                    src={props.logo_url}
                    height={'90px'}
                />
            </ExploreGridHeroWell>
            <ExploreGridContentWell>
                <Heading marginBottom={'0.5rem'} size={'small'}>{props.label}</Heading>
                <Paragraph marginBottom={'0.5rem'}>{props.description}</Paragraph>
            </ExploreGridContentWell>
        </ExploreGridTileLink>
    </ExploreGridTileWrapper>);
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
`;

const ExploreGridTileLink = styled.a`
    display: block;
`;

export const ExploreGridTileWrapper = styled.div`
    display: block;
    position: relative;
    background-color: white;
    border: 1px solid rgba(0, 0, 0, 0.15);
    // transition: box-shadow 200ms ease-in-out;
    // &:hover {
    //     box-shadow: 0px 8px 24px rgba(0, 0, 0, 0.1);
    // }
`;

const ExploreGridButtonWrapper = styled.div`
    position: absolute;
    top: 1rem;
    right: 1rem;
    z-index: 1;
`;
