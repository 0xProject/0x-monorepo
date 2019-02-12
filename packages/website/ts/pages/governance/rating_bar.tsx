import * as _ from 'lodash';
import * as React from 'react';
import DocumentTitle from 'react-document-title';
import styled from 'styled-components';

import { Paragraph } from 'ts/components/text';

import { colors } from 'ts/style/colors';

interface LabelInterface {
    [key: number]: string;
}

interface RatingBarProps {
    rating: number;
    color?: string;
    labels: LabelInterface;
}

interface RatingBulletProps {
    color: string;
    isFilled: boolean;
}

export const RatingBar: React.StatelessComponent<RatingBarProps> = ({ rating, color, labels }) => {
    const id =
        Math.random()
            .toString(36)
            .substring(2, 15) +
        Math.random()
            .toString(36)
            .substring(2, 15);
    const ratingLabel = labels[rating];
    const ratingPlaceholders = Array.from(new Array(3), (value, index) => index + 1);
    const fillCheck = (currentIndex: number) => currentIndex <= rating;

    return (
        <div>
            <div style={{ display: 'flex', marginBottom: '12px' }}>
                {ratingPlaceholders.map((currentIndex: number) => (
                    <RatingBullet color={color} key={`${id}-${currentIndex}`} isFilled={fillCheck(currentIndex)} />
                ))}
            </div>
            <Paragraph>{ratingLabel}</Paragraph>
        </div>
    );
};

const RatingBullet = styled.div<RatingBulletProps>`
    background-color: ${props => (props.isFilled ? colors.brandLight : colors.brandDark)};
    border-radius: 50%;
    width: 20px;
    height: 20px;

    & + & {
        margin-left: 8px;
    }
`;

RatingBullet.defaultProps = {
    color: colors.white,
};
