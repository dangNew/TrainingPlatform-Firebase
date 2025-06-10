"use client"

import { useState, useEffect, useContext } from "react"
import { addDoc, collection, getDocs, query, orderBy, limit, where, doc, setDoc } from "firebase/firestore"
import { SidebarToggleContext } from "../components/LgNavbar";
import { db } from "../firebase.config"
import LgNavbar from "../components/LgNavbar"
import Sidebar from "../adviser/sidebar"
import Calendar from "react-calendar"
import "react-calendar/dist/Calendar.css"
import ReactQuill from "react-quill"
import "react-quill/dist/quill.snow.css"
import styled, { keyframes } from "styled-components"
import {
  FaBook,
  FaCheckCircle,
  FaMedal,
  FaClock,
  FaGraduationCap,
  FaCalendarAlt,
  FaPaperPlane,
  FaExclamationTriangle,
  FaTimes,
  FaInfoCircle,
} from "react-icons/fa"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts"

const MainContent = styled.div`
  flex: 1;
  padding: 2rem;
  background-color: #f5f7fa;
  border-radius: 8px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  margin-left: ${({ expanded }) => (expanded ? "270px" : "70px")};
  transition: margin-left 0.3s ease;
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`

const InputField = styled.div`
  margin-bottom: 1.5rem;
  position: relative;
`

const InputLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 0.5rem;
`

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s ease-in-out;
  background-color: #f9fafb;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`

const Select = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s ease-in-out;
  background-color: #f9fafb;
  appearance: none;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`

const Button = styled.button`
  width: 100%;
  padding: 0.75rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    background-color: #2563eb;
  }

  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }
`

// Animation for notification appearance
const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

// Pulse animation for the icon
const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
`

// Redesigned Success Message
const SuccessMessage = styled.div`
  margin-top: 1.5rem;
  padding: 1.25rem;
  background: linear-gradient(to right, #dcfce7, #f0fdf4);
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  animation: ${slideIn} 0.3s ease-out forwards;
  border-left: 4px solid #16a34a;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background-color: #16a34a;
  }

  .icon-wrapper {
    background-color: rgba(22, 163, 74, 0.2);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 1rem;
    flex-shrink: 0;
  }

  .icon {
    color: #16a34a;
    font-size: 1.25rem;
    animation: ${pulse} 1.5s infinite;
  }

  .content {
    flex: 1;
  }

  .title {
    font-weight: 600;
    color: #166534;
    margin-bottom: 0.25rem;
    font-size: 1rem;
  }

  .message {
    color: #14532d;
    font-size: 0.875rem;
  }

  .close-button {
    background: none;
    border: none;
    color: #16a34a;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
    margin-left: 0.5rem;

    &:hover {
      background-color: rgba(22, 163, 74, 0.1);
    }
  }
`

// Redesigned Error Message
const ErrorMessage = styled.div`
  margin-top: 1.5rem;
  padding: 1.25rem;
  background: linear-gradient(to right, #fee2e2, #fef2f2);
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  animation: ${slideIn} 0.3s ease-out forwards;
  border-left: 4px solid #dc2626;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background-color: #dc2626;
  }

  .icon-wrapper {
    background-color: rgba(220, 38, 38, 0.2);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 1rem;
    flex-shrink: 0;
  }

  .icon {
    color: #dc2626;
    font-size: 1.25rem;
    animation: ${pulse} 1.5s infinite;
  }

  .content {
    flex: 1;
  }

  .title {
    font-weight: 600;
    color: #991b1b;
    margin-bottom: 0.25rem;
    font-size: 1rem;
  }

  .message {
    color: #7f1d1d;
    font-size: 0.875rem;
  }

  .close-button {
    background: none;
    border: none;
    color: #dc2626;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
    margin-left: 0.5rem;

    &:hover {
      background-color: rgba(220, 38, 38, 0.1);
    }
  }
`

// Info Message for additional notifications
const InfoMessage = styled.div`
  margin-top: 1.5rem;
  padding: 1.25rem;
  background: linear-gradient(to right, #dbeafe, #eff6ff);
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  animation: ${slideIn} 0.3s ease-out forwards;
  border-left: 4px solid #2563eb;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background-color: #2563eb;
  }

  .icon-wrapper {
    background-color: rgba(37, 99, 235, 0.2);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 1rem;
    flex-shrink: 0;
  }

  .icon {
    color: #2563eb;
    font-size: 1.25rem;
    animation: ${pulse} 1.5s infinite;
  }

  .content {
    flex: 1;
  }

  .title {
    font-weight: 600;
    color: #1e40af;
    margin-bottom: 0.25rem;
    font-size: 1rem;
  }

  .message {
    color: #1e3a8a;
    font-size: 0.875rem;
  }

  .close-button {
    background: none;
    border: none;
    color: #2563eb;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
    margin-left: 0.5rem;

    &:hover {
      background-color: rgba(37, 99, 235, 0.1);
    }
  }
`

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

const Dashboard = () => {
  const [announcements, setAnnouncements] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [recentActivities, setRecentActivities] = useState([])
  const [quickStats, setQuickStats] = useState({})
  const [newAnnouncement, setNewAnnouncement] = useState({
    subject: "",
    content: "",
    date: "",
    expiryDate: "",
    attachment: null,
    targetAudience: "All",
  })
  const [users, setUsers] = useState([])
  const [loggedInUser, setLoggedInUser] = useState(null)
  const [darkMode, setDarkMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const [notifications, setNotifications] = useState([])
  const [showInfoMessage, setShowInfoMessage] = useState(false)
  const { expanded } = useContext(SidebarToggleContext);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const q = query(collection(db, "announcements"), orderBy("timestamp", "desc"))
        const querySnapshot = await getDocs(q)
        const announcementsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setAnnouncements(announcementsData)
      } catch (error) {
        console.error("Error fetching announcements:", error)
      }
    }

    const fetchLeaderboard = async () => {
      try {
        const q = query(collection(db, "learner"), orderBy("score", "desc"), limit(5))
        const querySnapshot = await getDocs(q)
        const leaderboardData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setLeaderboard(leaderboardData)
      } catch (error) {
        console.error("Error fetching leaderboard:", error)
      }
    }

    const fetchRecentActivities = async () => {
      try {
        const q = query(collection(db, "activities"), orderBy("timestamp", "desc"), limit(5))
        const querySnapshot = await getDocs(q)
        const activitiesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setRecentActivities(activitiesData)
      } catch (error) {
        console.error("Error fetching recent activities:", error)
      }
    }

    const fetchQuickStats = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"))
        const coursesSnapshot = await getDocs(collection(db, "courses"))

        const quickStats = {
          totalUsers: usersSnapshot.size,
          activeCourses: coursesSnapshot.size,
          recentLogins: usersSnapshot.docs.filter(
            (doc) => doc.data().lastLogin > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          ).length,
        }
        setQuickStats(quickStats)
      } catch (error) {
        console.error("Error fetching quick stats:", error)
      }
    }

    const fetchUsers = async () => {
      try {
        const users = []

        const fetchFromCollection = async (collectionName) => {
          const querySnapshot = await getDocs(collection(db, collectionName))
          const usersData = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          users.push(...usersData)
        }

        await fetchFromCollection("User")
        await fetchFromCollection("learner")
        await fetchFromCollection("intern")

        setUsers(users)
      } catch (error) {
        console.error("Error fetching users:", error)
      }
    }

    const fetchLoggedInUser = async () => {
      try {
        const userId = localStorage.getItem("userId")
        if (userId) {
          const userDoc = await getDocs(query(collection(db, "users"), where("id", "==", userId)))
          if (!userDoc.empty) {
            setLoggedInUser(userDoc.docs[0].data())
          }
        }
      } catch (error) {
        console.error("Error fetching logged-in user:", error)
      }
    }

    fetchAnnouncements()
    fetchLeaderboard()
    fetchRecentActivities()
    fetchQuickStats()
    fetchUsers()
    fetchLoggedInUser()

    // Show info message after 2 seconds
    const infoTimer = setTimeout(() => {
      setShowInfoMessage(true)
    }, 2000)

    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => {
      clearInterval(timer)
      clearTimeout(infoTimer)
    }
  }, [])

  const validateForm = () => {
    const errors = {}
    if (!newAnnouncement.subject.trim()) {
      errors.subject = "Title is required"
    }
    if (!newAnnouncement.content.trim()) {
      errors.content = "Message is required"
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const ensureAnnouncementsCollectionExists = async () => {
    try {
      const snapshot = await getDocs(collection(db, "announcements"))
      if (snapshot.empty) {
        // Create a dummy document to ensure the collection exists
        await setDoc(doc(collection(db, "announcements"), "dummy"), {
          dummy: true,
        })
        console.log("Created 'announcements' collection")
      }
    } catch (error) {
      console.error("Error ensuring 'announcements' collection exists:", error)
    }
  }

  const handleAddAnnouncement = async () => {
    if (!validateForm()) {
      console.log("Form validation failed")
      return
    }

    setLoading(true)
    setSuccess(false)
    setError(false)
    setShowInfoMessage(false)

    const announcement = {
      ...newAnnouncement,
      timestamp: new Date(),
    }

    try {
      console.log("Attempting to add announcement:", announcement)
      await ensureAnnouncementsCollectionExists()
      await addDoc(collection(db, "announcements"), announcement)
      setAnnouncements([...announcements, { id: Date.now(), ...announcement }])
      setSuccess(true)

      // Add to notifications
      setNotifications([
        ...notifications,
        {
          id: Date.now(),
          type: "success",
          title: "Announcement Published",
          message: `Your announcement "${announcement.subject}" has been published successfully.`,
          timestamp: new Date(),
        },
      ])

      console.log("Announcement added successfully")

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccess(false)
      }, 5000)
    } catch (error) {
      setError(true)

      // Add to notifications
      setNotifications([
        ...notifications,
        {
          id: Date.now(),
          type: "error",
          title: "Publication Failed",
          message: "There was an error publishing your announcement. Please try again.",
          timestamp: new Date(),
        },
      ])

      console.error("Error adding announcement:", error)

      // Auto-hide error message after 5 seconds
      setTimeout(() => {
        setError(false)
      }, 5000)
    } finally {
      setLoading(false)
      setNewAnnouncement({
        subject: "",
        content: "",
        date: "",
        expiryDate: "",
        attachment: null,
        targetAudience: "All",
      })
    }
  }

  const handleCloseNotification = (type) => {
    if (type === "success") {
      setSuccess(false)
    } else if (type === "error") {
      setError(false)
    } else if (type === "info") {
      setShowInfoMessage(false)
    }
  }

  const handleDownloadReport = () => {
    const csvContent = `Total Users,Active Courses,Recent Logins\n${quickStats.totalUsers},${quickStats.activeCourses},${quickStats.recentLogins}`
    const blob = new Blob([csvContent], { type: "text/csv" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "dashboard_report.csv"
    link.click()
  }

  const prepareProgressChartData = () => {
    return [
      { name: "Completed", value: quickStats.completedCourses || 0 },
      { name: "In Progress", value: quickStats.inProgressCourses || 0 },
      { name: "Not Started", value: quickStats.notStartedCourses || 0 },
    ]
  }

  const prepareModuleChartData = () => {
    return [
      { name: "Completed", value: quickStats.completedModules || 0 },
      { name: "Remaining", value: quickStats.remainingModules || 0 },
    ]
  }

  const prepareCourseProgressData = () => {
    return [
      { name: "Course 1", progress: quickStats.course1Progress || 0 },
      { name: "Course 2", progress: quickStats.course2Progress || 0 },
    ]
  }

  return (
    <div className="flex flex-col h-screen">
      <LgNavbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MainContent expanded={expanded}>
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl mr-4">
                {loggedInUser ? loggedInUser.firstName.charAt(0).toUpperCase() : "D"}
              </div>
              <div>
                <h1 className="text-2xl font-bold">Welcome, {loggedInUser ? loggedInUser.firstName : "Guest"}</h1>
                <p className="text-gray-500">{loggedInUser ? loggedInUser.email : "Not logged in"}</p>
              </div>
            </div>
            <div className="bg-blue-900 px-4 py-2 rounded-lg text-white shadow-md">
              <p className="text-sm">
                Last login: {loggedInUser ? new Date(loggedInUser.lastLogin.toDate()).toLocaleString() : "N/A"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-200 rounded-xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <FaBook className="text-blue-500 text-2xl mr-3" />
                <h2 className="text-xl font-semibold">Course Progress</h2>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-3xl font-bold">{quickStats.completedCourses || 0}</p>
                  <p className="text-gray-500">Completed</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">{quickStats.inProgressCourses || 0}</p>
                  <p className="text-gray-500">In Progress</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">{quickStats.totalCourses || 0}</p>
                  <p className="text-gray-500">Total</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-200 rounded-xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <FaCheckCircle className="text-green-500 text-2xl mr-3" />
                <h2 className="text-xl font-semibold">Module Completion</h2>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-3xl font-bold">{quickStats.completedModules || 0}</p>
                  <p className="text-gray-500">Completed</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">{quickStats.remainingModules || 0}</p>
                  <p className="text-gray-500">Remaining</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">{quickStats.totalModules || 0}</p>
                  <p className="text-gray-500">Total</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-200 rounded-xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <FaMedal className="text-yellow-500 text-2xl mr-3" />
                <h2 className="text-xl font-semibold">Certificates</h2>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-3xl font-bold">{quickStats.earnedCertificates || 0}</p>
                  <p className="text-gray-500">Earned</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">{quickStats.availableCertificates || 0}</p>
                  <p className="text-gray-500">Available</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Course Progress</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={prepareProgressChartData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {prepareProgressChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Module Completion</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={prepareModuleChartData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {prepareModuleChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Top Courses Progress</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={prepareCourseProgressData()}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip formatter={(value) => [`${value}%`, "Progress"]} />
                    <Bar dataKey="progress" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <FaClock className="text-blue-500 text-xl mr-3" />
                <h2 className="text-xl font-semibold">Recent Activity</h2>
              </div>
              {recentActivities.length > 0 ? (
                <ul className="space-y-4">
                  {recentActivities.map((activity) => (
                    <li key={activity.id} className="border-l-2 border-blue-500 pl-4 py-1">
                      <p className="font-medium">{activity.activity}</p>
                      <p className="text-xs text-gray-600">
                        {new Date(activity.timestamp.seconds * 1000).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No recent activity found.</p>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <FaGraduationCap className="text-green-500 text-xl mr-3" />
                <h2 className="text-xl font-semibold">Your Courses</h2>
              </div>
              {announcements.length > 0 ? (
                <ul className="space-y-4">
                  {announcements.slice(0, 5).map((announcement) => (
                    <li key={announcement.id} className="border-b border-gray-200 pb-3 last:border-0">
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-medium">{announcement.subject}</p>
                        <span className="text-sm bg-blue-900 px-2 py-1 rounded">50% Complete</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: "50%" }}></div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No courses found.</p>
              )}
              {announcements.length > 5 && (
                <button
                  onClick={() => (window.location.href = "/courses")}
                  className="mt-4 text-blue-400 hover:text-blue-300 text-sm"
                >
                  View all courses ({announcements.length})
                </button>
              )}
            </div>
          </div>

          <Card>
            <SectionTitle>
              <FaPaperPlane className="text-blue-500" />
              Create Announcement
            </SectionTitle>

            <InputField>
              <InputLabel>📌 Title</InputLabel>
              <Input
                type="text"
                value={newAnnouncement.subject}
                onChange={(e) =>
                  setNewAnnouncement({
                    ...newAnnouncement,
                    subject: e.target.value,
                  })
                }
                placeholder="Enter title"
                aria-invalid={formErrors.subject ? "true" : "false"}
                aria-describedby={formErrors.subject ? "subject-error" : undefined}
              />
              {formErrors.subject && (
                <div id="subject-error" className="text-red-500 text-sm mt-1">
                  {formErrors.subject}
                </div>
              )}
            </InputField>

            <InputField>
              <InputLabel>🧾 Message</InputLabel>
              <ReactQuill
                value={newAnnouncement.content}
                onChange={(content) =>
                  setNewAnnouncement({
                    ...newAnnouncement,
                    content: content,
                  })
                }
                placeholder="Write your announcement here..."
                className="h-48 mb-4"
                aria-invalid={formErrors.content ? "true" : "false"}
                aria-describedby={formErrors.content ? "content-error" : undefined}
              />
              {formErrors.content && (
                <div id="content-error" className="text-red-500 text-sm mt-1">
                  {formErrors.content}
                </div>
              )}
            </InputField>

            <InputField>
              <InputLabel>🗂️ Audience</InputLabel>
              <Select
                value={newAnnouncement.targetAudience}
                onChange={(e) =>
                  setNewAnnouncement({
                    ...newAnnouncement,
                    targetAudience: e.target.value,
                  })
                }
              >
                <option value="All">All</option>
                <option value="User">Users</option>
                <option value="learner">Learners</option>
                <option value="intern">Interns</option>
              </Select>
            </InputField>

            <InputField>
              <InputLabel>📅 Post Date</InputLabel>
              <Input
                type="date"
                value={newAnnouncement.date}
                onChange={(e) =>
                  setNewAnnouncement({
                    ...newAnnouncement,
                    date: e.target.value,
                  })
                }
              />
            </InputField>

            <InputField>
              <InputLabel>📆 Expiry Date</InputLabel>
              <Input
                type="date"
                value={newAnnouncement.expiryDate}
                onChange={(e) =>
                  setNewAnnouncement({
                    ...newAnnouncement,
                    expiryDate: e.target.value,
                  })
                }
              />
            </InputField>

            <InputField>
              <InputLabel>📎 Attachment (Optional)</InputLabel>
              <Input
                type="file"
                onChange={(e) =>
                  setNewAnnouncement({
                    ...newAnnouncement,
                    attachment: e.target.files[0],
                  })
                }
              />
            </InputField>

            <Button onClick={handleAddAnnouncement} disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Publishing...
                </>
              ) : (
                <>
                  <FaPaperPlane className="mr-2" />
                  Publish Announcement
                </>
              )}
            </Button>

            {/* Redesigned Success Message */}
            {success && (
              <SuccessMessage>
                <div className="icon-wrapper">
                  <FaCheckCircle className="icon" />
                </div>
                <div className="content">
                  <div className="title">Announcement Published Successfully!</div>
                  <div className="message">
                    Your announcement has been sent to{" "}
                    {newAnnouncement.targetAudience === "All" ? "all users" : newAnnouncement.targetAudience + "s"}.
                  </div>
                </div>
                <button
                  className="close-button"
                  onClick={() => handleCloseNotification("success")}
                  aria-label="Close notification"
                >
                  <FaTimes />
                </button>
              </SuccessMessage>
            )}

            {/* Redesigned Error Message */}
            {error && (
              <ErrorMessage>
                <div className="icon-wrapper">
                  <FaExclamationTriangle className="icon" />
                </div>
                <div className="content">
                  <div className="title">Publication Failed</div>
                  <div className="message">
                    There was an error publishing your announcement. Please check your connection and try again.
                  </div>
                </div>
                <button
                  className="close-button"
                  onClick={() => handleCloseNotification("error")}
                  aria-label="Close notification"
                >
                  <FaTimes />
                </button>
              </ErrorMessage>
            )}

            {/* Info Message */}
            {showInfoMessage && (
              <InfoMessage>
                <div className="icon-wrapper">
                  <FaInfoCircle className="icon" />
                </div>
                <div className="content">
                  <div className="title">Quick Tip</div>
                  <div className="message">
                    You can schedule announcements by setting a future post date. The system will automatically publish
                    it at the specified time.
                  </div>
                </div>
                <button
                  className="close-button"
                  onClick={() => handleCloseNotification("info")}
                  aria-label="Close notification"
                >
                  <FaTimes />
                </button>
              </InfoMessage>
            )}
          </Card>

          <Card>
            <SectionTitle>
              <FaClock className="text-blue-500" />
              Announcement History
            </SectionTitle>
            <ul>
              {announcements.map((announcement) => (
                <li key={announcement.id} className="mb-4 p-4 border rounded shadow">
                  <h3 className="text-lg font-semibold">{announcement.subject}</h3>
                  <p className="text-sm text-gray-600">{announcement.content}</p>
                  <p className="text-xs text-gray-500">Sent to: {announcement.targetAudience}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(announcement.timestamp.seconds * 1000).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          </Card>

          <div className="grid grid-cols-2 gap-6 mt-6">
            <Card>
              <SectionTitle>
                <FaCalendarAlt className="text-blue-500" />
                Calendar
              </SectionTitle>
              <Calendar />
            </Card>

            <Card>
              <SectionTitle>
                <FaMedal className="text-yellow-500" />
                Leaderboard
              </SectionTitle>
              <ul className="mt-2">
                {leaderboard.map((entry) => (
                  <li key={entry.id} className="text-sm mt-2">
                    {entry.name}: {entry.score} points
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card>
            <SectionTitle>
              <FaBook className="text-blue-500" />
              Quick Stats
            </SectionTitle>
            <div className="mt-2">
              <p>Total Users: {quickStats.totalUsers}</p>
              <p>Active Courses: {quickStats.activeCourses}</p>
              <p>Recent Logins: {quickStats.recentLogins}</p>
            </div>
            <Button onClick={handleDownloadReport}>
              <FaPaperPlane className="mr-2" />
              Download Report
            </Button>
          </Card>

          <Card>
            <SectionTitle>
              <FaClock className="text-blue-500" />
              Recent Activities
            </SectionTitle>
            <ul className="mt-2">
              {recentActivities.map((activity) => (
                <li key={activity.id} className="text-sm mt-2">
                  {activity.activity} - {new Date(activity.timestamp.seconds * 1000).toLocaleString()}
                </li>
              ))}
            </ul>
          </Card>
        </MainContent>
      </div>
    </div>
  )
}

export default Dashboard
