"use client";

import { useEffect, useRef, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  User,
  Trophy,
  BookOpen,
  Award,
  Calendar,
  Wallet,
  Edit3,
  Save,
  X,
  LucideLoader,
} from "lucide-react";
import { useAccount, useReadContract } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { FindUserByAddressDto } from "../api/user/[address]/route";
import { EnrollDialog } from "./enrol-dialog";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { campusCreditAbi, campusCreditAddress } from "@/abi/campus-credit";
import { formatUnits } from "viem";

export default function ProfilePage() {
  const { isConnected, address } = useAccount();
  const { data: accountOffChain, isLoading } = useQuery({
    queryKey: ["profile", address, isConnected],
    queryFn: async () => {
      const response = await fetch("/api/user/" + address);
      return response.json() as Promise<FindUserByAddressDto>;
    },
    enabled: isConnected,
  });
  const [userTokens, setUserTokens] = useState(2750);
  const [isEditing, setIsEditing] = useState(false);

  const [userProfile, setUserProfile] = useState({
    username: "CryptoLearner",
    joinDate: "",
    totalCourses: 8,
    completedCourses: 5,
    level: "Advanced Learner",
    nftId: "#1337",
  });

  const completedCourses = [
    {
      id: "1",
      title: "Blockchain Fundamentals",
      completedDate: "2024-10-15",
      score: 95,
      tokensEarned: 500,
    },
    {
      id: "2",
      title: "Smart Contract Development",
      completedDate: "2024-11-20",
      score: 88,
      tokensEarned: 800,
    },
    {
      id: "3",
      title: "DeFi Basics",
      completedDate: "2024-12-05",
      score: 92,
      tokensEarned: 650,
    },
  ];

  const achievements = [
    {
      id: "1",
      title: "First Course Completed",
      description: "Completed your first course",
      icon: "🎓",
      date: "2024-10-15",
    },
    {
      id: "2",
      title: "Quiz Master",
      description: "Scored 90+ on 5 quizzes",
      icon: "🧠",
      date: "2024-11-01",
    },
    {
      id: "3",
      title: "Token Collector",
      description: "Earned 1000+ tokens",
      icon: "💎",
      date: "2024-11-15",
    },
  ];

  const { data: cc } = useReadContract({
    abi: campusCreditAbi,
    address: campusCreditAddress,
    functionName: "balanceOf",
    args: [address || "0x0"],
  });

  const isEnrolled =
    !(!accountOffChain?.success && accountOffChain?.error === "Not Found") && !isLoading;
  return (
    <div className="min-h-screen bg-gray-50">
      <Header isWalletConnected={isConnected} userTokens={userTokens} />

      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
            {isConnected ? (
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="w-24 h-24 bg-gradient-to-br from-[#58CC02] to-[#4E6C50] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {address?.slice(2, 4).toUpperCase()}
                </div>

                <div className="flex-1 text-center md:text-left">
                  {isEnrolled ? (
                    accountOffChain?.success ? (
                      <>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                          {accountOffChain.data.name}
                        </h1>
                        <p className="text-gray-600 mb-4">{accountOffChain.data.description}</p>
                      </>
                    ) : (
                      <>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">CryptoLearner</h1>
                        <p className="text-gray-600 mb-4">Web3 rookie..</p>
                      </>
                    )
                  ) : (
                    <EnrollDialog />
                  )}

                  <p className="text-gray-600 mb-4 flex items-center gap-1">
                    Wallet: <span className="block w-50 truncate">{address}</span> • Joined{" "}
                    {accountOffChain?.success &&
                      new Date(accountOffChain.data.createdAt).toDateString()}
                  </p>
                  {isEnrolled && (
                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                      <div className="bg-[#58CC02] text-white px-4 py-2 rounded-full text-sm font-medium">
                        Rookie
                      </div>
                      <div className="bg-[#FF6F61] text-white px-4 py-2 rounded-full text-sm font-medium">
                        NFT ID:{" "}
                        {accountOffChain?.success && "#" + accountOffChain.data.studentNFTId}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center space-y-4">
                  <div className="text-center">
                    {isEnrolled ? (
                      <div className="text-3xl font-bold text-[#58CC02] mb-1">
                        {formatUnits(cc ?? BigInt(0), 18)}
                      </div>
                    ) : (
                      "ENROLL NOW"
                    )}
                    <div className="text-gray-600 text-sm">Campus Credits</div>
                  </div>

                  <div className="flex items-center space-x-2"></div>
                </div>
              </div>
            ) : (
              <div className="flex justify-between">
                Please Connect Wallet First <ConnectButton />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card text-center">
                  <BookOpen className="w-8 h-8 text-[#58CC02] mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {userProfile.totalCourses}
                  </div>
                  <div className="text-sm text-gray-600">Total Courses</div>
                </div>

                <div className="card text-center">
                  <Award className="w-8 h-8 text-[#FF6F61] mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {userProfile.completedCourses}
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>

                <div className="card text-center">
                  <Trophy className="w-8 h-8 text-[#4E6C50] mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900 mb-1">{achievements.length}</div>
                  <div className="text-sm text-gray-600">Achievements</div>
                </div>

                <div className="card text-center">
                  <Wallet className="w-8 h-8 text-[#58CC02] mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {Math.round((userProfile.completedCourses / userProfile.totalCourses) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Completion</div>
                </div>
              </div>

              <div className="card">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                  <BookOpen className="w-6 h-6 mr-2 text-[#58CC02]" />
                  Completed Courses
                </h2>

                <div className="space-y-4">
                  {completedCourses.map((course) => (
                    <div
                      key={course.id}
                      className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-900">{course.title}</h3>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(course.completedDate).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          <div className="text-sm">
                            Score:{" "}
                            <span className="font-medium text-[#58CC02]">{course.score}%</span>
                          </div>
                          <div className="text-sm">
                            Earned:{" "}
                            <span className="font-medium text-[#FF6F61]">
                              {course.tokensEarned} tokens
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-[#FF6F61]" />
                  Achievements
                </h2>

                <div className="space-y-4">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-sm">{achievement.title}</h3>
                        <p className="text-xs text-gray-600 mb-1">{achievement.description}</p>
                        <div className="text-xs text-gray-500">
                          {new Date(achievement.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-[#4E6C50]" />
                  NFT Certificate
                </h2>

                <div className="bg-gradient-to-br from-[#58CC02] to-[#4E6C50] rounded-lg overflow-hidden text-white text-center">
                  {accountOffChain?.success ? (
                    <NFTCanvas
                      name={(accountOffChain?.success && accountOffChain.data.name) || ""}
                    />
                  ) : (
                    <div className="w-full aspect-square grid place-content-center">
                      <LucideLoader className="animate-spin" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
let image: HTMLImageElement;

if (typeof window !== "undefined") {
  image = new Image();
  image.src = "/cedura-university.png";
}

function NFTCanvas(props: { name: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.beginPath();
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    ctx.closePath();
    ctx.font = "100px Arial";
    ctx.fillStyle = "#e2e3e5";
    ctx.fillRect(897, 946, 200, 77);
    ctx.fillStyle = "black";
    ctx.fillText(props.name, 896, 1024);
  }, [props.name]);
  return <canvas className="w-full h-full" ref={canvasRef} width={2048} height={2048} />;
}
