import React, { useState, useEffect } from "react";
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from "firebase/firestore";
import { db } from "../firebase.config";
import Header from "../Dashboard/Header";
import Sidebar from "../adviser/sidebar";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const Dashboard = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [recentActivities, setRecentActivities] = useState([]);
  const [quickStats, setQuickStats] = useState({});
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const q = query(collection(db, "announcements"), orderBy("timestamp", "desc"), limit(5));
      const querySnapshot = await getDocs(q);
      const announcementsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAnnouncements(announcementsData);
    };

    const fetchLeaderboard = async () => {
      const q = query(collection(db, "learner"), orderBy("score", "desc"), limit(5));
      const querySnapshot = await getDocs(q);
      const leaderboardData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLeaderboard(leaderboardData);
    };

    const fetchRecentActivities = async () => {
      const q = query(collection(db, "activities"), orderBy("timestamp", "desc"), limit(5));
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
        recentLogins: usersSnapshot.docs.filter(doc => doc.data().lastLogin > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length
      };
      setQuickStats(quickStats);
    };

    fetchAnnouncements();
    fetchLeaderboard();
    fetchRecentActivities();
    fetchQuickStats();

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAddAnnouncement = async () => {
    if (newAnnouncement.trim() === "") return;

    const announcement = {
      title: "New Announcement",
      content: newAnnouncement,
      timestamp: new Date()
    };

    await addDoc(collection(db, "announcements"), announcement);
    setAnnouncements([...announcements, { id: Date.now(), ...announcement }]);
    setNewAnnouncement("");
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
    <div className={`h-screen flex flex-col ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
      <div className="fixed top-0 left-0 w-full z-50">
        <Header />
      </div>

      <div className="flex flex-1 pt-16">
        <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white shadow-md">
          <Sidebar />
        </div>

        <div className="flex-1 ml-64 p-6 overflow-y-auto h-[calc(100vh-4rem)]">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-semibold">Welcome Back, Professor!</h1>
            <button onClick={() => setDarkMode(!darkMode)} className="px-4 py-2 bg-gray-700 text-white rounded-md">
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
            <h2 className="text-lg font-semibold">Calendar</h2>
            <Calendar />
          </div>

          <div className="grid grid-cols-2 gap-6 mt-6">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-lg font-semibold">📢 Announcements</h2>
              <ul className="mt-2">
                {announcements.map((announcement) => (
                  <li key={announcement.id} className="text-sm mt-2">
                    <strong>{announcement.title}:</strong> {announcement.content}
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <input
                  type="text"
                  value={newAnnouncement}
                  onChange={(e) => setNewAnnouncement(e.target.value)}
                  placeholder="Add new announcement..."
                  className="border px-2 py-1 w-full"
                />
                <button onClick={handleAddAnnouncement} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md">
                  Add Announcement
                </button>
              </div>
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
            <button onClick={handleDownloadReport} className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md">
              Download Report
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
            <h2 className="text-lg font-semibold">🕒 Recent Activities</h2>
            <ul className="mt-2">
              {recentActivities.map((activity) => (
                <li key={activity.id} className="text-sm mt-2">
                  {activity.activity} - {new Date(activity.timestamp.seconds * 1000).toLocaleString()}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
