import * as React from 'react';

import { ColorOption, styled } from '../../style/theme';

export interface ImageProps extends React.HTMLAttributes<HTMLImageElement> {
    rounded?: boolean;
}

export const Image = styled.img<ImageProps>`
    && {
        ${props => (props.rounded ? 'border-radius: 50%' : '')};
    }
`;

Image.defaultProps = {};

Image.displayName = 'Image';
