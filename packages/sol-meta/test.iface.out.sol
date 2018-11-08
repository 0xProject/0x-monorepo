pragma experimental ABIEncoderV2;

contract MAssetProxyDispatcherMock {
	
	uint256 internal _dispatchTransferFrom_counter = 0;
	
	event _dispatchTransferFrom_log(uint256  counter, bytes  assetData, address  from, address  to, uint256  amount);
	
	function dispatchTransferFrom(bytes memory assetData, address  from, address  to, uint256  amount)
		internal 
	{
		emit _dispatchTransferFrom_log(_dispatchTransferFrom_counter, assetData, from, to, amount);
		_dispatchTransferFrom_counter++;
	}
	
	uint256 internal _someFunction_counter = 0;
	
	event _someFunction_log(uint256  counter, uint256  a, uint256  b);
	
	struct _someFunction_Result {
		uint256 _ret0;
		bytes _ret1;
	}
	
	mapping (uint256 => _someFunction_Result) _someFunction_results;
	
	function _someFunction_set(uint256  _counter, _someFunction_Result  _value)
		public 
	{
		(_someFunction_results[_counter]) = _value;
	}
	
	function someFunction(uint256  a, uint256  b)
		public 
		returns (uint256  _ret0, bytes  _ret1)
	{
		emit _someFunction_log(_someFunction_counter, a, b);
		_someFunction_Result storage result = (_someFunction_results[_someFunction_counter]);
		_someFunction_counter++;
		return ((result._ret0), (result._ret1));
	}
}
