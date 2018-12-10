import * as React from 'react';
import styled from 'styled-components';

import {Link} from 'react-router-dom';
import {WrapGrid} from 'ts/@next/components/layout';
import {Heading} from 'ts/@next/components/text';

export const DropdownDevelopers = () => (
    <>
        <Wrap>
            <Heading size="small" color="#5d5d5d">
                Getting Started
            </Heading>

            <WrapGrid isCentered={false} isWrapped={true}>
                <Link to="#">Build a relayer</Link>
                <Link to="#">Develop on Ethereum</Link>
                <Link to="#">Make & take orders</Link>
                <Link to="#">Use networked liquidity</Link>
            </WrapGrid>
        </Wrap>

        <Wrap>
            asdf
        </Wrap>
    </>
);

const Wrap = styled.div`
    padding: 15px 30px;
`;

const StyledLink = styled(Link)`
    width: calc(50% - 15px);
    flex-shrink: 0;
    color: #000000;
`;
