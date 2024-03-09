"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { ArrowRightCircleIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";

type Voting = {
  id: number;
  title: string;
  hoster: string;
  startTime: Date;
  endTime: Date;
};

const Home: NextPage = () => {
  const [votingList, setVotingList] = useState<{ current: Voting[]; upcoming: Voting[]; past: Voting[] }>({
    current: [],
    upcoming: [],
    past: [],
  });
  const [activeTab, setActiveTab] = useState<"current" | "upcoming" | "past">("current");

  const { data: rawVotingList } = useScaffoldContractRead({
    contractName: "Vote",
    functionName: "getVotingList",
  });

  useEffect(() => {
    if (!rawVotingList || rawVotingList.length === 0) {
      return;
    }

    const now = Date.now();
    const currentVotingList: Voting[] = [];
    const upcomingVotingList: Voting[] = [];
    const pastVotingList: Voting[] = [];

    rawVotingList.forEach((voting: any) => {
      const newVoting = {
        id: Number(voting.id),
        title: voting.title,
        hoster: voting.hoster,
        startTime: new Date(Number(voting.startTime) * 1000),
        endTime: new Date(Number(voting.endTime) * 1000),
      };

      if (newVoting.startTime.getTime() > now) {
        upcomingVotingList.push(newVoting);
      } else if (newVoting.endTime.getTime() <= now) {
        pastVotingList.push(newVoting);
      } else {
        currentVotingList.push(newVoting);
      }
    });

    setVotingList({
      current: currentVotingList,
      upcoming: upcomingVotingList,
      past: pastVotingList,
    });
  }, [rawVotingList]);

  return (
    <>
      <div className="flex items-center flex-col flex-grow my-10">
        <div className="flex flex-row items-center h-12 w-1/2 mb-4 py-2 border-b-2">
          <button
            className={`rounded-full justify-center w-full h-full hover:bg-base-300 hover:shadow-md mx-2 ${
              activeTab === "current" && "bg-base-300 shadow-md"
            }`}
            onClick={() => setActiveTab("current")}
          >
            Current Voting
          </button>
          <button
            className={`rounded-full justify-center w-full h-full hover:bg-base-300 hover:shadow-md mx-2 ${
              activeTab === "upcoming" && "bg-base-300 shadow-md"
            }`}
            onClick={() => setActiveTab("upcoming")}
          >
            Upcoming Voting
          </button>
          <button
            className={`rounded-full justify-center w-full h-full hover:bg-base-300 hover:shadow-md mx-2 ${
              activeTab === "past" && "bg-base-300 shadow-md"
            }`}
            onClick={() => setActiveTab("past")}
          >
            Past Voting
          </button>
        </div>

        <div className="flex-auto w-2/3">
          <table className="table-auto w-full border-separate border-spacing-x-4 border-spacing-y-3">
            <thead>
              <tr>
                <th>Title</th>
                <th>Hoster</th>
                <th>Start</th>
                <th>End</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {votingList[activeTab] &&
                votingList[activeTab].map(voting => (
                  <tr key={voting.id}>
                    <td>{voting.title}</td>
                    <td>
                      <Address address={voting.hoster} format="short"></Address>
                    </td>
                    <td className="text-center">
                      <label className="w-full">{voting.startTime.toLocaleString()}</label>
                    </td>
                    <td className="text-center">
                      <label className="w-full">{voting.endTime.toLocaleString()}</label>
                    </td>
                    <td>
                      <Link href={`/voting/${voting.id}`} passHref>
                        <ArrowRightCircleIcon className="stroke-accent h-6 w-6" />
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Home;
