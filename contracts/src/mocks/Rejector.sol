// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @notice Test-only helper: a recipient that always rejects native transfers.
/// Used to prove QuiltSplits.pay reverts atomically instead of partially paying.
contract Rejector {
    error Rejected();

    receive() external payable {
        revert Rejected();
    }
}
