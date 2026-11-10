// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title QuiltSplits
/// @notice Immutable native-BOT split payments. A creator registers 2-5
/// recipients with fixed basis-point weights; any payer then settles every
/// share atomically with one native-value transaction.
/// @dev No fees, no admin, no upgradeability, no withdrawals. There is no
/// receive/fallback function, so accidental direct transfers revert instead
/// of trapping funds. Forced BOT (e.g. selfdestruct) is unspendable by design.
contract QuiltSplits is ReentrancyGuard {
    /// @notice Denominator for all weights. Weights must sum to exactly this.
    uint16 public constant TOTAL_BPS = 10_000;
    uint256 public constant MIN_RECIPIENTS = 2;
    uint256 public constant MAX_RECIPIENTS = 5;

    /// @notice Next split id to assign. Ids start at 1 and never repeat.
    uint256 public nextSplitId = 1;

    struct Split {
        address creator;
        address[] recipients;
        uint16[] weightsBps;
        uint256 totalPaid;
        uint256 paymentCount;
        bool exists;
    }

    mapping(uint256 => Split) private splits;
    mapping(address => uint256[]) private createdSplitIds;

    event SplitCreated(uint256 indexed splitId, address indexed creator);
    event RecipientPaid(uint256 indexed splitId, address indexed recipient, uint256 amount);
    event SplitPaid(uint256 indexed splitId, address indexed payer, uint256 totalAmount);

    error InvalidRecipientCount(uint256 count);
    error LengthMismatch();
    error ZeroRecipientAddress(uint256 index);
    error DuplicateRecipient(address recipient);
    error InvalidWeight(uint256 index, uint16 weight);
    error BadTotalWeight(uint256 total);
    error SplitNotFound(uint256 splitId);
    error ZeroPayment();
    error ZeroShare(uint256 index);
    error TransferFailed(address recipient, uint256 amount);

    /// @notice Register an immutable recipient/weight allocation.
    /// @return splitId The newly assigned split id.
    function createSplit(
        address[] calldata recipients,
        uint16[] calldata weightsBps
    ) external returns (uint256 splitId) {
        uint256 count = recipients.length;
        if (count < MIN_RECIPIENTS || count > MAX_RECIPIENTS) {
            revert InvalidRecipientCount(count);
        }
        if (weightsBps.length != count) revert LengthMismatch();

        uint256 total;
        for (uint256 i = 0; i < count; i++) {
            address recipient = recipients[i];
            if (recipient == address(0)) revert ZeroRecipientAddress(i);
            if (weightsBps[i] == 0) revert InvalidWeight(i, 0);
            total += weightsBps[i];
            for (uint256 j = 0; j < i; j++) {
                if (recipients[j] == recipient) revert DuplicateRecipient(recipient);
            }
        }
        if (total != TOTAL_BPS) revert BadTotalWeight(total);

        splitId = nextSplitId++;
        Split storage s = splits[splitId];
        s.creator = msg.sender;
        s.exists = true;
        for (uint256 i = 0; i < count; i++) {
            s.recipients.push(recipients[i]);
            s.weightsBps.push(weightsBps[i]);
        }
        createdSplitIds[msg.sender].push(splitId);

        emit SplitCreated(splitId, msg.sender);
    }

    /// @notice Pay every recipient of a split atomically with native BOT.
    /// @dev Reverts entirely if any recipient transfer fails or any share
    /// would be zero wei. State counters update before external calls, and
    /// reentrancy is blocked by ReentrancyGuard.
    function pay(uint256 splitId) external payable nonReentrant {
        Split storage s = splits[splitId];
        if (!s.exists) revert SplitNotFound(splitId);

        uint256[] memory amountsWei = _amounts(s, msg.value);

        s.totalPaid += msg.value;
        s.paymentCount += 1;
        emit SplitPaid(splitId, msg.sender, msg.value);

        uint256 count = s.recipients.length;
        for (uint256 i = 0; i < count; i++) {
            (bool ok,) = s.recipients[i].call{value: amountsWei[i]}("");
            if (!ok) revert TransferFailed(s.recipients[i], amountsWei[i]);
            emit RecipientPaid(splitId, s.recipients[i], amountsWei[i]);
        }
    }

    /// @notice Preview exact per-recipient amounts for a payment value.
    /// @dev Uses the identical allocation logic as pay; reverts on the same
    /// dust/zero inputs that pay would reject.
    function quoteSplit(
        uint256 splitId,
        uint256 amountWei
    ) external view returns (uint256[] memory amountsWei) {
        Split storage s = splits[splitId];
        if (!s.exists) revert SplitNotFound(splitId);
        return _amounts(s, amountWei);
    }

    function getSplit(uint256 splitId) external view returns (Split memory) {
        Split storage s = splits[splitId];
        if (!s.exists) revert SplitNotFound(splitId);
        return s;
    }

    function getCreatorSplitIds(address creator) external view returns (uint256[] memory) {
        return createdSplitIds[creator];
    }

    /// @dev Single source of truth for allocation math, shared by pay and
    /// quoteSplit. First N-1 shares round down; the last recipient receives
    /// the exact remainder so shares always sum to the payment value.
    function _amounts(
        Split storage s,
        uint256 amountWei
    ) internal view returns (uint256[] memory amountsWei) {
        if (amountWei == 0) revert ZeroPayment();
        uint256 count = s.recipients.length;
        amountsWei = new uint256[](count);
        uint256 accounted;
        for (uint256 i = 0; i < count - 1; i++) {
            uint256 share = (amountWei * s.weightsBps[i]) / TOTAL_BPS;
            if (share == 0) revert ZeroShare(i);
            amountsWei[i] = share;
            accounted += share;
        }
        amountsWei[count - 1] = amountWei - accounted;
        if (amountsWei[count - 1] == 0) revert ZeroShare(count - 1);
    }
}
