"use client"

import { useEffect, useState, useContext } from "react"
import { collection, doc, getDoc, onSnapshot, query, where, getDocs } from "firebase/firestore"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db } from "../firebase.config"
import { FaBook, FaClock, FaMedal, FaUser, FaQuestionCircle } from "react-icons/fa"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import styled from "styled-components"
import { SidebarToggleContext } from "../components/LgNavbar"
import Sidebar from "../components/LSidebar"

const MainContent = styled.div`
  flex: 1;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  transition: margin-left 0.3s ease;
  margin-left: ${({ expanded }) => (expanded ? "16rem" : "4rem")};
  width: ${({ expanded }) => (expanded ? "calc(100% - 16rem)" : "calc(100% - 4rem)")};
`

const SidebarWrapper = styled.div`
  height: 100%;
  z-index: 5;
`

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

const LearnerDashboard = () => {
  const [user, loading] = useAuthState(auth)
  const [learnerData, setLearnerData] = useState(null)
  const [userCollection, setUserCollection] = useState(null)
  const [courses, setCourses] = useState([])
  const [progress, setProgress] = useState({})
  const [history, setHistory] = useState([])
  const [recentActivities, setRecentActivities] = useState([])
  const [certificates, setCertificates] = useState([])
  const [quizScores, setQuizScores] = useState([])
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    totalModules: 0,
    completedModules: 0,
    certificatesEarned: 0,
    totalQuizzes: 0,
    completedQuizzes: 0,
  })
  const [dashboardLoading, setDashboardLoading] = useState(true)

  const { expanded } = useContext(SidebarToggleContext)

  useEffect(() => {
    if (!user) return

    const fetchUserData = async () => {
      try {
        const learnerRef = doc(db, "learner", user.uid)
        const learnerSnap = await getDoc(learnerRef)

        if (learnerSnap.exists()) {
          setLearnerData(learnerSnap.data())
          setUserCollection("learner")
        } else {
          const internRef = doc(db, "intern", user.uid)
          const internSnap = await getDoc(internRef)

          if (internSnap.exists()) {
            setLearnerData(internSnap.data())
            setUserCollection("intern")
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      }
    }

    fetchUserData()
  }, [user])

  useEffect(() => {
    if (!user || !userCollection) return

    const collectionName = userCollection === "learner" ? "courses" : "Intern_Course"
    const coursesQuery = query(collection(db, collectionName))

    const unsubscribeCourses = onSnapshot(coursesQuery, (snapshot) => {
      const coursesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setCourses(coursesData)
    })

    return () => unsubscribeCourses()
  }, [user, userCollection])

  useEffect(() => {
    if (!user || !userCollection) return

    const progressCollection = collection(db, userCollection, user.uid, "progress")
    const unsubscribeProgress = onSnapshot(
      progressCollection,
      (snapshot) => {
        if (snapshot.empty) {
          setProgress({})
          return
        }

        const progressData = {}
        snapshot.docs.forEach((doc) => {
          progressData[doc.id] = doc.data()
        })
        setProgress(progressData)
      },
      (error) => {
        console.error("Error fetching progress:", error)
        setProgress({})
      },
    )

    return () => unsubscribeProgress()
  }, [user, userCollection])

  useEffect(() => {
    if (!user || !userCollection) return

    const courseScoreCollection = collection(db, userCollection, user.uid, "course score")
    const unsubscribeQuizScores = onSnapshot(
      courseScoreCollection,
      (snapshot) => {
        if (snapshot.empty) {
          setQuizScores([])
          return
        }

        const scoresData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setQuizScores(scoresData)
      },
      (error) => {
        console.error("Error fetching quiz scores:", error)
        setQuizScores([])
      },
    )

    return () => unsubscribeQuizScores()
  }, [user, userCollection])

  useEffect(() => {
    if (!user || !userCollection) return

    const historyCollection = collection(db, userCollection, user.uid, "history")
    const unsubscribeHistory = onSnapshot(
      historyCollection,
      (snapshot) => {
        if (snapshot.empty) {
          setHistory([])
          setRecentActivities([])
          return
        }

        const historyData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        historyData.sort((a, b) => b.completedAt?.toDate() - a.completedAt?.toDate())

        setHistory(historyData)
        setRecentActivities(
          historyData.slice(0, 5).map((item) => ({
            ...item,
            type: "module_completion",
          })),
        )
      },
      (error) => {
        console.error("Error fetching history:", error)
        setHistory([])
        setRecentActivities([])
      },
    )

    return () => unsubscribeHistory()
  }, [user, userCollection])

  useEffect(() => {
    if (!user) return

    const certificatesCollection = collection(db, "certificates")
    const certificatesQuery = query(certificatesCollection, where("userId", "==", user.uid))

    const unsubscribeCertificates = onSnapshot(certificatesQuery, (snapshot) => {
      const certificatesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setCertificates(certificatesData)
    })

    return () => unsubscribeCertificates()
  }, [user])

  const calculateQuizStats = async () => {
    let totalQuizzes = 0
    let completedQuizzes = 0

    try {
      for (const course of courses) {
        const quizzesSnapshot = await getDocs(
          collection(db, userCollection === "intern" ? "Intern_Course" : "courses", course.id, "quizzes"),
        )

        if (!quizzesSnapshot.empty) {
          const courseQuizCount = quizzesSnapshot.size
          totalQuizzes += courseQuizCount

          const progressRef = doc(db, userCollection, user.uid, "progress", course.id)
          const progressSnap = await getDoc(progressRef)

          if (progressSnap.exists()) {
            const courseScoreCollection = collection(
              db,
              userCollection,
              user.uid,
              "progress",
              course.id,
              "course score",
            )
            const courseScoreSnapshot = await getDocs(courseScoreCollection)

            const completedQuizIds = new Set()
            courseScoreSnapshot.forEach((doc) => {
              const scoreData = doc.data()
              if (scoreData.quizId && (scoreData.passed || scoreData.isCompleted)) {
                completedQuizIds.add(scoreData.quizId)
              }
            })

            completedQuizzes += completedQuizIds.size
          }
        }
      }

      setStats((prevStats) => ({
        ...prevStats,
        totalQuizzes,
        completedQuizzes,
      }))
    } catch (error) {
      console.error("Error calculating quiz stats:", error)
      setStats((prevStats) => ({
        ...prevStats,
        totalQuizzes: 0,
        completedQuizzes: 0,
      }))
    }
  }

  useEffect(() => {
    if (!courses.length || !userCollection || !user) {
      setDashboardLoading(false)
      return
    }

    const calculateCourseStats = () => {
      const totalCourses = courses.length
      let completedCourses = 0
      let inProgressCourses = 0
      let totalModules = 0
      let completedModules = 0
      let certificatesEarned = 0

      const coursesWithCertificates = new Set()

      Object.entries(progress).forEach(([courseId, courseProgress]) => {
        if (courseProgress.certificate) {
          coursesWithCertificates.add(courseId)
          certificatesEarned++
        }
      })

      courses.forEach((course) => {
        const courseProgress = progress[course.id]
        const moduleCount = Number.parseInt(course.numModules) || 0
        totalModules += moduleCount

        const completedModuleCount = courseProgress?.completedModules?.length || 0
        completedModules += completedModuleCount

        if (coursesWithCertificates.has(course.id)) {
          completedCourses++
        } else if (completedModuleCount === moduleCount && moduleCount > 0) {
          completedCourses++
        } else if (completedModuleCount > 0) {
          inProgressCourses++
        }
      })

      certificates.forEach((cert) => {
        if (cert.courseId && !coursesWithCertificates.has(cert.courseId) && cert.isCourseWide) {
          certificatesEarned++

          const course = courses.find((c) => c.id === cert.courseId)
          if (course) {
            const courseProgress = progress[cert.courseId]
            const completedModuleCount = courseProgress?.completedModules?.length || 0
            const moduleCount = Number.parseInt(course.numModules) || 0

            if (completedModuleCount !== moduleCount || moduleCount === 0) {
              completedCourses++
              if (completedModuleCount > 0) {
                inProgressCourses--
              }
            }
          }
        }
      })

      setStats((prevStats) => ({
        ...prevStats,
        totalCourses,
        completedCourses,
        inProgressCourses,
        totalModules,
        completedModules,
        certificatesEarned,
      }))
    }

    calculateCourseStats()
    calculateQuizStats().then(() => setDashboardLoading(false))
  }, [courses, progress, certificates, userCollection, user])

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A"
    const date = timestamp.toDate()
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const calculateCourseProgress = (courseId) => {
    const course = courses.find((c) => c.id === courseId)
    const courseProgress = progress && progress[courseId]

    if (courseProgress?.certificate) {
      return 100
    }

    if (!course || !courseProgress) return 0

    const totalModules = course.modules?.length || 0
    if (totalModules === 0) return 0

    const completedModules = courseProgress.completedModules?.length || 0
    return Math.round((completedModules / totalModules) * 100)
  }

  const prepareProgressChartData = () => {
    return [
      { name: "Completed", value: stats.completedCourses },
      { name: "In Progress", value: stats.inProgressCourses },
      { name: "Not Started", value: stats.totalCourses - stats.completedCourses - stats.inProgressCourses },
    ]
  }

  const prepareModuleChartData = () => {
    return [
      { name: "Completed", value: stats.completedModules },
      { name: "Remaining", value: stats.totalModules - stats.completedModules },
    ]
  }

  const prepareQuizChartData = () => {
    return [
      { name: "Completed", value: stats.completedQuizzes },
      { name: "Remaining", value: stats.totalQuizzes - stats.completedQuizzes },
    ]
  }

  const prepareCourseProgressData = () => {
    return courses.slice(0, 5).map((course) => {
      const progressPercent = calculateCourseProgress(course.id)
      return {
        name: course.title?.substring(0, 15) + (course.title?.length > 15 ? "..." : "") || "Unnamed Course",
        progress: progressPercent,
      }
    })
  }

  if (loading || dashboardLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-800 text-lg">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-white text-gray-800">
        <div className="text-center max-w-md p-8 bg-gray-100 rounded-xl shadow-2xl">
          <FaUser className="text-5xl text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Login Required</h2>
          <p className="mb-6">You need to be logged in to view your dashboard.</p>
          <button
            onClick={() => (window.location.href = "/login")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  const hasProgress = progress && Object.keys(progress).length > 0
  const hasHistory = history && history.length > 0

  return (
    <div className="min-h-screen bg-white text-gray-800 flex">
      <SidebarWrapper>
        <Sidebar />
      </SidebarWrapper>
      <MainContent expanded={expanded}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="flex items-center mb-4 md:mb-0">
            {learnerData?.photoURL?.url ? (
              <img
                src={learnerData.photoURL.url || "/placeholder.svg"}
                alt={learnerData.fullName || "User"}
                className="w-16 h-16 rounded-full mr-4 object-cover border-2 border-blue-500"
              />
            ) : (
              <div className="w-16 h-16 rounded-full mr-4 bg-blue-800 flex items-center justify-center text-2xl">
                {(learnerData?.fullName || user.email || "U")[0].toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">
                Welcome, {learnerData?.fullName || user.email?.split("@")[0] || "Learner"}
              </h1>
              <p className="text-gray-500">{learnerData?.email || user.email}</p>
              {userCollection && (
                <p className="text-sm text-blue-600 mt-1">
                  Account Type: {userCollection.charAt(0).toUpperCase() + userCollection.slice(1)}
                </p>
              )}
            </div>
          </div>
          <div className="bg-blue-900 px-4 py-2 rounded-lg text-white shadow-md">
            <p className="text-sm">
              Last login:{" "}
              {user.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : "Unknown"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 shadow-lg text-white">
            <div className="flex items-center mb-4">
              <FaBook className="text-white text-2xl mr-3" />
              <h2 className="text-xl font-semibold">Your Courses</h2>
            </div>
            {hasProgress ? (
              <div className="flex justify-between items-center">
                <div className="text-center">
                  <p className="text-3xl font-bold">{stats.completedCourses}</p>
                  <p className="text-gray-100">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{stats.inProgressCourses}</p>
                  <p className="text-gray-100">In Progress</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{stats.totalCourses}</p>
                  <p className="text-gray-100">Total</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-100">No progress data available.</p>
            )}
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 shadow-lg text-white">
            <div className="flex items-center mb-4">
              <FaQuestionCircle className="text-white text-2xl mr-3" />
              <h2 className="text-xl font-semibold">Quiz Progress</h2>
            </div>
            {quizScores.length > 0 || stats.totalQuizzes > 0 ? (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-gray-100">
                    Completed: {stats.completedQuizzes} of {stats.totalQuizzes}
                  </p>
                  <p className="text-gray-100 font-bold">
                    {stats.totalQuizzes > 0 ? Math.round((stats.completedQuizzes / stats.totalQuizzes) * 100) : 0}%
                  </p>
                </div>
                <div className="w-full bg-green-700 rounded-full h-3">
                  <div
                    className="bg-white h-3 rounded-full"
                    style={{
                      width: `${stats.totalQuizzes > 0 ? (stats.completedQuizzes / stats.totalQuizzes) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            ) : (
              <p className="text-gray-100">No quiz data available.</p>
            )}
          </div>

          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 shadow-lg text-white">
            <div className="flex items-center mb-4">
              <FaMedal className="text-white text-2xl mr-3" />
              <h2 className="text-xl font-semibold">Certificates</h2>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="text-3xl font-bold">{stats.certificatesEarned}</p>
                  <p className="text-gray-100">Earned</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats.totalCourses}</p>
                  <p className="text-gray-100">Total Available</p>
                </div>
              </div>
              {stats.completedCourses > 0 && (
                <button
                  onClick={() => (window.location.href = "/certificates")}
                  className="mt-2 bg-white text-yellow-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  View Certificates
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Course Progress Overview</h2>
            {hasProgress ? (
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
                    <Tooltip formatter={(value, name) => [`${value} Courses`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">No course progress data available.</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FaClock className="text-blue-500 text-xl mr-3" />
                <h2 className="text-xl font-semibold">Recent Activity</h2>
              </div>
              {hasHistory && recentActivities.length > 0 && (
                <span className="text-sm text-gray-500">Last {recentActivities.length} completed modules</span>
              )}
            </div>
            {hasHistory ? (
              <ul className="space-y-4">
                {recentActivities.map((activity) => (
                  <li
                    key={activity.id}
                    className="border-l-2 border-blue-500 pl-4 py-1 hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-medium">{activity.moduleTitle}</p>
                    <p className="text-sm text-gray-500">Completed module in {activity.courseTitle}</p>
                    <p className="text-xs text-gray-600">{formatDate(activity.completedAt)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FaClock className="text-gray-300 text-4xl mb-3" />
                <p className="text-gray-500">No recent activity found.</p>
                <p className="text-sm text-gray-400 mt-2">Complete modules to see your activity here.</p>
              </div>
            )}
          </div>
        </div>
      </MainContent>
    </div>
  )
}

export default LearnerDashboard
