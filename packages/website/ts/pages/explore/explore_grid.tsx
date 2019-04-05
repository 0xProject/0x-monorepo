import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { addFadeInAnimation } from 'ts/constants/animations';
import { ExploreGridTile } from 'ts/pages/explore/explore_grid_tile';
import { ExploreTile, ExploreTileGridWidth, ExploreTileVisibility, ExploreTileWidth } from 'ts/types';

const EXPLORE_TILE_COL_WIDTH: { [ExploreTileWidth: string]: { [ExploreTileGridWidth: number]: number } } = {
    [ExploreTileWidth.OneThird]: {
        [ExploreTileGridWidth.ThreeColumn]: 2,
        [ExploreTileGridWidth.TwoColumn]: 2,
        [ExploreTileGridWidth.OneColumn]: 2,
    },
    [ExploreTileWidth.FullWidth]: {
        [ExploreTileGridWidth.ThreeColumn]: 6,
        [ExploreTileGridWidth.TwoColumn]: 4,
        [ExploreTileGridWidth.OneColumn]: 2,
    },
    [ExploreTileWidth.Half]: {
        [ExploreTileGridWidth.ThreeColumn]: 3,
        [ExploreTileGridWidth.TwoColumn]: 4,
        [ExploreTileGridWidth.OneColumn]: 2,
    },
    [ExploreTileWidth.TwoThirds]: {
        [ExploreTileGridWidth.ThreeColumn]: 4,
        [ExploreTileGridWidth.TwoColumn]: 4,
        [ExploreTileGridWidth.OneColumn]: 2,
    },
};

export interface ExptoreGridProps {
    tiles: ExploreTile[];
}

interface ExploreGridTilePosition {
    gridStart: number;
    gridEnd: number;
}

interface RicherExploreGridListTile extends ExploreTile {
    tilePositions: { [ExploreTileGridWidth: number]: ExploreGridTilePosition };
}

export class ExploreGrid extends React.Component<ExptoreGridProps> {
    public render(): React.ReactNode {
        return (
            <ExploreGridList>
                {this._prepareTiles().map(t => {
                    if (!!t.exploreProject) {
                        return (
                            <ExploreGridTileWrapper key={t.name} tilePositions={t.tilePositions}>
                                <ExploreGridTile {...t.exploreProject} />
                            </ExploreGridTileWrapper>
                        );
                    } else {
                        return (
                            <ExploreGridTileWrapper key={t.name} tilePositions={t.tilePositions}>
                                {!!t.component && t.component}
                            </ExploreGridTileWrapper>
                        );
                    }
                })}
            </ExploreGridList>
        );
    }

    private readonly _prepareTiles = (): RicherExploreGridListTile[] => {
        const visibleTiles = this.props.tiles.filter(t => t.visibility !== ExploreTileVisibility.Hidden);
        return this._generateGridValues(visibleTiles);
    };

    private readonly _generateGridPositions = (
        tiles: RicherExploreGridListTile[],
        width: ExploreTileGridWidth,
    ): RicherExploreGridListTile[] => {
        let gridEndCounter = 1;
        const newTiles = tiles.map(t => {
            if (gridEndCounter + EXPLORE_TILE_COL_WIDTH[t.width][width] > width + 1) {
                gridEndCounter = 1;
            }
            const gridStart = gridEndCounter;
            const gridEnd = gridEndCounter + EXPLORE_TILE_COL_WIDTH[t.width][width];
            gridEndCounter = gridEnd;
            const newTilePositions = _.assign({}, t.tilePositions);
            newTilePositions[width] = { gridStart, gridEnd };
            return _.assign({}, t, { tilePositions: newTilePositions }) as RicherExploreGridListTile;
        });
        return newTiles;
    };

    private readonly _generateGridValues = (tiles: ExploreTile[]): RicherExploreGridListTile[] => {
        let richerTiles = tiles.map(t => {
            return _.assign({ tilePositions: {} }, t) as RicherExploreGridListTile;
        });
        richerTiles = this._generateGridPositions(richerTiles, ExploreTileGridWidth.ThreeColumn);
        richerTiles = this._generateGridPositions(richerTiles, ExploreTileGridWidth.TwoColumn);
        richerTiles = this._generateGridPositions(richerTiles, ExploreTileGridWidth.OneColumn);
        return richerTiles;
    };
}

interface ExploreGridListProps {}

interface ExploreGridTileWrapperProps {
    tilePositions: { [ExploreTileGridWidth: number]: ExploreGridTilePosition };
}

const ExploreGridTileWrapper = styled.div<ExploreGridTileWrapperProps>`
    grid-column-start: ${props => props.tilePositions[ExploreTileGridWidth.ThreeColumn].gridStart};
    grid-column-end: ${props => props.tilePositions[ExploreTileGridWidth.ThreeColumn].gridEnd};
    @media (max-width: 56rem) {
        grid-column-start: ${props => props.tilePositions[ExploreTileGridWidth.TwoColumn].gridStart};
        grid-column-end: ${props => props.tilePositions[ExploreTileGridWidth.TwoColumn].gridEnd};
    }
    @media (max-width: 36rem) {
        grid-column-start: ${props => props.tilePositions[ExploreTileGridWidth.OneColumn].gridStart};
        grid-column-end: ${props => props.tilePositions[ExploreTileGridWidth.OneColumn].gridEnd};
    }
`;

const ExploreGridList = styled.div<ExploreGridListProps>`
    display: grid;
    grid-template-columns: repeat(${ExploreTileGridWidth.ThreeColumn}, 1fr);
    grid-column-gap: 1.5rem;
    grid-row-gap: 1.5rem;
    ${addFadeInAnimation('0.5s', '0.25s')}
    & > * {
        align-self: stretch;
    }
    @media (max-width: 56rem) {
        grid-template-columns: repeat(${ExploreTileGridWidth.TwoColumn}, 1fr);
    }
    @media (max-width: 36rem) {
        grid-template-columns: repeat(${ExploreTileGridWidth.OneColumn}, 1fr);
    }
`;
