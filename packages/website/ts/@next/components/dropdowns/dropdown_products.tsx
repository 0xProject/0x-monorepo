import * as _ from 'lodash';
import * as React from 'react';
import {Link} from 'react-router-dom';
import styled from 'styled-components';
import {Heading, Paragraph} from 'ts/@next/components/text';

const navData = [
        {
            title: '0x Instant',
            description: 'Simple crypto purchasing',
            url: '/next/0x-instant',
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
                <Link to={item.url}>
                    <Heading color="#000000" isNoMargin={true} size="small">
                        {item.title}
                    </Heading>

                    {item.description &&
                        <Paragraph color="#5d5d5d" isNoMargin={true} size="small">
                            {item.description}
                        </Paragraph>
                    }
                </Link>
            </li>
        ))}
    </List>
);

const List = styled.ul`
    a {
        padding: 15px 30px;
        display: block;
    }
`;
