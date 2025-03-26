"use client"

import { useEffect, useState } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { collection, getDocs, query, orderBy, where } from "firebase/firestore"
import { auth, db } from "../firebase.config"
import { FaHistory, FaBook, FaCheckCircle, FaChevronDown, FaChevronRight } from "react-icons/fa"

const ProfileHistory = () => {
  const [user, authLoading] = useAuthState(auth)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedCourses, setExpandedCourses] = useState({})

  // Reset history when user changes
  useEffect(() => {
    if (!user) {
      setHistory([])
    }
  }, [user])

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) {
        setHistory([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        console.log("Fetching history for user:", user.uid)

        // Get user's learning history from Firestore with explicit user check
        // Only fetch history entries that were created by clicking the Finish button
        // These entries will have a completedAt field
        const historyCollection = collection(db, "learner", user.uid, "history")
        const historyQuery = query(
          historyCollection,
          where("completedAt", "!=", null), // Only get entries with completedAt field
          orderBy("completedAt", "desc"),
        )
        const historySnapshot = await getDocs(historyQuery)

        const historyData = historySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          completedAt: doc.data().completedAt?.toDate() || new Date(),
        }))

        console.log(`Found ${historyData.length} completed history items for user ${user.uid}`)
        setHistory(historyData)
      } catch (error) {
        console.error("Error fetching history:", error)
        // Reset history on error to prevent showing incorrect data
        setHistory([])
      } finally {
        setLoading(false)
      }
    }

    // Only fetch when user is available and not in loading state
    if (!authLoading) {
      fetchHistory()
    }

    // Clean up function to reset history when component unmounts
    return () => {
      setHistory([])
    }
  }, [user, authLoading])

  // Toggle course expansion
  const toggleCourse = (courseId) => {
    setExpandedCourses((prev) => ({
      ...prev,
      [courseId]: !prev[courseId],
    }))
  }

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <FaHistory className="mx-auto text-gray-400 text-5xl mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Please log in</h3>
        <p className="text-gray-500">You need to be logged in to view your learning history.</p>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <FaHistory className="mx-auto text-gray-400 text-5xl mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No learning history yet</h3>
        <p className="text-gray-500">
          Complete modules by clicking the "Finish" button to see your learning history here.
        </p>
      </div>
    )
  }

  // Group history by course
  const courseGroups = history.reduce((groups, item) => {
    const courseId = item.courseId
    if (!groups[courseId]) {
      groups[courseId] = {
        courseId: courseId,
        courseTitle: item.courseTitle,
        modules: [],
      }
    }
    groups[courseId].modules.push(item)
    return groups
  }, {})

  return (
    <div className="space-y-8">
      <h3 className="text-lg font-semibold mb-4 text-blue-950">Your Learning History</h3>

      <div className="space-y-4">
        {Object.values(courseGroups).map((course) => (
          <div key={course.courseId} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            {/* Course Header - Clickable */}
            <div
              className="p-4 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => toggleCourse(course.courseId)}
            >
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <FaBook className="text-blue-600 text-xl" />
                </div>
                <h4 className="font-semibold text-gray-900">{course.courseTitle}</h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{course.modules.length} completed modules</span>
                {expandedCourses[course.courseId] ? (
                  <FaChevronDown className="text-gray-500" />
                ) : (
                  <FaChevronRight className="text-gray-500" />
                )}
              </div>
            </div>

            {/* Modules List - Expandable */}
            {expandedCourses[course.courseId] && (
              <div className="divide-y divide-gray-100">
                {course.modules.map((module) => (
                  <div key={module.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="bg-green-100 p-2 rounded-full">
                        <FaCheckCircle className="text-green-600 text-xl" />
                      </div>

                      <div className="flex-1">
                        <h5 className="font-medium text-gray-800">{module.moduleTitle}</h5>
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                          <span>
                            Completed {module.chaptersCompleted} of {module.totalChapters} chapters
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(module.completedAt).toLocaleDateString()} at{" "}
                            {new Date(module.completedAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProfileHistory

