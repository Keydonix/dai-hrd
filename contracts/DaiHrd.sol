pragma solidity 0.5.12;

import "@openzeppelin/contracts/token/ERC777/ERC777.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IVat {
	function dai(address holder) external returns(uint256 attorontodai);
	function move(address holder, address recipient, uint256 attorontodai) external;
}

interface IDaiJoin {
	function live() external returns (uint256 boolean);
	function join(address holder, uint256 attodai) external;
	function exit(address holder, uint256 attodai) external;
}

interface IDsr {
	function pie(address holder) external returns(uint256);
	function chi() external returns(uint256);
	function rho() external returns (uint256);
	function drip() external;
	function join(uint256 amount) external;
	function exit(uint256 amount) external;
}

contract DaiHrd is ERC777 {
	IERC20 public dai;
	// AKA: pot
	IDsr public dsr;
	IDaiJoin public daiJoin;
	IVat public vat;

	// uses this super constructor syntax instead of the preferred alternative syntax because my editor doesn't like the class syntax
	constructor(IERC20 _dai, IDsr _dsr, IDaiJoin _daiJoin, IVat _vat) ERC777("DAI-HRD", "DAI-HRD", new address[](0)) public {
		dai = _dai;
		dsr = _dsr;
		daiJoin = _daiJoin;
		vat = _vat;
	}

	function deposit(uint256 attodai) external returns(uint256 depositedAttodsr) {
		dai.transferFrom(msg.sender, address(this), attodai);
		daiJoin.join(address(this), dai.balanceOf(address(this)));

		if (dsr.rho() != now) dsr.drip();
		uint256 rontodaiPerDsr = dsr.chi();
		uint256 attodsrToDeposit = vat.dai(address(this)) / rontodaiPerDsr;

		dsr.join(attodsrToDeposit);
		_mint(address(0), msg.sender, attodsrToDeposit, new bytes(0), new bytes(0));
		return attodsrToDeposit;
	}

	function withdraw(uint256 attodaiHrd) external returns(uint256 attodai) {
		if (dsr.rho() != now) dsr.drip();
		_burn(address(0), msg.sender, attodaiHrd, new bytes(0), new bytes(0));
		dsr.exit(attodaiHrd);
		daiJoin.exit(address(this), vat.dai(address(this)));
		attodai = dai.balanceOf(address(this));
		dai.transfer(msg.sender, attodai);
		return attodai;
	}

	function withdrawDuringShutdown(uint256 attodaiHrd) external returns(uint256 attorontodai) {
		require(daiJoin.live() != 1);
		if (dsr.rho() != now) dsr.drip();
		_burn(address(0), msg.sender, attodaiHrd, new bytes(0), new bytes(0));
		dsr.exit(attodaiHrd);
		attorontodai = vat.dai(address(this));
		vat.move(address(this), msg.sender, attorontodai);
		return attorontodai;
	}
}
