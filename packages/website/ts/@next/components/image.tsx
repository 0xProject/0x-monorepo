import * as React from 'react';
import styled from 'styled-components';

interface Props {
    alt?: string;
    src: any;
    srcset: any;
    center: any;
}

const ImageClass: React.FunctionComponent<Props> = (props: Props) => {
    const { src, srcset, alt } = props;

    return (
        <img src={src} {...props} />
    );
};

export const Image = styled(ImageClass)`
    margin: ${(props: Props) => props.center && `0 auto`};
`;
