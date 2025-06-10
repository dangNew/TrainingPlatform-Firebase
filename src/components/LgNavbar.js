// components/LgNavbar.js
import React, { useState, useEffect, useRef, useContext } from "react";
import { Menu, X, Search, Bell, MessageSquare, ChevronDown, Settings, LifeBuoy, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase.config";
import logo from "../assets/logo1.jpg";

// Create a context for sidebar state that can be used across components
export const SidebarToggleContext = React.createContext({
  expanded: true,
  setExpanded: () => {},
});

const LNavbar = () => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [user] = useAuthState(auth);
  const [userData, setUserData] = useState({
    fullName: "",
    photoURL: {
      url: "",
    },
  });
  const [announcements, setAnnouncements] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const notificationDropdownRef = useRef(null);

  const { expanded, setExpanded } = useContext(SidebarToggleContext);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      // Check users collection
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setUserData({
          fullName: userData.fullName,
          photoURL: userData.photoURL || { url: "" },
        });
      } else {
        // If not found in users collection, try learner collection
        const learnerRef = doc(db, "learner", user.uid);
        const learnerSnap = await getDoc(learnerRef);

        if (learnerSnap.exists()) {
          setUserData(learnerSnap.data());
        } else {
          // If not found in learner collection, try intern collection
          const internRef = doc(db, "intern", user.uid);
          const internSnap = await getDoc(internRef);

          if (internSnap.exists()) {
            setUserData(internSnap.data());
          } else {
            setUserData({
              fullName: user.displayName || "User",
              photoURL: {
                url: user.photoURL || "",
              },
            });
          }
        }
      }
    };

    fetchUserData();
  }, [user]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const today = new Date().toISOString().split('T')[0];
      const announcementsRef = collection(db, "announcements");
      const q = query(announcementsRef, where("date", ">=", today));
      const querySnapshot = await getDocs(q);
      const fetchedAnnouncements = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Load viewed announcements from local storage
      const viewedAnnouncements = JSON.parse(localStorage.getItem('viewedAnnouncements') || '[]');

      // Filter out viewed announcements
      const unviewedAnnouncements = fetchedAnnouncements.filter(
        announcement => !viewedAnnouncements.includes(announcement.id)
      );

      setAnnouncements(unviewedAnnouncements);
    };

    fetchAnnouncements();
  }, []);

  const navigateToAnnouncement = (announcementId) => {
    // Add the clicked announcement ID to local storage
    const viewedAnnouncements = JSON.parse(localStorage.getItem('viewedAnnouncements') || '[]');
    if (!viewedAnnouncements.includes(announcementId)) {
      viewedAnnouncements.push(announcementId);
      localStorage.setItem('viewedAnnouncements', JSON.stringify(viewedAnnouncements));
    }

    // Remove the clicked announcement from the list
    setAnnouncements(announcements.filter(announcement => announcement.id !== announcementId));
    navigate(`/announcement/${announcementId}`);
    setNotificationDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) {
        setNotificationDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleSidebar = () => {
    setExpanded(!expanded);
  };

  const toggleNavbar = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setDropdownOpen(!dropdownOpen);
  };

  const toggleNotificationDropdown = (e) => {
    e.stopPropagation();
    setNotificationDropdownOpen(!notificationDropdownOpen);
  };

  const navigateToProfile = () => {
    navigate("/lprofile");
    setDropdownOpen(false);
    setMobileDrawerOpen(false);
  };

  const navigateToSettings = () => {
    navigate("/settings");
    setDropdownOpen(false);
    setMobileDrawerOpen(false);
  };

  const navigateToHelp = () => {
    navigate("/help");
    setDropdownOpen(false);
    setMobileDrawerOpen(false);
  };

  const handleLogout = () => {
    auth.signOut().then(() => {
      navigate("/");
      setDropdownOpen(false);
      setMobileDrawerOpen(false);
    });
  };

  const getProfileImageUrl = () => {
    if (userData.photoURL?.url) {
      return userData.photoURL.url;
    } else if (user?.photoURL) {
      return user.photoURL;
    }
    return "/placeholder.svg";
  };

  // Check if the current route is the profile page
  const isProfilePage = location.pathname === "/lprofile";

  return (
    <nav className="sticky top-0 z-50 py-6 bg-[#201E43] text-white">
      <div className="px-4 relative text-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center flex-shrink-0">
            {!isProfilePage && (
              <button onClick={toggleSidebar} className="p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 mr-4 ml-0">
                <Menu className="text-gray-200" size={20} />
              </button>
            )}
            <img className="h-16 w-16 mr-3 rounded-full object-cover border-2 border-gray-300" src={logo} alt="logo" />
            <span className="text-2xl font-medium tracking-tight">WealthFinancials</span>
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <div className="relative" ref={notificationDropdownRef}>
              <Bell size={20} className="cursor-pointer" onClick={toggleNotificationDropdown} />
              {announcements.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {announcements.length}
                </span>
              )}
              {notificationDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-50">
                  {announcements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      onClick={() => navigateToAnnouncement(announcement.id)}
                    >
                      <p className="font-bold">{announcement.subject}</p>
                      <p className="text-xs text-gray-500">{announcement.date}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative" ref={dropdownRef}>
              <div className="flex items-center gap-2 cursor-pointer" onClick={toggleDropdown}>
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <img src={getProfileImageUrl()} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <span className="font-medium">{userData.fullName || user?.displayName || "User"}</span>
                <ChevronDown size={16} className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
              </div>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <div className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer" onClick={navigateToProfile}>
                    <div className="w-6 h-6 rounded-full overflow-hidden">
                      <img src={getProfileImageUrl()} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                    <span>Profile</span>
                  </div>
                  <hr className="my-1 border-gray-200" />
                  <div className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer" onClick={navigateToSettings}>
                    <Settings size={16} />
                    <span>Settings</span>
                  </div>
                  <hr className="my-1 border-gray-200" />
                  <div className="px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2 cursor-pointer" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>Logout</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:hidden flex flex-col justify-end">
            <button onClick={toggleNavbar}>{mobileDrawerOpen ? <X /> : <Menu />}</button>
          </div>
        </div>

        {mobileDrawerOpen && (
          <div style={{ background: "white", position: "fixed", right: 0, zIndex: 20, width: "100%", padding: "3rem", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", color: "black" }} className="lg:hidden">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <img src={getProfileImageUrl()} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <span className="font-medium">{userData.fullName || user?.displayName || "User"}</span>
            </div>
            <div className="flex gap-6 mt-4 mb-6">
              <Bell size={24} className="cursor-pointer" onClick={toggleNotificationDropdown} />
              <MessageSquare size={24} className="cursor-pointer" />
            </div>
            <div className="w-full border-t border-gray-200 pt-4">
              <div className="flex items-center gap-2 py-3 cursor-pointer" onClick={navigateToProfile}>
                <div className="w-6 h-6 rounded-full overflow-hidden">
                  <img src={getProfileImageUrl()} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <span>Profile</span>
              </div>
              <div className="flex items-center gap-2 py-3 cursor-pointer" onClick={navigateToSettings}>
                <Settings size={20} />
                <span>Settings</span>
              </div>
              <div className="flex items-center gap-2 py-3 cursor-pointer" onClick={navigateToHelp}>
                <LifeBuoy size={20} />
                <span>Help</span>
              </div>
              <div className="flex items-center gap-2 py-3 text-red-600 cursor-pointer" onClick={handleLogout}>
                <LogOut size={20} />
                <span>Logout</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default LNavbar;
