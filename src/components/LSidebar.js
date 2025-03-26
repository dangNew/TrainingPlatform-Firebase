import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LifeBuoy, Receipt, FolderOpen, UserCircle, FileText, BookOpen, LayoutDashboard, Settings, Menu, MoreVertical, LogOut } from 'lucide-react';
import { auth, db } from '../firebase.config';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc } from 'firebase/firestore';

const SidebarContext = createContext();

export default function Sidebar() {
  const [expanded, setExpanded] = useState(true);
  const [user] = useAuthState(auth);
  const [userData, setUserData] = useState({ fullName: '', email: '' });

  const location = useLocation();
  const navigate = useNavigate(); // Add this line to get the navigate function
  const [activeItem, setActiveItem] = useState(() => {
    return localStorage.getItem('activeItem') || 'Dashboard'; // Default active item
  });

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

  useEffect(() => {
    // Map URL path to corresponding sidebar item text
    const routeToText = {
      '/user-dashboard': 'Dashboard',
      '/lcourses': 'Courses',
      '/lprofile': 'Profile',
      '/certificates': 'Certificates',
      '/resources': 'Resources',
      '/settings': 'Settings',
      '/help': 'Help',
    };

    // Ensure "Courses" stays active when navigating to a module
    if (location.pathname.startsWith('/lcourses') || location.pathname.startsWith('/lmodules')) {
      setActiveItem('Courses');
    } else {
      setActiveItem(routeToText[location.pathname] || 'Dashboard');
    }
  }, [location.pathname]);

  useEffect(() => {
    localStorage.setItem('activeItem', activeItem);
  }, [activeItem]);

  const handleLogout = () => {
    auth.signOut().then(() => {
      navigate('/'); // Navigate to the landing page after signing out
    });
  };

  return (
    <SidebarContext.Provider value={{ expanded, activeItem, setActiveItem }}>
      <div className="flex">
        <aside className={`fixed h-screen transition-all ${expanded ? 'w-64' : 'w-16'}`}>
          <nav className="h-full flex flex-col bg-blue-950 border-r shadow-sm text-gray-200">
            <div className="p-4 pb-2 flex justify-between items-center">
              <button
                onClick={() => setExpanded((curr) => !curr)}
                className="p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600"
              >
                <Menu className="text-gray-200" size={32} />
              </button>
            </div>

            <Link to="/lprofile" className="flex flex-col items-center p-3">
              <div className={`rounded-full overflow-hidden ${expanded ? 'w-24 h-24' : 'w-12 h-12'}`}>
                <img
                  src={userData.photoURL}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className={`text-center ${expanded ? 'block' : 'hidden'}`}>
                <h4 className="font-bold text-lg text-gray-200">{userData.fullName}</h4>
                <span className="text-sm text-gray-400">{userData.email}</span>
              </div>
            </Link>

            <hr className="my-3 border-gray-700" />

            <ul className="flex-1 px-3">
              <SidebarItem icon={<LayoutDashboard size={24} />} text="Dashboard" route="/user-dashboard" />
              <SidebarItem icon={<BookOpen size={24} />} text="Courses" route="/lcourses" />
              <SidebarItem icon={<FileText size={24} />} text="Certificates" route="/certificates" />
              <SidebarItem icon={<FolderOpen size={24} />} text="Resources" route="/resources" />
              <SidebarItem icon={<UserCircle size={24} />} text="Profile" route="/lprofile" />
              <hr className="my-3 border-gray-700" />
              <SidebarItem icon={<Settings size={24} />} text="Settings" route="/settings" />
              <SidebarItem icon={<LifeBuoy size={24} />} text="Help" route="/help" />
            </ul>

            <div className="border-t border-gray-700 flex p-3">
              <button
                onClick={handleLogout}
                className="flex items-center justify-center w-full text-gray-200 hover:text-red-500"
              >
                <LogOut size={32} className="mr-2" />
                <span className={`overflow-hidden transition-all ${expanded ? 'w-52 ml-3 text-lg' : 'w-0'}`}>Logout</span>
              </button>
            </div>
          </nav>
        </aside>
        <main className={`transition-all ${expanded ? 'ml-64' : 'ml-16'}`}>
          {/* Main content goes here */}
        </main>
      </div>
    </SidebarContext.Provider>
  );
}

function SidebarItem({ icon, text, route }) {
  const { expanded, activeItem, setActiveItem } = useContext(SidebarContext);
  const navigate = useNavigate();

  const handleClick = () => {
    setActiveItem(text);
    localStorage.setItem('activeItem', text); // Persist the active item
    if (route) {
      navigate(route);
    }
  };

  return (
    <li
      onClick={handleClick}
      className={`relative flex items-center py-1 px-2 my-1 font-medium rounded-md cursor-pointer transition-colors group ${
        activeItem === text ? 'bg-gradient-to-tr from-yellow-200 to-yellow-100 text-yellow-800' : 'hover:bg-yellow-50 text-gray-200'
      }`}
    >
      {icon}
      <span className={`overflow-hidden transition-all ${expanded ? 'w-40 ml-3 text-sm' : 'w-0'}`}>{text}</span>
    </li>
  );
}
