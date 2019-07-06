import React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

interface IRatingBarProps {
    rating: number;
}

interface IRatingBulletProps {
    isFilled: boolean;
}

export const RatingBar: React.FC<IRatingBarProps> = ({ rating }) => {
    const id = Math.random()
        .toString(36)
        .substring(2, 15);
    const ratingPlaceholders = Array.from(new Array(3), (value, index) => index + 1);
    const fillCheck = (currentIndex: number) => currentIndex <= rating;

    // TODO convert this to use a Container component
    return (
        <RatingBarWrapper>
            {ratingPlaceholders.map((currentIndex: number) => (
                <RatingBullet key={`${id}-${currentIndex}`} isFilled={fillCheck(currentIndex)} />
            ))}
        </RatingBarWrapper>
    );
};

const RatingBarWrapper = styled.div`
    display: flex;
    align-items: center;
`;

const RatingBullet = styled.div<IRatingBulletProps>`
    background-color: ${({ isFilled }) => (isFilled ? colors.brandDark : 'rgba(0, 56, 49, 0.2)')};
    border-radius: 50%;
    width: 10px;
    height: 10px;

    & + & {
        margin-left: 4px;
    }
`;
