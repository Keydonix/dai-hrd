pragma solidity 0.5.12;

interface DaiJoinLike {
	function live() external returns (uint256 boolean);
	function join(address holder, uint256 attodai) external;
	function exit(address holder, uint256 attodai) external;
}
