pragma solidity ^0.4.0;
import "./test.sol";
contract TestExposed is Test{
	
	function get_hiddenState()
		public view
		returns (uint256  )
	{
		return hiddenState;
	}
	
	function set_hiddenState(uint256  setterNewValue)
		public 
	{
		hiddenState = setterNewValue;
	}
	
	function emit_SomeLogEvent(uint256 withValues, address canBeIndexed)
		public 
	{
		emit SomeLogEvent(withValues, canBeIndexed);
	}
	
	function modifier_modWithoutParameters()
		public modWithoutParameters()
		returns (bool  executed)
	{
		return true;
	}
	
	function modifier_modWithParameters(bytes32  hash)
		public modWithParameters(hash)
		returns (bool  executed)
	{
		return true;
	}
	
	function public_someInternalAction(uint256[4]  withParameters)
		public 
	{
		someInternalAction(withParameters);
	}
	
	function public_someInternalFunction(uint256  x)
		public pure
		returns (uint256  y)
	{
		return (someInternalFunction(x));
	}
	
	function public_someMultiFunction(uint256  a)
		public view
		returns (uint256  x, uint256  y)
	{
		return (someMultiFunction(a));
	}
}
