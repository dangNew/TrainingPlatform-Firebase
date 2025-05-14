import React, { useState, useEffect } from "react";
import {
  addDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  doc,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase.config";
import LgNavbar from "../components/LgNavbar";
import Sidebar from "../adviser/sidebar";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import styled from "styled-components";
import {
  FaBook,
  FaCheckCircle,
  FaMedal,
  FaClock,
  FaGraduationCap,
  FaEnvelope,
  FaCalendarAlt,
  FaPaperclip,
  FaUsers,
  FaUserGraduate,
  FaUserTie,
  FaUser,
  FaChevronDown,
  FaPaperPlane,
  FaCheck,
  FaExclamationTriangle,
} from "react-icons/fa";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const MainContent = styled.div`
  flex: 1;
  padding: 2rem;
  background-color: #f5f7fa;
  border-radius: 8px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  margin-left: 10px;
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const InputField = styled.div`
  margin-bottom: 1.5rem;
  position: relative;
`;

const InputLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 0.5rem;
`;

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
`;

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
`;

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
`;

const SuccessMessage = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background-color: #dcfce7;
  border-left: 4px solid #16a34a;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ErrorMessage = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background-color: #fee2e2;
  border-left: 4px solid #dc2626;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

const Dashboard = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [recentActivities, setRecentActivities] = useState([]);
  const [quickStats, setQuickStats] = useState({});
  const [newAnnouncement, setNewAnnouncement] = useState({
    subject: "",
    content: "",
    date: "",
    expiryDate: "",
    attachment: null,
    targetAudience: "All",
  });
  const [users, setUsers] = useState([]);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
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
      } catch (error) {
        console.error("Error fetching announcements:", error);
      }
    };

    const fetchLeaderboard = async () => {
      try {
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
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      }
    };

    const fetchRecentActivities = async () => {
      try {
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
      } catch (error) {
        console.error("Error fetching recent activities:", error);
      }
    };

    const fetchQuickStats = async () => {
      try {
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
      } catch (error) {
        console.error("Error fetching quick stats:", error);
      }
    };

    const fetchUsers = async () => {
      try {
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
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    const fetchLoggedInUser = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (userId) {
          const userDoc = await getDocs(
            query(collection(db, "users"), where("id", "==", userId))
          );
          if (!userDoc.empty) {
            setLoggedInUser(userDoc.docs[0].data());
          }
        }
      } catch (error) {
        console.error("Error fetching logged-in user:", error);
      }
    };

    fetchAnnouncements();
    fetchLeaderboard();
    fetchRecentActivities();
    fetchQuickStats();
    fetchUsers();
    fetchLoggedInUser();

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const validateForm = () => {
    const errors = {};
    if (!newAnnouncement.subject.trim()) {
      errors.subject = "Title is required";
    }
    if (!newAnnouncement.content.trim()) {
      errors.content = "Message is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const ensureAnnouncementsCollectionExists = async () => {
    try {
      const snapshot = await getDocs(collection(db, "announcements"));
      if (snapshot.empty) {
        // Create a dummy document to ensure the collection exists
        await setDoc(doc(collection(db, "announcements"), "dummy"), {
          dummy: true,
        });
        console.log("Created 'announcements' collection");
      }
    } catch (error) {
      console.error("Error ensuring 'announcements' collection exists:", error);
    }
  };

  const handleAddAnnouncement = async () => {
    if (!validateForm()) {
      console.log("Form validation failed");
      return;
    }

    setLoading(true);
    setSuccess(false);
    setError(false);

    const announcement = {
      ...newAnnouncement,
      timestamp: new Date(),
    };

    try {
      console.log("Attempting to add announcement:", announcement);
      await ensureAnnouncementsCollectionExists();
      await addDoc(collection(db, "announcements"), announcement);
      setAnnouncements([...announcements, { id: Date.now(), ...announcement }]);
      setSuccess(true);
      console.log("Announcement added successfully");
    } catch (error) {
      setError(true);
      console.error("Error adding announcement:", error);
    } finally {
      setLoading(false);
      setNewAnnouncement({
        subject: "",
        content: "",
        date: "",
        expiryDate: "",
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

  const prepareProgressChartData = () => {
    return [
      { name: "Completed", value: quickStats.completedCourses || 0 },
      { name: "In Progress", value: quickStats.inProgressCourses || 0 },
      { name: "Not Started", value: quickStats.notStartedCourses || 0 },
    ];
  };

  const prepareModuleChartData = () => {
    return [
      { name: "Completed", value: quickStats.completedModules || 0 },
      { name: "Remaining", value: quickStats.remainingModules || 0 },
    ];
  };

  const prepareCourseProgressData = () => {
    return [
      { name: "Course 1", progress: quickStats.course1Progress || 0 },
      { name: "Course 2", progress: quickStats.course2Progress || 0 },
    ];
  };

  return (
    <div className="flex flex-col h-screen">
      <LgNavbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MainContent>
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl mr-4">
                {loggedInUser
                  ? loggedInUser.firstName.charAt(0).toUpperCase()
                  : "D"}
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  Welcome, {loggedInUser ? loggedInUser.firstName : "Guest"}
                </h1>
                <p className="text-gray-500">
                  {loggedInUser ? loggedInUser.email : "Not logged in"}
                </p>
              </div>
            </div>
            <div className="bg-blue-900 px-4 py-2 rounded-lg text-white shadow-md">
              <p className="text-sm">
                Last login:{" "}
                {loggedInUser
                  ? new Date(loggedInUser.lastLogin.toDate()).toLocaleString()
                  : "N/A"}
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
                  <p className="text-3xl font-bold">
                    {quickStats.completedCourses || 0}
                  </p>
                  <p className="text-gray-500">Completed</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">
                    {quickStats.inProgressCourses || 0}
                  </p>
                  <p className="text-gray-500">In Progress</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">
                    {quickStats.totalCourses || 0}
                  </p>
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
                  <p className="text-3xl font-bold">
                    {quickStats.completedModules || 0}
                  </p>
                  <p className="text-gray-500">Completed</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">
                    {quickStats.remainingModules || 0}
                  </p>
                  <p className="text-gray-500">Remaining</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">
                    {quickStats.totalModules || 0}
                  </p>
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
                  <p className="text-3xl font-bold">
                    {quickStats.earnedCertificates || 0}
                  </p>
                  <p className="text-gray-500">Earned</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">
                    {quickStats.availableCertificates || 0}
                  </p>
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
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {prepareProgressChartData().map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
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
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {prepareModuleChartData().map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4">
                Top Courses Progress
              </h2>
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
                    <li
                      key={activity.id}
                      className="border-l-2 border-blue-500 pl-4 py-1"
                    >
                      <p className="font-medium">{activity.activity}</p>
                      <p className="text-xs text-gray-600">
                        {new Date(
                          activity.timestamp.seconds * 1000
                        ).toLocaleString()}
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
                    <li
                      key={announcement.id}
                      className="border-b border-gray-200 pb-3 last:border-0"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-medium">{announcement.subject}</p>
                        <span className="text-sm bg-blue-900 px-2 py-1 rounded">
                          50% Complete
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: "50%" }}
                        ></div>
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
                aria-describedby={
                  formErrors.subject ? "subject-error" : undefined
                }
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
                aria-describedby={
                  formErrors.content ? "content-error" : undefined
                }
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

            {success && (
              <SuccessMessage>
                <FaCheck className="text-green-600" />
                <span>Announcement sent successfully!</span>
              </SuccessMessage>
            )}

            {error && (
              <ErrorMessage>
                <FaExclamationTriangle className="text-red-600" />
                <span>Failed to send announcement. Please try again.</span>
              </ErrorMessage>
            )}
          </Card>

          <Card>
            <SectionTitle>
              <FaClock className="text-blue-500" />
              Announcement History
            </SectionTitle>
            <ul>
              {announcements.map((announcement) => (
                <li
                  key={announcement.id}
                  className="mb-4 p-4 border rounded shadow"
                >
                  <h3 className="text-lg font-semibold">
                    {announcement.subject}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {announcement.content}
                  </p>
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
                  {activity.activity} -{" "}
                  {new Date(activity.timestamp.seconds * 1000).toLocaleString()}
                </li>
              ))}
            </ul>
          </Card>
        </MainContent>
      </div>
    </div>
  );
};

export default Dashboard;
