import {
  BookOpen, FileText, FolderOpen, LayoutDashboard,
  LifeBuoy, LogOut, MessageCircle, Megaphone, UserCircle
} from 'lucide-react';
import { useContext, useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase.config";
import { doc, getDoc } from "firebase/firestore";
import { SidebarToggleContext } from "./LgNavbar"; // Import the context from LNavbar

export default function LSidebar() {
  const [user] = useAuthState(auth);
  const [userData, setUserData] = useState({ fullName: "", email: "" });
  const location = useLocation();
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState(() => {
    return localStorage.getItem("activeItem") || "Dashboard";
  });

  // Use the expanded state from the context
  const { expanded } = useContext(SidebarToggleContext);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userRef = doc(db, "learner", user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      }
    };
    fetchUserData();
  }, [user]);

  useEffect(() => {
    const routeToText = {
      "/user-dashboard": "Dashboard",
      "/lcourses": "Courses",
      "/chatroom": "Chat",
      "/certificates": "Certificates",
      "/resources": "Resources",
      "/announcement": "Announcement",
    
    };

    if (location.pathname.startsWith("/lcourses") || location.pathname.startsWith("/lmodules")) {
      setActiveItem("Courses");
    } else {
      setActiveItem(routeToText[location.pathname] || "Dashboard");
    }
  }, [location.pathname]);

  useEffect(() => {
    localStorage.setItem("activeItem", activeItem);
  }, [activeItem]);

  const handleLogout = () => {
    auth.signOut().then(() => {
      navigate("/");
    });
  };

  return (
    <div className="flex">
      <aside className={`fixed h-screen transition-all ${expanded ? "w-64" : "w-16"}`}>
      <nav className="h-full flex flex-col bg-white border-r shadow-sm text-blue-950">
      <div className="p-4 pb-2 flex justify-between items-center"></div>
          {/* <Link to="/lprofile" className="flex flex-col items-center p-3">
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
          </Link> */}
          {/* <hr className="my-3 border-gray-700" /> */}
          <ul className="flex-1 px-3">
            <SidebarItem icon={<LayoutDashboard size={28} />} text="Dashboard" route="/user-dashboard" activeItem={activeItem} setActiveItem={setActiveItem} />
            <SidebarItem icon={<BookOpen size={28} />} text="Courses" route="/lcourses" activeItem={activeItem} setActiveItem={setActiveItem} />
            <SidebarItem icon={<MessageCircle size={28} />} text="Chat" route="/chatroom" activeItem={activeItem} setActiveItem={setActiveItem} />
            <SidebarItem icon={<FileText size={28} />} text="Certificates" route="/certificates" activeItem={activeItem} setActiveItem={setActiveItem} />
            <SidebarItem icon={<FolderOpen size={28} />} text="Resources" route="/resources" activeItem={activeItem} setActiveItem={setActiveItem} />
            <SidebarItem icon={<Megaphone size={28} />} text="Announcement" route="/announcement" activeItem={activeItem} setActiveItem={setActiveItem} />
          </ul>

          {/* <div className="border-t border-gray-700 flex p-3">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-full text-gray-200 hover:text-red-500"
            >
              <LogOut size={32} className="mr-2" />
              <span className={`overflow-hidden transition-all ${expanded ? "w-52 ml-3 text-lg" : "w-0"}`}>
                Logout
              </span>
            </button> */}
          {/* </div> */}
        </nav>
      </aside>
    </div>
  );
}

function SidebarItem({ icon, text, route, activeItem, setActiveItem }) {
  const { expanded } = useContext(SidebarToggleContext);
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
}

