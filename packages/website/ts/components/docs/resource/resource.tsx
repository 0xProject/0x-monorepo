import * as React from 'react';
import styled from 'styled-components';

import { Link } from '@0x/react-shared';

import { Difficulty, Level } from 'ts/components/docs/resource/level';
import { Tag } from 'ts/components/docs/resource/tag';
import { Heading, Paragraph } from 'ts/components/text';

import { colors } from 'ts/style/colors';

interface IHitProps {
    hit: IResourceProps;
}
export interface IResourceProps {
    title?: string;
    description?: string;
    difficulty?: Difficulty;
    isCommunity?: boolean;
    url: string;
    tags: string[];
}

export const Resource: React.FC<IHitProps> = ({ hit }) => {
    const { title, difficulty, description, isCommunity, tags, url } = hit;

    return (
        <ResourceWrapper>
            <Heading color={colors.brandDark} size="small" marginBottom="8px">
                <Link to={url}>{title}</Link>
            </Heading>
            <Paragraph size="default" marginBottom="10px">
                {description}
            </Paragraph>
            <Meta>
                <Tags>
                    {isCommunity && <Tag isInverted={true}>community maintained</Tag>}
                    {tags.map((label, index) => (
                        <Tag key={`tag-${index}`}>{label}</Tag>
                    ))}
                </Tags>
                <Level difficulty={difficulty} />
            </Meta>
        </ResourceWrapper>
    );
};

const ResourceWrapper = styled.div`
    border: 1px solid #d7e3db;
    padding: 25px 30px 5px;
    margin-bottom: 1.1rem;
    display: block;
`;

const Meta = styled.div`
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
`;

const Tags = styled.div`
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
`;
