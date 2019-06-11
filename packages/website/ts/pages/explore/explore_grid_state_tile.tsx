import * as React from 'react';
import styled from 'styled-components';

import { Heading, Paragraph } from 'ts/components/text';
import { Image } from 'ts/components/ui/image';

export interface ExploreGridDialogTileProps {
    dialogImageUrl?: string;
    title?: string;
    description: string;
}

export const EXPLORE_STATE_DIALOGS: { [s: string]: ExploreGridDialogTileProps } = {
    ERROR: {
        title: 'Something went wrong.',
        description: 'Try refreshing the page after a few moments',
    },
    LOADING: {
        description: 'Loading...',
    },
    EMPTY: {
        title: 'No projects found.',
        description: 'Try changing your search.',
    },
};

export const ExploreGridDialogTile = (props: ExploreGridDialogTileProps) => {
    return (
        <ExploreGridDialogTileWrapper>
            {!!props.dialogImageUrl && <Image src={props.dialogImageUrl} height={'90px'} />}
            {!!props.title && (
                <Heading marginBottom={'0.5rem'} size={'small'}>
                    {props.title}
                </Heading>
            )}
            <Paragraph marginBottom={'0.5rem'}>{props.description}</Paragraph>
        </ExploreGridDialogTileWrapper>
    );
};

const ExploreGridDialogTileWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    margin: 120px 0;
`;
