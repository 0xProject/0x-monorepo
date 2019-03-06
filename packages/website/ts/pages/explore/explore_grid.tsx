import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { ExploreGridTile } from 'ts/pages/explore/explore_grid_tile';
import { ExploreEntryVisibility, RicherExploreEntry} from 'ts/types';

export interface ExptoreGridProps {
    entries: RicherExploreEntry[];
}

export class ExploreGrid extends React.Component<ExptoreGridProps> {
    constructor(props: ExptoreGridProps) {
        super(props);
    }

    public render(): React.ReactNode {
        return (
            <ExploreGridList>
                {this.props.entries.filter(e => e.visibility !== ExploreEntryVisibility.Hidden).map(e => {
                    return <ExploreGridTile {...e} key={e.label} />;
                })}
            </ExploreGridList>
        );
    }
}

interface ExploreGridListProps {

}

const ExploreGridList = styled.div<ExploreGridListProps>`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-column-gap: 1.5rem;
    grid-row-gap: 1.5rem;
    @media (max-width: 56rem) {
        grid-template-columns: repeat(2, 1fr);;
    }
    @media (max-width: 36rem) {
        grid-template-columns: repeat(1, 1fr);;
    }
`;
