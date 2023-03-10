const Voting = artifacts.require("./Voting.sol");
const { BN, expectRevert, expectEvent } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");

contract("Voting", (accounts) => {
  const _owner = accounts[0];
  const _voter1 = accounts[1];
  const _voter2 = accounts[2];
  const _voter3 = accounts[3];

  let votingInstance;
  let txAdd1;
  let txAdd2;
  let txStartProp;
  let txEndProp;
  let txAddProp;
  let txStartVoting;
  let txSetVote;
  let txTally;

  before(async function () {
    votingInstance = await Voting.deployed({ from: _owner });
  });
  describe("step 0", () => {
    before(async function () {
      txAdd1 = await votingInstance.addVoter(_voter1, {
        from: _owner,
      });
      txAdd2 = await votingInstance.addVoter(_voter2, {
        from: _owner,
      });
    });
    describe("add a voter", () => {
      it("has a initial status RegisteringVoters ", async function () {
        const workflowStatus = await votingInstance.workflowStatus.call();
        expect(workflowStatus).to.be.bignumber.equal(new BN(0));
      });
      it("Should revert if called by non owner", async () => {
        const tx = votingInstance.addVoter(_voter2, {
          from: _voter1,
        });
        await expectRevert(tx, "Ownable: caller is not the owner");
      });
      it("Should revert if already registred", async () => {
        const tx = votingInstance.addVoter(_voter1, {
          from: _owner,
        });
        await expectRevert(tx, "Already registered");
      });
      it("Should get voter1 as registred", async () => {
        const voter = await votingInstance.getVoter.call(_voter1, {
          from: _voter1,
        });
        expect(voter.isRegistered).to.be.true;
      });
      it("Should emit an event VoterRegistered", async () => {
        expectEvent(txAdd1, "VoterRegistered", { voterAddress: _voter1 });
      });
    });
  });

  describe("step 1", () => {
    before(async function () {
      txStartProp = await votingInstance.startProposalsRegistering({
        from: _owner,
      });
      txAddProp = await votingInstance.addProposal("smic 5000 euros", {
        from: _voter1,
      });
    });
    it("Should revert if call step 0", async () => {
      const txAdd2 = votingInstance.addVoter(_voter2, {
        from: _owner,
      });

      await expectRevert(txAdd2, "Voters registration is not open yet");
    });

    describe("start proposal registering", () => {
      it("Should revert if non owner call", async () => {
        const tx = votingInstance.startProposalsRegistering({
          from: _voter1,
        });
        await expectRevert(tx, "Ownable: caller is not the owner");
      });

      it("Should get a genesis proposal", async () => {
        const proposal = await votingInstance.getOneProposal.call(0, {
          from: _voter1,
        });
        expect(proposal[0]).to.be.equal("GENESIS");
      });
      it("Should emit an event WorkflowStatusChange", async () => {
        expectEvent(txStartProp, "WorkflowStatusChange", {
          previousStatus: BN(0),
          newStatus: BN(1),
        });
      });
    });
    describe("add a proposal", () => {
      it("Should have a status ProposalsRegistrationStarted ", async function () {
        const workflowStatus = await votingInstance.workflowStatus.call();
        expect(workflowStatus).to.be.bignumber.equal(new BN(1));
      });
      it("Should revert if non registered voter call", async () => {
        const tx = votingInstance.addProposal("smic 5000 euros", {
          from: _voter3,
        });
        await expectRevert(tx, "You're not a voter");
      });
      it("Should revert if proposal is empty", async () => {
        const tx = votingInstance.addProposal("", {
          from: _voter1,
        });
        await expectRevert(tx, "Vous ne pouvez pas ne rien proposer");
      });
      it("Should get added proposal", async () => {
        const proposal = await votingInstance.getOneProposal.call(1, {
          from: _voter1,
        });
        expect(proposal[0]).to.be.equal("smic 5000 euros");
      });
      it("added proposal voteCount should be 0", async function () {
        const proposal = await votingInstance.getOneProposal.call(1, {
          from: _voter1,
        });
        expect(proposal.voteCount).to.be.bignumber.equal(BN(0));
      });
      it("Should emit an event ProposalRegistered", async () => {
        expectEvent(txAddProp, "ProposalRegistered", { proposalId: BN(1) });
      });
    });

    describe("end proposal registering", () => {
      before(async function () {
        txEndProp = await votingInstance.endProposalsRegistering({
          from: _owner,
        });
      });
      it("Should revert if non owner call", async () => {
        const tx = votingInstance.endProposalsRegistering({
          from: _voter1,
        });
        await expectRevert(tx, "Ownable: caller is not the owner");
      });
      it("Should revert if call step 1", async () => {
        tx = votingInstance.startProposalsRegistering({
          from: _owner,
        });
        await expectRevert(tx, "Registering proposals cant be started now");
      });
      it("Should emit an event WorkflowStatusChange", async () => {
        expectEvent(txEndProp, "WorkflowStatusChange", {
          previousStatus: BN(1),
          newStatus: BN(2),
        });
      });
    });
  });

  describe("step 2", () => {
    it("Should revert if call step 1", async () => {
      const txAddProp = votingInstance.addProposal("smic 5000 euros", {
        from: _voter1,
      });

      await expectRevert(txAddProp, "Proposals are not allowed yet");
    });

    describe("start voting session", () => {
      before(async function () {
        txStartVoting = await votingInstance.startVotingSession({
          from: _owner,
        });
      });
      it("Should revert if non owner call", async () => {
        const tx = votingInstance.startVotingSession({
          from: _voter1,
        });
        await expectRevert(tx, "Ownable: caller is not the owner");
      });

      it("Should emit an event WorkflowStatusChange", async () => {
        expectEvent(txStartVoting, "WorkflowStatusChange", {
          previousStatus: BN(2),
          newStatus: BN(3),
        });
      });
    });

    describe("set a vote", () => {
      before(async function () {
        txSetVote = await votingInstance.setVote(1, {
          from: _voter1,
        });
      });
      it("Should revert if non registered voter call", async () => {
        const tx = votingInstance.setVote(1, {
          from: _voter3,
        });
        await expectRevert(tx, "You're not a voter");
      });
      it("Should have a status VotingSessionStarted", async function () {
        const workflowStatus = await votingInstance.workflowStatus.call();
        expect(workflowStatus).to.be.bignumber.equal(new BN(3));
      });
      it("Should revert if voter has already voted", async () => {
        let setVote = votingInstance.setVote(1, {
          from: _voter1,
        });
        await expectRevert(setVote, "You have already voted");
      });
      it("Should revert if voter has already voted", async () => {
        let setVote = votingInstance.setVote(4, {
          from: _voter2,
        });
        await expectRevert(setVote, "Proposal not found");
      });
      it("Should set votedProposal id", async function () {
        const voter1 = await votingInstance.getVoter.call(_voter1, {
          from: _voter1,
        });
        expect(voter1.votedProposalId).to.be.bignumber.equal(BN(1));
      });
      it("Should set votedProposal id", async function () {
        const voter1 = await votingInstance.getVoter.call(_voter1, {
          from: _voter1,
        });
        expect(voter1.hasVoted).to.be.true;
      });
      it("Should increment proposal voteCount", async function () {
        const proposal = await votingInstance.getOneProposal.call(1, {
          from: _voter1,
        });
        expect(proposal.voteCount).to.be.bignumber.equal(BN(1));
      });
      it("Should emit an event Voted", async () => {
        expectEvent(txSetVote, "Voted", {
          voter: _voter1,
          proposalId: BN(1),
        });
      });
    });

    describe("end voting session", () => {
      before(async function () {
        txEndProp = await votingInstance.endVotingSession({
          from: _owner,
        });
      });
      it("Should revert if non owner call", async () => {
        const tx = votingInstance.endVotingSession({
          from: _voter1,
        });
        await expectRevert(tx, "Ownable: caller is not the owner");
      });
      it("Should emit an event WorkflowStatusChange", async () => {
        expectEvent(txEndProp, "WorkflowStatusChange", {
          previousStatus: BN(3),
          newStatus: BN(4),
        });
      });
    });
  });

  describe("step 3", () => {
    before(async function () {
      txTally = await votingInstance.tallyVotes({
        from: _owner,
      });
    });
    it("Should revert if call step 2", async () => {
      const txSetVote = votingInstance.setVote(1, {
        from: _voter1,
      });

      await expectRevert(txSetVote, "Voting session havent started yet");
    });
    describe("tallyVotes", () => {
      it("Should revert if non owner call", async () => {
        const tx = votingInstance.tallyVotes({
          from: _voter1,
        });
        await expectRevert(tx, "Ownable: caller is not the owner");
      });
      it("WinningProposalID should be equal to 1 ", async () => {
        const tx = await votingInstance.winningProposalID.call({
          from: _owner,
        });
        expect(tx).to.be.bignumber.equal(BN(1));
      });
      it("Should emit an event WorkflowStatusChange", async () => {
        expectEvent(txTally, "WorkflowStatusChange", {
          previousStatus: BN(4),
          newStatus: BN(5),
        });
      });
    });
  });
});
