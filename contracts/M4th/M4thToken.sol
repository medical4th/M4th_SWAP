pragma solidity ^0.6.0;

import "./ERC20Pausable.sol";
import "./IERC20.sol";
import "./TokenTimelock.sol";
import "./Ownable.sol";


contract M4thToken is ERC20Pausable, Ownable {
    string private _m4c_name = "Medical 4th Chain";
    string private _m4c_symbol = "M4th";
    uint256 private _m4c_decimals = 18;
    uint256 private INITIAL_SUPPLY = 4000000000 * (10**_m4c_decimals); //40 억개

    //lock base time(listing on date)  2020-03-26 17:00:00(UTC+9) 08:00:00(UTC 0)
    uint256 private constant _baseTime = 1585209600;
    //total locked amount
    uint256 private _totalLockedAmount = 0;
    //total locked amount per address
    mapping(address => uint256) private _lockedAmount;
    //locked info
    mapping(address => TokenTimelock[]) private _lockedList;

    //event
    event TokenLockup(address indexed beneficiary, uint256 time, uint256 amount);
    event TokenUnlock(address indexed beneficiary, uint256 amount);


    //constructor
    constructor() public ERC20(_m4c_name, _m4c_symbol) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    //get now time
    function getNow() external view returns (uint256) {
        return now;
    }

    function baseTime() external pure returns (uint256) {
        return _baseTime;
    }

    //burn token by self
    function burnToken(uint256 amount) external {
        _burn(_msgSender(), amount);
    }

    // token pause by owner
    function tokenPause() external onlyOwner {
        _pause();
    }

    // token unpause by owner
    function tokenUnpause() external onlyOwner {
        _unpause();
    }

    function lockedTotalBalance() external view onlyOwner returns (uint256) {
        return _totalLockedAmount;
    }

    //my locked token amount
    function lockedBalanceOf() external view returns (uint256) {
        return _lockedBalanceOf(_msgSender());
    }

    function lockedBalanceOfByOwner(address beneficiary) external view onlyOwner returns (uint256) {
        return _lockedBalanceOf(beneficiary);
    }

    function _lockedBalanceOf(address beneficiary) internal view returns (uint256) {
        return _lockedAmount[beneficiary];
    }

    //my locked token length
    function lockedLength() external view returns (uint256) {
        return _lockedLength(_msgSender());
    }

    function lockedLengthByOwner(address beneficiary) external view onlyOwner returns (uint256) {
        return _lockedLength(beneficiary);
    }

    function _lockedLength(address beneficiary) internal view returns (uint256) {
        return _lockedList[beneficiary].length;
    }

    // 1 day = 24 * 60 * 60 = 86400
    // 1 month = 30 * 1 day = 
    // 1 year = 165 * 1 day = 31536000
    //lock token
    function tokenLock(address beneficiary, uint256 time, uint256 amount) external onlyOwner {
        require(beneficiary != address(0), "M4th: tokenLock from the zero address" );
        require(amount > 0, "M4th: tokenLock amount greater than zero");
        require(time > 0, "M4th: tokenLock time greater than zero");

        TokenTimelock _lock = new TokenTimelock(
            IERC20(address(this)),
            beneficiary,
            _baseTime.add(time)
        );
        _transfer(beneficiary, address(_lock), amount);

        _totalLockedAmount = _totalLockedAmount.add(amount);
        _lockedAmount[beneficiary] = _lockedAmount[beneficiary].add(amount);
        _lockedList[beneficiary].push(_lock);
        TokenLockup(beneficiary, _baseTime.add(time), amount);
    }

    //token unlock by contract owner
    function tokenUnlockByOwner(address beneficiary) external onlyOwner {
        _tokenUnlock(beneficiary);
    }

    //token unlock by token owner
    function tokenUnlock() external {
        _tokenUnlock(_msgSender());
    }

    function _tokenUnlock(address beneficiary) internal {
        require( beneficiary != address(0), "M4th: tokenUnlock to the zero address");
        require(_lockedLength(beneficiary) > 0, "M4th: not found locked token");

        for (uint256 idx = _lockedLength(beneficiary); idx > 0; idx--) {
            uint256 currentIdx = idx -1;
            TokenTimelock _tmp = _lockedList[beneficiary][currentIdx];
            uint256 _amount = balanceOf(address(_tmp));
            if (_tmp.releaseTime() <= now) {
                _lockedList[beneficiary][currentIdx] = _lockedList[beneficiary][_lockedLength(beneficiary) - 1];
                _lockedList[beneficiary].pop();
                _lockedAmount[beneficiary] = _lockedAmount[beneficiary].sub(_amount);
                _totalLockedAmount = _totalLockedAmount.sub(_amount);

                _tmp.release();
                TokenUnlock(beneficiary, _amount);
            }
        }
        if (_lockedLength(beneficiary) == 0) {
            delete _lockedList[beneficiary];
        }
    }
    //token lock info
    function tokenLockInfo(uint256 idx) external view returns(address, uint256, uint256){
        return _tokenLockInfo(_msgSender(), idx);
    }
    function tokenLockInfoByOwner(address beneficiary, uint256 idx) external view onlyOwner returns(address, uint256, uint256){
        return _tokenLockInfo(beneficiary, idx);
    }
    function _tokenLockInfo(address beneficiary, uint256 idx) internal view returns(address, uint256, uint256){
        require( idx < _lockedLength(beneficiary), "M4th: tokenLockInfo idx less then length");
        TokenTimelock _tmp = _lockedList[beneficiary][idx];
        return (_tmp.beneficiary(), _tmp.releaseTime(), _tmp.token().balanceOf(address(_tmp)));
    }
}
