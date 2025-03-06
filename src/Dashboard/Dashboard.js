import React from "react";
import Header from "../Dashboard/Header"; // Adjust path to find Header.js
import Sidebar from "../adviser/sidebar"; // Import Sidebar component

const Dashboard = () => {
  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header - Fixed at the top */}
      <div className="fixed top-0 left-0 w-full z-50">
        <Header />
      </div>

      <div className="flex flex-1 pt-16"> {/* Add padding-top to prevent content from going under Header */}
        {/* Sidebar - Fixed on the left */}
        <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white shadow-md">
          <Sidebar />
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 ml-64 p-6 overflow-y-auto h-[calc(100vh-4rem)]">
          <h1 className="text-3xl font-semibold text-gray-700">
            Welcome Back, Professor!
          </h1>

          {/* Dashboard Cards */}
          <div className="grid grid-cols-3 gap-6 mt-6">
            <div className="bg-red-500 text-white p-6 rounded-lg shadow-lg">
              <h2 className="text-lg font-semibold">Courses</h2>
              <p className="text-sm">Manage your courses</p>
            </div>

            <div className="bg-blue-500 text-white p-6 rounded-lg shadow-lg">
              <h2 className="text-lg font-semibold">Enrolled Courses</h2>
              <p className="text-sm">Track student progress</p>
            </div>

            <div className="bg-black text-white p-6 rounded-lg shadow-lg">
              <h2 className="text-lg font-semibold">Achievements</h2>
              <p className="text-sm">View student milestones</p>
            </div>
          </div>

          {/* Announcements & Leaderboard */}
          <div className="grid grid-cols-2 gap-6 mt-6">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-lg font-semibold text-gray-700">📢 Announcements</h2>
              <p className="text-sm text-gray-600 mt-2">New courses added this week!</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-lg font-semibold text-gray-700">🏆 Leaderboard</h2>
              <p className="text-sm text-gray-600 mt-2">Top 5 learners of the month</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
