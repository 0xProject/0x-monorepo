import * as React from 'react';
import styled from 'styled-components';

import { Definition, DefinitionProps } from 'ts/components/definition';
import { CodeTab, TabbedCodeDemo } from 'ts/components/tabbed_code_demo';

const StepperContainer = styled.div`
    display: flex;
    padding: 30px;
`;

interface InteractiveDefinitionProps extends DefinitionProps {
    isSelected?: boolean;
}

const InteractiveDefinition = styled(Definition)<InteractiveDefinitionProps>`
    @media (min-width: 768px) {
        padding: 20px;
        background-color: ${props => (props.isSelected ? '#0D1413' : '')};
        border-left: ${props => (props.isSelected ? '3px solid #00AE99' : '3px solid rgba(0,0,0,0)')};
        width: 600px;
        p {
            margin-bottom: 0px;
        }
        &:hover {
            background-color: #0d1413;
            cursor: pointer;
        }
    }

    @media (max-width: 768px) {
        text-align: center;
        margin-top: 60px;
    }
`;

interface CodeStepperProps {}

interface CodeStepperState {
    selectedSideTabIndex: number;
    selectedCodeTabIndex: number;
}

const useCasesData = [
    {
        title: 'Source orders',
        icon: 'recruitingSupport',
        description: 'Automatically find orders for any token trading pair',
    },
    {
        title: 'Pass orders',
        icon: 'standardForExchange',
        description: 'Easily transform orders into a contract fillable format',
    },
    {
        title: 'Fill orders',
        icon: 'flexibleOrders',
        description: 'Quickly execute orders to fulfill your desired use case',
    },
];

const codeData: CodeTab[] = [
    {
        code: `import { SwapQuoter } from '@0x/asset-swapper';

const apiUrl = 'https://api.relayer.com/v2';
const daiTokenAddress = '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359';
const wethTokenAddress = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';

const quoter = SwapQuoter.getSwapQuoterForStandardRelayerAPIUrl(
  web3.provider,
  apiUrl
);

// Get a quote to buy three units of DAI
const quote = await quoter.getMarketBuySwapQuoteAsync(
  daiTokenAddress,
  wethTokenAddress,
  web3.utils.fromWei(3, 'ether'),
);
`,
        label: 'getQuote.js',
        language: 'javascript',
    },
    {
        code: `import { SwapQuoteConsumer } from '@0x/asset-swapper';

const swapQuoteConsumer = new SwapQuoteConsumer(web3.provider);

const calldataInfo = await swapQuoteConsumer.getCalldataOrThrowAsync(quote);

const { calldataHexString } = calldataInfo;

const txHash = await yourSmartContract.methods
  .liquidityRequiringMethod(calldataHexString)
  .call();
`,
        label: 'consumeQuote.js',
        language: 'javascript',
    },
    {
        code: `contract MyContract {

  public address zeroExExchangeAddress;

  function liquidityRequiringMethod(bytes calldata calldataHexString) {
    zeroExExchangeAddress.call(calldataHexString);
  }
}`,
        label: 'smartContract.sol',
        language: 'typescript',
    },
];

export class CodeStepper extends React.Component<CodeStepperProps, CodeStepperState> {
    public state: CodeStepperState = {
        selectedSideTabIndex: 0,
        selectedCodeTabIndex: 0,
    };
    public render(): React.ReactNode {
        const { selectedSideTabIndex, selectedCodeTabIndex } = this.state;
        return (
            <StepperContainer>
                <div>
                    {useCasesData.map((item, index) => (
                        <div onClick={this._onSideTabClick.bind(this, index)}>
                            <InteractiveDefinition
                                key={`offers-${index}`}
                                icon={item.icon}
                                title={item.title}
                                titleSize="small"
                                description={item.description}
                                isWithMargin={false}
                                isCentered={true}
                                isSelected={index === selectedSideTabIndex}
                            />
                        </div>
                    ))}
                </div>
                <TabbedCodeDemo tabs={codeData} activeIndex={selectedCodeTabIndex} onTabClick={this._onCodeTabClick} />
            </StepperContainer>
        );
    }
    private readonly _onSideTabClick = (index: number) => {
        this.setState({
            selectedSideTabIndex: index,
            selectedCodeTabIndex: index,
        });
    };
    private readonly _onCodeTabClick = (index: number) => {
        this.setState({
            selectedSideTabIndex: index,
            selectedCodeTabIndex: index,
        });
    };
}
