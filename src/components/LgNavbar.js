"use client"

import React, { useState, useEffect, useRef } from "react"
import { Menu, X, Search, Bell, MessageSquare, ChevronDown, Settings, LifeBuoy, LogOut } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuthState } from "react-firebase-hooks/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "../firebase.config"
import logo from "../assets/logo1.jpg"

// Create a context for sidebar state that can be used across components
export const SidebarToggleContext = React.createContext({
  expanded: true,
  setExpanded: () => {},
})

const LNavbar = () => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [user] = useAuthState(auth)
  const [userData, setUserData] = useState({
    fullName: "",
    photoURL: {
      publicId: "",
      url: "",
    },
  })
  const navigate = useNavigate()
  const dropdownRef = useRef(null)

  // Access the sidebar context
  const { expanded, setExpanded } = React.useContext(SidebarToggleContext)

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return

      const learnerRef = doc(db, "learner", user.uid)
      const internRef = doc(db, "intern", user.uid)

      const [learnerSnap, internSnap] = await Promise.all([getDoc(learnerRef), getDoc(internRef)])

      if (learnerSnap.exists()) {
        setUserData(learnerSnap.data())
      } else if (internSnap.exists()) {
        setUserData(internSnap.data())
      } else {
        // If not found in either, fallback to displayName or default
        setUserData({
          fullName: user.displayName || "User",
          photoURL: {
            publicId: "",
            url: user.photoURL || "",
          },
        })
      }
    }

    fetchUserData()
  }, [user])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const toggleSidebar = () => {
    setExpanded(!expanded)
  }


  const toggleNavbar = () => {
    setMobileDrawerOpen(!mobileDrawerOpen)
  }

  const toggleDropdown = (e) => {
    e.stopPropagation()
    setDropdownOpen(!dropdownOpen)
  }

  const navigateToProfile = () => {
    navigate("/lprofile")
    setDropdownOpen(false)
    setMobileDrawerOpen(false)
  }

  const navigateToSettings = () => {
    navigate("/settings")
    setDropdownOpen(false)
    setMobileDrawerOpen(false)
  }

  const navigateToHelp = () => {
    navigate("/help")
    setDropdownOpen(false)
    setMobileDrawerOpen(false)
  }

  const handleLogout = () => {
    auth.signOut().then(() => {
      navigate("/")
      setDropdownOpen(false)
      setMobileDrawerOpen(false)
    })
  }

  // Get the profile image URL with fallback
  const getProfileImageUrl = () => {
    if (userData.photoURL?.url) {
      return userData.photoURL.url
    } else if (user?.photoURL) {
      return user.photoURL
    }
    return "/placeholder.svg"
  }

  return (
    <nav className="sticky top-0 z-50 py-6 bg-[#201E43] text-white">
      <div className="px-4 relative text-sm">
        <div className="flex justify-between items-center">
          {/* Logo and Brand Name - Left Side with Sidebar Toggle */}
          <div className="flex items-center flex-shrink-0">
            {/* Sidebar Toggle Button - moved more to the left with added margin */}
            <button onClick={toggleSidebar} className="p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 mr-4 ml-0">
              <Menu className="text-gray-200" size={20} />
            </button>

            {/* Logo - made bigger and circular */}
            <img
              className="h-16 w-16 mr-3 rounded-full object-cover border-2 border-gray-300"
              src={logo || "/placeholder.svg"}
              alt="logo"
            />
            <span className="text-2xl font-medium tracking-tight">WealthFinancials</span>
          </div>

          {/* Right Side Elements */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Search"
                className="pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-800"
              />
            </div>

            {/* Notification Icons */}
            <Bell size={20} className="cursor-pointer" />

            {/* Profile with Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <div className="flex items-center gap-2 cursor-pointer" onClick={toggleDropdown}>
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <img
                    src={getProfileImageUrl() || "/placeholder.svg"}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="font-medium">{userData.fullName || user?.displayName || "User"}</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </div>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <div
                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                    onClick={navigateToProfile}
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden">
                      <img
                        src={getProfileImageUrl() || "/placeholder.svg"}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span>Profile</span>
                  </div>
                  <hr className="my-1 border-gray-200" />
                  <div
                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                    onClick={navigateToSettings}
                  >
                    <Settings size={16} />
                    <span>Settings</span>
                  </div>
                  {/* <div
                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                    onClick={navigateToHelp}
                  >
                    <LifeBuoy size={16} />
                    <span>Help</span>
                  </div> */}
                  <hr className="my-1 border-gray-200" />
                  <div
                    className="px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex flex-col justify-end">
            <button onClick={toggleNavbar}>{mobileDrawerOpen ? <X /> : <Menu />}</button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileDrawerOpen && (
          <div
            style={{
              background: "white",
              position: "fixed",
              right: 0,
              zIndex: 20,
              width: "100%",
              padding: "3rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              color: "black",
            }}
            className="lg:hidden"
          >
            {/* Profile in Mobile View */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <img
                  src={getProfileImageUrl() || "/placeholder.svg"}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-medium">{userData.fullName || user?.displayName || "User"}</span>
            </div>

            {/* Search in Mobile View */}
            <div className="w-full mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Notification Icons in Mobile View */}
            <div className="flex gap-6 mt-4 mb-6">
              <Bell size={24} className="cursor-pointer" />
              <MessageSquare size={24} className="cursor-pointer" />
            </div>

            {/* Mobile Menu Options */}
            <div className="w-full border-t border-gray-200 pt-4">
              <div className="flex items-center gap-2 py-3 cursor-pointer" onClick={navigateToProfile}>
                <div className="w-6 h-6 rounded-full overflow-hidden">
                  <img
                    src={getProfileImageUrl() || "/placeholder.svg"}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
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
  )
}

export default LNavbar
