// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

interface ITokenizedVotes {
    function getPastVotes(address, uint256) external view returns(uint256);
}

contract TokenizedBallot {
    uint256 public referenceBlock;
    ITokenizedVotes public tokenContract;

    struct Proposal {
        bytes32 name;
        int256 voteCount;
    }

    Proposal[] public proposals;
    mapping(address => uint256) public votePowerSpent;

    constructor(
        bytes32[] memory proposalNames, 
        address _tokenContract, 
        uint256 _referenceBlock
        ){
        
        for(uint256 i=0; i < proposalNames.length; i++){
            proposals.push(Proposal({voteCount: 0, name: proposalNames[i]}));
        }
        tokenContract = ITokenizedVotes(_tokenContract);
        referenceBlock = _referenceBlock;
    }

    function vote(uint256 proposal1, uint256 proposal2, uint256 proposal3, uint256 proposal4, uint256 proposal5, uint256 amount) public {
        uint256 votePower_ = votePower(msg.sender);
        require(votePower_ >= amount, 
        "TokenizedBallot: trying to vote more than the vote power available for the account"
        );
        require(amount > 0, 
        "TokenizedBallot: trying to vote with amount zero"
        );
        votePowerSpent[msg.sender] +=amount;
        proposals[proposal1].voteCount += 3*int256(amount);
        proposals[proposal2].voteCount += 2*int256(amount);
        proposals[proposal3].voteCount += 1*int256(amount);
        proposals[proposal4].voteCount -= 1*int256(amount);
        proposals[proposal5].voteCount -= 2*int256(amount); 
    }

    function votePower(address account) public view returns(uint256 votePower_){
        votePower_ = tokenContract.getPastVotes(account, referenceBlock);
    }

    function winningProposal() public view returns (int256 winningProposal_){
        int256 winningVoteCount = 0;
        for(uint256 p=0; p < proposals.length; p++){
            if(proposals[p].voteCount > winningVoteCount){
                winningVoteCount = proposals[p].voteCount;
                winningProposal_ = int(p);
            }
        }
    }

    function winningProp() public view returns (int256[] memory){
        int256[] memory data = new int256[](3);
        int256 length = int(proposals.length);
        int256 winningVoteCount = -100;
        int256 winningProposal1 = 0;
        int256 winningProposal2 = 0;
        int256 winningProposal3 = 0;
        for(int256 p=0; p < length; p++){
            if(proposals[uint256(p)].voteCount > winningVoteCount){
                winningVoteCount = proposals[uint256(p)].voteCount;
                winningProposal1 = p;
            }
        }
        winningVoteCount = -100;
        for(int256 i=0; i < length; i++){ 
            if(i != winningProposal1){
                if(proposals[uint256(i)].voteCount > winningVoteCount){
                winningVoteCount = proposals[uint256(i)].voteCount;
                winningProposal2 = i;
            }
            }
        }
        winningVoteCount = -100;
        for(int256 i=0; i < length; i++){ 
         if(i != winningProposal1 && i != winningProposal2){
            if(proposals[uint256(i)].voteCount > winningVoteCount){
                winningVoteCount = proposals[uint256(i)].voteCount;
                winningProposal3 = i;
         }
         }
        }

        data[0] = winningProposal1;
        data[1] = winningProposal2;
        data[2] = winningProposal3;

        return data;
    }

}