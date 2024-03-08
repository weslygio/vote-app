//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Vote is Ownable {
    Voting[] public votingList;
    VotingData[] public votingDataList;

    struct Voting {
        address hoster;
        uint256 id;
        uint256 startTime;
        uint256 endTime;
        string title;
    }

    struct VotingData {
        uint256 id;
        address[] candidates;
        mapping(address => VoterStatus) status;
        mapping(address => uint256) voteCount;
    }

    struct CandidateVote {
        address candidate;
        uint256 voteCount;
    }

    enum VoterStatus {
        NotAllowed,
        NotVoted,
        Voted
    }
    
    function host(
        string calldata title,
        uint256 startTime,
        uint256 endTime,
        address[] calldata candidates,
        address[] calldata allowedVoters
    ) public payable {
        require(msg.value >= 0.001 ether, "Hosting price is 0.001 ether");

        votingList.push();
        votingDataList.push();
        uint256 idx = votingList.length - 1;
        Voting storage v = votingList[idx];
        VotingData storage vd = votingDataList[idx];

        v.id = idx + 1;
        vd.id = idx + 1;
        v.hoster = msg.sender;
        v.title = title;
        v.startTime = startTime;
        v.endTime = endTime;
        vd.candidates = candidates;

        for (uint256 i = 0; i < allowedVoters.length; i++) {
            vd.status[allowedVoters[i]] = VoterStatus.NotVoted;
        }
    }

    function vote(uint256 voteNo, address voted) public {
        Voting storage v = votingList[voteNo];
        VotingData storage vd = votingDataList[voteNo];

        require(isCandidate(voteNo, voted), "The voted is not candidate");
        require(v.startTime <= block.timestamp, "The voting has not been open");
        require(block.timestamp < v.endTime, "The voting has been closed");
        
        if (vd.status[msg.sender] == VoterStatus.NotAllowed) {
            revert("You are not allowed to vote");
        }

        if (vd.status[msg.sender] == VoterStatus.Voted) {
            revert("You have voted");
        }

        vd.status[msg.sender] = VoterStatus.Voted;
        vd.voteCount[voted] += 1;
    }

    function getVoteCount(uint256 voteNo, address candidate) public view returns (uint256) {
        return votingDataList[voteNo].voteCount[candidate];
    }

    function isCandidate(uint256 voteNo, address candidate) internal view returns (bool) {
        address[] memory candidates = votingDataList[voteNo].candidates;

        for (uint256 i = 0; i < candidates.length; i++) {
            if (candidate == candidates[i]) {
                return true;
            }
        }

        return false;
    }
    
    function withdraw() public onlyOwner {
        (bool success, ) = owner().call{ value: address(this).balance }("");
        require(success, "Failed to send Ether");
    }

    receive() external payable {}

    function getVotingList() public view returns (Voting[] memory) {
        return votingList;
    }

    function getVoting(uint256 voteNo) public view returns (Voting memory) {
        return votingList[voteNo];
    }

    function getCandidates(uint256 voteNo) public view returns (address[] memory) {
        return votingDataList[voteNo].candidates;
    }

    function getCandidateVotes(uint256 voteNo) public view returns (CandidateVote[] memory) {
        address[] memory candidates = this.getCandidates(voteNo);
        CandidateVote[] memory votes = new CandidateVote[](candidates.length);
        
        for (uint256 i = 0; i < candidates.length; i++) {
            votes[i] = CandidateVote({
                candidate: candidates[i],
                voteCount: getVoteCount(voteNo, candidates[i])
            });
        }

        return votes;
    }

    function canVote(uint256 voteNo) public view returns (bool) {
        return votingDataList[voteNo].status[msg.sender] == VoterStatus.NotVoted;
    }
}