import * as React from 'react';
import styled from 'styled-components';

import { ExploreGridTileWrapper } from 'ts/pages/explore/explore_grid_tile';
import { RicherExploreEntry } from 'ts/types';

interface ExploreGridFeaturedTitleProps extends RicherExploreEntry {
    headerImageUrl: string;
}

interface ExploreGridFeaturedTileWrapperProps {
    themeColor: string;
}

const ExploreGridFeaturedTileRightWrapper = styled.div`
`;

const ExploreGridFeaturedTileLeftWrapper = styled.div`
`;


const ExploreGridFeaturedTileWrapper = styled(ExploreGridTileWrapper)<ExploreGridFeaturedTileWrapperProps>`
    background-color: ${props => props.themeColor};
`;

export const ExploreGridFeaturedTile = (props: ExploreGridFeaturedTitleProps) => {
    return <ExploreGridFeaturedTileWrapper themeColor={props.theme_color}>
        <ExploreGridFeaturedTileRightWrapper>

        </ExploreGridFeaturedTileRightWrapper>
        <ExploreGridFeaturedTileLeftWrapper>
            
        </ExploreGridFeaturedTileLeftWrapper>
    </ExploreGridFeaturedTileWrapper>;
};
