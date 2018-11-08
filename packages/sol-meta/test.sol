contract MAssetProxyDispatcher {
	
	address public owner;
	
	modifier onlyOwner() {
		require(((msg.sender) == owner), "ONLY_CONTRACT_OWNER");
		_;
	}
	
	function transferOwnership(address  newOwner)
		public onlyOwner()
	{
		if ((newOwner != ((address)(0))))
		{
			owner = newOwner;
		}
	}
	
	constructor()
		public 
	{
		owner = (msg.sender);
	}
	
	function dispatchTransferFrom(bytes memory assetData, address  from, address  to, uint256  amount)
		internal 
	;
	
	function someFunction(uint256  a, uint256  b)
		internal 
		returns (uint256  , bytes  )
	;
}
