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
        // {
        //     title: 'Extensions',
        //     url: '#',
        // },
];

export const DropdownProducts = () => (
    <List>
        {_.map(navData, (item, index) => (
            <li key={`productLink-${index}`}>
                <Link to={item.url}>
                    <Heading
                        asElement="h3"
                        color="inherit"
                        isNoMargin={true}
                        size="small"
                    >
                        {item.title}
                    </Heading>

                    {item.description &&
                        <Paragraph
                            color="inherit"
                            isNoMargin={true}
                            size="small"
                            isMuted={0.5}
                        >
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
        color: inherit;
    }
`;
