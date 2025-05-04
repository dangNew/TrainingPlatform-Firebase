import React from "react";
import { Link } from "react-router-dom"; // Import Link from react-router-dom
import {
  FaBook,
  FaGraduationCap,
  FaTrophy,
  FaCog,
  FaSignOutAlt,
  FaInbox,
  FaUpload,
  FaComment,
  FaUserCircle,
} from "react-icons/fa";
import Header from "../Dashboard/Header"; // Adjust path to find Header.js

const Dashboard = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <Header />

      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg">
          <div className="p-5 text-xl font-bold text-gray-800">E-Learning</div>
          <ul className="space-y-4 p-4">
            <li className="flex items-center text-red-600 font-medium p-2 rounded-md hover:bg-red-100 cursor-pointer">
              <FaBook className="mr-2" />
              <Link to="/courses">Courses</Link>
            </li>
            <li className="flex items-center text-blue-600 font-medium p-2 rounded-md hover:bg-blue-100 cursor-pointer">
              <FaGraduationCap className="mr-2" />
              <Link to="/enrolled-courses">Enrolled Courses</Link>
            </li>
            <li className="flex items-center text-black font-medium p-2 rounded-md hover:bg-gray-200 cursor-pointer">
              <FaTrophy className="mr-2" />
              <Link to="/achievements">Achievements</Link>
            </li>
            <li className="flex items-center text-gray-600 font-medium p-2 rounded-md hover:bg-gray-200 cursor-pointer">
              <FaInbox className="mr-2" />
              <Link to="/messages">Messages</Link>
            </li>
            <li className="flex items-center text-gray-600 font-medium p-2 rounded-md hover:bg-gray-200 cursor-pointer">
              <FaComment className="mr-2" />
              <Link to="/comments">Comments</Link>
            </li>
            <li className="flex items-center text-green-600 font-medium p-2 rounded-md hover:bg-green-100 cursor-pointer">
              <FaUpload className="mr-2" />
              <Link to="/upload-content">Upload Content</Link>
            </li>
            <li className="flex items-center text-purple-600 font-medium p-2 rounded-md hover:bg-purple-100 cursor-pointer">
              <FaUserCircle className="mr-2" />
              <Link to="/assistant-access">Assistant Access</Link>
            </li>
            <li className="flex items-center text-gray-600 font-medium p-2 rounded-md hover:bg-gray-200 cursor-pointer">
              <FaCog className="mr-2" />
              <Link to="/settings">Settings</Link>
            </li>
            <li className="flex items-center text-red-500 font-medium p-2 rounded-md hover:bg-red-200 cursor-pointer">
              <FaSignOutAlt className="mr-2" />
              <Link to="/logout">Logout</Link>
            </li>
          </ul>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
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
              <h2 className="text-lg font-semibold text-gray-700">
                📢 Announcements
              </h2>
              <p className="text-sm text-gray-600 mt-2">
                New courses added this week!
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-lg font-semibold text-gray-700">
                🏆 Leaderboard
              </h2>
              <p className="text-sm text-gray-600 mt-2">
                Top 5 learners of the month11
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;