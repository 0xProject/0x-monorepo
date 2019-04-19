import * as React from 'react';

import { styled } from '../../style/theme';

export interface ImageProps extends React.HTMLAttributes<HTMLImageElement> {
    height?: string;
    width?: string;
    objectFit?: string;
}

export const Image = styled.img<ImageProps>`
    && {
        ${props => (props.height ? `height: ${props.height}` : '')};
        ${props => (props.width ? `width: ${props.width}` : '')};
        ${props => (props.objectFit ? `object-fit: ${props.objectFit}` : '')};
    }
`;

Image.defaultProps = {};

Image.displayName = 'Image';
