import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import { prependOnceListener } from "process";
import { MyToken__factory } from "../typechain-types";
import { Address } from "cluster";
import { string } from "hardhat/internal/core/params/argumentTypes";
dotenv.config();

const PROPOSALS = [
  "Proposal 1",
  "Proposal 2",
  "Proposal 3",
  "Proposal 4",
  "Proposal 5",
  "Proposal 6",
  "Proposal 7",
  "Proposal 8",
  "Proposal 9",
  "Proposal 10",
];
const TOKENS_MINTED = ethers.utils.parseEther("1");
const TOKENS_VOTE = ethers.utils.parseEther("1");

function convertStringArrayToBytes32(array: string[]) {
  const bytes32Array = [];
  for (let index = 0; index < array.length; index++) {
    bytes32Array.push(ethers.utils.formatBytes32String(array[index]));
  }
  return bytes32Array;
}

async function DeployTokenizedBallot(adrr: string, blockNumber: number) {
  const TokenizedBallotFactory = await ethers.getContractFactory(
    "TokenizedBallot"
  );
  console.log("Deploying TokenizedBallotContract\n");
  const TokenizedBallotContract = await TokenizedBallotFactory.deploy(
    convertStringArrayToBytes32(PROPOSALS),
    adrr,
    blockNumber
  );
  const tokenizedBallotContract = await TokenizedBallotContract.deployed();
  return tokenizedBallotContract;
}

async function main() {
  // DEPLOY MyToken (MyERC20Votes.sol)
  const [deployer, acc1, acc2] = await ethers.getSigners();
  const ERC20Factory = await ethers.getContractFactory("MyToken");
  const ERC20Contract = await ERC20Factory.deploy();
  const deploymentTx = await ERC20Contract.deployed();
  // GETTING MyToken CONTRACT ADDRESS
  const ERC20ContractAdrr = deploymentTx.address;
  console.log("Deploy address: " + ERC20ContractAdrr + "\n");

  // CHECK TOTAL SUPPLY AND TOKEN BALANCE AF ACC1 BEFORE MINTING
  const totalSupplyBefore = await ERC20Contract.totalSupply();
  console.log(
    `The totalSupply of this contract BEFORE minting is ${ethers.utils.formatEther(
      totalSupplyBefore
    )}\n`
  );
  const acc1BalanceBeforeMint = await ERC20Contract.balanceOf(acc1.address);
  console.log(
    `The token balance of acc1 BEFORE minting is ${ethers.utils.formatEther(
      acc1BalanceBeforeMint
    )}\n`
  );

  // MINTING TOKENS FOR ACC1
  console.log("Minting new tokens for Acc1\n");
  const mintTx = await ERC20Contract.mint(acc1.address, TOKENS_MINTED);
  await mintTx.wait();

  // CHECK TOTAL SUPPLY AND TOKEN BALANCE OF ACC1 AFTER MINTING
  const totalSupplyAfter = await ERC20Contract.totalSupply();
  console.log(
    `The totalSupply of this contract AFTER minting is ${ethers.utils.formatEther(
      totalSupplyAfter
    )}\n`
  );
  const acc1BalanceAfterMint = await ERC20Contract.balanceOf(acc1.address);
  console.log(
    `The token balance of acc1 AFTER minting is ${ethers.utils.formatEther(
      acc1BalanceAfterMint
    )}\n`
  );

  console.log("Minting new tokens for Acc2\n");
  const mintTx2 = await ERC20Contract.mint(acc2.address, TOKENS_MINTED);
  await mintTx2.wait();

  // CHECK VOTE BALANCE OF ACC1 BEFORE SELF-DELEGATION - getVotes
  let acc1VotingBalance0 = await ERC20Contract.getVotes(acc1.address);
  console.log(
    `The vote balance of acc1 BEFORE self-delegation is ${ethers.utils.formatEther(
      acc1VotingBalance0
    )}\n`
  );
  // SELF-DELEGATION ACC1
  console.log("Delegating from acc1 to acc1?\n");
  const delegateTx = await ERC20Contract.connect(acc1).delegate(acc1.address);
  await delegateTx.wait();
  // CHECK VOTE BALANCE OF ACC1 AFTER SELF-DELEGATION - getVotes
  let acc1VotingBalance = await ERC20Contract.getVotes(acc1.address);
  console.log(
    `The vote balance of acc1 AFTER self-delegation is ${ethers.utils.formatEther(
      acc1VotingBalance
    )}\n`
  );
  // SELF-DELEGATION ACC2
  console.log("Delegating from acc2 to acc2?\n");
  const delegateTx2 = await ERC20Contract.connect(acc2).delegate(acc2.address);
  await delegateTx2.wait();

  //VOTE ACC1
  let currentBlock = await ethers.provider.getBlock("latest");
  console.log("the current Blocknumber is " + currentBlock.number + "\n");

  const TokenizedBallot = await DeployTokenizedBallot(
    ERC20ContractAdrr,
    currentBlock.number
  );

  let votePowerSpent = await TokenizedBallot.votePowerSpent(acc1.address);
  console.log(
    "Vote Power Spent of acc1 before voting: " +
      ethers.utils.formatEther(votePowerSpent) +
      "\n"
  );

  console.log("Voting acc1\n");
  const acc1Vote = await TokenizedBallot.connect(acc1).vote(
    1,
    2,
    3,
    4,
    5,
    TOKENS_VOTE
  );
  await acc1Vote.wait();

  // VOTE ACC2
  console.log("Voting acc2\n");
  const acc2Vote = await TokenizedBallot.connect(acc2).vote(
    9,
    5,
    6,
    1,
    0,
    TOKENS_VOTE
  );
  await acc2Vote.wait();

  votePowerSpent = await TokenizedBallot.votePowerSpent(acc1.address);
  console.log(
    "Vote Power Spent of acc1 after voting: " +
      ethers.utils.formatEther(votePowerSpent) +
      "\n"
  );
  votePowerSpent = await TokenizedBallot.votePowerSpent(acc2.address);
  console.log(
    "Vote Power Spent of acc2 after voting: " +
      ethers.utils.formatEther(votePowerSpent) +
      "\n"
  );

  const votePower = await TokenizedBallot.votePower(acc1.address);
  console.log(
    "Vote Power of acc1 after voting: " +
      ethers.utils.formatEther(votePower) +
      "\n"
  );

  acc1VotingBalance = await ERC20Contract.getVotes(acc1.address);
  console.log(
    `The vote balance of acc1 after voting is ${ethers.utils.formatEther(
      acc1VotingBalance
    )}\n`
  );

  const acc1BalanceAfterVote = await ERC20Contract.balanceOf(acc1.address);
  console.log(
    `The token balance of acc1 after voting is ${ethers.utils.formatEther(
      acc1BalanceAfterVote
    )}\n`
  );

  const winningProp = await TokenizedBallot.winningProp();
  const voteCount1 = await TokenizedBallot.proposals(winningProp[0]);
  const voteCount2 = await TokenizedBallot.proposals(winningProp[1]);
  const voteCount3 = await TokenizedBallot.proposals(winningProp[2]);
  console.log({ winningProp });
  console.log(
    "First winning proposal: " +
      winningProp[0] +
      " , with score: " +
      ethers.utils.formatEther(voteCount1.voteCount) +
      "\n"
  );
  console.log(
    "Second winning proposal: " +
      winningProp[1] +
      " , with score: " +
      ethers.utils.formatEther(voteCount2.voteCount) +
      "\n"
  );
  console.log(
    "Third winning proposal: " +
      winningProp[2] +
      " , with score: " +
      ethers.utils.formatEther(voteCount3.voteCount) +
      "\n"
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
