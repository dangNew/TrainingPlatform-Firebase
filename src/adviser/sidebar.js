import React, { useRef, useState, useEffect, createContext, useContext } from "react";
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
  FaArrowUp,
  FaArrowDown,
  FaBars
} from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase.config";
import { doc, getDoc } from "firebase/firestore";

const SidebarContext = createContext();

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  const [expanded, setExpanded] = useState(true);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(true);
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

  const scrollUp = () => {
    if (sidebarRef.current) {
      sidebarRef.current.scrollBy({ top: -100, behavior: "smooth" });
    }
  };

  const scrollDown = () => {
    if (sidebarRef.current) {
      sidebarRef.current.scrollBy({ top: 100, behavior: "smooth" });
    }
  };

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
    <SidebarContext.Provider value={{ expanded, activeItem, setActiveItem }}>
      <div className="flex">
        <aside className={`fixed h-screen transition-all ${expanded ? "w-64" : "w-16"}`}>
          <nav className="h-full flex flex-col bg-blue-950 border-r shadow-sm text-gray-200">
            <div className="p-4 pb-2 flex justify-between items-center">
              <button
                onClick={() => setExpanded((curr) => !curr)}
                className="p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600"
              >
                <FaBars className="text-gray-200" size={32} />
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
                <h4 className="font-bold text-lg text-gray-200">{userData.fullName}</h4>
                <span className="text-sm text-gray-400">{userData.email}</span>
              </div>
            </Link>

            <hr className="my-3 border-gray-700" />

            {canScrollUp && (
              <button className="w-full py-2 text-gray-200 hover:text-white hover:bg-gray-700" onClick={scrollUp}>
                <FaArrowUp className="mx-auto" />
              </button>
            )}

            <div ref={sidebarRef} className="flex-grow overflow-y-auto p-4">
              <ul className="space-y-2">
                <SidebarItem icon={<FaTachometerAlt size={24} />} text="Dashboard" route="/dashboard" />
                <SidebarItem icon={<FaBook size={24} />} text="Courses" route="/courses" />
                <SidebarItem icon={<FaBookOpen size={24} />} text="Add Course" route="/addcourse" />
                <SidebarItem icon={<FaComments size={24} />} text="Chat" route="/Achat" />
                <SidebarItem icon={<FaFolder size={24} />} text="File Library" route="/file-library" />
                <SidebarItem icon={<FaPlusCircle size={24} />} text="Add Module" route="/addmodule" />
                <SidebarItem icon={<FaPuzzlePiece size={24} />} text="Quizzes" route="/addquiz" />
                <SidebarItem icon={<FaCalendarCheck size={24} />} text="Attendance" route="/attendance" />
                <SidebarItem icon={<FaEnvelope size={24} />} text="Messages" route="/messages" />
                <SidebarItem icon={<FaCog size={24} />} text="Settings" route="/settings" />
                <SidebarItem icon={<FaUserShield size={24} />} text="Admin" route="/admin" />

                <li
                  onClick={handleLogout}
                  className="p-2 rounded-md bg-red-700 text-white hover:bg-red-600 cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <FaSignOutAlt /> <span>Logout</span>
                  </div>
                </li>
              </ul>
            </div>

            {canScrollDown && (
              <button className="w-full py-2 text-gray-200 hover:text-white hover:bg-gray-700" onClick={scrollDown}>
                <FaArrowDown className="mx-auto" />
              </button>
            )}
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
          ? "bg-gradient-to-tr from-yellow-200 to-yellow-100 text-yellow-800"
          : "hover:bg-yellow-50 text-gray-200"
      }`}
    >
      {icon}
      <span className={`overflow-hidden transition-all ${expanded ? "w-40 ml-3 text-sm" : "w-0"}`}>{text}</span>
    </li>
  );
};

export default Sidebar;
