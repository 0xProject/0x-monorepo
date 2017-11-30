import * as chai from 'chai';

import * as tokenTransferProxyJSON from '../../build/contracts/TokenTransferProxy.json';
import {Artifacts} from '../../util/artifacts';
import {constants} from '../../util/constants';
import {crypto} from '../../util/crypto';
import {MultiSigWrapper} from '../../util/multi_sig_wrapper';
import {ContractInstance, TransactionDataParams} from '../../util/types';

import {chaiSetup} from './utils/chai_setup';
const {TokenTransferProxy, MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress} = new Artifacts(artifacts);
const PROXY_ABI = (tokenTransferProxyJSON as any).abi;

chaiSetup.configure();
const expect = chai.expect;

contract('MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress', (accounts: string[]) => {
  const owners = [accounts[0], accounts[1]];
  const requiredApprovals = 2;
  const SECONDS_TIME_LOCKED = 1000000;

  // initialize fake addresses
  const authorizedAddress = `0x${crypto.solSHA3([accounts[0]]).slice(0, 20).toString('hex')}`;
  const unauthorizedAddress = `0x${crypto.solSHA3([accounts[1]]).slice(0, 20).toString('hex')}`;

  let tokenTransferProxy: ContractInstance;
  let multiSig: ContractInstance;
  let multiSigWrapper: MultiSigWrapper;

  let validDestination: string;

  beforeEach(async () => {
    const initialOwner = accounts[0];
    tokenTransferProxy = await TokenTransferProxy.new({from: initialOwner});
    await tokenTransferProxy.addAuthorizedAddress(authorizedAddress, {from: initialOwner});
    multiSig = await MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress.new(
        owners, requiredApprovals, SECONDS_TIME_LOCKED, tokenTransferProxy.address);
    await tokenTransferProxy.transferOwnership(multiSig.address, {from: initialOwner});
    multiSigWrapper = new MultiSigWrapper(multiSig);
    validDestination = tokenTransferProxy.address;
  });

  describe('isFunctionRemoveAuthorizedAddress', () => {
    it('should throw if data is not for removeAuthorizedAddress', async () => {
      const data = multiSigWrapper.encodeFnArgs('addAuthorizedAddress', PROXY_ABI, [owners[0]]);
      return expect(multiSig.isFunctionRemoveAuthorizedAddress.call(data)).to.be.rejectedWith(constants.INVALID_OPCODE);
    });

    it('should return true if data is for removeAuthorizedAddress', async () => {
      const data = multiSigWrapper.encodeFnArgs('removeAuthorizedAddress', PROXY_ABI, [owners[0]]);
      const isFunctionRemoveAuthorizedAddress = await multiSig.isFunctionRemoveAuthorizedAddress.call(data);
      expect(isFunctionRemoveAuthorizedAddress).to.be.true();
    });
  });

  describe('executeRemoveAuthorizedAddress', () => {
    it('should throw without the required confirmations', async () => {
      const dataParams: TransactionDataParams = {
        name: 'removeAuthorizedAddress',
        abi: PROXY_ABI,
        args: [authorizedAddress],
      };
      const res = await multiSigWrapper.submitTransactionAsync(validDestination, owners[0], dataParams);
      const txId = res.logs[0].args.transactionId.toString();

      return expect(multiSig.executeRemoveAuthorizedAddress(txId)).to.be.rejectedWith(constants.INVALID_OPCODE);
    });

    it('should throw if tx destination is not the tokenTransferProxy', async () => {
      const invalidTokenTransferProxy = await TokenTransferProxy.new();
      const invalidDestination = invalidTokenTransferProxy.address;
      const dataParams: TransactionDataParams = {
        name: 'removeAuthorizedAddress',
        abi: PROXY_ABI,
        args: [authorizedAddress],
      };
      const res = await multiSigWrapper.submitTransactionAsync(invalidDestination, owners[0], dataParams);
      const txId = res.logs[0].args.transactionId.toString();
      await multiSig.confirmTransaction(txId, {from: owners[1]});
      const isConfirmed = await multiSig.isConfirmed.call(txId);
      expect(isConfirmed).to.be.true();

      return expect(multiSig.executeRemoveAuthorizedAddress(txId)).to.be.rejectedWith(constants.INVALID_OPCODE);
    });

    it('should throw if tx data is not for removeAuthorizedAddress', async () => {
      const dataParams: TransactionDataParams = {
        name: 'addAuthorizedAddress',
        abi: PROXY_ABI,
        args: [unauthorizedAddress],
      };
      const res = await multiSigWrapper.submitTransactionAsync(validDestination, owners[0], dataParams);
      const txId = res.logs[0].args.transactionId.toString();
      await multiSig.confirmTransaction(txId, {from: owners[1]});
      const isConfirmed = await multiSig.isConfirmed.call(txId);
      expect(isConfirmed).to.be.true();

      return expect(multiSig.executeRemoveAuthorizedAddress(txId)).to.be.rejectedWith(constants.INVALID_OPCODE);
    });

    it('should execute removeAuthorizedAddress for valid tokenTransferProxy if fully confirmed', async () => {
      const dataParams: TransactionDataParams = {
        name: 'removeAuthorizedAddress',
        abi: PROXY_ABI,
        args: [authorizedAddress],
      };
      const res = await multiSigWrapper.submitTransactionAsync(validDestination, owners[0], dataParams);
      const txId = res.logs[0].args.transactionId.toString();
      await multiSig.confirmTransaction(txId, {from: owners[1]});
      const isConfirmed = await multiSig.isConfirmed.call(txId);
      expect(isConfirmed).to.be.true();
      await multiSig.executeRemoveAuthorizedAddress(txId);

      const isAuthorized = await tokenTransferProxy.authorized.call(authorizedAddress);
      expect(isAuthorized).to.be.false();
    });

    it('should throw if already executed', async () => {
      const dataParams: TransactionDataParams = {
        name: 'removeAuthorizedAddress',
        abi: PROXY_ABI,
        args: [authorizedAddress],
      };
      const res = await multiSigWrapper.submitTransactionAsync(validDestination, owners[0], dataParams);
      const txId = res.logs[0].args.transactionId.toString();
      await multiSig.confirmTransaction(txId, {from: owners[1]});
      const isConfirmed = await multiSig.isConfirmed.call(txId);
      expect(isConfirmed).to.be.true();
      await multiSig.executeRemoveAuthorizedAddress(txId);
      const tx = await multiSig.transactions.call(txId);
      const isExecuted = tx[3];
      expect(isExecuted).to.be.true();
      return expect(multiSig.executeRemoveAuthorizedAddress(txId)).to.be.rejectedWith(constants.INVALID_OPCODE);
    });
  });
});
