import * as _ from 'lodash';
import * as React from 'react';

import { Container } from 'ts/components/ui/container';
import { Text } from 'ts/components/ui/text';
import { ActionLink } from 'ts/pages/instant/action_link';
import { CodeDemo } from 'ts/pages/instant/code_demo';
import { ConfigGenerator } from 'ts/pages/instant/config_generator';
import { colors } from 'ts/style/colors';

import { ZeroExInstantBaseConfig } from '../../../../instant/src/types';

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
                feePercentage: 0.01,
            },
        },
    };
    public render(): React.ReactNode {
        const { hash } = this.props;
        const codeToDisplay = this._generateCodeDemoCode();
        return (
            <Container
                className="flex justify-center py4 px3"
                id={hash}
                backgroundColor={colors.instantTertiaryBackground}
            >
                <Container className="mx3">
                    <Container className="mb3">
                        <Text fontSize="20px" lineHeight="28px" fontColor={colors.white} fontWeight={500}>
                            0x Instant Configurator
                        </Text>
                    </Container>
                    <ConfigGenerator value={this.state.instantConfig} onConfigChange={this._handleConfigChange} />
                </Container>
                <Container className="mx3" height="550px">
                    <Container className="mb3 flex justify-between">
                        <Text fontSize="20px" lineHeight="28px" fontColor={colors.white} fontWeight={500}>
                            Code Snippet
                        </Text>
                        <ActionLink displayText="Explore the Docs" linkSrc="/wiki#Get-Started" color={colors.grey} />
                    </Container>
                    <CodeDemo key={codeToDisplay}>{codeToDisplay}</CodeDemo>
                </Container>
            </Container>
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
                }`
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
