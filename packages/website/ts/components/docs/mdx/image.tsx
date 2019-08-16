import * as React from 'react';
import styled from 'styled-components';

export interface IImageProps {
    src: string;
    alt?: string;
    title?: string;
}

export const Image: React.FC<IImageProps> = props => (
    <ImageWrapper>
        <img {...props} />
    </ImageWrapper>
);

const ImageWrapper = styled.span`
    display: flex;
    align-items: center;
    justify-content: center;
`;
