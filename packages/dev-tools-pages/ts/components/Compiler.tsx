import * as React from 'react';
import styled from 'styled-components';
import { media, colors } from '../variables';

import Container from './Container';
import InlineCode from './InlineCode';

const Cards = styled.dl`
    column-count: 3;
    column-gap: 1.25rem;

    ${media.small`
        column-count: 1;
    `}: ;
`;

const Card = styled.div`
    background-color: ${colors.lightGray};
    padding: 3.125rem;
    padding-bottom: 2.5rem;
    display: inline-block;
    margin-bottom: 1.25rem;
    width: 100%;

    ${media.small`
        padding: 1.875rem;
    `};
`;

const Dt = styled.dt`
    font-weight: 500;
    display: inline;
    ::after {
        content: '. ';
    }
`;

const Dd = styled.dd`
    display: inline;
    margin-left: 0;
`;

const cards = [
    {
        title: 'Project-centric',
        body: (
            <React.Fragment>
                It can compile an entire project instead of only individual <InlineCode alt>.sol</InlineCode> files
            </React.Fragment>
        ),
    },
    {
        title: 'Incremental builds',
        body: 'It only recompiles your smart contracts after they have changed.',
    },
    {
        title: 'Customizable artifacts',
        body:
            'It allows you to store only the required compiler output in your artifacts and have complete control over your bundle size.',
    },
    {
        title: 'Seamless',
        body: 'It auto-fetches and caches the required compiler binaries.',
    },
    {
        title: 'Versioning',
        body:
            'It compiles each contract with the version specified at the top of its file (it even supports version ranges!).',
    },
];

function Compiler() {
    return (
        <Container wide>
            <Cards>
                {cards.map(card => (
                    <Card key={card.title.split(' ').join('-')}>
                        <Dt>{card.title}</Dt>
                        <Dd>{card.body}</Dd>
                    </Card>
                ))}
            </Cards>
        </Container>
    );
}

export default Compiler;
