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
    const ratingPlaceholders = Array.from(new Array(3), (_, index) => index + 1);
    const fillCheck = (currentIndex: number) => currentIndex <= rating;

    return (
        <RatingBarWrapper>
            {ratingPlaceholders.map((currentIndex: number) => (
                <RatingBullet key={`rating-${currentIndex}`} isFilled={fillCheck(currentIndex)} />
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
