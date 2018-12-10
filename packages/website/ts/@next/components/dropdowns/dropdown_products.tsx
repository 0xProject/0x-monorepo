import * as React from 'react';
import styled from 'styled-components';
import {Heading, Paragraph} from 'ts/@next/components/text';

export const DropdownProducts = () => (
    <List>
        <li>
            <Heading color="#000000" isNoMargin={true}>
                0x Instant
            </Heading>

            <Paragraph color="#5d5d5d" isNoMargin={true}>
                Simple crypto purchasing
            </Paragraph>
        </li>

        <li>
            <Heading color="#000000" isNoMargin={true}>
                0x Launch Kit
            </Heading>

            <Paragraph color="#5d5d5d" isNoMargin={true}>
                Build on the 0x protocol
            </Paragraph>
        </li>

        <li>
            <Heading color="#000000" isNoMargin={true}>
                Extensions
            </Heading>
        </li>
    </List>
);

const List = styled.ul`
    li {
        padding: 15px 30px;
    }
`;
