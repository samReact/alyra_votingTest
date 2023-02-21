const Voting = artifacts.require("./Voting.sol");
const { BN, expectRevert, expectEvent } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");

contract("Voting", (accounts) => {
  const _owner = accounts[0];
  const _voter1 = accounts[1];
  const _voter2 = accounts[2];

  beforeEach(async function () {
    this.voting = await Voting.new({ from: _owner });
  });

  describe("Add a voter", function () {
    it("Fails when called by a non-owner account", async function () {
      await expectRevert(
        this.voting.addVoter(_voter2, {
          from: _voter1,
        }),
        "Ownable: caller is not the owner"
      );
    });

    it("has a initial status RegisteringVoters ", async function () {
      expect(await this.voting.workflowStatus()).to.be.bignumber.equal(
        new BN(Voting.WorkflowStatus.RegisteringVoters)
      );
    });
    it("Should revert if status is not RegisteringVoters ", async function () {
      await this.voting.startProposalsRegistering({
        from: _owner,
      });
      await expectRevert(
        this.voting.addVoter(_voter1, {
          from: _owner,
        }),
        "Voters registration is not open yet"
      );
    });
    it("Should revert if you are already registred ", async function () {
      await this.voting.addVoter(accounts[1], {
        from: _owner,
      });
      await expectRevert(
        this.voting.addVoter(accounts[1], {
          from: _owner,
        }),
        "Already registered"
      );
    });
    it("Should emit an event VoterRegistred if you are not registred ", async function () {
      let receipt = await this.voting.addVoter(_voter1, {
        from: _owner,
      });
      expectEvent(receipt, "VoterRegisered", { voterAddress: _voter1 });
    });
  });
});
