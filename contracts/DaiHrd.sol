pragma solidity 0.5.12;

import "@openzeppelin/contracts/token/ERC777/ERC777.sol";

contract DaiHrd is ERC777 {
	// uses this super constructor syntax instead of the preferred alternative syntax because my editor doesn't like the class syntax
	constructor() ERC777("DAI-HRD", "DAI-HRD", new address[](0)) public { }
}
