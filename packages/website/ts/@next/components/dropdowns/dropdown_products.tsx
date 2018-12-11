import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';
import {Heading, Paragraph} from 'ts/@next/components/text';

const navData = [
        {
            title: '0x Instant',
            description: 'Simple crypto purchasing',
            url: '#',
        },
        {
            title: '0x Launch kit',
            description: 'Build on the 0x protocol',
            url: '#',
        },
        {
            title: 'Extensions',
            url: '#',
        },
];

export const DropdownProducts = () => (
    <List>
        {_.map(navData, (item, index) => (
            <li>
                <Heading color="#000000" isNoMargin={true} size="small">
                    {item.title}
                </Heading>

                {item.description &&
                    <Paragraph color="#5d5d5d" isNoMargin={true} size="small">
                        {item.description}
                    </Paragraph>
                }
            </li>
        ))}
    </List>
);

const List = styled.ul`
    li {
        padding: 15px 30px;
    }
`;
