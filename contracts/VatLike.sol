pragma solidity 0.5.12;

interface VatLike {
	function dai(address holder) external returns(uint256 attorontodai);
	function move(address holder, address recipient, uint256 attorontodai) external;
	function slip(bytes32,address,int) external;
	function suck(address,address,uint256) external;
}
