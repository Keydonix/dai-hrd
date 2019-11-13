/// pot.sol -- Drip and set dsr in same tx

pragma solidity 0.5.12;

import "./pot.sol";

contract SetDsr {
    // --- Auth ---
	Pot public pot;

    // --- Init ---
    constructor(address pot_) public {
		pot = Pot(pot_);
    }

	function setDsr(uint256 dsr) public {
		pot.drip();
		pot.file("dsr", dsr);
	}
}
