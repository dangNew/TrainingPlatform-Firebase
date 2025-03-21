import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const mockAnnouncements = [
        { id: 1, title: "New Course Available", content: "Check out the new course on AI!" },
        { id: 2, title: "Maintenance Notice", content: "System maintenance scheduled for this weekend." },
      ];
      setAnnouncements(mockAnnouncements);
    };

    const fetchLeaderboard = async () => {
      const mockLeaderboard = [
        { id: 1, name: "John Doe", score: 95 },
        { id: 2, name: "Jane Smith", score: 90 },
        { id: 3, name: "Alice Johnson", score: 88 },
      ];
      setLeaderboard(mockLeaderboard);
    };

    const fetchRecentActivities = async () => {
      const mockActivities = [
        { id: 1, activity: "User enrolled in Course X", timestamp: "2023-10-01T10:00:00Z" },
        { id: 2, activity: "Quiz completed by John Doe", timestamp: "2023-10-02T12:30:00Z" },
      ];
      setRecentActivities(mockActivities);
    };

    const fetchQuickStats = async () => {
      const mockStats = {
        totalUsers: 150,
        activeCourses: 20,
        recentLogins: 45,
      };
      setQuickStats(mockStats);
    };

    fetchAnnouncements();
    fetchLeaderboard();
    fetchRecentActivities();
    fetchQuickStats();

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <div className="fixed top-0 left-0 w-full z-50">
        <Header />
      </div>

      <div className="flex flex-1 pt-16">
        <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white shadow-md">
          <Sidebar />
        </div>

        <div className="flex-1 ml-64 p-6 overflow-y-auto h-[calc(100vh-4rem)]">
          <h1 className="text-3xl font-semibold text-gray-700">
            Welcome Back, Professor!
          </h1>

          <div className="mt-4 text-xl font-semibold text-gray-600">
            {currentTime.toLocaleTimeString()}
          </div>

          <div className="grid grid-cols-3 gap-6 mt-6">
            <div className="bg-red-500 text-white p-6 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition duration-300">
              <h2 className="text-lg font-semibold">Courses</h2>
              <p className="text-sm">Manage your courses</p>
            </div>

            <div className="bg-blue-500 text-white p-6 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition duration-300">
              <h2 className="text-lg font-semibold">Enrolled Courses</h2>
              <p className="text-sm">Track student progress</p>
            </div>

            <div className="bg-black text-white p-6 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition duration-300">
              <h2 className="text-lg font-semibold">Achievements</h2>
              <p className="text-sm">View student milestones</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
            <h2 className="text-lg font-semibold text-gray-700">Calendar</h2>
            <Calendar />
          </div>

          <div className="grid grid-cols-2 gap-6 mt-6">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-lg font-semibold text-gray-700">📢 Announcements</h2>
              <ul className="mt-2">
                {announcements.map((announcement) => (
                  <li key={announcement.id} className="text-sm text-gray-600 mt-2">
                    <strong>{announcement.title}:</strong> {announcement.content}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-lg font-semibold text-gray-700">🏆 Leaderboard</h2>
              <ul className="mt-2">
                {leaderboard.map((entry) => (
                  <li key={entry.id} className="text-sm text-gray-600 mt-2">
                    {entry.name}: {entry.score} points
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
            <h2 className="text-lg font-semibold text-gray-700">📊 Quick Stats</h2>
            <div className="mt-2">
              <p>Total Users: {quickStats.totalUsers}</p>
              <p>Active Courses: {quickStats.activeCourses}</p>
              <p>Recent Logins: {quickStats.recentLogins}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg mt-6">
            <h2 className="text-lg font-semibold text-gray-700">🕒 Recent Activities</h2>
            <ul className="mt-2">
              {recentActivities.map((activity) => (
                <li key={activity.id} className="text-sm text-gray-600 mt-2">
                  {activity.activity} - {new Date(activity.timestamp).toLocaleString()}
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
