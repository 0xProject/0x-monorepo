import * as React from 'react';
import styled from 'styled-components';

import { RatingBar } from 'ts/components/docs/resource/rating_bar';

import { colors } from 'ts/style/colors';

interface ILevelProps {
    difficulty: Difficulty;
}

export enum Difficulty {
    Beginner = 'Beginner',
    Intermediate = 'Intermediate',
    Advanced = 'Advanced',
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

export const Level: React.FC<ILevelProps> = ({ difficulty }) => {
    const { label, rating } = difficulties[difficulty];
    return (
        <LevelWrapper>
            <DifficultyLabel>{label}</DifficultyLabel>
            <RatingBar rating={rating} />
        </LevelWrapper>
    );
};

const LevelWrapper = styled.div`
    display: flex;
    align-items: center;
    margin: 20px 0;
`;

const DifficultyLabel = styled.span`
    font-size: 0.78rem;
    color: ${colors.brandDark};
    margin-right: 0.61rem;
`;
