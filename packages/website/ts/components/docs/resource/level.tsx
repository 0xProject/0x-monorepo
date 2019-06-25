import { Link } from '@0x/react-shared';
import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';
import { colors } from 'ts/style/colors';
import { RatingBar } from 'ts/components/docs/resource/rating_bar';

export interface LevelProps {
    difficulty: Difficulty;
}

export enum Difficulty {
    Beginner = 'beginner',
    Intermediate = 'intermediate',
    Advanced = 'advanced',
}

const difficulties = {
    [Difficulty.Beginner]: {
        label: 'Beginner',
        rating: 1,
    },
    [Difficulty.Intermediate]: {
        label: 'Intermediate',
        rating: 2,
    },
    [Difficulty.Advanced]: {
        label: 'Advanced',
        rating: 3,
    },
};

export const Level: React.FunctionComponent<LevelProps> = ({ difficulty }: LevelProps) => {
    const info = difficulties[difficulty];
    return (
        <Wrapper>
            <DifficultyLabel>{info.label}</DifficultyLabel>
            <RatingBar rating={info.rating} />
        </Wrapper>
    );
};

const Wrapper = styled.div`
    display: flex;
    align-items: center;
`;

const DifficultyLabel = styled.span`
    font-size: 0.777777778rem;
    color: ${colors.brandDark};
    margin-right: 0.611111111rem;
`;
