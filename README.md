## Project2 Alyra simple smart contract initialized with truffle init

### Installing the project in local

1. Clone the repository

```
$ git clone https://github.com/samReact/alyra_votingTest.git
```

2. Go to the correct folder

```
$ cd alyra_votingTest.git
```

3. Install dependencies

```
$ npm install
```

### Running the project with ganache

1. Launch ganache

```
$ ganache
```

2. Compile and deploy your contract

```
$ truffle migrate
```

3. You can now interact with your contract

### CI with github actions

the setting .yaml file is located here
`alyra_votingTest/.github/workflows/nodes.js.yml/`

On every push or pull request on the main branch tests are launch.

### Tests

```bash
#  execute the tests

$ truffle test
```

For testing the Voting.sol contract,we have follow theses steps:

```
 Contract: Voting
    step 0
      add a voter
        ✔ has a initial status RegisteringVoters
        ✔ Should revert if called by non owner (92ms)
        ✔ Should revert if already registred
        ✔ Should get voter1 as registred
        ✔ Should emit an event VoterRegistered
    step 1
      ✔ Should revert if call step 0
      start proposal registering
        ✔ Should revert if non owner call
        ✔ Should get a genesis proposal
        ✔ Should emit an event WorkflowStatusChange
      add a proposal
        ✔ Should have a status ProposalsRegistrationStarted
        ✔ Should revert if non registered voter call
        ✔ Should revert if proposal is empty
        ✔ Should get added proposal
        ✔ added proposal voteCount should be 0
        ✔ Should emit an event ProposalRegistered
      end proposal registering
        ✔ Should revert if non owner call
        ✔ Should revert if call step 1
        ✔ Should emit an event WorkflowStatusChange
    step 2
      ✔ Should revert if call step 1
      start voting session
        ✔ Should revert if non owner call
        ✔ Should emit an event WorkflowStatusChange
      set a vote
        ✔ Should revert if non registered voter call
        ✔ Should have a status VotingSessionStarted
        ✔ Should revert if voter has already voted
        ✔ Should revert if voter has already voted
        ✔ Should set votedProposal id
        ✔ Should set votedProposal id
        ✔ Should increment proposal voteCount
        ✔ Should emit an event Voted
      end voting session
        ✔ Should revert if non owner call
        ✔ Should emit an event WorkflowStatusChange
    step 3
      ✔ Should revert if call step 2
      tallyVotes
        ✔ Should revert if non owner call
        ✔ WinningProposalID should be equal to 1
        ✔ Should emit an event WorkflowStatusChange

```

To keep the contract storage state between steps we use a deployed instance of the contract instead of a new instance:

```js
before(async function () {
  votingInstance = await Voting.deployed({ from: _owner });
});
```

On every steps we execute the necessary actions to test the step, for instance on step 0 we add 2 voters before tests :

```js
before(async function () {
  txAdd1 = await votingInstance.addVoter(_voter1, {
    from: _owner,
  });
  txAdd2 = await votingInstance.addVoter(_voter2, {
    from: _owner,
  });
});
```

These 2 added voters will be kept through all steps.

For each function we will test :

- If caller has right to call (owner,voters)
- Has the correct status
- Do the expected behavior (add voters, add proposals, set a vote, emit events and finally set a winning proposal Id)
