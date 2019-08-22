import * as _ from 'lodash';
import * as React from 'react';
import styled from 'styled-components';

import { CodeDemo } from 'ts/components/code_demo';
import { ConfigGenerator } from 'ts/pages/instant/config_generator';

import { Link } from 'ts/components/link';
import { Column, FlexWrap } from 'ts/components/newLayout';
import { Heading } from 'ts/components/text';
import { WebsitePaths } from 'ts/types';

import { ZeroExInstantBaseConfig } from '../../../../instant/src/types';

export interface ConfiguratorState {
    instantConfig: ZeroExInstantBaseConfig;
}

export class Configurator extends React.Component {
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
        const codeToDisplay = this._generateCodeDemoCode();
        return (
            <FlexWrap isFlex={true}>
                <Column width="442px" padding="0 70px 0 0">
                    <ConfigGenerator value={this.state.instantConfig} onConfigChange={this._handleConfigChange} />
                </Column>
                <Column width="100%">
                    <HeadingWrapper>
                        <Heading size="small" marginBottom="15px">
                            Code Snippet
                        </Heading>
                        <Link href={`${WebsitePaths.Wiki}#Get-Started-With-Instant`} isBlock={true} target="_blank">
                            Explore the Docs
                        </Link>
                    </HeadingWrapper>
                    <CodeDemo key={codeToDisplay} language="html" fontSize="14px">
                        {codeToDisplay}
                    </CodeDemo>
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
        <script src="https://instant.0x.org/instant.js"></script>
    </head>
    <body>
        <script>
            zeroExInstant.render({
                orderSource: '${instantConfig.orderSource}',${
            instantConfig.affiliateInfo !== undefined && instantConfig.affiliateInfo.feeRecipient
                ? `\n                affiliateInfo: {
                    feeRecipient: '${instantConfig.affiliateInfo.feeRecipient.toLowerCase()}',
                    feePercentage: ${instantConfig.affiliateInfo.feePercentage}
                },`
                : ''
        }${
            instantConfig.availableAssetDatas !== undefined
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

    a {
        transform: translateY(-8px);
    }
`;
