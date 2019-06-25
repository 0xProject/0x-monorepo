import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { Paragraph } from 'ts/components/text';
import { colors } from 'ts/style/colors';

interface LabelInterface {
    [key: number]: string;
}

interface RatingBarProps {
    rating: number;
}

interface RatingBulletProps {
    isFilled: boolean;
}

export const RatingBar: React.StatelessComponent<RatingBarProps> = ({ rating }) => {
    const id =
        Math.random()
            .toString(36)
            .substring(2, 15) +
        Math.random()
            .toString(36)
            .substring(2, 15);
    const ratingPlaceholders = Array.from(new Array(3), (value, index) => index + 1);
    const fillCheck = (currentIndex: number) => currentIndex <= rating;

    // TODO convert this to use a Container component
    return (
        <Wrapper>
            {ratingPlaceholders.map((currentIndex: number) => (
                <RatingBullet key={`${id}-${currentIndex}`} isFilled={fillCheck(currentIndex)} />
            ))}
        </Wrapper>
    );
};

const Wrapper = styled.div`
    display: flex;
    align-items: center;
`;

const RatingBullet = styled.div<RatingBulletProps>`
    background-color: ${props => (props.isFilled ? colors.brandDark : 'rgba(0, 56, 49, 0.2)')};
    border-radius: 50%;
    width: 10px;
    height: 10px;

    & + & {
        margin-left: 4px;
    }
`;
