"use client"

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore"
import { useEffect, useState, useContext } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import {
  FaCertificate,
  FaCheck,
  FaChevronDown,
  FaChevronRight,
  FaLock,
  FaLockOpen,
  FaTrophy,
  FaClipboardList,
  FaEye,
} from "react-icons/fa"
import { useNavigate, useParams } from "react-router-dom"
import styled from "styled-components"
import Sidebar from "../components/LSidebar"
import { auth, db } from "../firebase.config"
import CertificateImage from "./certificate-image"
import { SidebarToggleContext } from "../components/LgNavbar" // Import the context

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

const ModuleDisplay = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { expanded } = useContext(SidebarToggleContext)
  const [user] = useAuthState(auth)
  const [modules, setModules] = useState([])
  const [courseData, setCourseData] = useState(null)
  const [completedModules, setCompletedModules] = useState([])
  const [completedChapters, setCompletedChapters] = useState({})
  const [expandedModules, setExpandedModules] = useState({})
  const [loading, setLoading] = useState(true)
  const [quizzes, setQuizzes] = useState([])
  const [quizScores, setQuizScores] = useState({})
  const [quizAttempts, setQuizAttempts] = useState({}) // Track quiz attempts

  // Add state variables for certificate functionality
  const [showCertificateAlert, setShowCertificateAlert] = useState(false)
  const [certificateCreated, setCertificateCreated] = useState(false)
  const [savingCertificate, setSavingCertificate] = useState(false)
  const [existingCertificate, setExistingCertificate] = useState(null)
  const [userData, setUserData] = useState(null)
  const [allModulesCompleted, setAllModulesCompleted] = useState(false)

  const [commentText, setCommentText] = useState("")
  const [comments, setComments] = useState([])
  const [submittingComment, setSubmittingComment] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)

  // Add a state variable for userType
  const [userType, setUserType] = useState(null)

  // Helper function to get the image URL from the course data
  const getCourseImageUrl = (course) => {
    if (!course) return "/placeholder.svg?height=200&width=800"

    // Check if fileUrl exists and has a url property (nested structure)
    if (course.fileUrl && course.fileUrl.url) {
      return course.fileUrl.url
    }

    // If fileUrl is a direct string
    if (typeof course.fileUrl === "string") {
      return course.fileUrl
    }

    // Fallback to a placeholder image
    return "/placeholder.svg?height=200&width=800"
  }

  useEffect(() => {
    const checkUserTypeAndFetchData = async () => {
      try {
        // Get current user
        if (!user) return

        // Check if user exists in learner collection
        const learnerDocRef = doc(db, "learner", user.uid)
        const learnerDoc = await getDoc(learnerDocRef)

        // Check if user exists in intern collection
        const internDocRef = doc(db, "intern", user.uid)
        const internDoc = await getDoc(internDocRef)

        let courseCollectionName = "courses" // Default collection

        if (learnerDoc.exists()) {
          setUserType("learner")
          courseCollectionName = "courses"
        } else if (internDoc.exists()) {
          setUserType("intern")
          courseCollectionName = "Intern_Course"
        } else {
          console.warn("User not found in either learner or intern collection")
        }

        // Fetch course data
        const fetchCourseData = async () => {
          try {
            const courseDoc = doc(db, courseCollectionName, courseId)
            const courseSnapshot = await getDoc(courseDoc)
            if (courseSnapshot.exists()) {
              setCourseData(courseSnapshot.data())
            }
          } catch (error) {
            console.error("Error fetching course data:", error)
          }
        }

        // Fetch modules
        const fetchModules = async () => {
          try {
            const modulesCollection = collection(db, courseCollectionName, courseId, "modules")
            const querySnapshot = await getDocs(modulesCollection)
            const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

            // Sort modules by their order if available
            const sortedData = data.sort((a, b) => (a.order || 0) - (b.order || 0))
            setModules(sortedData)
          } catch (error) {
            console.error("Error fetching modules:", error)
          }
        }

        // Fetch quizzes for the course
        const fetchQuizzes = async () => {
          try {
            const quizzesCollection = collection(db, courseCollectionName, courseId, "quizzes")
            const querySnapshot = await getDocs(quizzesCollection)
            const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
            setQuizzes(data)
          } catch (error) {
            console.error("Error fetching quizzes:", error)
          }
        }

        // Execute all fetch operations
        await Promise.all([fetchCourseData(), fetchModules(), fetchQuizzes()])
      } catch (error) {
        console.error("Error checking user type or fetching data:", error)
      }
    }

    checkUserTypeAndFetchData()
  }, [courseId, user])

  const loadProgress = async () => {
    if (!user) return

    try {
      // Determine the collection based on user type
      const userCollection = userType === "intern" ? "intern" : "learner"

      const userProgressRef = doc(db, userCollection, user.uid, "progress", courseId)
      const userProgressDoc = await getDoc(userProgressRef)

      if (userProgressDoc.exists()) {
        const userProgress = userProgressDoc.data()
        setCompletedModules(userProgress.completedModules || [])
        setCompletedChapters(userProgress.completedChapters || {})
      } else {
        setCompletedModules([])
        setCompletedChapters({})
      }
    } catch (error) {
      console.error("Error loading progress:", error)
      // Reset progress if there's an error
      setCompletedModules([])
      setCompletedChapters({})
    }
  }

  const fetchQuizScores = async () => {
    if (!user) return

    try {
      // Determine the collection based on user type
      const userCollection = userType === "intern" ? "intern" : "learner"

      // Get quiz scores
      const scoresCollection = collection(db, userCollection, user.uid, "quizScores")
      const scoresQuery = query(scoresCollection, where("courseId", "==", courseId))
      const querySnapshot = await getDocs(scoresQuery)

      const scoresData = {}
      querySnapshot.docs.forEach((doc) => {
        const data = doc.data()
        scoresData[data.quizId] = {
          score: data.score,
          totalPoints: data.totalPoints,
          percentage: data.percentage,
          completedAt: data.completedAt,
          passed: data.passed,
        }
      })
      setQuizScores(scoresData)

      // Get quiz attempts
      const attemptsCollection = collection(db, userCollection, user.uid, "course score")
      const attemptsQuery = query(attemptsCollection, where("courseId", "==", courseId))
      const attemptsSnapshot = await getDocs(attemptsQuery)

      const attemptsData = {}
      attemptsSnapshot.docs.forEach((doc) => {
        const data = doc.data()
        if (!attemptsData[data.quizId]) {
          attemptsData[data.quizId] = 0
        }
        attemptsData[data.quizId]++
      })
      setQuizAttempts(attemptsData)
    } catch (error) {
      console.error("Error fetching quiz scores and attempts:", error)
    }
  }

  const loadCertificateData = async () => {
    if (!user) return

    try {
      // Determine the collection based on user type
      const userCollection = userType === "intern" ? "intern" : "learner"

      // Fetch user data for certificate
      const userRef = doc(db, userCollection, user.uid)
      const userSnap = await getDoc(userRef)
      if (userSnap.exists()) {
        setUserData(userSnap.data())
      }

      // Check if certificate already exists
      const certificatesCollection = collection(db, "certificates")
      const certificateQuery = query(
        certificatesCollection,
        where("userId", "==", user.uid),
        where("courseId", "==", courseId),
        where("isCourseWide", "==", true),
      )
      const certificateSnapshot = await getDocs(certificateQuery)

      if (!certificateSnapshot.empty) {
        setExistingCertificate(certificateSnapshot.docs[0].data())
      }
    } catch (error) {
      console.error("Error loading certificate data:", error)
    }
  }

  useEffect(() => {
    const fetchComments = async () => {
      if (!courseId) return

      try {
        const commentsCollection = collection(db, "courseComments")
        const commentsQuery = query(
          commentsCollection,
          where("courseId", "==", courseId),
          orderBy("createdAt", "desc"),
          limit(5),
        )
        const commentsSnapshot = await getDocs(commentsQuery)

        const commentsData = commentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
        }))

        setComments(commentsData)
      } catch (error) {
        console.error("Error fetching comments:", error)
      }
    }

    Promise.all([loadProgress(), loadCertificateData(), fetchComments(), fetchQuizScores()]).finally(() => {
      setLoading(false)

      // Check if all modules are completed
      if (modules.length > 0 && completedModules.length >= modules.length) {
        setAllModulesCompleted(true)
      }
    })
  }, [courseId, user, userType])

  // Add a useEffect to check if all modules are completed when modules or completedModules change
  useEffect(() => {
    if (modules.length > 0 && completedModules.length >= modules.length) {
      setAllModulesCompleted(true)
    } else {
      setAllModulesCompleted(false)
    }
  }, [modules, completedModules])

  // Add the generateCertificate function
  const generateCertificate = async () => {
    if (!user || !courseData || !userData) return

    try {
      setSavingCertificate(true)

      // Check if certificate already exists
      if (existingCertificate) {
        setCertificateCreated(true)
        return
      }

      // Create certificate data
      const completionDate = new Date()
      const formattedDate = completionDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })

      const certificateId = `CERT-${Date.now().toString(36).toUpperCase()}`

      const certificateData = {
        userId: user.uid,
        userName: userData.fullName,
        courseId,
        courseTitle: courseData.title,
        moduleTitle: "Complete Course",
        issueDate: serverTimestamp(),
        formattedDate: formattedDate,
        certificateId: certificateId,
        isCourseWide: true, // Flag to indicate this is a course-wide certificate
        courseDescription: courseData.description,
      }

      // Save certificate to Firestore
      const certificatesCollection = collection(db, "certificates")
      await addDoc(certificatesCollection, certificateData)

      // Update user's certificates count
      const userCollection = userType === "intern" ? "intern" : "learner"
      const userRef = doc(db, userCollection, user.uid)
      await updateDoc(userRef, {
        certificatesCount: (userData.certificatesCount || 0) + 1,
      })

      // Set existing certificate for future reference
      setExistingCertificate(certificateData)

      // Show success message
      setCertificateCreated(true)
    } catch (error) {
      console.error("Error generating certificate:", error)
    } finally {
      setSavingCertificate(false)
    }
  }

  const handleStartModule = (module) => {
    // Open module viewer in a new tab with collection type
    window.open(`/module-viewer?courseId=${courseId}&moduleId=${module.id}&userType=${userType}`, "_blank")
  }

  const handleStartQuiz = (quiz) => {
    // Navigate to quiz-taker page with the necessary parameters
    const hasRetaken = quizAttempts[quiz.id] >= 1
    const mode = hasRetaken ? "review" : "take"
    navigate(`/quiz-taker?courseId=${courseId}&quizId=${quiz.id}&mode=${mode}&userType=${userType}`)
  }

  const isModuleUnlocked = (moduleId, index) => {
    // First module is always unlocked
    if (index === 0) return true

    // Check if previous module has all chapters completed
    const previousModule = modules[index - 1]
    if (!previousModule) return false

    const previousModuleChapters = previousModule.chapters || []
    const completedChaptersInPreviousModule = completedChapters[previousModule.id] || []

    // Module is unlocked if all chapters in previous module are completed
    return completedChaptersInPreviousModule.length >= previousModuleChapters.length
  }

  const getChapterProgress = (module) => {
    const completed = completedChapters[module.id] || []
    return `${completed.length}/${module.chapters.length}`
  }

  const getProgressPercentage = (module) => {
    const completed = completedChapters[module.id] || []
    return (completed.length / module.chapters.length) * 100
  }

  const toggleChapters = (moduleId) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }))
  }

  const isChapterUnlocked = (moduleId, chapterIndex) => {
    if (chapterIndex === 0) return true
    const completedChaptersInModule = completedChapters[moduleId] || []
    return completedChaptersInModule.includes(chapterIndex - 1)
  }

  const submitComment = async () => {
    if (!commentText.trim() || !user) return

    try {
      setSubmittingComment(true)

      // Create comment data
      const commentData = {
        userId: user.uid,
        userName: userData?.fullName || "Anonymous User",
        courseId,
        courseTitle: courseData.title,
        comment: commentText,
        rating: rating, // Add the rating to the comment data
        createdAt: serverTimestamp(),
      }

      // Save comment to Firestore
      const commentsCollection = collection(db, "courseComments")
      await addDoc(commentsCollection, commentData)

      // Clear the input and refresh comments
      setCommentText("")
      setRating(0) // Reset rating after submission
      // In a real app, you would fetch the updated comments here

      // For demo purposes, add to local state
      setComments([
        {
          id: Date.now().toString(),
          ...commentData,
          createdAt: new Date().toISOString(),
        },
        ...comments,
      ])
    } catch (error) {
      console.error("Error submitting comment:", error)
    } finally {
      setSubmittingComment(false)
    }
  }

  // Calculate total points for a quiz
  const calculateTotalPoints = (quiz) => {
    let totalPoints = 0

    // Check if quiz and quiz.sections exist before trying to iterate
    if (quiz && quiz.sections && Array.isArray(quiz.sections)) {
      quiz.sections.forEach((section) => {
        // Check if section.questions exists before trying to iterate
        if (section && section.questions && Array.isArray(section.questions)) {
          section.questions.forEach((question) => {
            totalPoints += question.points || 0
          })
        }
      })
    }

    return totalPoints
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <MainContent expanded={expanded}>
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </MainContent>
      </div>
    )
  }

  if (!modules.length || !courseData) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <MainContent expanded={expanded}>
          <div className="text-center p-8">
            <h2 className="text-xl font-semibold">No modules found for this course</h2>
            <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
              Go Back
            </button>
          </div>
        </MainContent>
      </div>
    )
  }

  // Add the animation styles at the top of the component
  const styles = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}

.animate-slideIn {
  animation: slideIn 0.3s ease-out;
}

.animate-pulse {
  animation: pulse 1.5s infinite;
}
`

  return (
    <>
      {/* Add the styles */}
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div className="flex h-screen">
        <Sidebar />
        <MainContent expanded={expanded}>
          {/* Header with Background Image */}
          <div
            className="h-48 bg-cover bg-center mb-6 relative rounded-xl overflow-hidden"
            style={{ backgroundImage: `url(${getCourseImageUrl(courseData)})` }}
          >
            {/* Back Button */}
            <button
              onClick={() => navigate("/lcourses")}
              className="absolute top-4 left-4 bg-white bg-opacity-30 backdrop-blur-md text-white px-4 py-2 rounded-lg shadow-md hover:bg-opacity-40 transition"
            >
              ← Back
            </button>

            <div className="bg-black bg-opacity-50 h-full flex flex-col justify-center p-6">
              <h1 className="text-white text-4xl font-bold">{courseData.title}</h1>
              <p className="text-white text-sm mt-1">{courseData.description}</p>
              {userType && (
                <span className="mt-2 px-3 py-1 bg-white bg-opacity-20 text-white text-xs rounded-full self-start">
                  {userType === "intern" ? "Intern Course" : "Learner Course"}
                </span>
              )}
            </div>
          </div>

          {/* Module List */}
          <div className="flex flex-col space-y-6">
            {modules.map((module, moduleIndex) => {
              const isUnlocked = isModuleUnlocked(module.id, moduleIndex)
              const isExpanded = expandedModules[module.id]
              const progress = getProgressPercentage(module)
              const isCompleted = progress === 100

              return (
                <div key={module.id} className="relative">
                  <div
                    className={`h-[150px] w-full bg-white flex rounded-xl transition-all duration-300 hover:scale-[1.01] shadow-lg border ${
                      isCompleted ? "border-green-300" : isUnlocked ? "border-gray-300" : "border-gray-200 opacity-80"
                    }`}
                  >
                    <div
                      className={`h-full w-[200px] p-7 text-white rounded-l-xl ${
                        isCompleted ? "bg-green-700" : isUnlocked ? "bg-[#261a6b]" : "bg-gray-500"
                      }`}
                    >
                      <p className="text-[11px] tracking-widest text-[#cccc]">COURSE</p>
                      <h1 className="text-[18px] pt-3 font-medium tracking-wide leading-[20px]">
                        Module {moduleIndex + 1}
                      </h1>
                      <h4
                        className="text-[12px] pt-[50px] text-[#cccc] cursor-pointer flex items-center gap-1"
                        onClick={() => toggleChapters(module.id)}
                      >
                        {isExpanded ? "Hide" : "View"} all chapters
                        {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
                      </h4>
                    </div>

                    <div className="p-5 bg-white w-full rounded-r-xl relative">
                      <div className="flex justify-between">
                        <h1 className="text-[#949494] text-[13px] tracking-[.5px]">
                          {isCompleted ? "Completed" : isUnlocked ? "Available" : "Locked"}
                        </h1>
                        <div className="relative">
                          <div className="h-1.5 w-[200px] bg-slate-200 rounded-xl">
                            <div
                              className={`h-1.5 rounded-xl ${isCompleted ? "bg-green-500" : "bg-[#261a6b]"}`}
                              style={{
                                width: `${progress}%`,
                              }}
                            ></div>
                          </div>
                          <p className="text-[#a8a8a8] text-[12px] tracking-[.5px] absolute right-0">
                            {getChapterProgress(module)} Chapters
                          </p>
                        </div>
                      </div>
                      <h1 className="text-[20px] pt-1 font-[500] tracking-wide text-black">{module.title}</h1>
                      <button
                        className={`h-8 w-[100px] rounded-3xl tracking-wide absolute right-10 bottom-7 ${
                          isUnlocked
                            ? isCompleted
                              ? "bg-green-600 text-white hover:bg-green-700"
                              : "bg-[#261a6be8] text-white hover:bg-[#4938b6e8]"
                            : "bg-gray-400 text-gray-200 cursor-not-allowed"
                        }`}
                        disabled={!isUnlocked}
                        onClick={() => handleStartModule(module)}
                      >
                        {isUnlocked ? isCompleted ? "Review" : "Start" : <FaLock />}
                      </button>
                    </div>
                  </div>

                  {/* Chapters List */}
                  {isExpanded && (
                    <div className="mt-4 p-4 bg-slate-100 rounded-xl">
                      <ul className="space-y-2">
                        {module.chapters.map((chapter, chapIndex) => {
                          const isUnlocked = isChapterUnlocked(module.id, chapIndex)
                          const isCompleted = (completedChapters[module.id] || []).includes(chapIndex)

                          return (
                            <li
                              key={chapIndex}
                              className={`p-3 flex items-center gap-3 rounded transition-colors ${
                                isUnlocked
                                  ? "hover:bg-gray-200 cursor-pointer"
                                  : "text-gray-500 cursor-not-allowed bg-gray-200 bg-opacity-50"
                              } ${isCompleted ? "border-l-4 border-green-500" : ""}`}
                              onClick={() => {
                                if (isUnlocked) {
                                  window.open(
                                    `/module-viewer?courseId=${courseId}&moduleId=${module.id}&chapterIndex=${chapIndex}`,
                                    "_blank",
                                  )
                                }
                              }}
                            >
                              <div className="w-6 h-6 flex items-center justify-center">
                                {isCompleted ? (
                                  <FaCheck className="text-green-500" />
                                ) : isUnlocked ? (
                                  <FaLockOpen className="text-blue-600" />
                                ) : (
                                  <FaLock className="text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className={`font-medium ${isCompleted ? "text-green-700" : ""}`}>
                                  {chapter.title}
                                </div>
                                {chapter.description && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {chapter.description.substring(0, 60)}
                                    {chapter.description.length > 60 ? "..." : ""}
                                  </div>
                                )}
                              </div>
                              {isCompleted && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Completed</span>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Quizzes Section */}
          {quizzes.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <FaClipboardList className="mr-2 text-blue-600" />
                Course Quizzes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quizzes.map((quiz) => {
                  const quizScore = quizScores[quiz.id]
                  const totalPoints = calculateTotalPoints(quiz)
                  const isCompleted = !!quizScore
                  const isPassed = quizScore?.passed
                  const hasRetaken = quizAttempts[quiz.id] >= 1

                  return (
                    <div
                      key={quiz.id}
                      className={`bg-white rounded-xl shadow-md overflow-hidden border-l-4 ${
                        isCompleted ? (isPassed ? "border-green-500" : "border-red-500") : "border-blue-500"
                      }`}
                    >
                      <div className="p-5">
                        <div className="flex justify-between items-start">
                          <h3 className="text-xl font-semibold">{quiz.title}</h3>
                          {isCompleted && (
                            <div
                              className={`text-sm font-medium px-3 py-1 rounded-full ${
                                isPassed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}
                            >
                              {isPassed ? "Passed" : "Failed"}
                            </div>
                          )}
                        </div>

                        <div className="mt-2 text-gray-600">
                          <p className="text-sm">
                            {quiz.description ||
                              `This quiz contains ${quiz.sections.reduce((acc, section) => acc + section.questions.length, 0)} questions`}
                          </p>
                        </div>

                        <div className="mt-4 flex justify-between items-center">
                          <div>
                            <div className="text-sm text-gray-500">Total Points: {totalPoints}</div>
                            {isCompleted && (
                              <div className="mt-1 font-medium">
                                Score: {quizScore.score}/{quizScore.totalPoints} ({quizScore.percentage}%)
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleStartQuiz(quiz)}
                            className={`px-4 py-2 rounded-lg flex items-center ${
                              quizAttempts[quiz.id] > 0
                                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                          >
                            {quizAttempts[quiz.id] > 0 ? (
                              <>
                                <FaEye className="mr-2" /> Review Answer
                              </>
                            ) : (
                              <>
                                <FaClipboardList className="mr-2" /> Start Quiz
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Certificate Section - Always visible but locked if not completed */}
          <div className="mt-8 p-4 bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaCertificate className="text-yellow-400 text-3xl mr-3" />
                <div>
                  <h2 className="text-xl font-bold">Course Certificate</h2>
                  <p className="text-sm text-gray-300">Complete all modules to earn your certificate</p>
                </div>
              </div>

              {allModulesCompleted ? (
                existingCertificate ? (
                  <div className="bg-green-800 bg-opacity-50 p-2 rounded-lg text-sm">
                    <FaCheck className="inline-block mr-1 text-green-400" />
                    Certificate claimed
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCertificateAlert(true)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center"
                  >
                    <FaTrophy className="mr-2" /> Claim Certificate
                  </button>
                )
              ) : (
                <div className="flex items-center bg-gray-700 bg-opacity-50 py-2 px-4 rounded-lg">
                  <FaLock className="text-gray-400 mr-2" />
                  <span className="text-gray-300">Locked</span>
                </div>
              )}
            </div>

            {/* Progress bar for certificate */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-300 mb-1">
                <span>Course Progress</span>
                <span>
                  {completedModules.length}/{modules.length} modules
                </span>
              </div>
              <div className="h-1.5 w-full bg-gray-700 rounded-full">
                <div
                  className="h-1.5 rounded-full bg-yellow-500"
                  style={{ width: `${(completedModules.length / modules.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          {/* Course Comments Section */}
          <div className="mt-6 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Course Feedback</h2>

            {/* Comment Form */}
            <div className="mb-6">
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Share your thoughts about this course..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              ></textarea>

              {/* Star Rating */}
              <div className="flex items-center mt-3">
                <span className="text-sm text-gray-700 mr-2">Rate this course:</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="focus:outline-none"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-6 w-6 ${
                          (hoveredRating || rating) >= star
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300 fill-gray-300"
                        } transition-colors duration-150`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">
                  {rating > 0 ? `${rating} star${rating !== 1 ? "s" : ""}` : "No rating"}
                </span>
              </div>

              <div className="flex justify-between mt-2">
                <div className="flex items-center">
                  <span className="text-sm text-gray-500">Your feedback helps improve our courses</span>
                </div>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:bg-blue-400"
                  onClick={submitComment}
                  disabled={!commentText.trim() || submittingComment}
                >
                  {submittingComment ? "Submitting..." : "Submit Feedback"}
                </button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">{comment.userName}</span>
                      <span className="text-sm text-gray-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                    </div>
                    {comment.rating > 0 && (
                      <div className="flex items-center mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-4 w-4 ${
                              comment.rating >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-300 fill-gray-300"
                            }`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="ml-1 text-xs text-gray-600">
                          {comment.rating} star{comment.rating !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                    <p className="text-gray-700">{comment.comment}</p>
                  </div>
                ))
              ) : (
                <div className="text-center p-4 text-gray-500">Be the first to leave a comment!</div>
              )}
            </div>
          </div>
          {/* Certificate Claim Alert */}
          {showCertificateAlert && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fadeIn">
              <div className="bg-gray-900 border-2 border-yellow-500 rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4 transform transition-all animate-slideIn">
                <div className="flex items-center mb-6">
                  <div className="bg-yellow-500 rounded-full p-2 mr-4">
                    <FaCertificate className="text-white text-2xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Your Course Certificate</h3>
                </div>

                {!certificateCreated && !existingCertificate ? (
                  <div className="bg-gray-800 p-5 rounded-lg mb-6 border border-gray-700 overflow-auto max-h-[70vh]">
                    <CertificateImage
                      userName={userData?.fullName || "Student Name"}
                      courseTitle={courseData?.title}
                      moduleTitle="Complete Course"
                      issueDate={new Date().toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                      certificateId={`CERT-${Date.now().toString(36).toUpperCase()}`}
                      courseDescription={courseData?.description}
                    />
                  </div>
                ) : (
                  <div className="text-center mb-6">
                    <div className="bg-green-500 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                      <FaCheck className="text-white text-3xl" />
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">Certificate Created!</h4>
                    <p className="text-gray-300">
                      Your course certificate has been successfully generated and added to your profile. You can view
                      all your certificates in the Certificates page.
                    </p>
                  </div>
                )}

                <div className="flex justify-between">
                  <button
                    onClick={() => setShowCertificateAlert(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Close
                  </button>

                  {!certificateCreated && !existingCertificate && (
                    <button
                      onClick={generateCertificate}
                      disabled={savingCertificate}
                      className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold px-6 py-2 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 flex items-center"
                    >
                      {savingCertificate ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-gray-900 border-t-transparent rounded-full mr-2"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <FaTrophy className="mr-2" /> Claim Certificate
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </MainContent>
      </div>
    </>
  )
}

export default ModuleDisplay
