"use client"

import { useEffect, useState } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { collection, getDocs, doc, getDoc } from "firebase/firestore"
import { auth, db } from "../firebase.config"
import { FaBook, FaCheckCircle, FaLock, FaChevronDown, FaChevronUp } from "react-icons/fa"

const ProfileProgress = () => {
  const [user] = useAuthState(auth)
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedCourse, setExpandedCourse] = useState(null)

  useEffect(() => {
    const fetchUserCourses = async () => {
      if (!user) return

      try {
        setLoading(true)

        // Fetch all courses
        const coursesCollection = collection(db, "courses")
        const coursesSnapshot = await getDocs(coursesCollection)
        const coursesData = coursesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        // For each course, fetch its modules
        const coursesWithModules = await Promise.all(
          coursesData.map(async (course) => {
            const modulesCollection = collection(db, "courses", course.id, "modules")
            const modulesSnapshot = await getDocs(modulesCollection)
            const modulesData = modulesSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))

            // Get user's progress from Firestore instead of localStorage
            const userProgressRef = doc(db, "learner", user.uid, "progress", course.id)
            const userProgressDoc = await getDoc(userProgressRef)

            // Get completed chapters and modules from Firestore
            const userProgress = userProgressDoc.exists()
              ? userProgressDoc.data()
              : { completedChapters: {}, completedModules: [] }
            const completedChapters = userProgress.completedChapters || {}
            const completedModules = userProgress.completedModules || []

            // Calculate progress for each module
            const modulesWithProgress = modulesData.map((module) => {
              const totalChapters = module.chapters?.length || 0
              const completedChaptersCount = completedChapters[module.id]?.length || 0
              const progress = totalChapters > 0 ? (completedChaptersCount / totalChapters) * 100 : 0
              const isCompleted = completedModules.includes(module.id)

              return {
                ...module,
                progress,
                completedChapters: completedChaptersCount,
                totalChapters,
                isCompleted,
              }
            })

            // Calculate overall course progress
            const totalChaptersInCourse = modulesWithProgress.reduce((total, module) => total + module.totalChapters, 0)

            const completedChaptersInCourse = modulesWithProgress.reduce(
              (total, module) => total + module.completedChapters,
              0,
            )

            const courseProgress =
              totalChaptersInCourse > 0 ? (completedChaptersInCourse / totalChaptersInCourse) * 100 : 0

            return {
              ...course,
              modules: modulesWithProgress,
              progress: courseProgress,
              completedChapters: completedChaptersInCourse,
              totalChapters: totalChaptersInCourse,
            }
          }),
        )

        setCourses(coursesWithModules)
      } catch (error) {
        console.error("Error fetching courses:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserCourses()
  }, [user])

  const toggleCourseExpansion = (courseId) => {
    setExpandedCourse((prev) => (prev === courseId ? null : courseId))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <FaBook className="mx-auto text-gray-400 text-5xl mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No courses yet</h3>
        <p className="text-gray-500">You haven't started any courses yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h3 className="text-lg font-semibold mb-4 text-blue-950">Your Learning Progress</h3>

      {courses.map((course) => (
        <div key={course.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={course.fileUrl || "/placeholder.svg"}
                  alt={course.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <h4 className="text-xl font-semibold text-gray-900">{course.title}</h4>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>
                    {course.completedChapters}/{course.totalChapters} chapters completed
                  </span>
                  <span>•</span>
                  <span>{Math.round(course.progress)}% complete</span>
                </div>
              </div>
            </div>
            <button onClick={() => toggleCourseExpansion(course.id)}>
              {expandedCourse === course.id ? <FaChevronUp /> : <FaChevronDown />}
            </button>
          </div>

          {expandedCourse === course.id && (
            <>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
                <div className="h-full bg-blue-600" style={{ width: `${course.progress}%` }}></div>
              </div>

              <div className="space-y-4">
                <h5 className="font-medium text-gray-700">Modules</h5>
                {course.modules.map((module, index) => (
                  <div key={module.id} className="pl-4 border-l-2 border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        {module.isCompleted ? (
                          <FaCheckCircle className="text-green-500" />
                        ) : module.progress > 0 ? (
                          <div className="relative h-5 w-5 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full border-2 border-blue-500"></div>
                            <div className="text-xs text-blue-600 font-bold">{Math.round(module.progress)}%</div>
                          </div>
                        ) : (
                          <FaLock className="text-gray-400" />
                        )}
                        <span className="font-medium">
                          Module {index + 1}: {module.title}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {module.completedChapters}/{module.totalChapters}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full ${module.isCompleted ? "bg-green-500" : "bg-blue-500"}`}
                        style={{ width: `${module.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}

export default ProfileProgress
