"use client"

import { useEffect, useRef, useState } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { useLocation, useNavigate } from "react-router-dom"
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where, addDoc } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import {
  FaCheck,
  FaLock,
  FaLockOpen,
  FaSignInAlt,
  FaClipboardCheck,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaLightbulb,
  FaTrophy,
  FaMedal,
  FaSpinner,
  FaArrowLeft,
  FaArrowRight,
  FaBook,
  FaLayerGroup,
  FaChalkboardTeacher,
} from "react-icons/fa"
import { auth, db } from "../firebase.config"
import VideoPlayer from "./video-player"

const ModuleView = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, loading] = useAuthState(auth)
  const searchParams = new URLSearchParams(location.search)
  const courseId = searchParams.get("courseId")
  const moduleId = searchParams.get("moduleId")
  const initialChapterIndex = Number.parseInt(searchParams.get("chapterIndex") || "0", 10)

  const [module, setModule] = useState(null)
  const [course, setCourse] = useState(null)
  const [userData, setUserData] = useState(null)
  const [contentLoading, setContentLoading] = useState(true)
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(initialChapterIndex)
  const [error, setError] = useState(null)
  const [unlockedChapters, setUnlockedChapters] = useState({})
  const [isLastChapterScrolledToBottom, setIsLastChapterScrolledToBottom] = useState(false)
  const [savingCompletion, setSavingCompletion] = useState(false)
  const [showCompletionAlert, setShowCompletionAlert] = useState(false)
  const [moduleAlreadyCompleted, setModuleAlreadyCompleted] = useState(false)
  const [historyDocId, setHistoryDocId] = useState(null)
  const contentRef = useRef(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [videoCompleted, setVideoCompleted] = useState(false)

  // Quiz state
  const [quizzes, setQuizzes] = useState([])
  const [showQuiz, setShowQuiz] = useState(false)
  const [currentQuiz, setCurrentQuiz] = useState(null)
  const [currentQuizSection, setCurrentQuizSection] = useState(0)
  const [currentQuizQuestion, setCurrentQuizQuestion] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizResults, setQuizResults] = useState(null)
  const [quizSubmitting, setQuizSubmitting] = useState(false)
  const [showQuizResults, setShowQuizResults] = useState(false)

  // Previous quiz attempt state
  const [previousQuizAttempt, setPreviousQuizAttempt] = useState(null)
  const [hasPreviousAttempt, setHasPreviousAttempt] = useState(false)
  const [showPreviousAttempt, setShowPreviousAttempt] = useState(false)

  // Module completion state
  const [showModuleCompleted, setShowModuleCompleted] = useState(false)

  // Add a state to track the number of quiz attempts
  const [quizAttemptCount, setQuizAttemptCount] = useState(0)

  // Function to check if the content is a video
  const isVideoContent = (fileUrl) => {
    if (!fileUrl) return false
    return (
      fileUrl.toLowerCase().endsWith(".mp4") ||
      fileUrl.toLowerCase().includes("/video/upload/") ||
      (fileUrl.toLowerCase().includes("cloudinary") && fileUrl.toLowerCase().includes(".mp4"))
    )
  }

  // Reset video completion status when changing chapters
  useEffect(() => {
    setVideoCompleted(false)

    // Check if this chapter is already completed
    const moduleChapters = unlockedChapters[moduleId] || []
    if (moduleChapters.includes(selectedChapterIndex)) {
      setVideoCompleted(true)
    }
  }, [selectedChapterIndex, unlockedChapters, moduleId])

  // Check authentication status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setAuthChecked(true)
      if (!currentUser) {
        setError("You must be logged in to view this module")
      }
    })

    return () => unsubscribe()
  }, [])

  // Fetch module data, unlocked chapters, quizzes, and previous quiz attempts from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Wait for auth to be checked and make sure user is logged in
        if (!authChecked) return
        if (!user) {
          setContentLoading(false)
          return
        }

        setContentLoading(true)

        // Determine user type and collection to fetch from
        let userType = null
        let collectionName = "courses" // Default collection

        // Check if user exists in learner collection
        const learnerRef = doc(db, "learner", user.uid)
        const learnerSnap = await getDoc(learnerRef)

        // Check if user exists in intern collection
        const internRef = doc(db, "intern", user.uid)
        const internSnap = await getDoc(internRef)

        if (learnerSnap.exists()) {
          userType = "learner"
          collectionName = "courses"
          setUserData(learnerSnap.data())
        } else if (internSnap.exists()) {
          userType = "intern"
          collectionName = "Intern_Course"
          setUserData(internSnap.data())
        } else {
          console.warn("User document not found in 'learner' or 'intern' collection")
        }

        // Fetch module data from the appropriate collection
        const moduleRef = doc(db, collectionName, courseId, "modules", moduleId)
        const moduleSnap = await getDoc(moduleRef)

        // Fetch course data for history records
        const courseRef = doc(db, collectionName, courseId)
        const courseSnap = await getDoc(courseRef)

        // Check if module is already completed in history
        const historyCollection = collection(db, userType === "intern" ? "intern" : "learner", user.uid, "history")
        const historyQuery = query(
          historyCollection,
          where("moduleId", "==", moduleId),
          where("courseId", "==", courseId),
        )
        const historySnapshot = await getDocs(historyQuery)

        if (!historySnapshot.empty) {
          setModuleAlreadyCompleted(true)
          // Store the history document ID for potential updates
          setHistoryDocId(historySnapshot.docs[0].id)
        }

        // Fetch user's progress from Firestore
        const userProgressRef = doc(db, userType === "intern" ? "intern" : "learner", user.uid, "progress", courseId)
        const userProgressDoc = await getDoc(userProgressRef)

        if (userProgressDoc.exists()) {
          const userProgress = userProgressDoc.data()
          setUnlockedChapters(userProgress.completedChapters || {})
        } else {
          setUnlockedChapters({})
        }

        if (moduleSnap.exists() && courseSnap.exists()) {
          setModule(moduleSnap.data())
          setCourse(courseSnap.data())
        } else {
          setError("Module or course not found.")
        }

        // Fetch quizzes for this module from the correct location
        try {
          // Updated path to match the database structure shown in screenshots
          const quizzesCollection = collection(db, collectionName, courseId, "modules", moduleId, "quizzes")
          const quizzesSnapshot = await getDocs(quizzesCollection)

          if (!quizzesSnapshot.empty) {
            const quizzesData = quizzesSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            setQuizzes(quizzesData)

            // Initialize quiz answers
            if (quizzesData.length > 0) {
              const initialQuiz = quizzesData[0]
              setCurrentQuiz(initialQuiz)

              // Initialize answers object
              const initialAnswers = {}
              if (initialQuiz.sections) {
                initialQuiz.sections.forEach((section, sectionIndex) => {
                  if (section.questions && Array.isArray(section.questions)) {
                    section.questions.forEach((question, questionIndex) => {
                      initialAnswers[`${sectionIndex}-${questionIndex}`] = null
                    })
                  }
                })
              }
              setQuizAnswers(initialAnswers)

              // Check for previous quiz attempts in moduleScore collection
              try {
                // Try the appropriate collection based on user type
                const moduleScoreQuery = query(
                  collection(db, userType === "intern" ? "intern" : "learner", user.uid, "moduleScore"),
                  where("moduleId", "==", moduleId),
                  where("courseId", "==", courseId),
                )

                const moduleScoreSnapshot = await getDocs(moduleScoreQuery)

                if (!moduleScoreSnapshot.empty) {
                  // Get all attempts
                  const attempts = moduleScoreSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                  }))

                  // Sort by completedAt timestamp (most recent first)
                  attempts.sort((a, b) => {
                    const aTime = a.completedAt?.toDate?.() || new Date(0)
                    const bTime = b.completedAt?.toDate?.() || new Date(0)
                    return bTime - aTime
                  })

                  // Set the attempt count
                  setQuizAttemptCount(attempts.length)

                  const latestAttempt = attempts[0]
                  setPreviousQuizAttempt(latestAttempt)
                  setHasPreviousAttempt(true)

                  console.log("Found previous quiz attempts:", attempts.length)
                }
              } catch (error) {
                console.error("Error fetching previous quiz attempts:", error)
              }
            }
          }
        } catch (error) {
          console.error("Error fetching quizzes:", error)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        setError(`Failed to load module: ${error.message}`)
      } finally {
        setContentLoading(false)
      }
    }

    fetchData()
  }, [courseId, moduleId, user, authChecked])

  // Function to mark the current chapter as completed
  const markChapterAsCompleted = async () => {
    if (!module || !user) return

    try {
      setUnlockedChapters((prev) => {
        const moduleChapters = prev[moduleId] || []

        // If this chapter is not already marked as completed
        if (!moduleChapters.includes(selectedChapterIndex)) {
          const updatedModuleChapters = [...moduleChapters, selectedChapterIndex]
          const updatedUnlockedChapters = {
            ...prev,
            [moduleId]: updatedModuleChapters,
          }

          // Determine user type
          const userCollection = userData && userData.role === "intern" ? "intern" : "learner"

          // Save to Firestore
          const userProgressRef = doc(db, userCollection, user.uid, "progress", courseId)
          setDoc(
            userProgressRef,
            {
              completedChapters: updatedUnlockedChapters,
              lastUpdated: serverTimestamp(),
            },
            { merge: true },
          )

          return updatedUnlockedChapters
        }

        return prev
      })
    } catch (error) {
      console.error("Error saving chapter completion:", error)
    }
  }

  // Set up scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current || !module) return

      const { scrollTop, scrollHeight, clientHeight } = contentRef.current
      const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 50

      if (scrolledToBottom) {
        // Only mark non-video content as completed via scrolling
        const selectedChapter = module.chapters[selectedChapterIndex]
        const isVideo = isVideoContent(selectedChapter.fileUrl.url || selectedChapter.fileUrl)

        if (!isVideo) {
          // Mark current chapter as completed
          markChapterAsCompleted()
        }

        // If this is the last chapter, enable the Finish button
        if (selectedChapterIndex === module.chapters.length - 1) {
          setIsLastChapterScrolledToBottom(true)
        }
      }
    }

    const contentElement = contentRef.current
    if (contentElement) {
      contentElement.addEventListener("scroll", handleScroll)
    }

    return () => {
      if (contentElement) {
        contentElement.removeEventListener("scroll", handleScroll)
      }
    }
  }, [selectedChapterIndex, module])

  // Function to check if a chapter is unlocked
  const isChapterUnlocked = (index) => {
    if (index === 0) return true
    const moduleChapters = unlockedChapters[moduleId] || []
    return moduleChapters.includes(index - 1)
  }

  // Navigate to next chapter
  const goToNextChapter = () => {
    if (selectedChapterIndex < module.chapters.length - 1 && isChapterUnlocked(selectedChapterIndex + 1)) {
      setSelectedChapterIndex(selectedChapterIndex + 1)
      // Reset the last chapter scrolled state when changing chapters
      setIsLastChapterScrolledToBottom(false)
      // Scroll back to top when changing chapters
      if (contentRef.current) {
        contentRef.current.scrollTop = 0
      }
    }
  }

  // Function to mark module as completed and record in history
  const completeModule = async () => {
    if (!user || !module || !course) return

    try {
      setSavingCompletion(true)

      // Determine user type
      const userCollection = userData && userData.role === "intern" ? "intern" : "learner"

      // 1. Mark the module as completed in Firestore
      const userProgressRef = doc(db, userCollection, user.uid, "progress", courseId)
      const userProgressDoc = await getDoc(userProgressRef)

      let completedModules = []
      if (userProgressDoc.exists()) {
        completedModules = userProgressDoc.data().completedModules || []
      }

      if (!completedModules.includes(moduleId)) {
        completedModules.push(moduleId)
        await setDoc(
          userProgressRef,
          {
            completedModules,
            lastUpdated: serverTimestamp(),
          },
          { merge: true },
        )
      }

      // 2. Add completion record to user's history in Firestore ONLY if not already completed
      if (!moduleAlreadyCompleted) {
        const historyCollection = collection(db, userCollection, user.uid, "history")
        const historyDoc = await addDoc(historyCollection, {
          courseId,
          courseTitle: course.title,
          moduleId,
          moduleTitle: module.title,
          completedAt: serverTimestamp(),
          chaptersCompleted: (unlockedChapters[moduleId] || []).length,
          totalChapters: module.chapters.length,
        })

        // Store the history document ID
        setHistoryDocId(historyDoc.id)

        // Update module completion status
        setModuleAlreadyCompleted(true)
      }

      // 3. Show module completed screen
      setShowModuleCompleted(true)
    } catch (error) {
      console.error("Error saving completion:", error)
      setError("There was an error saving your progress. Please try again.")
    } finally {
      setSavingCompletion(false)
    }
  }

  // Handle video completion
  const handleVideoComplete = () => {
    setVideoCompleted(true)
    markChapterAsCompleted()
  }

  // Handle login redirect
  const handleLoginRedirect = () => {
    // Save current URL to localStorage to redirect back after login
    localStorage.setItem("redirectAfterLogin", window.location.href)
    navigate("/login")
  }

  // Quiz functions
  const handleQuizAnswerSelect = (questionKey, optionIndex) => {
    setQuizAnswers({
      ...quizAnswers,
      [questionKey]: optionIndex,
    })
  }

  const goToNextQuizQuestion = () => {
    if (!currentQuiz || !currentQuiz.sections || currentQuiz.sections.length === 0) return

    const currentSectionQuestions = currentQuiz.sections[currentQuizSection]?.questions || []

    if (currentQuizQuestion < currentSectionQuestions.length - 1) {
      // Go to next question in current section
      setCurrentQuizQuestion(currentQuizQuestion + 1)
    } else if (currentQuizSection < currentQuiz.sections.length - 1) {
      // Go to first question of next section
      setCurrentQuizSection(currentQuizSection + 1)
      setCurrentQuizQuestion(0)
    }
  }

  const goToPreviousQuizQuestion = () => {
    if (currentQuizQuestion > 0) {
      // Go to previous question in current section
      setCurrentQuizQuestion(currentQuizQuestion - 1)
    } else if (currentQuizSection > 0) {
      // Go to last question of previous section
      setCurrentQuizSection(currentQuizSection - 1)
      const previousSectionQuestions = currentQuiz.sections[currentQuizSection - 1]?.questions || []
      setCurrentQuizQuestion(previousSectionQuestions.length - 1)
    }
  }

  const calculateQuizResults = () => {
    if (!currentQuiz || !currentQuiz.sections)
      return { score: 0, totalPoints: 0, percentage: 0, correctAnswers: 0, totalQuestions: 0, passed: false }

    let totalPoints = 0
    let earnedPoints = 0
    let correctAnswers = 0
    let totalQuestions = 0

    currentQuiz.sections.forEach((section, sectionIndex) => {
      if (!section.questions) return

      section.questions.forEach((question, questionIndex) => {
        const questionKey = `${sectionIndex}-${questionIndex}`
        const userAnswer = quizAnswers[questionKey]
        const correctOption = question.correctOption
        const points = question.points || 1 // Default to 1 point if not specified

        totalPoints += points
        totalQuestions++

        if (userAnswer === correctOption) {
          earnedPoints += points
          correctAnswers++
        }
      })
    })

    const percentage = Math.round((earnedPoints / totalPoints) * 100) || 0
    const passed = percentage >= 70 // Assuming 70% is passing score

    return {
      score: earnedPoints,
      totalPoints,
      percentage,
      correctAnswers,
      totalQuestions,
      passed,
    }
  }

  const submitQuiz = async () => {
    if (quizSubmitting) return

    try {
      setQuizSubmitting(true)

      // Calculate results
      const results = calculateQuizResults()
      setQuizResults(results)

      // Save results to Firestore
      if (user) {
        const scoreData = {
          userId: user.uid,
          courseId,
          quizId: currentQuiz.id,
          moduleId,
          quizTitle: currentQuiz.title,
          score: results.score,
          totalPoints: results.totalPoints,
          percentage: results.percentage,
          correctAnswers: results.correctAnswers,
          totalQuestions: results.totalQuestions,
          passed: results.passed,
          answers: quizAnswers,
          completedAt: serverTimestamp(),
          attempts: quizAttemptCount + 1, // Add attempts field to track number of attempts
        }

        // Determine user type
        const userCollection = userData && userData.role === "intern" ? "intern" : "learner"

        // Add to user's moduleScore collection
        await addDoc(collection(db, userCollection, user.uid, "moduleScore"), scoreData)
        setQuizAttemptCount((prevCount) => prevCount + 1)

        console.log("Quiz results saved to Firestore")

        // Set has previous attempt since we just submitted a quiz
        setHasPreviousAttempt(true)
        setPreviousQuizAttempt(scoreData)

        // Mark the module as completed in the database, but don't show the completion screen yet
        await markModuleAsCompleted()
      }

      setQuizSubmitted(true)
      setShowQuizResults(true)
    } catch (error) {
      console.error("Error submitting quiz:", error)
    } finally {
      setQuizSubmitting(false)
    }
  }

  const getTotalQuizQuestions = () => {
    if (!currentQuiz || !currentQuiz.sections) return 0

    return currentQuiz.sections.reduce((total, section) => {
      return total + (section.questions ? section.questions.length : 0)
    }, 0)
  }

  const getCurrentQuizQuestionNumber = () => {
    if (!currentQuiz || !currentQuiz.sections) return 0

    let questionNumber = 1

    for (let i = 0; i < currentQuizSection; i++) {
      questionNumber += currentQuiz.sections[i]?.questions?.length || 0
    }

    return questionNumber + currentQuizQuestion
  }

  const getAnsweredQuizQuestionsCount = () => {
    return Object.values(quizAnswers).filter((answer) => answer !== null).length
  }

  // Function to view previous quiz attempt
  const viewPreviousQuizAttempt = () => {
    if (!hasPreviousAttempt || !previousQuizAttempt) return

    // Set the quiz answers from the previous attempt
    if (previousQuizAttempt.answers) {
      setQuizAnswers(previousQuizAttempt.answers)
    }

    // Set the quiz results from the previous attempt
    setQuizResults({
      score: previousQuizAttempt.score,
      totalPoints: previousQuizAttempt.totalPoints,
      percentage: previousQuizAttempt.percentage,
      correctAnswers: previousQuizAttempt.correctAnswers,
      totalQuestions: previousQuizAttempt.totalQuestions,
      passed: previousQuizAttempt.passed,
    })

    setQuizSubmitted(true)
    setShowQuiz(true)
    setShowPreviousAttempt(true)
    setShowQuizResults(true)
  }

  // Function to restart the module
  const handleRestartModule = () => {
    setSelectedChapterIndex(0)
    setShowModuleCompleted(false)
    if (contentRef.current) {
      contentRef.current.scrollTop = 0
    }
  }

  // Function to go to assessment exam
  const handleGoToAssessment = () => {
    // Navigate to assessment exam page
    navigate(`/assessment?courseId=${courseId}`)
  }

  // Function to mark module as completed in the database without showing the completion screen
  const markModuleAsCompleted = async () => {
    if (!user || !module || !course) return

    try {
      setSavingCompletion(true)

      // Determine user type
      const userCollection = userData && userData.role === "intern" ? "intern" : "learner"

      // 1. Mark the module as completed in Firestore
      const userProgressRef = doc(db, userCollection, user.uid, "progress", courseId)
      const userProgressDoc = await getDoc(userProgressRef)

      let completedModules = []
      if (userProgressDoc.exists()) {
        completedModules = userProgressDoc.data().completedModules || []
      }

      if (!completedModules.includes(moduleId)) {
        completedModules.push(moduleId)
        await setDoc(
          userProgressRef,
          {
            completedModules,
            lastUpdated: serverTimestamp(),
          },
          { merge: true },
        )
      }

      // 2. Add completion record to user's history in Firestore ONLY if not already completed
      if (!moduleAlreadyCompleted) {
        const historyCollection = collection(db, userCollection, user.uid, "history")
        const historyDoc = await addDoc(historyCollection, {
          courseId,
          courseTitle: course.title,
          moduleId,
          moduleTitle: module.title,
          completedAt: serverTimestamp(),
          chaptersCompleted: (unlockedChapters[moduleId] || []).length,
          totalChapters: module.chapters.length,
        })

        // Store the history document ID
        setHistoryDocId(historyDoc.id)

        // Update module completion status
        setModuleAlreadyCompleted(true)
      }
    } catch (error) {
      console.error("Error saving completion:", error)
      setError("There was an error saving your progress. Please try again.")
    } finally {
      setSavingCompletion(false)
    }
  }

  // Show loading state
  if (loading || contentLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center p-8 bg-white rounded-2xl shadow-md">
          <FaSpinner className="animate-spin text-4xl text-indigo-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading module content...</h2>
          <p className="text-gray-500">Please wait while we prepare your learning materials.</p>
        </div>
      </div>
    )
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-lg">
          <div className="bg-indigo-100 p-4 rounded-full inline-flex items-center justify-center mb-4">
            <FaSignInAlt className="text-indigo-600 text-3xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Login Required</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to view this module and track your progress.</p>
          <button
            onClick={handleLoginRedirect}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-medium transition-colors shadow-md"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-lg">
          <div className="bg-rose-100 p-4 rounded-full inline-flex items-center justify-center mb-4">
            <FaTimes className="text-rose-600 text-3xl" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-medium transition-colors shadow-md"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  // Show missing module data error
  if (!module || !module.chapters || module.chapters.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-lg">
          <div className="bg-amber-100 p-4 rounded-full inline-flex items-center justify-center mb-4">
            <FaBook className="text-amber-600 text-3xl" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Module Not Found</h2>
          <p className="text-gray-600 mb-6">The module data is missing or has no chapters.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-medium transition-colors shadow-md"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const selectedChapter = module.chapters[selectedChapterIndex]
  const moduleChapters = unlockedChapters[moduleId] || []
  const isCurrentChapterCompleted = moduleChapters.includes(selectedChapterIndex)
  const isLastChapter = selectedChapterIndex === module.chapters.length - 1
  const isLastChapterVideo =
    isLastChapter &&
    module &&
    module.chapters &&
    isVideoContent(
      module.chapters[selectedChapterIndex]?.fileUrl?.url || module.chapters[selectedChapterIndex]?.fileUrl,
    )
  const canFinish =
    isLastChapter &&
    (isCurrentChapterCompleted || (isLastChapterVideo ? videoCompleted : isLastChapterScrolledToBottom))

  // Show module completed screen
  if (showModuleCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-indigo-900 to-indigo-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8 text-center">
          <div className="bg-green-100 p-4 rounded-full inline-flex items-center justify-center mb-6">
            <FaTrophy className="text-green-600 text-4xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Module Completed!</h1>
          <p className="text-gray-600 text-lg mb-8">Congratulations! You have successfully completed this module.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={handleRestartModule}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors font-medium"
            >
              Restart Module
            </button>
            <button
              onClick={() => window.close()}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
            >
              Finish
            </button>
          </div>
        </div>
      </div>
    )
  }

  // If showing previous quiz results
  if (showQuiz && showQuizResults && quizResults) {
    return (
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white shadow-md flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <FaLayerGroup className="mr-2 text-indigo-600" /> Chapters
            </h2>
          </div>
          <div className="overflow-y-auto flex-1 p-2">
            <ul className="space-y-1">
              {module.chapters.map((chapter, index) => {
                const isUnlocked = isChapterUnlocked(index)
                const isCompleted = moduleChapters.includes(index)

                return (
                  <li
                    key={index}
                    className={`rounded-xl transition-colors ${
                      index === selectedChapterIndex
                        ? "bg-indigo-50 text-indigo-700"
                        : isUnlocked
                          ? "hover:bg-gray-100 cursor-pointer"
                          : "text-gray-400 cursor-not-allowed"
                    }`}
                    onClick={() => {
                      if (isUnlocked) {
                        setShowQuizResults(false)
                        setShowQuiz(false)
                        setShowPreviousAttempt(false)
                        setSelectedChapterIndex(index)
                        if (contentRef.current) {
                          contentRef.current.scrollTop = 0
                        }
                        // Reset last chapter scrolled state when changing chapters
                        if (isLastChapter) {
                          setIsLastChapterScrolledToBottom(false)
                        }
                      }
                    }}
                  >
                    <div className="flex items-center p-3">
                      <div className={`p-2 rounded-lg mr-3 ${isCompleted ? "bg-green-100" : "bg-gray-100"}`}>
                        {!isUnlocked ? (
                          <FaLock className="text-gray-400" />
                        ) : isCompleted ? (
                          <FaCheck className="text-green-600" />
                        ) : (
                          <FaLockOpen className="text-indigo-600" />
                        )}
                      </div>
                      <span className={`${isCompleted ? "font-medium" : ""} truncate`}>{chapter.title}</span>
                    </div>
                  </li>
                )
              })}

              {/* Add quiz to sidebar if available */}
              {quizzes.length > 0 && (
                <li className="rounded-xl bg-indigo-50 text-indigo-700">
                  <div className="flex items-center p-3">
                    <div className={`p-2 rounded-lg mr-3 ${hasPreviousAttempt ? "bg-green-100" : "bg-indigo-100"}`}>
                      {hasPreviousAttempt ? (
                        <FaCheck className="text-green-600" />
                      ) : (
                        <FaClipboardCheck className="text-indigo-600" />
                      )}
                    </div>
                    <span className="font-medium truncate">Module Quiz</span>
                  </div>
                </li>
              )}

              {/* Add Module Completed to sidebar if module is completed */}
              {moduleAlreadyCompleted && (
                <li
                  className="rounded-xl bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer"
                  onClick={() => setShowModuleCompleted(true)}
                >
                  <div className="flex items-center p-3">
                    <div className="p-2 bg-green-100 rounded-lg mr-3">
                      <FaMedal className="text-green-600" />
                    </div>
                    <span className="font-medium truncate">Module Completed</span>
                  </div>
                </li>
              )}
            </ul>
          </div>

          <div className="p-4 border-t">
            <div className="text-sm text-gray-600 mb-1">Progress</div>
            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-green-500 h-full"
                style={{
                  width: `${(moduleChapters.length / module.chapters.length) * 100}%`,
                }}
              ></div>
            </div>
            <div className="text-xs text-right mt-1 text-gray-500">
              {moduleChapters.length}/{module.chapters.length} completed
            </div>
          </div>
        </div>

        {/* Main Content - Quiz Results */}
        <div ref={contentRef} className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6">
            <button
              onClick={() => {
                setShowQuizResults(false)
                setShowQuiz(false)
                setShowPreviousAttempt(false)
              }}
              className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <FaChevronLeft className="mr-2" /> Back to Module
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 text-white">
              <h2 className="text-2xl font-bold mb-2">
                {showPreviousAttempt && previousQuizAttempt ? previousQuizAttempt.quizTitle : currentQuiz?.title}
              </h2>
              <p className="text-indigo-200">Quiz Results</p>
            </div>

            <div className="p-6">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-xl p-6 text-white text-center mb-6">
                <div className="flex items-center justify-center mb-4">
                  <div
                    className={`h-20 w-20 rounded-full flex items-center justify-center ${
                      quizResults.passed ? "bg-green-100 text-green-600" : "bg-rose-100 text-rose-600"
                    }`}
                  >
                    {quizResults.passed ? <FaTrophy className="text-3xl" /> : <FaTimes className="text-3xl" />}
                  </div>
                </div>

                <h3 className="text-2xl font-bold mb-2">
                  {quizResults.passed ? "Congratulations!" : "Quiz Completed"}
                </h3>

                <p className="text-indigo-200">
                  {quizResults.passed
                    ? "You've successfully passed the quiz!"
                    : "You didn't pass this time, but you can try again."}
                </p>
              </div>

              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-indigo-600 mb-2">{quizResults.percentage}%</div>
                <div className="text-gray-500">Your Score</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-gray-800">
                    {quizResults.score}/{quizResults.totalPoints}
                  </div>
                  <div className="text-sm text-gray-500">Points</div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-gray-800">
                    {quizResults.correctAnswers}/{quizResults.totalQuestions}
                  </div>
                  <div className="text-sm text-gray-500">Correct</div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-gray-800">{quizResults.passed ? "Passed" : "Failed"}</div>
                  <div className="text-sm text-gray-500">Result</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={() => {
                    setShowQuizResults(false)
                    setCurrentQuizSection(0)
                    setCurrentQuizQuestion(0)
                  }}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg flex items-center justify-center"
                >
                  <FaLightbulb className="mr-2" /> Review Answers
                </button>

                {quizAttemptCount === 1 && (
                  <button
                    onClick={() => {
                      // Reset quiz state for retake
                      setQuizSubmitted(false)
                      setShowQuizResults(false)
                      setShowPreviousAttempt(false)

                      // Reset answers
                      const initialAnswers = {}
                      if (currentQuiz && currentQuiz.sections) {
                        currentQuiz.sections.forEach((section, sectionIndex) => {
                          if (section.questions && Array.isArray(section.questions)) {
                            section.questions.forEach((question, questionIndex) => {
                              initialAnswers[`${sectionIndex}-${questionIndex}`] = null
                            })
                          }
                        })
                      }
                      setQuizAnswers(initialAnswers)

                      // Reset to first question
                      setCurrentQuizSection(0)
                      setCurrentQuizQuestion(0)
                    }}
                    className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-md hover:shadow-lg flex items-center justify-center"
                  >
                    <FaClipboardCheck className="mr-2" /> Retake Quiz
                    <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      1 attempt left
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // If showing quiz review
  if (showQuiz && currentQuiz) {
    // Get current question data
    const currentSectionData = currentQuiz.sections[currentQuizSection] || { questions: [] }
    const currentQuestionData =
      currentSectionData.questions && currentSectionData.questions[currentQuizQuestion]
        ? currentSectionData.questions[currentQuizQuestion]
        : { question: "Question not found", options: [], correctOption: 0 }
    const questionKey = `${currentQuizSection}-${currentQuizQuestion}`
    const selectedAnswer = quizAnswers[questionKey]
    const isReview = quizSubmitted || showPreviousAttempt
    const isCorrect = isReview && selectedAnswer === currentQuestionData.correctOption

    return (
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white shadow-md flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <FaLayerGroup className="mr-2 text-indigo-600" /> Chapters
            </h2>
          </div>
          <div className="overflow-y-auto flex-1 p-2">
            <ul className="space-y-1">
              {module.chapters.map((chapter, index) => {
                const isUnlocked = isChapterUnlocked(index)
                const isCompleted = moduleChapters.includes(index)

                return (
                  <li
                    key={index}
                    className={`rounded-xl transition-colors ${
                      index === selectedChapterIndex && !showQuiz
                        ? "bg-indigo-50 text-indigo-700"
                        : isUnlocked
                          ? "hover:bg-gray-100 cursor-pointer"
                          : "text-gray-400 cursor-not-allowed"
                    }`}
                    onClick={() => {
                      if (isUnlocked) {
                        setShowQuiz(false)
                        setShowPreviousAttempt(false)
                        setSelectedChapterIndex(index)
                        if (contentRef.current) {
                          contentRef.current.scrollTop = 0
                        }
                        // Reset last chapter scrolled state when changing chapters
                        if (isLastChapter) {
                          setIsLastChapterScrolledToBottom(false)
                        }
                      }
                    }}
                  >
                    <div className="flex items-center p-3">
                      <div className={`p-2 rounded-lg mr-3 ${isCompleted ? "bg-green-100" : "bg-gray-100"}`}>
                        {!isUnlocked ? (
                          <FaLock className="text-gray-400" />
                        ) : isCompleted ? (
                          <FaCheck className="text-green-600" />
                        ) : (
                          <FaLockOpen className="text-indigo-600" />
                        )}
                      </div>
                      <span className={`${isCompleted ? "font-medium" : ""} truncate`}>{chapter.title}</span>
                    </div>
                  </li>
                )
              })}

              {/* Add quiz to sidebar if available */}
              {quizzes.length > 0 && (
                <li className="rounded-xl bg-indigo-50 text-indigo-700">
                  <div className="flex items-center p-3">
                    <div className={`p-2 rounded-lg mr-3 ${hasPreviousAttempt ? "bg-green-100" : "bg-indigo-100"}`}>
                      {hasPreviousAttempt ? (
                        <FaCheck className="text-green-600" />
                      ) : (
                        <FaClipboardCheck className="text-indigo-600" />
                      )}
                    </div>
                    <span className="font-medium truncate">Module Quiz</span>
                  </div>
                </li>
              )}

              {/* Add Module Completed to sidebar if module is completed */}
              {moduleAlreadyCompleted && (
                <li className="rounded-xl bg-green-50 text-green-700">
                  <div className="flex items-center p-3">
                    <div className="p-2 bg-green-100 rounded-lg mr-3">
                      <FaMedal className="text-green-600" />
                    </div>
                    <span className="font-medium truncate">Module Completed</span>
                  </div>
                </li>
              )}
            </ul>
          </div>

          <div className="p-4 border-t">
            <div className="text-sm text-gray-600 mb-1">Progress</div>
            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-green-500 h-full"
                style={{
                  width: `${(moduleChapters.length / module.chapters.length) * 100}%`,
                }}
              ></div>
            </div>
            <div className="text-xs text-right mt-1 text-gray-500">
              {moduleChapters.length}/{module.chapters.length} completed
            </div>
          </div>
        </div>

        {/* Main Content - Quiz */}
        <div ref={contentRef} className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6 flex justify-between items-center">
            <button
              onClick={() => {
                setShowQuiz(false)
                setShowPreviousAttempt(false)
              }}
              className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <FaChevronLeft className="mr-2" /> Back to Module
            </button>

            <div className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full font-medium flex items-center">
              Question {getCurrentQuizQuestionNumber()} of {getTotalQuizQuestions()}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 text-white">
              <h2 className="text-2xl font-bold mb-2">
                {showPreviousAttempt && previousQuizAttempt ? previousQuizAttempt.quizTitle : currentQuiz.title}
              </h2>
              <p className="text-indigo-200">
                {showPreviousAttempt
                  ? "Review Previous Attempt"
                  : currentSectionData.title || `Section ${currentQuizSection + 1}`}
              </p>
            </div>

            <div className="p-6">
              {/* Progress bar */}
              <div className="mb-6">
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-500 ease-out"
                    style={{ width: `${(getAnsweredQuizQuestionsCount() / getTotalQuizQuestions()) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-2 text-sm text-gray-600">
                  <span>
                    Progress: {getAnsweredQuizQuestionsCount()}/{getTotalQuizQuestions()} questions answered
                  </span>
                  {!isReview && (
                    <span className="font-medium text-indigo-600">
                      {Math.round((getAnsweredQuizQuestionsCount() / getTotalQuizQuestions()) * 100)}% complete
                    </span>
                  )}
                </div>
              </div>

              {/* Question */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-medium text-gray-800">{currentQuestionData.question}</h3>
                  {isReview && (
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        isCorrect
                          ? "bg-green-100 text-green-800 border border-green-200"
                          : "bg-rose-100 text-rose-800 border border-rose-200"
                      }`}
                    >
                      {isCorrect ? "Correct" : "Incorrect"}
                    </div>
                  )}
                </div>

                {/* Show correct answer banner if the user got it wrong */}
                {isReview && !isCorrect && selectedAnswer !== null && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-4 flex items-center text-indigo-800">
                    <FaLightbulb className="mr-2 text-indigo-500" />
                    <span>
                      Correct answer: {String.fromCharCode(65 + currentQuestionData.correctOption)} -{" "}
                      {currentQuestionData.options[currentQuestionData.correctOption]}
                    </span>
                  </div>
                )}

                {/* Options */}
                <div className="mt-6 space-y-3">
                  {currentQuestionData.options &&
                    currentQuestionData.options.map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          selectedAnswer === optionIndex
                            ? isReview
                              ? isCorrect
                                ? "border-green-500 bg-green-50"
                                : "border-rose-500 bg-rose-50"
                              : "border-indigo-500 bg-indigo-50"
                            : isReview && currentQuestionData.correctOption === optionIndex
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                        }`}
                        onClick={() => {
                          if (!isReview) {
                            handleQuizAnswerSelect(questionKey, optionIndex)
                          }
                        }}
                      >
                        <div className="flex items-center">
                          <div
                            className={`w-8 h-8 flex items-center justify-center rounded-full mr-3 ${
                              selectedAnswer === optionIndex
                                ? isReview
                                  ? isCorrect
                                    ? "bg-green-500 text-white"
                                    : "bg-rose-500 text-white"
                                  : "bg-indigo-600 text-white"
                                : isReview && currentQuestionData.correctOption === optionIndex
                                  ? "bg-green-500 text-white"
                                  : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {String.fromCharCode(65 + optionIndex)}
                          </div>
                          <span className="flex-1 text-gray-800">{option}</span>
                          {isReview && (
                            <div className="ml-2">
                              {optionIndex === currentQuestionData.correctOption && (
                                <FaCheck className="text-green-500 text-xl" />
                              )}
                              {selectedAnswer === optionIndex && optionIndex !== currentQuestionData.correctOption && (
                                <FaTimes className="text-rose-500 text-xl" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>

                {/* Explanation (in review mode) */}
                {isReview && (
                  <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <div className="font-medium text-gray-800 mb-2 flex items-center">
                      <FaLightbulb className="mr-2 text-indigo-500" /> Answer Explanation
                    </div>
                    <div className="text-gray-700">
                      {currentQuestionData.explanation ||
                        `The correct answer is option ${String.fromCharCode(65 + currentQuestionData.correctOption)}:
                        ${currentQuestionData.options[currentQuestionData.correctOption]}`}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={goToPreviousQuizQuestion}
                  disabled={currentQuizSection === 0 && currentQuizQuestion === 0}
                  className={`px-4 py-2 rounded-xl flex items-center ${
                    currentQuizSection === 0 && currentQuizQuestion === 0
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  <FaChevronLeft className="mr-2" /> Previous
                </button>

                {!isReview ? (
                  <button
                    onClick={submitQuiz}
                    disabled={
                      quizSubmitting ||
                      Object.values(quizAnswers).some((a) => a === null) ||
                      getTotalQuizQuestions() === 0
                    }
                    className={`px-6 py-2 rounded-xl flex items-center ${
                      quizSubmitting ||
                      Object.values(quizAnswers).some((a) => a === null) ||
                      getTotalQuizQuestions() === 0
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    {quizSubmitting ? (
                      <>
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <FaClipboardCheck className="mr-2" /> Submit Quiz
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowQuizResults(true)}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center"
                  >
                    View Results <FaChevronRight className="ml-2" />
                  </button>
                )}

                <button
                  onClick={goToNextQuizQuestion}
                  disabled={
                    currentQuizSection === currentQuiz.sections.length - 1 &&
                    currentQuizQuestion === currentQuiz.sections[currentQuizSection].questions.length - 1
                  }
                  className={`px-4 py-2 rounded-xl flex items-center ${
                    currentQuizSection === currentQuiz.sections.length - 1 &&
                    currentQuizQuestion === currentQuiz.sections[currentQuizSection].questions.length - 1
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Next <FaChevronRight className="ml-2" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <FaLayerGroup className="mr-2 text-indigo-600" /> Chapters
          </h2>
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          <ul className="space-y-1">
            {module.chapters.map((chapter, index) => {
              const isUnlocked = isChapterUnlocked(index)
              const isCompleted = moduleChapters.includes(index)

              return (
                <li
                  key={index}
                  className={`rounded-xl transition-colors ${
                    index === selectedChapterIndex
                      ? "bg-indigo-50 text-indigo-700"
                      : isUnlocked
                        ? "hover:bg-gray-100 cursor-pointer"
                        : "text-gray-400 cursor-not-allowed"
                  }`}
                  onClick={() => {
                    if (isUnlocked) {
                      setSelectedChapterIndex(index)
                      if (contentRef.current) {
                        contentRef.current.scrollTop = 0
                      }
                      // Reset last chapter scrolled state when changing chapters
                      if (isLastChapter) {
                        setIsLastChapterScrolledToBottom(false)
                      }
                    }
                  }}
                >
                  <div className="flex items-center p-3">
                    <div className={`p-2 rounded-lg mr-3 ${isCompleted ? "bg-green-100" : "bg-gray-100"}`}>
                      {!isUnlocked ? (
                        <FaLock className="text-gray-400" />
                      ) : isCompleted ? (
                        <FaCheck className="text-green-600" />
                      ) : (
                        <FaLockOpen className="text-indigo-600" />
                      )}
                    </div>
                    <span className={`${isCompleted ? "font-medium" : ""} truncate`}>{chapter.title}</span>
                  </div>
                </li>
              )
            })}

            {/* Add quiz to sidebar if available */}
            {quizzes.length > 0 && (
              <li
                className="rounded-xl hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  // If there's a previous attempt, automatically show the results
                  if (hasPreviousAttempt) {
                    viewPreviousQuizAttempt()
                  } else {
                    setShowQuiz(true)
                  }
                }}
              >
                <div className="flex items-center p-3">
                  <div className={`p-2 rounded-lg mr-3 ${hasPreviousAttempt ? "bg-green-100" : "bg-indigo-100"}`}>
                    {hasPreviousAttempt ? (
                      <FaCheck className="text-green-600" />
                    ) : (
                      <FaClipboardCheck className="text-indigo-600" />
                    )}
                  </div>
                  <span className="truncate">Module Quiz</span>
                </div>
              </li>
            )}

            {/* Add Module Completed to sidebar if module is completed */}
            {moduleAlreadyCompleted && (
              <li
                className="rounded-xl bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer"
                onClick={() => setShowModuleCompleted(true)}
              >
                <div className="flex items-center p-3">
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <FaMedal className="text-green-600" />
                  </div>
                  <span className="font-medium truncate">Module Completed</span>
                </div>
              </li>
            )}
          </ul>
        </div>

        <div className="p-4 border-t">
          <div className="text-sm text-gray-600 mb-1">Progress</div>
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-green-500 h-full"
              style={{
                width: `${(moduleChapters.length / module.chapters.length) * 100}%`,
              }}
            ></div>
          </div>
          <div className="text-xs text-right mt-1 text-gray-500">
            {moduleChapters.length}/{module.chapters.length} completed
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div ref={contentRef} className="flex-1 p-6 overflow-y-auto">
        {/* Chapter Header */}
        <div className="bg-gradient-to-r from-sky-500 to-indigo-600 rounded-2xl shadow-lg mb-8 overflow-hidden">
          <div className="p-8">
            <div className="flex items-center mb-2">
              <div className="bg-white p-2 rounded-full shadow-md mr-3">
                <FaChalkboardTeacher className="text-indigo-600 text-xl" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">{selectedChapter.title}</h1>
            </div>
            <p className="text-indigo-100 ml-12">{selectedChapter.description || "No description available"}</p>
          </div>
        </div>

        {/* Previous quiz attempt notification */}
        {hasPreviousAttempt && previousQuizAttempt && (
          <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 p-4 rounded-xl mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold mb-1">Previous Quiz Attempt Found</h3>
                <p>You've already taken the quiz for this module. Your score was {previousQuizAttempt.percentage}%.</p>
                <p className="text-sm text-indigo-600 mt-1">
                  Completed on: {previousQuizAttempt.completedAt?.toDate?.().toLocaleDateString() || "Unknown date"}
                </p>
              </div>
              <button
                onClick={viewPreviousQuizAttempt}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
              >
                View Results
              </button>
            </div>
          </div>
        )}

        {/* Module Overview Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center mb-4">
            <div className="bg-indigo-100 p-2 rounded-full mr-3">
              <FaCheck className="text-indigo-600 text-xl" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Chapter Content</h2>
          </div>
          <p className="text-gray-600 ml-12 mb-4">
            This chapter covers important concepts and materials to help you understand the topic better.
          </p>

          {/* Content Display - Video or iframe based on content type */}
          {isVideoContent(selectedChapter.fileUrl.url || selectedChapter.fileUrl) ? (
            <div className="mt-6 bg-gray-800 rounded-xl overflow-hidden">
              <VideoPlayer
                src={selectedChapter.fileUrl.url || selectedChapter.fileUrl}
                onComplete={handleVideoComplete}
                isCompleted={isCurrentChapterCompleted}
                className="max-h-[600px]"
              />
              {videoCompleted && !isCurrentChapterCompleted && (
                <div className="mt-3 bg-green-100 text-green-800 p-3 rounded-xl">
                  <p className="text-sm font-medium">Video completed!</p>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6">
              <iframe
                src={selectedChapter.fileUrl.url || selectedChapter.fileUrl}
                width="100%"
                height="600px"
                className="border rounded-xl"
                title="Chapter Content"
              />
            </div>
          )}
        </div>

        {isCurrentChapterCompleted && !isLastChapter && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl mb-6">
            <div className="flex items-center">
              <FaCheck className="text-green-600 mr-2" />
              <p className="font-medium">You've completed this chapter!</p>
            </div>
          </div>
        )}

        {/* Module Quiz Button (if available) */}
        {quizzes.length > 0 && isLastChapter && canFinish && !hasPreviousAttempt && (
          <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 p-4 rounded-xl mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold mb-1">Module Quiz Available</h3>
                <p>Test your knowledge with a quiz on this module's content.</p>
              </div>
              <button
                onClick={() => {
                  setShowQuiz(true)
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
              >
                Take Quiz
              </button>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 mb-8">
          <button
            onClick={() => {
              if (selectedChapterIndex > 0) {
                setSelectedChapterIndex(selectedChapterIndex - 1)
                if (contentRef.current) {
                  contentRef.current.scrollTop = 0
                }
              }
            }}
            disabled={selectedChapterIndex === 0}
            className={`flex items-center px-6 py-3 rounded-xl font-medium transition-colors ${
              selectedChapterIndex === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <FaArrowLeft className="mr-2" /> Previous Chapter
          </button>

          <button
            className={`flex items-center px-6 py-3 rounded-xl font-medium transition-colors ${
              canFinish
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
            disabled={
              (isLastChapter && !canFinish) ||
              (!isLastChapter && !isChapterUnlocked(selectedChapterIndex + 1)) ||
              savingCompletion ||
              (isVideoContent(selectedChapter.fileUrl.url || selectedChapter.fileUrl) &&
                !videoCompleted &&
                !isCurrentChapterCompleted)
            }
            onClick={() => {
              if (isLastChapter && canFinish) {
                if (quizAttemptCount >= 2) {
                  // If user has 2 or more attempts, directly show results
                  viewPreviousQuizAttempt()
                } else if (quizAttemptCount === 1) {
                  // If user has 1 attempt, show results with retake option
                  viewPreviousQuizAttempt()
                } else {
                  // If no attempts, show the quiz
                  setShowQuiz(true)
                }
              } else {
                goToNextChapter()
              }
            }}
          >
            {isLastChapter && canFinish ? "Next" : "Next Chapter"} <FaArrowRight className="ml-2" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModuleView
