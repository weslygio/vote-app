"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { NextPage } from "next";
import { isAddress, isAddressEqual, parseEther, zeroAddress } from "viem";
import { PlusCircleIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

const Host: NextPage = () => {
  const [candidates, setCandidates] = useState<string[]>([]);
  const router = useRouter();

  const { writeAsync, isLoading } = useScaffoldContractWrite({
    contractName: "Vote",
    functionName: "host",
    args: [undefined, undefined, undefined, undefined, undefined],
    value: parseEther("0.001"),
    onBlockConfirmation: txnReceipt => {
      console.log("Transaction blockHash", txnReceipt.blockHash);
      router.replace("/");
    },
  });

  const addCandidate = () => {
    const newCandidateInput = document.getElementById("new-candidate") as HTMLInputElement;
    const newCandidate = newCandidateInput.value;
    newCandidateInput.value = "";

    if (!(newCandidate && isAddress(newCandidate) && !isAddressEqual(newCandidate, zeroAddress))) {
      notification.error(
        <>
          <p className="font-bold mt-0 mb-1">Address is invalid</p>
        </>,
      );
      return;
    }

    if (candidates.includes(newCandidate)) {
      notification.error(
        <>
          <p className="font-bold mt-0 mb-1">Address already exists</p>
        </>,
      );
      return;
    }

    setCandidates([...candidates, newCandidate]);
  };

  const deleteCandidate = (index: number) => {
    setCandidates(candidates.filter((_, i) => i !== index));
  };

  const handleHost = () => {
    const title = (document.getElementById("title") as HTMLInputElement).value;
    const startTime = Date.parse((document.getElementById("start-time") as HTMLInputElement).value);
    const endTime = Date.parse((document.getElementById("end-time") as HTMLInputElement).value);
    let voters = (document.getElementById("voters") as HTMLInputElement).value.split(/\r?\n/);

    voters.forEach((voter, i) => {
      voters[i] = voter.trim();
    });

    voters = voters.filter(isAddress);

    if (!(title && startTime && endTime) || candidates.length === 0 || voters.length === 0 || startTime >= endTime) {
      notification.error(
        <>
          <p className="font-bold mt-0 mb-1">Please fill in the fields correctly.</p>
        </>,
      );
      return;
    }

    if (candidates.length < 2) {
      notification.error(
        <>
          <p className="font-bold mt-0 mb-1">At least 2 candidates are required.</p>
        </>,
      );
      return;
    }

    writeAsync({
      args: [title, BigInt(startTime / 1000), BigInt(endTime / 1000), candidates, voters],
    });
  };

  return (
    <>
      <div className="flex flex-col mx-auto py-4">
        <h2 className="text-2xl font-bold">Host a Voting</h2>

        <div className="my-2">
          <label className="mr-2 font-bold">Voting Title</label>
          <input
            id="title"
            type="text"
            placeholder="Title"
            className="input focus:outline-none focus:text-gray-400 border-2 border-base-300 bg-base-200 rounded-full text-accent w-2/3 px-2 text-gray-400"
          />
        </div>

        <div className="flex flex-col md:flex-row my-2">
          <div className="flex-auto mb-2 md:mr-2">
            <label className="mr-2 font-bold">Start Time</label>
            <input
              id="start-time"
              type="datetime-local"
              className="input focus:outline-none focus:text-gray-400 border-2 border-base-300 bg-base-200 rounded-full text-accent w-2/3 px-2 text-gray-400"
            />
          </div>
          <div className="flex-auto mb-2 md:ml-2">
            <label className="mr-2 font-bold">End Time</label>
            <input
              id="end-time"
              type="datetime-local"
              className="input focus:outline-none focus:text-gray-400 border-2 border-base-300 bg-base-200 rounded-full text-accent w-2/3 px-2 text-gray-400"
            />
          </div>
        </div>

        <div className="flex flex-col mb-4 mr-auto">
          <label className="text-lg font-bold mb-1">Candidates</label>
          <table>
            <tbody>
              {candidates.map((candidate, index) => {
                return (
                  <tr key={index}>
                    <td>
                      <div className="flex flex-row border-2 border-base-300 rounded-full my-0.5 px-4 py-0.5">
                        <div className="flex-none w-1/12 text-right pr-1">
                          <label className="font-bold">{index + 1}</label>
                        </div>
                        <span className="ml-4 mr-2">
                          <Address address={candidate} format="long" />
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className="mx-1 my-0.5 px-2 py-0.5">
                        <button>
                          <TrashIcon
                            className="text-red-500 block-inline h-6 w-6"
                            onClick={() => deleteCandidate(index)}
                          />
                        </button>
                      </span>
                    </td>
                  </tr>
                );
              })}

              <tr>
                <td>
                  <div className="flex flex-row border-2 border-base-300 rounded-full my-0.5 px-4 py-0.5">
                    <div className="flex-none w-1/12 text-right pr-1 mr-7">
                      <label className="font-bold">New</label>
                    </div>
                    <span className="ml-4 mr-2 w-96">
                      <input
                        id="new-candidate"
                        type="text"
                        placeholder="0x..."
                        className="focus:outline-none focus:text-gray-400 border-b-2 border-secondary bg-base-200 text-accent w-full px-1 text-gray-400"
                      />
                    </span>
                  </div>
                </td>

                <td>
                  <span className="mx-1 my-0.5 px-2 py-0.5">
                    <button>
                      <PlusCircleIcon className="stroke-accent block-inline h-6 w-6" onClick={() => addCandidate()} />
                    </button>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mb-6">
          <label className="text-lg font-bold mb-1">Allowed Voters</label>
          <textarea
            id="voters"
            placeholder="0x..."
            className="px-2 py-1 mx-2 w-5/6 h-48 input focus:outline-none focus:text-gray-400 border-2 border-base-300 bg-base-200 rounded-lg text-accent w-2/3 px-2 text-gray-400"
          />
        </div>

        <div className="flex justify-center my-2">
          <label>Price: 0.001 ETH</label>
        </div>

        <div className="flex justify-center">
          <button
            className="border-2 border-base-300 rounded-full py-1.5 px-3 w-2/3 hover:bg-secondary hover:shadow-md"
            onClick={handleHost}
          >
            {isLoading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <span className="text-lg">Host</span>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default Host;
