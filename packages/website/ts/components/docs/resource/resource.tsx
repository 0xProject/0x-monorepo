import React from 'react';
import styled from 'styled-components';

import { Link } from '@0x/react-shared';

import { Difficulty, Level } from 'ts/components/docs/resource/level';
import { Tag } from 'ts/components/docs/resource/tag';
import { Heading, Paragraph } from 'ts/components/text';

import { colors } from 'ts/style/colors';

export interface IResourceProps {
    heading?: string;
    description?: string;
    isCommunity?: boolean;
    url: string;
    tags: string[];
}

export const Resource: React.FC<IResourceProps> = ({ heading, description, isCommunity, url, tags }) => {
    console.log('isCommunity', isCommunity);

    return (
        <Wrapper>
            <Heading color={colors.brandDark} size="small" marginBottom="8px">
                <Link to={url}>{heading}</Link>
            </Heading>
            <Paragraph size="default" marginBottom="30px">
                {description}
            </Paragraph>
            <Meta>
                <Tags>
                    {isCommunity && <Tag isInverted={true}>community maintained</Tag>}
                    {tags.map((label, index) => (
                        <Tag key={`tag-${index}`}>{label}</Tag>
                    ))}
                </Tags>
                <Level difficulty={Difficulty.Beginner} />
            </Meta>
        </Wrapper>
    );
};

const Wrapper = styled.div`
    border: 1px solid #d7e3db;
    padding: 25px 30px;
    margin-bottom: 1.1rem;
    display: block;
`;

const Meta = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

const Tags = styled.div`
    display: flex;
    align-items: center;
`;
