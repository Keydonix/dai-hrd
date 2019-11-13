/// pot.sol -- Drip and set dsr in same tx

// Copyright (C) 2018 Rain <rainbreak@riseup.net>
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

pragma solidity 0.5.12;

import "./pot.sol";

contract SetDsr {
    // --- Auth ---
    mapping (address => uint) public wards;
    function rely(address usr) external auth { wards[usr] = 1; }
    function deny(address usr) external auth { wards[usr] = 0; }
    modifier auth {
        require(wards[msg.sender] == 1, "DripAndFile/not-authorized");
        _;
    }

	Pot public pot;

    // --- Init ---
    constructor(address pot_) public {
		pot = Pot(pot_);
		wards[msg.sender] = 1;
    }

	function setDsr(uint256 dsr) public {
		pot.drip();
		pot.file("dsr", dsr);
	}
}
