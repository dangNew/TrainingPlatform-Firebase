import React, { useState } from "react";
import { Link } from "react-router-dom";
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
  FaUsers,
  FaBullhorn,
} from "react-icons/fa";
import Header from "../Dashboard/Header"; // Adjust path to find Header.js

const Dashboard = () => {
  // Sample announcements state (replace with data from Firestore)
  const [announcements, setAnnouncements] = useState([
    "Midterm exams start next week!",
    "Assignment submission deadline extended.",
    "New course materials uploaded for Web Development.",
  ]);

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
            <li className="flex items-center text-green-600 font-medium p-2 rounded-md hover:bg-green-100 cursor-pointer">
              <FaUpload className="mr-2" />
              <Link to="/upload-content">Upload Content</Link>
            </li>
            <li className="flex items-center text-purple-600 font-medium p-2 rounded-md hover:bg-purple-100 cursor-pointer">
              <FaUserCircle className="mr-2" />
              <Link to="/assistant-access">Assistant Access</Link>
            </li>
            <li className="flex items-center text-blue-600 font-medium p-2 rounded-md hover:bg-blue-100 cursor-pointer">
              <FaUsers className="mr-2" />
              <Link to="/manage-students">Manage Students</Link>
            </li>
            <li className="flex items-center text-yellow-600 font-medium p-2 rounded-md hover:bg-yellow-100 cursor-pointer">
              <FaBullhorn className="mr-2" />
              <Link to="/manage-announcements">Manage Announcements</Link>
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
              <Link to="/manage-courses">
                <button className="mt-3 bg-white text-red-500 px-4 py-2 rounded-lg hover:bg-red-300">
                  Manage Courses
                </button>
              </Link>
            </div>

            <div className="bg-blue-500 text-white p-6 rounded-lg shadow-lg">
              <h2 className="text-lg font-semibold">Students</h2>
              <p className="text-sm">Monitor student progress</p>
              <Link to="/manage-students">
                <button className="mt-3 bg-white text-blue-500 px-4 py-2 rounded-lg hover:bg-blue-300">
                  View Students
                </button>
              </Link>
            </div>

            <div className="bg-yellow-500 text-white p-6 rounded-lg shadow-lg">
              <h2 className="text-lg font-semibold">Announcements</h2>
              <p className="text-sm">Post and edit announcements</p>
              <Link to="/manage-announcements">
                <button className="mt-3 bg-white text-yellow-500 px-4 py-2 rounded-lg hover:bg-yellow-300">
                  Manage Announcements
                </button>
              </Link>
            </div>
          </div>

          {/* Announcements & Leaderboard */}
          <div className="grid grid-cols-2 gap-6 mt-6">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-lg font-semibold text-gray-700">📢 Announcements</h2>
              <ul className="text-sm text-gray-600 mt-2">
                {announcements.map((announcement, index) => (
                  <li key={index}>- {announcement}</li>
                ))}
              </ul>
              <Link to="/manage-announcements">
                <button className="mt-3 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
                  Edit Announcements
                </button>
              </Link>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-lg font-semibold text-gray-700">🏆 Leaderboard</h2>
              <p className="text-sm text-gray-600 mt-2">
                Top 5 learners of the month
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
