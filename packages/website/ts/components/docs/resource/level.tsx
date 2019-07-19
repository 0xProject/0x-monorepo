import React from 'react';
import styled from 'styled-components';

import { RatingBar } from 'ts/components/docs/resource/rating_bar';

import { colors } from 'ts/style/colors';

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

export const Level: React.FC<LevelProps> = ({ difficulty }) => {
    const info = difficulties[difficulty];
    return (
        <LevelWrapper>
            <DifficultyLabel>{info.label}</DifficultyLabel>
            <RatingBar rating={info.rating} />
        </LevelWrapper>
    );
};

const LevelWrapper = styled.div`
    display: flex;
    align-items: center;
    margin: 20px 0;
`;

const DifficultyLabel = styled.span`
    font-size: 0.777777778rem;
    color: ${colors.brandDark};
    margin-right: 0.611111111rem;
`;
