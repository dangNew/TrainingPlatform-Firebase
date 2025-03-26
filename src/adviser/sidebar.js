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
  FaUserShield,
  FaUserFriends,
} from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCoursesOpen, setIsCoursesOpen] = useState(false);

  const handleLogout = () => {
    // Clear session storage or authentication token
    localStorage.removeItem("userToken");
    navigate("/login"); // Redirect to login page
  };

  return (
    <div className="flex flex-col h-screen w-64 bg-gray-800 text-white shadow-lg">
      {/* Profile Section (Fixed) */}
      <div className="flex flex-col items-center p-6 border-b border-gray-700">
        <div className="bg-blue-600 rounded-full w-20 h-20 flex items-center justify-center text-white text-2xl font-bold">
          TA
        </div>
        <p className="mt-2 font-semibold text-gray-300">Training Academy</p>
        <Link to="/profile" className="text-blue-300 text-sm hover:underline">
          View Profile
        </Link>
      </div>

      {/* Scrollable Sidebar Menu */}
      <div className="flex-grow overflow-y-auto p-4">
        <ul className="space-y-2">
          <li className={`${location.pathname === "/dashboard" ? "bg-gray-700" : ""} p-2 rounded-md hover:bg-gray-700`}>
            <Link to="/dashboard" className="flex items-center space-x-2">
              <FaTachometerAlt /> <span>Dashboard</span>
            </Link>
          </li>

          {/* Courses Dropdown */}
          <li className="p-2 rounded-md cursor-pointer" onClick={() => setIsCoursesOpen(!isCoursesOpen)}>
            <div className="flex items-center justify-between text-white font-medium">
              <div className="flex items-center space-x-2">
                <FaBook /> <span>Courses</span>
              </div>
              <FaChevronDown className={`transform transition-transform ${isCoursesOpen ? "rotate-180" : ""}`} />
            </div>
            {isCoursesOpen && (
              <ul className="ml-6 mt-2 space-y-1 text-gray-400">
                <li className="hover:text-blue-300"><Link to="/courses">Courses List</Link></li>
                <li className="hover:text-blue-300"><Link to="/addcourse">Add Course</Link></li>
                <li className="hover:text-blue-300"><Link to="/reviews">Reviews</Link></li>
              </ul>
            )}
          </li>

          <li className="p-2 rounded-md hover:bg-gray-700">
            <Link to="/file-library" className="flex items-center space-x-2">
              <FaFileAlt /> <span>File Library</span>
            </Link>
          </li>
          <li className="p-2 rounded-md hover:bg-gray-700">
            <Link to="/addmodule" className="flex items-center space-x-2">
              <FaFileAlt /> <span>Add Module</span>
            </Link>
          </li>
          <li className="p-2 rounded-md hover:bg-gray-700">
            <Link to="/addquiz" className="flex items-center space-x-2">
              <FaUsers /> <span>Quizzes</span>
            </Link>
          </li>
          <li className="p-2 rounded-md hover:bg-gray-700">
            <Link to="/attendance" className="flex items-center space-x-2">
              <FaUserCircle /> <span>Attendance</span>
            </Link>
          </li>
          <li className="p-2 rounded-md hover:bg-gray-700">
            <Link to="/messages" className="flex items-center space-x-2">
              <FaEnvelope /> <span>Messages</span>
            </Link>
          </li>
          <li className="p-2 rounded-md hover:bg-gray-700">
            <Link to="/settings" className="flex items-center space-x-2">
              <FaCog /> <span>Settings</span>
            </Link>
          </li>

          {/* List of Users */}
          <li className="p-2 rounded-md hover:bg-gray-700">
            <Link to="/users" className="flex items-center space-x-2">
              <FaUserFriends /> <span>List of Users</span>
            </Link>
          </li>

          {/* Admin Section */}
          <li className="p-2 rounded-md hover:bg-gray-700">
            <Link to="/admin" className="flex items-center space-x-2">
              <FaUserShield /> <span>Admin</span>
            </Link>
          </li>

          {/* Logout Button */}
          <li className="p-2 rounded-md hover:bg-red-700 text-red-300 cursor-pointer" onClick={handleLogout}>
            <div className="flex items-center space-x-2">
              <FaSignOutAlt /> <span>Logout</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
