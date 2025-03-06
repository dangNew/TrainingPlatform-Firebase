import React, { useState } from "react";
import {
  FaBook,
  FaTachometerAlt,
  FaUsers,
  FaFileAlt,
  FaUserCircle,
  FaEnvelope,
  FaCog,
  FaSignOutAlt,
  FaChevronDown,
} from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();
  const [isCoursesOpen, setIsCoursesOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen w-64 bg-white shadow-lg p-4">
      {/* Profile Section */}
      <div className="flex flex-col items-center mb-6">
        <div className="bg-gray-300 rounded-full w-16 h-16 flex items-center justify-center text-gray-700 text-2xl font-bold">
          TA
        </div>
        <p className="mt-2 font-semibold">Training Academy</p>
        <Link to="/profile" className="text-blue-500 text-sm hover:underline">Profile</Link>
      </div>

      {/* Sidebar Menu */}
      <ul className="space-y-2">
        <li className={`${location.pathname === "/dashboard" ? "bg-gray-200" : ""} p-2 rounded-md hover:bg-gray-200` }>
          <Link to="/dashboard" className="flex items-center space-x-2">
            <FaTachometerAlt /> <span>Dashboard</span>
          </Link>
        </li>
        
        {/* Courses Dropdown */}
        <li className="p-2 rounded-md cursor-pointer" onClick={() => setIsCoursesOpen(!isCoursesOpen)}>
          <div className="flex items-center justify-between text-black font-medium">
            <div className="flex items-center space-x-2">
              <FaBook /> <span>Courses</span>
            </div>
            <FaChevronDown className={`transform transition-transform ${isCoursesOpen ? "rotate-180" : ""}`} />
          </div>
          {isCoursesOpen && (
            <ul className="ml-6 mt-2 space-y-1 text-gray-700">
              <li className="hover:text-blue-500"><Link to="/courses">Courses List</Link></li>
              <li className="hover:text-blue-500"><Link to="/packages">Packages</Link></li>
              <li className="hover:text-blue-500"><Link to="/reviews">Reviews</Link></li>
            </ul>
          )}
        </li>

        <li className="p-2 rounded-md hover:bg-gray-200">
          <Link to="/file-library" className="flex items-center space-x-2">
            <FaFileAlt /> <span>File Library</span>
          </Link>
        </li>
        <li className="p-2 rounded-md hover:bg-gray-200">
          <Link to="/quizzes" className="flex items-center space-x-2">
            <FaUsers /> <span>Quizzes</span>
          </Link>
        </li>
        <li className="p-2 rounded-md hover:bg-gray-200">
          <Link to="/attendance" className="flex items-center space-x-2">
            <FaUserCircle /> <span>Attendance</span>
          </Link>
        </li>
        <li className="p-2 rounded-md hover:bg-gray-200">
          <Link to="/messages" className="flex items-center space-x-2">
            <FaEnvelope /> <span>Messages</span>
          </Link>
        </li>
        <li className="p-2 rounded-md hover:bg-gray-200">
          <Link to="/settings" className="flex items-center space-x-2">
            <FaCog /> <span>Settings</span>
          </Link>
        </li>
        <li className="p-2 rounded-md hover:bg-red-100 text-red-600">
          <Link to="/logout" className="flex items-center space-x-2">
            <FaSignOutAlt /> <span>Logout</span>
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
