import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { colors } from 'ts/style/colors';

import { ConfigGenerator } from 'ts/@next/pages/instant/config_generator';
import { CodeDemo } from 'ts/pages/instant/code_demo';
import { Column, FlexWrap, Section } from 'ts/@next/components/newLayout';
import { Heading, Paragraph } from 'ts/@next/components/text';
import { WebsitePaths } from 'ts/types';
import { Link } from 'ts/@next/components/link';

import { ZeroExInstantBaseConfig } from '../../../../../instant/src/types';

export interface ConfiguratorProps {
    hash: string;
}

export interface ConfiguratorState {
    instantConfig: ZeroExInstantBaseConfig;
}

export class Configurator extends React.Component<ConfiguratorProps> {
    public state: ConfiguratorState = {
        instantConfig: {
            orderSource: 'https://api.radarrelay.com/0x/v2/',
            availableAssetDatas: undefined,
            affiliateInfo: {
                feeRecipient: '',
                feePercentage: 0,
            },
        },
    };
    public render(): React.ReactNode {
        const { hash } = this.props;
        const codeToDisplay = this._generateCodeDemoCode();
        return (
            <FlexWrap
                isFlex={true}
            >
                <Column width="442px">
                    <ConfigGenerator value={this.state.instantConfig} onConfigChange={this._handleConfigChange} />
                </Column>
                <Column width="560px">
                    <HeadingWrapper>
                        <Heading size="small">Code Snippet</Heading>
                        <Link
                            href={`${WebsitePaths.Wiki}#Get-Started-With-Instant`}
                            isBlock={true}
                        >
                            Explore the Docs
                        </Link>
                    </HeadingWrapper>
                    <CodeDemo key={codeToDisplay}>{codeToDisplay}</CodeDemo>
                </Column>
            </FlexWrap>
        );
    }
    private readonly _handleConfigChange = (config: ZeroExInstantBaseConfig) => {
        this.setState({
            instantConfig: config,
        });
    };
    private readonly _generateCodeDemoCode = (): string => {
        const { instantConfig } = this.state;
        return `<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8" />
        <script src="https://instant.0xproject.com/instant.js"></script>
    </head>
    <body>
        <script>
            zeroExInstant.render({
                orderSource: '${instantConfig.orderSource}',${
            !_.isUndefined(instantConfig.affiliateInfo) && instantConfig.affiliateInfo.feeRecipient
                ? `\n                affiliateInfo: {
                    feeRecipient: '${instantConfig.affiliateInfo.feeRecipient.toLowerCase()}',
                    feePercentage: ${instantConfig.affiliateInfo.feePercentage}
                },`
                : ''
        }${
            !_.isUndefined(instantConfig.availableAssetDatas)
                ? `\n                availableAssetDatas: ${this._renderAvailableAssetDatasString(
                      instantConfig.availableAssetDatas,
                  )}`
                : ''
        }
            }, 'body');
        </script>
    </body>
</html>`;
    };
    private readonly _renderAvailableAssetDatasString = (availableAssetDatas: string[]): string => {
        const stringAvailableAssetDatas = availableAssetDatas.map(assetData => `'${assetData}'`);
        if (availableAssetDatas.length < 2) {
            return `[${stringAvailableAssetDatas.join(', ')}]`;
        }
        return `[\n                    ${stringAvailableAssetDatas.join(
            ', \n                    ',
        )}\n                ]`;
    };
}

const HeadingWrapper = styled.div`
    display: flex;
    justify-content: space-between;
`;
