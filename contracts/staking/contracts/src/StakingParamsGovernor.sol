/*

  Copyright 2019 ZeroEx Intl.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

*/

pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;

import "./interfaces/IStaking.sol";
import "./interfaces/IStorage.sol";
import "./interfaces/IStakingProxy.sol";
import "./interfaces/IStructs.sol";
import "./libs/LibSafeDowncast.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibMath.sol";
import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "@0x/contracts-utils/contracts/src/DeploymentConstants.sol";


contract StakingParamsGovernor is
    DeploymentConstants
{
    using LibSafeMath for uint256;
    using LibSafeDowncast for uint256;

    uint256 PPM_DENOMINATOR = 1000000;

    /// @dev Staking parameters that can be voted on.
    /// @param epochDurationInSeconds Minimum seconds between epochs.
    /// @param minimumPoolStake Minimum amount of stake required in a pool to collect rewards.
    /// @param rewardDelegatedStakeWeight How much delegated stake is weighted vs operator stake, in ppm.
    /// @param cobbDouglasAlphaNumerator Numerator for cobb douglas alpha factor.
    /// @param cobbDouglasAlphaDenominator Denominator for cobb douglas alpha factor.
    struct StakingParams {
        uint256 epochDurationInSeconds;
        uint256 minimumPoolStake;
        uint32 rewardDelegatedStakeWeight;
        uint32 cobbDouglasAlphaNumerator;
        uint32 cobbDouglasAlphaDenominator;
    }

    /// @dev Vote info for a specific staker and proposal.
    /// @param amount Amount of ZRX voted.
    /// @param forProposal For or against proposal.
    struct Vote {
        uint224 amount;
        bool forProposal; 
    }

    /// @dev Proposal information that will be voted on.
    /// @param params Staking params that will be voted on.
    /// @param epochSubmitted The staking epoch in which the proposal was submitted.
    /// @param forProposalAmount Amount of ZRX that voted for proposal.
    /// @param againstProposalAmount Amount of ZRX that voted against proposal.
    /// @param executed If proposal has already been executed.
    /// @param votesByAddress Mapping of voters to votes for proposal.
    struct Proposal {
        StakingParams params;
        uint256 epochSubmitted;
        uint256 forProposalAmount;
        uint256 againstProposalAmount;
        bool executed;
        mapping (address => Vote) votesByAddress;
    }

    // 1% of supply of ZRX must vote for a proposal to be executed
    uint256 proposalVoteThreshold = 10 ** 25;

    // Proposal ids start at 1
    uint256 currentProposalId = 1;

    /// @dev Mapping of proposalId => proposal
    mapping (uint256 => Proposal) public proposalsById;

    /// @dev Mapping of epoch => proposal id that is past voting threshhold and has largest amount of votes
    mapping (uint256 => uint256) public largestExecutableProposalByEpoch;

    /// @dev Propose new staking parameters to be voted on.
    /// @param params Proposed staking params
    function submitProposal(StakingParams calldata params)
        external
    {
        // Ensure proposed params are valid
        _assertValidStakingParams(params);

        // Query current epoch
        uint256 currentEpoch = IStorage(_getStakingProxyAddress()).currentEpoch();

        // Assign an id to proposal
        uint256 proposalId = currentProposalId;
        currentProposalId = proposalId.safeAdd(1);

        proposalsById[proposalId] = Proposal({
            params: params,
            epochSubmitted: currentEpoch,
            forProposalAmount: 0,
            againstProposalAmount: 0,
            executed: false
        });
    }

    /// @dev Cast vote on a specific proposal.
    /// @param proposalId Id of proposal to vote on.
    /// @param forProposal For or against proposal.
    /// @param poolIds Array of all pool ids that sender is staked with.
    function castVote(
        uint256 proposalId,
        bool forProposal,
        bytes32[] calldata poolIds
    )
        external
    {
        Proposal storage proposal = proposalsById[proposalId];

        // Query the current epoch
        // Ensure that the proposal was submitted exactly last epoch
        uint256 currentEpoch = IStorage(_getStakingProxyAddress()).currentEpoch();
        require(
            currentEpoch == proposal.epochSubmitted.safeAdd(1),
            "StakingParamsGovernor/INVALID_VOTE_EPOCH"
        );

        Vote storage vote = proposal.votesByAddress[msg.sender];
        uint256 voteAmount = vote.amount;

        // A voter can change their preference but not the amount they voted with
        if (voteAmount > 0) {
            // Voter changing their vote from `for` to `against`
            if (vote.forProposal && !forProposal) {
                proposal.forProposalAmount = proposal.forProposalAmount.safeSub(voteAmount);
                proposal.againstProposalAmount = proposal.againstProposalAmount.safeAdd(voteAmount);

            // Voter changing their vote from `against` to `for`
            } else if (!vote.forProposal && forProposal) {
                proposal.againstProposalAmount = proposal.againstProposalAmount.safeSub(voteAmount);
                proposal.forProposalAmount = proposal.forProposalAmount.safeAdd(voteAmount);
            }
            vote.forProposal = forProposal;
            return;
        }

        // Get voting power of sender if they have not already voted
        uint224 votingPower = _getWeightedVotingPower(
            msg.sender,
            currentEpoch,
            poolIds
        ).downcastToUint224();

        // Store the vote of the sender
        vote.amount = votingPower;
        vote.forProposal = forProposal;

        // Update total vote amounts of proposal
        uint256 totalProposalAmount = 0;
        if (forProposal) {
            uint256 forProposalAmount = proposal.forProposalAmount.safeAdd(votingPower);
            proposal.forProposalAmount = forProposalAmount;
            totalProposalAmount = forProposalAmount.safeAdd(proposal.againstProposalAmount);
        } else {
            uint256 againstProposalAmount = proposal.againstProposalAmount.safeAdd(votingPower);
            proposal.againstProposalAmount = againstProposalAmount;
            totalProposalAmount = againstProposalAmount.safeAdd(proposal.forProposalAmount);
        }

        // Update largest proposal id if necessary
        uint256 nextEpoch = currentEpoch.safeAdd(1);
        uint256 largestProposalId = largestExecutableProposalByEpoch[nextEpoch];
        if (largestProposalId != proposalId && totalProposalAmount >= proposalVoteThreshold) {
            Proposal storage largestProposal = proposalsById[largestProposalId];
            uint256 largestProposalAmount = largestProposal.forProposalAmount
                .safeAdd(largestProposal.againstProposalAmount);
            // Note: The first proposal takes precedence if amounts are equal
            if (totalProposalAmount > largestProposalAmount) {
                largestExecutableProposalByEpoch[nextEpoch] = proposalId;
            }
        }
    }

    /// @dev Execute a proposal.
    ///      The proposal must meet the voting threshhold amount
    ///      and have the largest total voting amount of all proposal
    ///      that were voted on in the last epoch.
    /// @param proposalId Id of proposal to be executed.
    function executeProposal(uint256 proposalId)
        external
    {
        // Ensure proposal exists
        require(
            proposalId != 0,
            "StakingParamsGovernor/PROPOSAL_DOES_NOT_EXIST"
        );

        // Ensure proposal is executable
        address stakingProxyAddress = _getStakingProxyAddress();
        uint256 currentEpoch = IStorage(stakingProxyAddress).currentEpoch();
        require(
            largestExecutableProposalByEpoch[currentEpoch] == proposalId,
            "StakingParamsGovernor/PROPOSAL_NOT_EXECUTABLE"
        );

        // Ensure proposal not already executed
        Proposal storage proposal = proposalsById[proposalId];
        require(
            !proposal.executed,
            "StakingParamsGovernor/PROPOSAL_ALREADY_EXECUTED"
        );

        // Ensure that majority voted for proposal
        require(
            proposal.forProposalAmount > proposal.againstProposalAmount,
            "StakingParamsGovernor/PROPOSAL_DID_NOT_PASS"
        );

        // Execute proposal
        proposal.executed = true;
        StakingParams memory params = proposal.params;
        IStaking(stakingProxyAddress).setParams(
            params.epochDurationInSeconds,
            params.rewardDelegatedStakeWeight,
            params.minimumPoolStake,
            params.cobbDouglasAlphaNumerator,
            params.cobbDouglasAlphaDenominator
        );
    }

    function _getWeightedVotingPower(
        address staker,
        uint256 epoch,
        bytes32[] memory poolIds
    )
        internal
        view
        returns (uint256)
    {
        uint256 totalVotingPower = 0;
        uint256 poolIdsLen = poolIds.length;
        address stakingProxyAddress = _getStakingProxyAddress();

        for (uint256 i = 0; i != poolIdsLen; i++) {
            bytes32 poolId = poolIds[i];

            IStructs.Pool memory pool = IStaking(stakingProxyAddress).getStakingPool(poolId);
            IStructs.StoredBalance memory balance = IStaking(stakingProxyAddress)
                .getStakeDelegatedToPoolByOwner(staker, poolId);
    
            if (pool.operator == staker) {
                // Pool operators receive 100% of the voting power of their own stake to their pool
                totalVotingPower = totalVotingPower.safeAdd(balance.currentEpochBalance);
                IStructs.PoolStats memory poolStats = IStorage(stakingProxyAddress)
                    .poolStatsByEpoch(poolId, epoch);
                // Pool operators receive 50% of delegator voting power to their pool
                totalVotingPower = totalVotingPower.safeAdd(poolStats.membersStake.safeDiv(2));
            } else {
                // Delegators receive 50% of the voting power for stake delegated to any pool
                // that is not their own
                totalVotingPower = totalVotingPower.safeAdd(uint256(balance.currentEpochBalance).safeDiv(2));
            }
        }

        return totalVotingPower;
    }

    function _assertValidStakingParams(StakingParams memory params)
        internal
        view
    {
        // Query params currently set in the StakingProxy
        StakingParams memory currentParams;
        (
            currentParams.epochDurationInSeconds,
            currentParams.rewardDelegatedStakeWeight,
            currentParams.minimumPoolStake,
            currentParams.cobbDouglasAlphaNumerator,
            currentParams.cobbDouglasAlphaDenominator
        ) = IStaking(_getStakingProxyAddress()).getParams();

        require(
            params.epochDurationInSeconds <= LibMath.getPartialAmountFloor(
                12,
                10,
                currentParams.epochDurationInSeconds
            ) &&
            params.epochDurationInSeconds >= LibMath.getPartialAmountFloor(
                8,
                10,
                currentParams.epochDurationInSeconds
            ) &&
            params.epochDurationInSeconds >= 5 days &&
            params.epochDurationInSeconds <= 30 days,
            "StakingParamsGovernor/EPOCH_DURATION_OUT_OF_BOUNDS"
        );

        require(
            params.rewardDelegatedStakeWeight <= LibMath.getPartialAmountFloor(
                12,
                10,
                currentParams.rewardDelegatedStakeWeight
            ) &&
            params.rewardDelegatedStakeWeight >= LibMath.getPartialAmountFloor(
                8,
                10,
                currentParams.rewardDelegatedStakeWeight
            ) &&
            params.rewardDelegatedStakeWeight <= PPM_DENOMINATOR,
            "StakingParamsGovernor/DELEGATED_STAKE_WEIGHT_OUT_OF_BOUNDS"
        );

        require(
            params.minimumPoolStake <= LibMath.getPartialAmountFloor(
                12,
                10,
                currentParams.minimumPoolStake
            ) &&
            params.minimumPoolStake >= LibMath.getPartialAmountFloor(
                8,
                10,
                currentParams.minimumPoolStake
            ) &&
            params.minimumPoolStake >= 2,
            "StakingParamsGovernor/MIN_POOL_STAKE_OUT_OF_BOUNDS"
        );

        uint256 scaledAlpha = LibMath.getPartialAmountFloor(
            params.cobbDouglasAlphaNumerator,
            params.cobbDouglasAlphaDenominator,
            PPM_DENOMINATOR
        );
        require(
            params.cobbDouglasAlphaNumerator <= params.cobbDouglasAlphaDenominator &&
            params.cobbDouglasAlphaDenominator != 0 &&
            scaledAlpha <= LibMath.getPartialAmountFloor(
                currentParams.cobbDouglasAlphaNumerator,
                currentParams.cobbDouglasAlphaDenominator,
                1200000
            ) &&
            scaledAlpha >= LibMath.getPartialAmountFloor(
                currentParams.cobbDouglasAlphaNumerator,
                currentParams.cobbDouglasAlphaDenominator,
                800000
            ),
            "StakingParamsGovernor/ALPHA_OUT_OF_BOUNDS"
        );
    }
}
