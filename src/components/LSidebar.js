import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logo from "../assets/logo.jpg";
import { LifeBuoy, Receipt, FolderOpen, UserCircle, FileText, BookOpen, LayoutDashboard, Settings, Menu, MoreVertical, MessageCircle } from 'lucide-react';
import { auth, db } from '../firebase.config';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc } from 'firebase/firestore';

const SidebarContext = createContext();

export default function Sidebar() {
  const [expanded, setExpanded] = useState(true);
  const [user] = useAuthState(auth);
  const [userData, setUserData] = useState({ fullName: '', email: '' });
  const [activeItem, setActiveItem] = useState('Dashboard'); // Default active item

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userRef = doc(db, 'learner', user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      }
    };

    fetchUserData();
  }, [user]);

  return (
    <SidebarContext.Provider value={{ expanded, activeItem, setActiveItem }}>
      <div className="flex">
        <aside className={`fixed h-screen transition-all ${expanded ? 'w-64' : 'w-16'}`}>
          <nav className="h-full flex flex-col bg-blue-950 border-r shadow-sm text-gray-200">
            <div className="p-4 pb-2 flex justify-between items-center">
              <img
                src={logo}
                className={`overflow-hidden transition-all ${expanded ? 'w-12' : 'w-0'}`}
                alt="Logo"
              />
              <button
                onClick={() => setExpanded((curr) => !curr)}
                className="p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600"
              >
                <Menu className="text-gray-200" />
              </button>
            </div>

            <ul className="flex-1 px-3">
              <SidebarItem icon={<LayoutDashboard size={20} />} text="Dashboard" route="/user-dashboard" />
              <SidebarItem icon={<BookOpen size={20} />} text="Courses" route="/lcourses" />
              <SidebarItem icon={<FileText size={20} />} text="Modules" />
              <SidebarItem icon={<FolderOpen size={20} />} text="Resources" />
              <SidebarItem icon={<UserCircle size={20} />} text="Profile" route="/lprofile" />
              {/* <SidebarItem icon={<MessageCircle size={20} />} text="Chat Room" alert route="/chatroom" /> */}
              <hr className="my-3 border-gray-700" />
              <SidebarItem icon={<Settings size={20} />} text="Settings" />
              <SidebarItem icon={<LifeBuoy size={20} />} text="Help" />
            </ul>

            <Link to="/lprofile" className="border-t border-gray-700 flex p-3">
              <img
                src=""
                alt=""
                className="w-10 h-10 rounded-md"
              />
              <div className={`flex justify-between items-center overflow-hidden transition-all ${expanded ? 'w-52 ml-3' : 'w-0'}`}>
                <div className="leading-4">
                  <h4 className="font-semibold text-gray-200">{userData.fullName}</h4>
                  <span className="text-xs text-gray-400">{userData.email}</span>
                </div>
                <MoreVertical size={20} className="text-gray-200" />
              </div>
            </Link>
          </nav>
        </aside>
        <main className={`transition-all ${expanded ? 'ml-64' : 'ml-16'}`}>
          {/* Main content goes here */}
        </main>
      </div>
    </SidebarContext.Provider>
  );
}

function SidebarItem({ icon, text, alert, route }) {
  const { expanded, activeItem, setActiveItem } = useContext(SidebarContext);
  const navigate = useNavigate();

  const handleClick = () => {
    setActiveItem(text);
    if (route) {
      navigate(route);
    }
  };

  return (
    <li
      onClick={handleClick}
      className={`relative flex items-center py-2 px-3 my-1 font-medium rounded-md cursor-pointer transition-colors group ${
        activeItem === text ? 'bg-gradient-to-tr from-yellow-200 to-yellow-100 text-yellow-800' : 'hover:bg-yellow-50 text-gray-200'
      }`}
    >
      {icon}
      <span className={`overflow-hidden transition-all ${expanded ? 'w-52 ml-3' : 'w-0'}`}>{text}</span>
      {alert && <div className={`absolute right-2 w-2 h-2 rounded bg-yellow-400 ${expanded ? '' : 'top-2'}`} />}
      {!expanded && (
        <div className="absolute left-full rounded-md px-2 py-1 ml-6 bg-yellow-100 text-yellow-800 text-sm invisible opacity-20 -translate-x-3 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0">
          {text}
        </div>
      )}
    </li>
  );
}