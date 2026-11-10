// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface IQuiltPayer {
    function pay(uint256 splitId) external payable;
}

/// @notice Test-only helper: a recipient that tries to re-enter QuiltSplits.pay
/// from its receive function, attempting to double-claim its share.
/// Used to prove the reentrancy guard blocks the attack and reverts cleanly.
contract ReentrantAttacker {
    IQuiltPayer public immutable quilt;
    uint256 public targetSplit;

    constructor(IQuiltPayer _quilt) {
        quilt = _quilt;
    }

    function setTarget(uint256 splitId) external {
        targetSplit = splitId;
    }

    receive() external payable {
        quilt.pay{value: msg.value}(targetSplit);
    }
}
