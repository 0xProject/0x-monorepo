import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { ExploreGridTile } from 'ts/pages/explore/explore_grid_tile';
import { RicherExploreEntry} from 'ts/types';

export interface ExptoreGridProps {
    tiles: ExploreGridListTile[];
}

export enum ExploreGridListTileVisibility {
    Hidden = 'HIDDEN',
    Visible = 'VISIBLE',
}

export enum ExploreGridListTileWidth {
    OneThird = 2,
    FullWidth = 6,
    Half = 3,
    TwoThirds = 4,
}

export interface ExploreGridListTile {
    name: string;
    visibility: ExploreGridListTileVisibility;
    width?: ExploreGridListTileWidth;
    exploreEntry?: RicherExploreEntry;
    component?: React.ReactNode;
}

interface RicherExploreGridListTile extends ExploreGridListTile {
    gridStart: number;
    gridEnd: number;
}

export class ExploreGrid extends React.Component<ExptoreGridProps> {
    constructor(props: ExptoreGridProps) {
        super(props);
    }

    public render(): React.ReactNode {
        return (
            <ExploreGridList>
                {this._prepareTiles().map(t => {
                    if (!!t.exploreEntry) {
                        return <ExploreGridTileWrapper key={t.name} gridStart={t.gridStart} gridEnd={t.gridEnd}>
                            <ExploreGridTile {...t.exploreEntry} />
                        </ExploreGridTileWrapper>;
                    } else {
                        return <ExploreGridTileWrapper key={t.name} gridStart={t.gridStart} gridEnd={t.gridEnd}>
                            {!!t.component && t.component}
                        </ExploreGridTileWrapper>;
                    }
               })}
            </ExploreGridList>
        );
    }

    private _prepareTiles = (): RicherExploreGridListTile[] => {
        const visibleTiles = this.props.tiles.filter(t => t.visibility !== ExploreGridListTileVisibility.Hidden);
        return this._generateGridValues(visibleTiles);
    }

    private _generateGridValues = (tiles: ExploreGridListTile[]): RicherExploreGridListTile[] => {
        let gridEndCounter = 1;
        const richerTiles = tiles.map(t => {
            if (gridEndCounter + t.width > (ExploreGridListTileWidth.FullWidth + 1)) {
                gridEndCounter = 1;
            }
            const gridStart = gridEndCounter;
            const gridEnd = gridEndCounter + t.width;
            gridEndCounter = gridEnd;
            const newTile = _.assign({ gridStart, gridEnd }, t);
            return newTile as RicherExploreGridListTile;
        });
        return richerTiles;
    }
}

interface ExploreGridListProps {
}

interface ExploreGridTileWrapperProps {
    gridStart: number;
    gridEnd: number;
}

const ExploreGridTileWrapper = styled.div<ExploreGridTileWrapperProps>`
    grid-column-start: ${props => props.gridStart};
    grid-column-end: ${props => props.gridEnd};
`;

const ExploreGridList = styled.div<ExploreGridListProps>`
    display: grid;
    grid-template-columns: repeat(${ExploreGridListTileWidth.FullWidth}, 1fr);
    grid-column-gap: 1.5rem;
    grid-row-gap: 1.5rem;
    @media (max-width: 56rem) {
        grid-template-columns: repeat(2, 1fr);;
    }
    @media (max-width: 36rem) {
        grid-template-columns: repeat(1, 1fr);;
    }
`;
