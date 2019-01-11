import * as React from 'react';
import styled from 'styled-components';

interface Props {
    alt?: string;
    src?: any;
    srcset?: any;
    isCentered?: boolean;
}

const ImageClass: React.FunctionComponent<Props> = (props: Props) => {
    return <img {...props} />;
};

export const Image = styled(ImageClass)<Props>`
    margin: ${props => props.isCentered && `0 auto`};
`;
