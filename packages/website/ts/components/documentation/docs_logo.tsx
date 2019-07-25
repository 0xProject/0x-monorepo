import * as React from 'react';
import { Link } from 'ts/components/documentation/shared/link';
import { styled } from 'ts/style/theme';
import { WebsitePaths } from 'ts/types';

import { Container } from '../ui/container';

export interface DocsLogoProps {
    containerStyle?: React.CSSProperties;
}

const Image = styled.img`
    &:hover {
        opacity: 0.7;
    }
`;

export const DocsLogo: React.StatelessComponent<DocsLogoProps> = props => {
    return (
        <Container className="flex">
            <Container>
                <Link to={WebsitePaths.Home}>
                    <Image src="/images/developers/logo/0x.svg" height={34} />
                </Link>
            </Container>
            <Container paddingTop="6px" paddingLeft="7px">
                <Link to={WebsitePaths.Docs}>
                    <Image src="/images/developers/logo/docs.svg" height={20} />
                </Link>
            </Container>
        </Container>
    );
};

DocsLogo.defaultProps = {
    containerStyle: {},
};
