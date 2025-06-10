import React, { useState, useEffect, useContext } from "react";
import {
  FaTachometerAlt,
  FaBook,
  FaBookOpen,
  FaComments,
  FaFolder,
  FaPlusCircle,
  FaPuzzlePiece,
  FaSignOutAlt,
} from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase.config";
import { doc, getDoc } from "firebase/firestore";
import { SidebarToggleContext } from "../components/LgNavbar";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { expanded } = useContext(SidebarToggleContext);
  const [userData, setUserData] = useState({ fullName: "", email: "" });
  const [activeItem, setActiveItem] = useState(() => {
    return localStorage.getItem("activeItem") || "Dashboard";
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserData(userDocSnap.data());
        }
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const routeToText = {
      "/dashboard": "Dashboard",
      "/courses": "Courses",
      "/addcourse": "Add Course",
      "/Achat": "Chat",
      "/file-library": "File Library",
      "/addmodule": "Add Module",
      "/addquiz": "Quizzes",
    };

    setActiveItem(routeToText[location.pathname] || "Dashboard");
  }, [location.pathname]);

  useEffect(() => {
    localStorage.setItem("activeItem", activeItem);
  }, [activeItem]);

  const handleLogout = () => {
    auth.signOut().then(() => {
      navigate("/login");
    });
  };

  return (
    <div className="flex">
      <aside className={`fixed h-screen transition-all ${expanded ? "w-64" : "w-16"}`}>
        <nav className={`h-full flex flex-col bg-white border-r shadow-sm text-blue-950`}>
          <div className="p-4 pb-2 flex justify-between items-center"></div>
          <ul className="flex-1 px-3">
            <SidebarItem icon={<FaTachometerAlt size={28} />} text="Dashboard" route="/dashboard" activeItem={activeItem} setActiveItem={setActiveItem} />
            <SidebarItem icon={<FaBook size={28} />} text="Courses" route="/courses" activeItem={activeItem} setActiveItem={setActiveItem} />
            <SidebarItem icon={<FaBookOpen size={28} />} text="Add Course" route="/addcourse" activeItem={activeItem} setActiveItem={setActiveItem} />
            <SidebarItem icon={<FaComments size={28} />} text="Chat" route="/Achat" activeItem={activeItem} setActiveItem={setActiveItem} />
            <SidebarItem icon={<FaFolder size={28} />} text="File Library" route="/file-library" activeItem={activeItem} setActiveItem={setActiveItem} />
            <SidebarItem icon={<FaPlusCircle size={28} />} text="Add Module" route="/addmodule" activeItem={activeItem} setActiveItem={setActiveItem} />
            <SidebarItem icon={<FaPuzzlePiece size={28} />} text="Quizzes" route="/addquiz" activeItem={activeItem} setActiveItem={setActiveItem} />
          </ul>

          <div className="border-t border-gray-300 flex p-3">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-full text-gray-800 hover:text-red-500"
            >
              <FaSignOutAlt size={28} className="mr-2" />
              <span className={`overflow-hidden transition-all ${expanded ? "w-52 ml-3 text-lg" : "w-0"}`}>
                Logout
              </span>
            </button>
          </div>
        </nav>
      </aside>
    </div>
  );
};

const SidebarItem = ({ icon, text, route, activeItem, setActiveItem }) => {
  const { expanded } = useContext(SidebarToggleContext);
  const navigate = useNavigate();

  const handleClick = () => {
    setActiveItem(text);
    localStorage.setItem("activeItem", text);
    if (route) navigate(route);
  };

  return (
    <li
      onClick={handleClick}
      className={`relative flex items-center py-1 px-2 my-1 font-medium rounded-md cursor-pointer transition-colors group ${
        activeItem === text ? "bg-yellow-300 text-yellow-900" : "hover:bg-yellow-200 text-blue-950"
      }`}
    >
      {icon}
      <span className={`overflow-hidden transition-all ${expanded ? "w-40 ml-3 text-sm" : "w-0"}`}>{text}</span>
    </li>
  );
};

export default Sidebar;
