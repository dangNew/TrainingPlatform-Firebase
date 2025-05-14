import React, { useState, useEffect, createContext, useContext } from "react";
import {
  FaTachometerAlt,
  FaBook,
  FaBookOpen,
  FaComments,
  FaFolder,
  FaPlusCircle,
  FaPuzzlePiece,
  FaCalendarCheck,
  FaEnvelope,
  FaCog,
  FaUserShield,
  FaSignOutAlt,
  FaBars
} from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase.config";
import { doc, getDoc } from "firebase/firestore";

const SidebarContext = createContext();

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);
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
      "/attendance": "Attendance",
      "/messages": "Messages",
      "/settings": "Settings",
      "/admin": "Admin",
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
    <SidebarContext.Provider value={{ expanded, activeItem, setActiveItem }}>
      <div className="flex">
        <aside className={`fixed h-screen transition-all ${expanded ? "w-64" : "w-16"}`}>
          <nav className={`h-full flex flex-col bg-white border-r shadow-sm text-blue-950 overflow-y-auto`}>
            <div className="p-4 pb-2 flex justify-between items-center">
              <button
                onClick={() => setExpanded((curr) => !curr)}
                className="p-1.5 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                <FaBars className="text-blue-950" size={28} />
              </button>
            </div>

            <Link to="/profile" className="flex flex-col items-center p-3">
              <div className={`rounded-full overflow-hidden ${expanded ? "w-24 h-24" : "w-12 h-12"}`}>
                <img
                  src={userData.photoURL || "/placeholder.svg"}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className={`text-center ${expanded ? "block" : "hidden"}`}>
                <h4 className="font-bold text-lg text-gray-800">{userData.fullName}</h4>
                <span className="text-sm text-gray-600">{userData.email}</span>
              </div>
            </Link>

            <hr className="my-3 border-gray-300" />

            <ul className="flex-1 px-3">
              <SidebarItem icon={<FaTachometerAlt size={28} />} text="Dashboard" route="/dashboard" />
              <SidebarItem icon={<FaBook size={28} />} text="Courses" route="/courses" />
              <SidebarItem icon={<FaBookOpen size={28} />} text="Add Course" route="/addcourse" />
              <SidebarItem icon={<FaComments size={28} />} text="Chat" route="/Achat" />
              <SidebarItem icon={<FaFolder size={28} />} text="File Library" route="/file-library" />
              <SidebarItem icon={<FaPlusCircle size={28} />} text="Add Module" route="/addmodule" />
              <SidebarItem icon={<FaPuzzlePiece size={28} />} text="Quizzes" route="/addquiz" />
              <SidebarItem icon={<FaCalendarCheck size={28} />} text="Attendance" route="/attendance" />
              <SidebarItem icon={<FaEnvelope size={28} />} text="Messages" route="/messages" />
              <SidebarItem icon={<FaCog size={28} />} text="Settings" route="/settings" />
              <SidebarItem icon={<FaUserShield size={28} />} text="Admin" route="/admin" />
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
        <main className={`transition-all ${expanded ? "ml-64" : "ml-16"}`}>{/* Main content goes here */}</main>
      </div>
    </SidebarContext.Provider>
  );
};

const SidebarItem = ({ icon, text, route }) => {
  const { expanded, activeItem, setActiveItem } = useContext(SidebarContext);
  const navigate = useNavigate();

  const handleClick = () => {
    setActiveItem(text);
    localStorage.setItem("activeItem", text);
    if (route) {
      navigate(route);
    }
  };

  return (
    <li
      onClick={handleClick}
      className={`relative flex items-center py-1 px-2 my-1 font-medium rounded-md cursor-pointer transition-colors group ${
        activeItem === text
          ? "bg-yellow-300 text-yellow-900"
          : "hover:bg-yellow-200 text-blue-950"
      }`}
    >
      {icon}
      <span className={`overflow-hidden transition-all ${expanded ? "w-40 ml-3 text-sm" : "w-0"}`}>{text}</span>
    </li>
  );
};

export default Sidebar;
