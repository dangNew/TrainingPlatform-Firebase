import React from 'react';
import Sidebar from '../components/LSidebar';
import styled from 'styled-components';


const MainContent = styled.div`
  flex: 1;
  padding: 2rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  margin-left: 10px; `
;

const UserDashboard = () => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <MainContent>

        {/* Progress Overview */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Progress Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Course Progress */}
            <div className="group relative flex w-full flex-col rounded-xl bg-slate-950 p-4 shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-indigo-500/20">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-sm transition-opacity duration-300 group-hover:opacity-30"></div>
              <div className="absolute inset-px rounded-[11px] bg-slate-950"></div>
              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
                      <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                      </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-white">Course Progress</h3>
                  </div>
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    Live
                  </span>
                </div>
                <div className="mb-4">
                  <span className="text-gray-300">Course 1:</span>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div className="bg-blue-600 h-3 rounded-full" style={{ width: '70%' }}></div>
                  </div>
                </div>
                <div>
                  <span className="text-gray-300">Course 2:</span>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div className="bg-blue-600 h-3 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Overall Progress */}
            <div className="group relative flex w-full flex-col rounded-xl bg-slate-950 p-4 shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-indigo-500/20">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-sm transition-opacity duration-300 group-hover:opacity-30"></div>
              <div className="absolute inset-px rounded-[11px] bg-slate-950"></div>
              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
                      <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                      </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-white">Overall Progress</h3>
                  </div>
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    Live
                  </span>
                </div>
                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-slate-900/50 p-3">
                    <p className="text-xs font-medium text-slate-400">Total Hours</p>
                    <p className="text-lg font-semibold text-white">50 hours</p>
                  </div>
                  <div className="rounded-lg bg-slate-900/50 p-3">
                    <p className="text-xs font-medium text-slate-400">Completion</p>
                    <p className="text-lg font-semibold text-white">65%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="group relative flex w-full flex-col rounded-xl bg-slate-950 p-4 shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-indigo-500/20">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-sm transition-opacity duration-300 group-hover:opacity-30"></div>
              <div className="absolute inset-px rounded-[11px] bg-slate-950"></div>
              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
                      <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                      </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-white">Quick Stats</h3>
                  </div>
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    Live
                  </span>
                </div>
                <div className="mb-4 grid grid-cols-3 gap-4">
                  <div className="rounded-lg bg-slate-900/50 p-3 text-center">
                    <p className="text-xs font-medium text-slate-400">Total Courses</p>
                    <p className="text-lg font-semibold text-white">5</p>
                  </div>
                  <div className="rounded-lg bg-slate-900/50 p-3 text-center">
                    <p className="text-xs font-medium text-slate-400">Average Scores</p>
                    <p className="text-lg font-semibold text-white">85%</p>
                  </div>
                  <div className="rounded-lg bg-slate-900/50 p-3 text-center">
                    <p className="text-xs font-medium text-slate-400">Time Spent</p>
                    <p className="text-lg font-semibold text-white">50 hours</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="mb-8">
          <div className="p-4 w-full rounded-lg border dark:border-gray-800 bg-white transition-all duration-300 hover:scale-[1.02] hover:shadow-black-500/20">
            <h1 className="text-2xl font-bold">History</h1>
            <div className="grid gap-4 mt-2">
              <div className="flex gap-2 items-center">
                <div className="bg-red-500 w-20 h-10 rounded"></div>
                <div className="grid gap-1 text-sm flex-1">
                  <h2 className="font-semibold leading-none line-clamp-2">
                    Completed Lesson: Introduction to React
                  </h2>
                  <div className="text-xs text-gray-500 line-clamp-1 dark:text-gray-400">
                    1.2M views
                  </div>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <div className="bg-yellow-500 w-20 h-10 rounded"></div>
                <div className="grid gap-1 text-sm flex-1">
                  <h2 className="font-semibold leading-none line-clamp-2">
                    Submitted Assignment: JavaScript Basics (Score: 90%)
                  </h2>
                  <div className="text-xs text-gray-500 line-clamp-1 dark:text-gray-400">
                    21K views
                  </div>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <div className="bg-blue-500 w-20 h-10 rounded"></div>
                <div className="grid gap-1 text-sm flex-1">
                  <h2 className="font-semibold leading-none line-clamp-2">
                    Achievement: Badge for completing HTML course
                  </h2>
                  <div className="text-xs text-gray-500 line-clamp-1 dark:text-gray-400">
                    12K views
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Activity Tools */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Activity Tools</h2>
          <div className="h-[220px] w-[700px] bg-white flex rounded-xl border dark:border-gray-800 transition-all duration-300 hover:scale-[1.02] hover:shadow-black-500/20">
            <div className="h-full w-[250px] p-7 text-white bg-[#261a6b] rounded-l-xl">
              <p className="text-[11px] tracking-widest text-[#cccc]">COURSE</p>
              <h1 className="text-[25px] pt-5 font-medium tracking-wide leading-[25px]">
                JavaScript Fundamentals
              </h1>
              <h4 className="text-[12px] pt-[50px] text-[#cccccc] cursor-pointer">
                view all chapters <i className="fa-solid fa-chevron-right"></i>
              </h4>
            </div>

            <div className="p-7 bg-white w-full rounded-r-xl relative">
              <div className="flex justify-between">
                <h1 className="text-[#949494] text-[13px] tracking-[.5px]">CHAPTER 4</h1>
                <div className="relative">
                  <div className="h-1.5 w-[200px] bg-slate-200 rounded-xl">
                    <div className="h-1.5 w-[120px] bg-[#261a6b] rounded-xl"></div>
                  </div>
                  <p className="text-[#a8a8a8] text-[12px] tracking-[.5px] absolute right-0">
                    6/9 Challenges
                  </p>
                </div>
              </div>
              <h1 className="text-[28px] pt-2 font-[500] tracking-wide">
                Callbacks &amp; Closures
              </h1>
              <input
                type="button"
                value="Continue"
                className="h-10 w-[120px] bg-[#261a6be8] text-white rounded-3xl tracking-wide absolute right-10 bottom-7 cursor-pointer hover:bg-[#4938b6e8]"
              />
            </div>
          </div>
        </section>

        {/* Community and Support */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Community and Support</h2>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <ul className="list-disc list-inside">
              <li><a href="#" className="text-blue-500">Discussion Forums</a></li>
              <li><a href="#" className="text-blue-500">Help Resources</a></li>
            </ul>
          </div>
        </section>

        {/* Personalization */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Personalization</h2>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p>Change Theme or Layout</p>
          </div>
        </section>
      </MainContent>
    </div>
  );
};

export default UserDashboard;
