"use client";

import { Play, BookOpen, Users, Trophy } from "lucide-react";
import Counter from "../ui/couter";
import { useEffect, useState } from "react";
import Sparkles from "../ui/sparkle";
import { StartLearningButton } from "../button/start-learning";

export function HeroSection() {
  const [count, setCount] = useState({
    courses: 0,
    students: 0,
    rewards: 0,
  });

  useEffect(() => {
    setCount({
      courses: 50,
      students: 10,
      rewards: 500,
    });
  }, []);
  return (
    <section className="relative bg-gradient-to-br from-white via-green-50 to-blue-50 pt-20 pb-32 overflow-hidden min-h-[calc(100vh-64px)]">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Learn{" "}
              <Sparkles>
                <span className="text-gradient">Blockchain</span>
              </Sparkles>
              <br />
              Earn <span className="text-gradient">Rewards</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Master Web3 technologies with our interactive courses, earn crypto
              rewards, and build your blockchain expertise with hands-on
              projects and real-world applications.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <StartLearningButton />
              <button className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:border-[#58CC02] hover:text-[#58CC02] transition-all duration-200">
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </button>
            </div>

            <div className="grid grid-cols-3 gap-8">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-[#58CC02] rounded-lg mb-3 mx-auto">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  <Counter
                    value={count.courses}
                    places={[10, 1]}
                    gradientFrom="transaprent"
                    gradientTo="transparent"
                    textColor="#101828"
                    fontSize={24}
                    gap={0}
                    rightContent={"+"}
                  />
                </div>
                <div className="text-sm text-gray-600">Courses</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-[#FF6F61] rounded-lg mb-3 mx-auto">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  <Counter
                    value={count.students}
                    places={[10, 1]}
                    gradientFrom="transaprent"
                    gradientTo="transparent"
                    textColor="#101828"
                    fontSize={24}
                    gap={0}
                    rightContent={"K+"}
                  />
                </div>
                <div className="text-sm text-gray-600">Students</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-[#4E6C50] rounded-lg mb-3 mx-auto">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  <Counter
                    value={count.rewards}
                    places={[100, 10, 1]}
                    gradientFrom="transaprent"
                    gradientTo="transparent"
                    textColor="#101828"
                    fontSize={24}
                    gap={0}
                    rightContent={"K+"}
                  />
                </div>
                <div className="text-sm text-gray-600">Rewards</div>
              </div>
            </div>
          </div>

          <div className="animate-slide-up">
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#58CC02] rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        Smart Contracts 101
                      </div>
                      <div className="text-sm text-gray-500">
                        8 weeks • Intermediate
                      </div>
                    </div>
                  </div>

                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: "75%" }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Progress: 75%</span>
                    <div className="flex items-center bg-[#58CC02] text-white px-3 py-1 rounded-full text-sm">
                      <Trophy className="w-3 h-3 mr-1" />
                      +50 Credits
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 bg-[#FF6F61] text-white p-3 rounded-lg shadow-lg animate-bounce">
                <Trophy className="w-6 h-6" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-[#4E6C50] text-white p-3 rounded-lg shadow-lg">
                <span className="font-bold">+1000 XP</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
