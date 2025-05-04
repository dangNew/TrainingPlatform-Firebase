import React, { useState, useEffect } from "react";
import {
  addDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../firebase.config";
import Header from "../Dashboard/Header";
import Sidebar from "../adviser/sidebar";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import styled from "styled-components";

const MainContent = styled.div`
  flex: 1;
  padding: 2rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  margin-left: 10px;
`;

const Dashboard = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [recentActivities, setRecentActivities] = useState([]);
  const [quickStats, setQuickStats] = useState({});
  const [newAnnouncement, setNewAnnouncement] = useState({
    to: "",
    subject: "",
    content: "",
    date: "",
    attachment: null,
    targetAudience: "All", // Default to 'All'
  });
  const [users, setUsers] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const q = query(
        collection(db, "announcements"),
        orderBy("timestamp", "desc")
      );
      const querySnapshot = await getDocs(q);
      const announcementsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAnnouncements(announcementsData);
    };

    const fetchLeaderboard = async () => {
      const q = query(
        collection(db, "learner"),
        orderBy("score", "desc"),
        limit(5)
      );
      const querySnapshot = await getDocs(q);
      const leaderboardData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLeaderboard(leaderboardData);
    };

    const fetchRecentActivities = async () => {
      const q = query(
        collection(db, "activities"),
        orderBy("timestamp", "desc"),
        limit(5)
      );
      const querySnapshot = await getDocs(q);
      const activitiesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRecentActivities(activitiesData);
    };

    const fetchQuickStats = async () => {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const coursesSnapshot = await getDocs(collection(db, "courses"));

      const quickStats = {
        totalUsers: usersSnapshot.size,
        activeCourses: coursesSnapshot.size,
        recentLogins: usersSnapshot.docs.filter(
          (doc) =>
            doc.data().lastLogin >
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
      };
      setQuickStats(quickStats);
    };

    const fetchUsers = async () => {
      const users = [];

      const fetchFromCollection = async (collectionName) => {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const usersData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        users.push(...usersData);
      };

      await fetchFromCollection("User");
      await fetchFromCollection("learner");
      await fetchFromCollection("intern");

      setUsers(users);
    };

    fetchAnnouncements();
    fetchLeaderboard();
    fetchRecentActivities();
    fetchQuickStats();
    fetchUsers();

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAddAnnouncement = async () => {
    if (
      newAnnouncement.subject.trim() === "" ||
      newAnnouncement.content.trim() === "" ||
      newAnnouncement.to.trim() === ""
    )
      return;

    setLoading(true);
    setSuccess(false);
    setError(false);

    const announcement = {
      ...newAnnouncement,
      timestamp: new Date(),
    };

    try {
      await addDoc(collection(db, "announcements"), announcement);
      setAnnouncements([...announcements, { id: Date.now(), ...announcement }]);
      setSuccess(true);
    } catch (error) {
      setError(true);
      console.error("Error adding announcement:", error);
    } finally {
      setLoading(false);
      setNewAnnouncement({
        to: "",
        subject: "",
        content: "",
        date: "",
        attachment: null,
        targetAudience: "All",
      });
    }
  };

  const handleDownloadReport = () => {
    const csvContent = `Total Users,Active Courses,Recent Logins\n${quickStats.totalUsers},${quickStats.activeCourses},${quickStats.recentLogins}`;
    const blob = new Blob([csvContent], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "dashboard_report.csv";
    link.click();
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <MainContent>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-semibold">Welcome Back, Professor!</h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="px-4 py-2 bg-gray-700 text-white rounded-md"
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>

        <div className="mt-4 text-xl font-semibold">
          {currentTime.toLocaleTimeString()}
        </div>

        <div className="grid grid-cols-3 gap-6 mt-6">
          <div className="bg-red-500 text-white p-6 rounded-lg shadow-lg cursor-pointer">
            <h2 className="text-lg font-semibold">Courses</h2>
            <p className="text-sm">Manage your courses</p>
          </div>

          <div className="bg-blue-500 text-white p-6 rounded-lg shadow-lg cursor-pointer">
            <h2 className="text-lg font-semibold">Enrolled Courses</h2>
            <p className="text-sm">Track student progress</p>
          </div>

          <div className="bg-black text-white p-6 rounded-lg shadow-lg cursor-pointer">
            <h2 className="text-lg font-semibold">Achievements</h2>
            <p className="text-sm">View student milestones</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
          <h2 className="text-2xl font-bold mb-4">Create Announcement</h2>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              To
            </label>
            <input
              type="text"
              value={newAnnouncement.to}
              onChange={(e) =>
                setNewAnnouncement({
                  ...newAnnouncement,
                  to: e.target.value,
                })
              }
              placeholder="Enter recipient email"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Subject
            </label>
            <input
              type="text"
              value={newAnnouncement.subject}
              onChange={(e) =>
                setNewAnnouncement({
                  ...newAnnouncement,
                  subject: e.target.value,
                })
              }
              placeholder="Enter subject"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Content
            </label>
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
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Date to Publish
            </label>
            <input
              type="date"
              value={newAnnouncement.date}
              onChange={(e) =>
                setNewAnnouncement({
                  ...newAnnouncement,
                  date: e.target.value,
                })
              }
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Attachment (optional)
            </label>
            <input
              type="file"
              onChange={(e) =>
                setNewAnnouncement({
                  ...newAnnouncement,
                  attachment: e.target.files[0],
                })
              }
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Target Audience
            </label>
            <select
              value={newAnnouncement.targetAudience}
              onChange={(e) =>
                setNewAnnouncement({
                  ...newAnnouncement,
                  targetAudience: e.target.value,
                })
              }
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="All">All</option>
              <option value="User">Users</option>
              <option value="learner">Learners</option>
              <option value="intern">Interns</option>
            </select>
          </div>
          <button
            onClick={handleAddAnnouncement}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading}
          >
            {loading ? "Publishing..." : "Publish Announcement"}
          </button>
          {success && (
            <p className="text-green-500 mt-4">
              Announcement sent successfully!
            </p>
          )}
          {error && (
            <p className="text-red-500 mt-4">
              Failed to send announcement. Please try again.
            </p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
          <h2 className="text-2xl font-bold mb-4">Announcement History</h2>
          <ul>
            {announcements.map((announcement) => (
              <li
                key={announcement.id}
                className="mb-4 p-4 border rounded shadow"
              >
                <h3 className="text-lg font-semibold">
                  {announcement.subject}
                </h3>
                <p className="text-sm text-gray-600">{announcement.content}</p>
                <p className="text-xs text-gray-500">
                  Sent to: {announcement.targetAudience}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(
                    announcement.timestamp.seconds * 1000
                  ).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-6 mt-6">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold">Calendar</h2>
            <Calendar />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold">🏆 Leaderboard</h2>
            <ul className="mt-2">
              {leaderboard.map((entry) => (
                <li key={entry.id} className="text-sm mt-2">
                  {entry.name}: {entry.score} points
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
          <h2 className="text-lg font-semibold">📊 Quick Stats</h2>
          <div className="mt-2">
            <p>Total Users: {quickStats.totalUsers}</p>
            <p>Active Courses: {quickStats.activeCourses}</p>
            <p>Recent Logins: {quickStats.recentLogins}</p>
          </div>
          <button
            onClick={handleDownloadReport}
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md"
          >
            Download Report
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
          <h2 className="text-lg font-semibold">🕒 Recent Activities</h2>
          <ul className="mt-2">
            {recentActivities.map((activity) => (
              <li key={activity.id} className="text-sm mt-2">
                {activity.activity} -{" "}
                {new Date(activity.timestamp.seconds * 1000).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      </MainContent>
    </div>
  );
};

export default Dashboard;
