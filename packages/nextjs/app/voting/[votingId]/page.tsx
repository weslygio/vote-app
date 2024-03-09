"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { Candidate } from "./_components/Candidate";
import { NextPage } from "next";
import { useAccount } from "wagmi";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

type PageProps = {
  params: { votingId: string };
};

const VotingPage: NextPage<PageProps> = ({ params }: PageProps) => {
  const [selectedCandidate, setSelectedCandidate] = useState<string>("");
  const [status, setStatus] = useState<"current" | "upcoming" | "past" | undefined>(undefined);
  const [winners, setWinners] = useState<string[]>([]);

  const { address } = useAccount();

  const {
    data: voting,
    isSuccess,
    isError,
  } = useScaffoldContractRead({
    contractName: "Vote",
    functionName: "getVoting",
    args: [BigInt(Number(params?.votingId) - 1)],
  });

  const { data: candidateVotes } = useScaffoldContractRead({
    contractName: "Vote",
    functionName: "getCandidateVotes",
    args: [BigInt(Number(params?.votingId) - 1)],
  });

  const { data: canVote } = useScaffoldContractRead({
    contractName: "Vote",
    functionName: "canVote",
    args: [BigInt(Number(params?.votingId) - 1), address],
  });

  const { writeAsync, isLoading } = useScaffoldContractWrite({
    contractName: "Vote",
    functionName: "vote",
    args: [BigInt(Number(params?.votingId) - 1), undefined],
  });

  const handleVote = () => {
    writeAsync({
      args: [BigInt(Number(params?.votingId) - 1), selectedCandidate],
    });
  };

  useEffect(() => {
    if (!voting) {
      return;
    }

    const now = Date.now() / 1000;
    if (now < Number(voting.startTime)) {
      setStatus("upcoming");
    } else if (now >= Number(voting.endTime)) {
      setStatus("past");
    } else {
      setStatus("current");
    }
  }, [voting]);

  useEffect(() => {
    if (candidateVotes && status === "past") {
      let winners = [candidateVotes[0].candidate];
      let maxVote = candidateVotes[0].voteCount;

      for (let i = 1; i < candidateVotes.length; i++) {
        if (candidateVotes[i].voteCount > maxVote) {
          winners = [candidateVotes[i].candidate];
          maxVote = candidateVotes[i].voteCount;
        } else if (candidateVotes[i].voteCount === maxVote) {
          winners.push(candidateVotes[i].candidate);
        }
      }

      setWinners(winners);
    }
  }, [candidateVotes, status]);

  useEffect(() => {
    if (isError) {
      notFound();
    }
  }, [isError]);

  return (
    isSuccess && (
      <>
        <div className="flex flex-col items-center justify-center py-2 mx-auto">
          <div className="flex flex-col items-center justify-center my-4">
            <label className="text-xl font-bold my-2">{voting?.title}</label>
            <label className="text-base my-1">
              Start Time: {voting && new Date(Number(voting?.startTime) * 1000).toLocaleString()}
            </label>
            <label className="text-base my-1">
              End Time: {voting && new Date(Number(voting?.endTime) * 1000).toLocaleString()}
            </label>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4 my-4">
            {candidateVotes?.map(candidateVote => (
              <div
                key={candidateVote.candidate}
                className={`flex flex-col items-center justify-center relative ${
                  status === "past" ? "h-40" : "h-36"
                } w-auto p-4 border-2 border-base-300 rounded ${
                  status === "current" && canVote && "cursor-pointer hover:bg-base-300 hover:shadow-md"
                }`}
                onClick={() => canVote && setSelectedCandidate(candidateVote.candidate)}
              >
                <div className="absolute top-2 right-2">
                  {status === "current" && selectedCandidate === candidateVote.candidate && (
                    <CheckCircleIcon className="stroke-accent h-6 w-6" />
                  )}
                </div>
                <div>
                  <Candidate
                    address={candidateVote.candidate}
                    format="short"
                    value={status === "past" ? Number(candidateVote.voteCount) : undefined}
                    winner={status === "past" ? winners.includes(candidateVote.candidate) : undefined}
                  />
                </div>
              </div>
            ))}
          </div>

          {status === "current" && canVote && (
            <div className="flex justify-center w-full mt-4">
              <button
                className="border-2 border-base-300 rounded-full w-2/3 py-1.5 px-3 hover:bg-secondary hover:shadow-md"
                onClick={handleVote}
              >
                {isLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <span className="text-lg">Vote</span>
                )}
              </button>
            </div>
          )}
        </div>
      </>
    )
  );
};

export default VotingPage;
