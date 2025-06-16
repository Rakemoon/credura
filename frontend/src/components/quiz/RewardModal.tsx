"use client";

import {
  claimBadgeWithCertificate,
  claimCreditForStudent,
  createCertificateType,
} from "@/actions/quiz/claim-credit.action";
import { toast } from "@/hooks/use-toast";
import { X, Trophy, Coins } from "lucide-react";
import { useState } from "react";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";

interface RewardModalProps {
  tokens: number;
  badge: string;
}

export function RewardModal({ tokens, badge }: RewardModalProps) {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const { address: userAddress, isConnected } = useAccount();
  const { data: accountOffChain } = useQuery({
    queryKey: ["profile", userAddress, isConnected],
    queryFn: async () => {
      const response = await fetch("/api/user/" + userAddress);
      return response.json();
    },
    enabled: isConnected,
  });
  const [isLoadingToken, setIsloadingToken] = useState(false);
  const [isLoadingNFT, setIsLoadingNFT] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [tokenTxHash, setTokenTxHash] = useState<string | null>(null);

  const claimToken = async () => {
    setIsloadingToken(true);

    try {
      const result = await claimCreditForStudent({
        userAddress: userAddress as `0x${string}`,
      });

      if (result.error) {
        toast({
          title: "Token Claim Failed",
          description: result.details || "An error occurred while claiming tokens.",
        });
      } else {
        let description = "You have successfully claimed your tokens.";
        if (result.transactionHash) {
          setTokenTxHash(result.transactionHash);
          description += ` | `;
        }
        toast({
          title: "Tokens Claimed!",
          description: (
            <span>
              {description}
              {result.transactionHash && (
                <>
                  <br />
                  <a
                    href={`https://testnet.monadexplorer.com/tx/${result.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-600"
                  >
                    View on Monad Explorer
                  </a>
                </>
              )}
            </span>
          ),
        });
      }

      console.log(result);
    } catch (error: any) {
      console.error("Failed to add reward:", error);
      toast({
        title: "Token Claim Error",
        description: error.message,
      });
    } finally {
      setIsloadingToken(false);
    }
  };

  const claimBadge = async () => {
    setIsLoadingNFT(true);

    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to claim the badge.",
      });
      return;
    }

    const createResult = await createCertificateType({
      name: `${badge} Certificate`,
      maxSupply: BigInt(1000), // Reasonable max supply
      uriCertificate: "ipfs://pending",
    });

    try {
      const result = await claimBadgeWithCertificate({
        userAddress: userAddress as `0x${string}`,
        name: accountOffChain?.data?.name || "",
        tokenId: BigInt(createResult.tokenId!),
        course: badge,
        date: new Date().toISOString(),
      });

      if (result && typeof result === "object" && "tokenId" in result) {
        const tokenIdStr =
          typeof result.tokenId === "bigint" ? result.tokenId.toString() : String(result.tokenId);
        let description = `Badge claimed successfully! NFT: #${tokenIdStr}`;
        if (result.transactionHash) {
          setTxHash(result.transactionHash);
          description += ` | `;
        }
        toast({
          title: "Badge Claimed!",
          description: (
            <span>
              {description}
              {result.transactionHash && (
                <>
                  <br />
                  <a
                    href={`https://testnet.monadexplorer.com/tx/${result.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-600"
                  >
                    View on Monad Explorer
                  </a>
                </>
              )}
            </span>
          ),
        });
      } else if (typeof result === "string") {
        toast({
          title: "Badge Claim Error",
          description: result,
        });
      } else {
        toast({
          title: "Badge Claim Error",
          description: "Unknown error occurred while claiming badge.",
        });
      }
    } catch (error: any) {
      console.error("Failed to claim badge:", error);
      toast({
        title: "Badge Claim Error",
        description: error.message,
      });
    } finally {
      setIsLoadingNFT(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center animate-slide-up">
        <button
          onClick={handleCloseModal}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-[#58CC02] to-[#4E6C50] rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Congratulations! 🎉</h2>
          <p className="text-gray-600">You've successfully completed the quiz!</p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-[#FFFFFF] bg-opacity-10 rounded-lg p-4">
            <div className="flex items-center justify-center mb-2">
              <Coins className="w-6 h-6 text-[#58CC02] mr-2" />
              <span className="text-2xl font-bold text-[#58CC02]">+{tokens}</span>
            </div>
            <div className="space-y-2">
              <button
                disabled={isLoadingToken}
                className="w-full btn-primary disabled:opacity-50 cursor-pointer"
                onClick={() => claimToken()}
              >
                {isLoadingToken ? "Claiming..." : "Claim Credits"}
              </button>
              {status && <p className="text-sm text-gray-600">{status}</p>}
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#FF6F61] to-[#4E6C50] rounded-lg p-4 text-white">
            <div className="text-2xl mb-2">🏆</div>
            <div className="font-semibold">{badge}</div>
            <div className="text-sm opacity-90">Achievement Badge</div>
            <div className="mt-3">
              <button
                disabled={isLoadingNFT}
                className="cursor-pointer w-full bg-white text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-100 disabled:opacity-50"
                onClick={claimBadge}
              >
                {isLoadingNFT ? "Claiming..." : "Claim Badge & Certificate"}
              </button>
            </div>
          </div>
        </div>

        <button onClick={handleCloseModal} className="w-full btn-primary cursor-pointer">
          Continue Learning
        </button>
      </div>
    </div>
  );
}
