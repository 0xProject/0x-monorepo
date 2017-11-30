export class Artifacts {
  public Migrations: any;
  public TokenTransferProxy: any;
  public TokenRegistry: any;
  public MultiSigWalletWithTimeLock: any;
  public Exchange: any;
  public ZRXToken: any;
  public DummyToken: any;
  public EtherToken: any;
  public MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress: any;
  public MaliciousToken: any;
  constructor(artifacts: any) {
    this.Migrations = artifacts.require('Migrations');
    this.TokenTransferProxy = artifacts.require('TokenTransferProxy');
    this.TokenRegistry = artifacts.require('TokenRegistry');
    this.MultiSigWalletWithTimeLock = artifacts.require('MultiSigWalletWithTimeLock');
    this.Exchange = artifacts.require('Exchange');
    this.ZRXToken = artifacts.require('ZRXToken');
    this.DummyToken = artifacts.require('DummyToken');
    this.EtherToken = artifacts.require('EtherToken');
    this.MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress = artifacts.require(
        'MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress');
    this.MaliciousToken = artifacts.require('MaliciousToken');
  }
}
