import { dydxBridgeDataEncoder, DydxBridgeActionType, DydxBridgeContract, DydxBridgeData, artifacts as assetProxyArtifacts, ERC20BridgeProxyContract } from '@0x/contracts-asset-proxy';
import { StakingProxyContract, ZrxVaultContract, artifacts as stakingArtifacts } from '@0x/contracts-staking';
import { blockchainTests, constants, describe, expect, toBaseUnitAmount } from '@0x/contracts-test-utils';
import { AssetProxyId } from '@0x/types';
import { AbiEncoder, BigNumber } from '@0x/utils';
import { assetDataUtils } from '@0x/order-utils';
import { artifacts as erc20Artifacts } from '@0x/contracts-erc20';

import { contractAddresses, contractWrappers } from '../mainnet_fork_utils';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-protocol';

import { DeploymentManager } from '../framework/deployment_manager';

import { Maker } from '../framework/actors/maker';
import { Taker } from '../framework/actors/taker';
import { Actor } from '../framework/actors/base';

import { dydxEvents }  from './abi/dydxEvents';

blockchainTests.resets.fork('Mainnet dydx bridge tests', env => {
    let testContract: DydxBridgeContract;
    let testProxyContract: ERC20BridgeProxyContract;
    const contractOwner = '0x0000000000000000000000000000000000000000'; // no owner here
    const accountOwner = '0x1916a90bafe25771485e182a96132e200daffdd1'; // me
    const receiver = '0x986ccf5234d9cfbb25246f1a5bfa51f4ccfcb308';
    const daiToken = '0x6b175474e89094c44da98b954eedeac495271d0f';
    const dydxBridgeAddress = '0x96ddba19b69d6ea2549f6a12d005595167414744';
    const erc20BridgeProxyAddress = '0x8ed95d1746bf1e4dab58d8ed4724f1ef95b20db0';
    const accountNumber = new BigNumber(0);
    const daiMarketId = new BigNumber(3);
    let maker: Maker;
    let taker: Taker;
    const defaultDepositAction = {
        actionType: DydxBridgeActionType.Deposit as number,
        accountId: constants.ZERO_AMOUNT,
        marketId: daiMarketId,
        conversionRateNumerator: constants.ZERO_AMOUNT,
        conversionRateDenominator: constants.ZERO_AMOUNT,
    };
    const defaultWithdrawAction = {
        actionType: DydxBridgeActionType.Withdraw as number,
        accountId: constants.ZERO_AMOUNT,
        marketId: daiMarketId,
        conversionRateNumerator: new BigNumber(2),
        conversionRateDenominator: new BigNumber(10),
    };
    const defaultBridgeData = {
        accountNumbers: [new BigNumber(0)],
        actions: [defaultDepositAction, defaultWithdrawAction],
    }

    before(async () => {
        // Deploy dydx bridge
        testContract = new DydxBridgeContract(dydxBridgeAddress, env.provider, env.txDefaults, {"DydxBridge" : assetProxyArtifacts.DydxBridge.compilerOutput.abi, "ERC20": erc20Artifacts.ERC20Token.compilerOutput.abi, "Dydx": dydxEvents.abi});
        testProxyContract = new ERC20BridgeProxyContract(erc20BridgeProxyAddress, env.provider, env.txDefaults, {"DydxBridge" : assetProxyArtifacts.DydxBridge.compilerOutput.abi});

        const mainnetChainId = 1;
        const accounts = [
            contractOwner,  // contract owner (not used)
            accountOwner,   // maker
            receiver,       // taker
        ];
        const deployment = DeploymentManager.createFromChainId(mainnetChainId, env, accounts);

        maker = new Maker({
            name: 'Maker',
            deployment,
            orderConfig: {
                makerAssetData: assetDataUtils.encodeDydxBridgeData(defaultBridgeData),
                takerAssetData: deployment.assetDataEncoder.ERC20Token(daiToken).getABIEncodedTransactionData(),
                makerFeeAssetData: constants.NULL_ADDRESS,
                takerFeeAssetData: constants.NULL_ADDRESS,
                feeRecipientAddress: constants.NULL_ADDRESS,
            },
        });

        taker = new Taker({
            name: 'Taker',
            deployment
        });
    });

    after(async () => {
        Actor.reset();
    });

    describe('Mainnet tests', () => {
        const callTransferFrom = async (
            /*from: string,
            to: string,
            amount: BigNumber,*/
            bridgeData: DydxBridgeData,
            sender: string,
        ): Promise<TransactionReceiptWithDecodedLogs> => {
            const assetData = assetDataUtils.encodeERC20BridgeAssetData(
                daiToken,
                dydxBridgeAddress,
                dydxBridgeDataEncoder.encode({ bridgeData })
            );
            const returnValue = await testProxyContract.transferFrom(
                assetData,
                accountOwner,
                receiver,
                new BigNumber(1000000000)
            ).awaitTransactionSuccessAsync({from: sender});
            return returnValue;
        };

        const callBridgeTransferFrom = async (
            from: string,
            to: string,
            amount: BigNumber,
            bridgeData: DydxBridgeData,
            sender: string,
        ): Promise<void> => {


            const returnValue = await testContract
                .bridgeTransferFrom(constants.NULL_ADDRESS, from, to, amount, dydxBridgeDataEncoder.encode({ bridgeData }))
                .awaitTransactionSuccessAsync({ from: sender, gasPrice: 0 });

            console.log(JSON.stringify(returnValue, null, 4));
           // return returnValue;
        };

        const callBridgeTransferFromAndVerifyEvents = async (
            actionType: number,
            actionAddress: string,
            from: string,
            to: string,
            bridgeData: DydxBridgeData,
            sender: string,
        ): Promise<void> => {
            // Execute transaction.
            const txReceipt = await testContract
                .bridgeTransferFrom(
                    constants.NULL_ADDRESS,
                    from,
                    to,
                    new BigNumber(1),
                    dydxBridgeDataEncoder.encode(bridgeData),
                )
                .awaitTransactionSuccessAsync({ from: sender });
            console.log(JSON.stringify(txReceipt, null, 4));

            /*
            // Verify `OperateAccount` event.
            verifyEventsFromLogs(
                txReceipt.logs,
                [
                    {
                        owner: accountOwner,
                        number: accountNumber,
                    },
                ],
                TestDydxBridgeEvents.OperateAccount,
            );
            */

            // Verify `OperateAction` event.
            const accountId = new BigNumber(0);
            const positiveAmountSign = true;
            const weiDenomination = 0;
            const absoluteAmountRef = 1;
            /*
            verifyEventsFromLogs(
                txReceipt.logs,
                [
                    {
                        actionType,
                        accountId,
                        amountSign: positiveAmountSign,
                        amountDenomination: weiDenomination,
                        amountRef: absoluteAmountRef,
                        amountValue: new BigNumber(1),
                        primaryMarketId: marketId,
                        secondaryMarketId: constants.ZERO_AMOUNT,
                        otherAddress: actionAddress,
                        otherAccountId: constants.ZERO_AMOUNT,
                        data: '0x',
                    },
                ],
                TestDydxBridgeEvents.OperateAction,
            );
            */
        };


        it.only('should work via 0x Exchange', async () => {
           // throw new Error(`maker Address: ${maker.address}`);
            const signedOrder = await maker.signOrderAsync();
            console.log(JSON.stringify(signedOrder));
            //console.log(JSON.stringify(signedOrder));
            const tx = await taker.fillOrderAsync(signedOrder, signedOrder.takerAssetAmount);
            console.log(JSON.stringify(tx));
        });


        it.skip('should successfully deposit value', async () => {
            const order = {

            }

            console.log('begin depositing value');
            const bridgeData = {
                accountNumbers: [new BigNumber(0)],
                actions: [defaultDepositAction, defaultWithdrawAction],
            };
            const assetData = assetDataUtils.encodeERC20BridgeAssetData(
                daiToken,
                dydxBridgeAddress,
                dydxBridgeDataEncoder.encode({ bridgeData })
            );

            console.log(JSON.stringify(assetData));
            console.log('***\n',toBaseUnitAmount(1),'\n***');

            const returnValue = await callBridgeTransferFrom(
                accountOwner,
                receiver,
                toBaseUnitAmount(1),
                bridgeData,
                erc20BridgeProxyAddress
            );
            //console.log(JSON.stringify(returnValue, null, 4));
        });




    });
});
