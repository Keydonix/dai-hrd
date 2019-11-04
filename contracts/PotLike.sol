pragma solidity 0.5.12;

interface PotLike {
	function pie(address holder) external returns(uint256);
	function chi() external returns(uint256);
	function rho() external returns (uint256);
	function drip() external;
	function join(uint256 amount) external;
	function exit(uint256 amount) external;
}
