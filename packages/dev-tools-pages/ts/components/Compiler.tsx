import * as React from 'react';
import styled from 'styled-components';

import InlineCode from './InlineCode';

const Cards = styled.dl`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(25rem, 1fr));
    align-items: start;
    grid-gap: 1.25rem;
    margin-top: 0;
    margin-bottom: 0;
`;

const Card = styled.div`
    background-color: #f1f4f5;
    padding: 3.125rem;
    padding-bottom: 2.5rem;
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
                It can compile an entire project instead of only individual <InlineCode>.sol</InlineCode> files
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
        <Cards>
            {cards.map(card => (
                <Card key={card.title.split(' ').join('-')}>
                    <Dt>{card.title}</Dt>
                    <Dd>{card.body}</Dd>
                </Card>
            ))}
        </Cards>
    );
}

export default Compiler;
