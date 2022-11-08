import { ethers, Signer } from "ethers";
import * as dotenv from "dotenv";
import { prependOnceListener } from "process";
import { MyToken__factory, TokenizedBallot__factory } from "../typechain-types";
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

async function DeployTokenizedBallot(
  adrr: string,
  blockNumber: number,
  signer: Signer
) {
  const TokenizedBallotFactory = new TokenizedBallot__factory(signer);
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
  const options = { alchemy: process.env.ALCHEMY_API_KEY };
  const provider = ethers.providers.getDefaultProvider("goerli", options);

  const mnemonic = process.env.MNEMONIC!;
  const hdNode = ethers.utils.HDNode.fromMnemonic(mnemonic);
  const pathIndex: number = 0;
  const path = `m/44'/60'/0'/0/${pathIndex}`;
  const path1 = `m/44'/60'/0'/0/1`;
  const path2 = `m/44'/60'/0'/0/2`;
  const wallet = new ethers.Wallet(hdNode.derivePath(path));
  console.log(`DeployToken Using address ${wallet.address}\n`);
  const wallet1 = new ethers.Wallet(hdNode.derivePath(path1));
  const wallet2 = new ethers.Wallet(hdNode.derivePath(path2));

  const signer = wallet.connect(provider);
  const balanceBN = await signer.getBalance();
  const balance = Number(ethers.utils.formatUnits(balanceBN));
  console.log(`DeployToken Wallet balance ${balance}\n`);
  if (balance < 0.01) {
    throw new Error("Not enouth ether");
  }

  const acc1 = wallet1.connect(provider);
  const acc2 = wallet2.connect(provider);

  // DEPLOY MyToken
  console.log("Deploying MyToken\n");
  const ERC20Factory = new MyToken__factory(signer);
  const ERC20Contract = await ERC20Factory.deploy();
  const deploymentTx = await ERC20Contract.deployed();
  const myTokenContractAdrr = deploymentTx.address;
  console.log(
    "Deployed MyToken contract address: " + myTokenContractAdrr + "\n"
  );
  const myTokenContractBlock = await provider.getBlock("latest"); //deploymentTx.deployTransaction.blockNumber as number;
  const myTokenContractBlockNumber = myTokenContractBlock.number;
  console.log("myTokenContractBlock: " + myTokenContractBlockNumber + "\n");

  // CHECK TOTAL SUPPLY, VOTE BALANCE AND TOKEN BALANCE OF ACC1 BEFORE MINTING
  const totalSupplyBefore = await ERC20Contract.totalSupply();
  console.log(
    `The totalSupply of this contract BEFORE minting is ${ethers.utils.formatEther(
      totalSupplyBefore
    )}\n`
  );
  let acc1VotingPower = await ERC20Contract.getVotes(acc1.address);
  console.log(
    `The vote balance of acc1 BEFORE minting is ${ethers.utils.formatEther(
      acc1VotingPower
    )}\n`
  );
  let acc1Balance = await ERC20Contract.balanceOf(acc1.address);
  console.log(
    `The token balance of acc1 BEFORE minting is ${ethers.utils.formatEther(
      acc1Balance
    )}\n`
  );

  // MINTING TOKENS FOR ACC1
  console.log("Minting new tokens for Acc1\n");
  const mintTx = await ERC20Contract.mint(acc1.address, TOKENS_MINTED);
  await mintTx.wait();

  // CHECK TOTAL SUPPLY, VOTE BALANCE AND TOKEN BALANCE OF ACC1 AFTER MINTING
  const totalSupplyAfter = await ERC20Contract.totalSupply();
  console.log(
    `The totalSupply of this contract after minting is ${ethers.utils.formatEther(
      totalSupplyAfter
    )}\n`
  );
  acc1VotingPower = await ERC20Contract.getVotes(acc1.address);
  console.log(
    `The vote balance of acc1 after minting is ${ethers.utils.formatEther(
      acc1VotingPower
    )}\n`
  );
  acc1Balance = await ERC20Contract.balanceOf(acc1.address);
  console.log(
    `The token balance of acc1 after minting is ${ethers.utils.formatEther(
      acc1Balance
    )}\n`
  );

  // SELF-DELEGATION ACC1
  console.log("Delegating from acc1 to acc1?\n");
  const delegateTx = await ERC20Contract.connect(acc1).delegate(acc1.address);
  await delegateTx.wait();
  // CHECK VOTE BALANCE OF ACC1 AFTER SELF-DELEGATION - getVotes
  acc1VotingPower = await ERC20Contract.getVotes(acc1.address);
  console.log(
    `The vote balance of acc1 after self-delegation is ${ethers.utils.formatEther(
      acc1VotingPower
    )}\n`
  );

  //VOTE ACC1
  let currentBlock = await provider.getBlock("latest");
  console.log("the current Blocknumber is " + currentBlock.number + "\n");

  const TokenizedBallot = await DeployTokenizedBallot(
    myTokenContractAdrr,
    currentBlock.number,
    signer
  );

  // CHECK VOTE POWER SPENT - votePowerSpent
  let votePowerSpent = await TokenizedBallot.votePowerSpent(acc1.address);
  console.log(
    "Vote Power Spent of acc1 before voting is: " +
      ethers.utils.formatEther(votePowerSpent) +
      "\n"
  );

  console.log("Voting acc1\n");
  const acc1Vote = await TokenizedBallot.connect(acc1).vote(
    0,
    1,
    2,
    3,
    5,
    TOKENS_VOTE
  );
  await acc1Vote.wait();

  // CHECK VOTE POWER SPENT - votePowerSpent
  votePowerSpent = await TokenizedBallot.votePowerSpent(acc1.address);
  console.log(
    "Vote Power Spent of acc1 after voting is: " +
      ethers.utils.formatEther(votePowerSpent) +
      "\n"
  );

  // CHECK VOTE POWER - votePower
  const votePower = await TokenizedBallot.votePower(acc1.address);
  console.log(
    "Vote Power of acc1 after voting is: " +
      ethers.utils.formatEther(votePower) +
      "\n"
  );

  // CHECK VOTE BALANCE - getVotes
  const acc1VotingBalance = await ERC20Contract.getVotes(acc1.address);
  console.log(
    `The vote balance of acc1 after voting is ${ethers.utils.formatEther(
      acc1VotingBalance
    )}\n`
  );

  // CHECK TOKEN BALANCE - balanceOf
  const acc1BalanceAfterVote = await ERC20Contract.balanceOf(acc1.address);
  console.log(
    `The token balance of acc1 after voting is ${ethers.utils.formatEther(
      acc1BalanceAfterVote
    )}\n`
  );

  // RESULT
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
