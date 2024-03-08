"use client";

import { useEffect, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Address as AddressType, getAddress, isAddress } from "viem";
import { useEnsAvatar, useEnsName } from "wagmi";
import { CheckCircleIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import { BlockieAvatar } from "~~/components/scaffold-eth";

type CandidateProps = {
  address?: AddressType;
  format?: "short" | "long";
  value?: number;
};

export const Candidate = ({ address, format, value }: CandidateProps) => {
  const [ens, setEns] = useState<string | null>();
  const [ensAvatar, setEnsAvatar] = useState<string | null>();
  const [addressCopied, setAddressCopied] = useState(false);
  const checkSumAddress = address ? getAddress(address) : undefined;

  const { data: fetchedEns } = useEnsName({
    address: checkSumAddress,
    enabled: isAddress(checkSumAddress ?? ""),
    chainId: 1,
  });
  const { data: fetchedEnsAvatar } = useEnsAvatar({
    name: fetchedEns,
    enabled: Boolean(fetchedEns),
    chainId: 1,
    cacheTime: 30_000,
  });

  useEffect(() => {
    setEns(fetchedEns);
  }, [fetchedEns]);

  useEffect(() => {
    setEnsAvatar(fetchedEnsAvatar);
  }, [fetchedEnsAvatar]);

  // Skeleton UI
  if (!checkSumAddress) {
    return (
      <div className="animate-pulse flex space-x-4">
        <div className="rounded-md bg-slate-300 h-6 w-6"></div>
        <div className="flex items-center space-y-6">
          <div className="h-2 w-28 bg-slate-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (!isAddress(checkSumAddress)) {
    return <span className="text-error">Wrong address</span>;
  }

  let displayAddress = checkSumAddress?.slice(0, 6) + "..." + checkSumAddress?.slice(-4);

  if (ens) {
    displayAddress = ens;
  } else if (format === "long") {
    displayAddress = checkSumAddress;
  }

  return (
    <div className="flex flex-col items-center my-2">
      <div className="flex-shrink-0 mt-2">
        <BlockieAvatar address={checkSumAddress} ensImage={ensAvatar} size={72} />
      </div>

      <div className="flex mt-3">
        <span className={`ml-1.5 text-base font-normal`}>{displayAddress}</span>

        {addressCopied ? (
          <CheckCircleIcon
            className="ml-1.5 text-xl font-normal text-sky-600 h-5 w-5 cursor-pointer"
            aria-hidden="true"
          />
        ) : (
          <CopyToClipboard
            text={checkSumAddress}
            onCopy={() => {
              setAddressCopied(true);
              setTimeout(() => {
                setAddressCopied(false);
              }, 800);
            }}
          >
            <DocumentDuplicateIcon
              className="ml-1.5 text-xl font-normal text-sky-600 h-5 w-5 cursor-pointer"
              aria-hidden="true"
            />
          </CopyToClipboard>
        )}
      </div>

      {value !== undefined && (
        <div className="flex">
          <span className="text-base">{value} votes</span>
        </div>
      )}
    </div>
  );
};
