import * as React from 'react';
import styled from 'styled-components';

import { Button } from 'ts/components/button';
import { Heading, Paragraph } from 'ts/components/text';
import { Image } from 'ts/components/ui/image';
import { ExploreGridTileWrapper } from 'ts/pages/explore/explore_grid_tile';
import { colors } from 'ts/style/colors';
import { ExploreProject } from 'ts/types';

interface ExploreGridFeaturedTitleProps extends ExploreProject {
    headerImageUrl: string;
}

interface ExploreGridFeaturedTileWrapperProps {
    themeColor: string;
}

const ExploreGridFeaturedTileRightWrapper = styled.div`
    padding: 4rem 4rem 0 1.5rem;
    max-width: 28rem;
    min-width: 24rem;
`;

const ExploreGridFeaturedTileLeftWrapper = styled.div``;

const ExploreGridFeaturedTileWrapper = styled(ExploreGridTileWrapper)<ExploreGridFeaturedTileWrapperProps>`
    background-color: ${props => props.themeColor};
    display: flex;
    justify-content: space-between;
`;

const ExploreGridTextContent = styled.div`
    margin-top: 0.5rem;
`;

export const ExploreGridFeaturedTile = (props: ExploreGridFeaturedTitleProps) => {
    return (
        <ExploreGridFeaturedTileWrapper themeColor={props.theme_color}>
            <ExploreGridFeaturedTileLeftWrapper>
                <Image src={props.headerImageUrl} width={'100%'} />
            </ExploreGridFeaturedTileLeftWrapper>
            <ExploreGridFeaturedTileRightWrapper>
                <Image src={props.logo_url} height={'56px'} />
                <ExploreGridTextContent>
                    <Heading color={colors.white} marginBottom={'0.75rem'} size={'default'}>
                        {props.label}
                    </Heading>
                    <Paragraph color={colors.white} marginBottom={'1.5rem'}>
                        {props.description}
                    </Paragraph>
                    <Button isWithArrow={true} color={colors.white} href={props.url}>
                        Launch
                    </Button>
                </ExploreGridTextContent>
            </ExploreGridFeaturedTileRightWrapper>
        </ExploreGridFeaturedTileWrapper>
    );
};
