"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { QuizCard } from "@/components/quiz/QuizCard";
import { RewardModal } from "@/components/quiz/RewardModal";
import { Brain, Trophy, Clock, Target, Award } from "lucide-react";
import { useAccount, useWriteContract } from "wagmi";
import { addCreditForStudent } from "@/actions/quiz/add-credit.action";

const AVAILABLE_QUIZZES = [
  {
    id: "1",
    title: "Blockchain Basics Quiz",
    description: "Test your knowledge of fundamental blockchain concepts",
    questions: 10,
    duration: 15,
    difficulty: "Beginner",
    reward: 5,
    badge: "Blockchain Novice",
    category: "Fundamentals",
    attempts: 2543,
    successRate: 78,
  },
  {
    id: "2",
    title: "Smart Contracts Advanced",
    description: "Advanced concepts in smart contract development",
    questions: 15,
    duration: 25,
    difficulty: "Advanced",
    reward: 500,
    badge: "Smart Contract Expert",
    category: "Development",
    attempts: 892,
    successRate: 65,
  },
  {
    id: "3",
    title: "DeFi Protocols Quiz",
    description: "Understanding decentralized finance protocols",
    questions: 12,
    duration: 20,
    difficulty: "Intermediate",
    reward: 350,
    badge: "DeFi Specialist",
    category: "Finance",
    attempts: 1456,
    successRate: 71,
  },
];

export default function QuizPage() {
  const { address: userAddress, isConnected } = useAccount();
  const [userTokens, setUserTokens] = useState(1750);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [quizReward, setQuizReward] = useState({ tokens: 0, badge: "" });
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { writeContractAsync } = useWriteContract();

  const handleQuizComplete = async (reward: { tokens: number; badge: string }) => {
    setQuizReward(reward);
    setUserTokens((prev) => prev + reward.tokens);
    setShowRewardModal(true);
    setStatus("Sending transaction...");

    try {
      const result = await addCreditForStudent({
        userAddress: userAddress as `0x${string}`,
        amount: reward.tokens,
      });
    } catch (error: any) {
      console.error("Failed to add reward:", error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isWalletConnected={isConnected} />

      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-[#58CC02] rounded-full flex items-center justify-center">
                <Brain className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Knowledge Quiz Center</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Test your blockchain knowledge and earn rewards! Complete quizzes to gain tokens and
              unlock achievement badges.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="card text-center">
              <Target className="w-8 h-8 text-[#58CC02] mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 mb-1">24</div>
              <div className="text-sm text-gray-600">Available Quizzes</div>
            </div>

            <div className="card text-center">
              <Trophy className="w-8 h-8 text-[#FF6F61] mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 mb-1">12</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>

            <div className="card text-center">
              <Award className="w-8 h-8 text-[#4E6C50] mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 mb-1">8</div>
              <div className="text-sm text-gray-600">Badges Earned</div>
            </div>

            <div className="card text-center">
              <Clock className="w-8 h-8 text-[#58CC02] mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 mb-1">85%</div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
          </div>

          <div className="card mb-12 p-8 bg-gradient-to-r from-[#58CC02] to-[#4E6C50] text-white">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0 text-center md:text-left">
                <h2 className="text-2xl text-white font-bold mb-2">Weekly Challenge</h2>
                <p className="text-green-100 mb-4">
                  Complete this week's featured quiz for bonus rewards!
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm">
                  <span className="bg-white/20 px-3 py-1 rounded-full">20 Questions</span>
                  <span className="bg-white/20 px-3 py-1 rounded-full">30 Minutes</span>
                  <span className="bg-white/20 px-3 py-1 rounded-full">1000 Token Reward</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">🏆</div>
                <button className="cursor-pointer bg-white text-[#58CC02] font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors">
                  Take Challenge
                </button>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Quizzes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {AVAILABLE_QUIZZES.map((quiz) => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  isWalletConnected={isConnected}
                  onComplete={handleQuizComplete}
                />
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              How Quiz Rewards Work
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#58CC02] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold">1</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Choose Quiz</h3>
                <p className="text-gray-600 text-sm">
                  Select a quiz that matches your skill level and interests
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-[#FF6F61] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold">2</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Complete Quiz</h3>
                <p className="text-gray-600 text-sm">
                  Answer questions within the time limit to test your knowledge
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-[#4E6C50] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold">3</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Earn Rewards</h3>
                <p className="text-gray-600 text-sm">
                  Get tokens and badges based on your performance
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {showRewardModal && <RewardModal tokens={quizReward.tokens} badge={quizReward.badge} />}
    </div>
  );
}
