import React, { useRef, useState, useEffect } from "react";
import {
  FaBook,
  FaTachometerAlt,
  FaUsers,
  FaFileAlt,
  FaUserCircle,
  FaEnvelope,
  FaCog,
  FaSignOutAlt,
  FaUserShield,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    navigate("/login");
  };

  // Scroll Up Function
  const scrollUp = () => {
    if (sidebarRef.current) {
      sidebarRef.current.scrollBy({ top: -100, behavior: "smooth" });
    }
  };

  // Scroll Down Function
  const scrollDown = () => {
    if (sidebarRef.current) {
      sidebarRef.current.scrollBy({ top: 100, behavior: "smooth" });
    }
  };

  // Check if scrolling is needed
  useEffect(() => {
    const handleScroll = () => {
      if (sidebarRef.current) {
        setCanScrollUp(sidebarRef.current.scrollTop > 0);
        setCanScrollDown(
          sidebarRef.current.scrollTop + sidebarRef.current.clientHeight <
            sidebarRef.current.scrollHeight
        );
      }
    };

    if (sidebarRef.current) {
      sidebarRef.current.addEventListener("scroll", handleScroll);
      handleScroll();
    }

    return () => {
      if (sidebarRef.current) {
        sidebarRef.current.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-screen w-64 bg-white text-blue-900 shadow-lg border-r-2 border-red-700">
      {/* Profile Section */}
      <div className="flex flex-col items-center p-6 border-b-2 border-red-700">
        <div className="bg-blue-600 rounded-full w-20 h-20 flex items-center justify-center text-white text-2xl font-bold">
          TA
        </div>
        <p className="mt-2 font-semibold text-blue-900">Training Academy</p>
        <Link to="/profile" className="text-red-900 text-sm hover:underline">
          View Profile
        </Link>
      </div>

      {/* Scroll Up Button */}
      {canScrollUp && (
        <button className="w-full py-2 text-red-700 hover:text-white hover:bg-red-700" onClick={scrollUp}>
          <FaArrowUp className="mx-auto" />
        </button>
      )}

      {/* Sidebar Menu */}
      <div ref={sidebarRef} className="flex-grow overflow-y-auto p-4">
        <ul className="space-y-2">
          <SidebarItem to="/dashboard" icon={<FaTachometerAlt />} label="Dashboard" active={location.pathname === "/dashboard"} />
          <SidebarItem to="/courses" icon={<FaBook />} label="Courses" active={location.pathname === "/courses"} />
          <SidebarItem to="/addcourse" icon={<FaBook />} label="Add Course" active={location.pathname === "/addcourse"} />
          <SidebarItem to="/reviews" icon={<FaBook />} label="Reviews" active={location.pathname === "/reviews"} />
          <SidebarItem to="/file-library" icon={<FaFileAlt />} label="File Library" active={location.pathname === "/file-library"} />
          <SidebarItem to="/addmodule" icon={<FaFileAlt />} label="Add Module" active={location.pathname === "/addmodule"} />
          <SidebarItem to="/addquiz" icon={<FaUsers />} label="Quizzes" active={location.pathname === "/addquiz"} />
          <SidebarItem to="/attendance" icon={<FaUserCircle />} label="Attendance" active={location.pathname === "/attendance"} />
          <SidebarItem to="/messages" icon={<FaEnvelope />} label="Messages" active={location.pathname === "/messages"} />
          <SidebarItem to="/settings" icon={<FaCog />} label="Settings" active={location.pathname === "/settings"} />
          <SidebarItem to="/admin" icon={<FaUserShield />} label="Admin" active={location.pathname === "/admin"} />

          {/* Logout Button */}
          <li className="p-2 rounded-md bg-red-700 text-white hover:bg-red-600 cursor-pointer" onClick={handleLogout}>
            <div className="flex items-center space-x-2">
              <FaSignOutAlt /> <span>Logout</span>
            </div>
          </li>
        </ul>
      </div>

      {/* Scroll Down Button */}
      {canScrollDown && (
        <button className="w-full py-2 text-red-700 hover:text-white hover:bg-red-700" onClick={scrollDown}>
          <FaArrowDown className="mx-auto" />
        </button>
      )}
    </div>
  );
};

// Sidebar Item Component
const SidebarItem = ({ to, icon, label, active }) => {
  return (
    <li className={`p-2 rounded-md ${active ? "bg-red-700 text-white" : "hover:bg-gray-200 hover:text-red-700"}`}>
      <Link to={to} className="flex items-center space-x-2">
        {icon} <span>{label}</span>
      </Link>
    </li>
  );
};

export default Sidebar;
