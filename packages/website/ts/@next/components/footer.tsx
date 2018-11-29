import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

import { Button } from './button';
import { Section, Wrap, Column } from './layout';
import { Logo } from './logo';

export interface FooterInterface {
}

export interface LinkInterface {
    text: string;
    url: string;
    newWindow?: boolean;
}

const linkRows = [
    {
        heading: 'Products',
        links: [
            { url: '#', text: '0x Instant' },
            { url: '#', text: '0x Launch Kit' },
        ],
    },
    {
        heading: 'About',
        links: [
            { url: '#', text: 'Mission' },
            { url: '#', text: 'Team' },
            { url: '#', text: 'Jobs' },
            { url: '#', text: 'Press Kit' },
        ],
    },
    {
        heading: 'Community',
        links: [
            { url: '#', text: 'Twitter' },
            { url: '#', text: 'Rocket Chat' },
            { url: '#', text: 'Facebook' },
            { url: '#', text: 'Reddit' },
        ],
    },
];

export const Footer: React.StatelessComponent<FooterInterface> = ({}) => (
  <FooterWrap
    bgColor="#181818"
    noMargin>
    <Wrap>
      <Column colWidth="1/2" noPadding>
        <Logo />
      </Column>

      <Column colWidth="1/2" noPadding>
        <Wrap>
          {_.map(linkRows, (row, index) => (
            <Column
              key={`fc-${index}`}
              colWidth="1/3"
              noPadding>
              <RowHeading>
                { row.heading }
              </RowHeading>

              <ul>
                {_.map(row.links, (link, index) => (
                  <li key={`fl-${index}`}>
                    <Link href={link.url}>
                      { link.text }
                    </Link>
                  </li>
                ))}
              </ul>
            </Column>
          ))}
        </Wrap>
      </Column>
    </Wrap>
  </FooterWrap>
);

const FooterWrap = Section.withComponent('footer');

const RowHeading = styled.h3`
    color: ${colors.white};
    font-weight: 500;
    font-size: 16px;
    line-height: 20px;
    margin-bottom: 1.25em;
`;

const Link = styled.a`
    color: rgba(255, 255, 255, 0.5);
    display: block;
    font-size: 16px;
    line-height: 20px;
    transition: color 0.25s ease-in-out;
    text-decoration: none;

    &:hover {
        color: rgba(255, 255, 255, 1);
    }
`;
