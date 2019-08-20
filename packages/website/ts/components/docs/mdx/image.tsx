import * as React from 'react';
import styled from 'styled-components';

interface IImageProps extends IImageWrapperProps {
    src: string;
    alt?: string;
    title?: string;
    height?: number | string;
    width?: number | string;
}

interface IImageWrapperProps {
    align?: string;
    justify?: string;
    padding?: string;
    margin?: string;
    marginBottom?: string;
}

export const Image: React.FC<IImageProps> = props => (
    <ImageWrapper {...props}>
        <img {...props} />
    </ImageWrapper>
);

const alignImage = ({ align, justify }: { align: string; justify: string }) => {
    if (align === 'left' || justify === 'flex-start') {
        return 'flex-start';
    }
    if (align === 'right' || justify === 'flex-end') {
        return 'flex-end';
    }
    return 'center';
};

const ImageWrapper = styled.span<IImageWrapperProps>`
    display: flex;
    align-items: center;
    justify-content: ${({ align, justify }) => alignImage({ align, justify })};
    padding: ${props => props.padding};
    margin: ${props => props.margin};
    margin-bottom: ${props => props.marginBottom};
`;
