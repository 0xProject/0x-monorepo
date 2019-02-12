import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { colors, media } from 'ts/variables';

import { Breakout } from './breakout';
import { Container } from './container';
import { InlineCode } from './inline-code';

const Cards = styled.dl`
    column-count: 3;
    column-gap: 1.25rem;

    ${media.medium`
        column-count: 1;
    `};
`;

const Card = styled.div`
    background-color: ${colors.lightGray};
    padding: 3.125rem;
    padding-bottom: 2.5rem;
    display: inline-block;
    margin-bottom: 1.25rem;
    width: 100%;

    ${media.medium`
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
                Compiles an entire project instead of only individual <InlineCode isAlt={true}>.sol</InlineCode> files.
            </React.Fragment>
        ),
    },
    {
        title: 'Incremental builds',
        body: 'Only recompiles smart contracts that have been modified.',
    },
    {
        title: 'Customizable artifacts',
        body:
            'Stores only the required compiler output in your artifacts, so you can have complete control over your bundle size.',
    },
    {
        title: 'Seamless',
        body: 'Fetches and caches the required compiler binaries for the Solidity versions you use.',
    },
    {
        title: 'Versioning',
        body:
            'Compiles each contract with the Solidity version specified at the top of its file (it even supports version ranges!).',
    },
    {
        title: 'Watch mode',
        body: 'Have your contracts instantly recompile on file save.',
    },
];

const Compiler: React.StatelessComponent<{}> = () => (
    <Container>
        <Breakout>
            <Cards>
                {_.map(cards, card => (
                    <Card key={card.title.split(' ').join('-')}>
                        <Dt>{card.title}</Dt>
                        <Dd>{card.body}</Dd>
                    </Card>
                ))}
            </Cards>
        </Breakout>
    </Container>
);

export { Compiler };
