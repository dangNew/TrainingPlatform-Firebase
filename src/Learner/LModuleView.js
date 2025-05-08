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
} from "react-icons/fa"
import { auth, db } from "../firebase.config"
import VideoPlayer from "./video-player"

// Add this CSS for animations
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

/* Quiz styles */
.quiz-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  margin-top: 2rem;
  margin-bottom: 2rem;
  overflow: hidden;
}

.quiz-header {
  background: linear-gradient(90deg, #2d3748, #4a5568);
  padding: 1.5rem;
  color: white;
}

.quiz-body {
  padding: 1.5rem;
}

.quiz-question {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border-left: 4px solid #4a5568;
}

.quiz-option {
  padding: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  color: black; /* Change the text color to black */
}

.quiz-option:hover {
  border-color: #4a5568;
  background-color: #f7fafc;
}

.quiz-option.selected {
  border-color: #4a5568;
  background-color: #edf2f7;
}

.quiz-option.correct {
  border-color: #48bb78;
  background-color: #f0fff4;
}

.quiz-option.incorrect {
  border-color: #f56565;
  background-color: #fff5f5;
}

.quiz-result {
  background: linear-gradient(90deg, #3182ce, #5a67d8);
  color: white;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  margin-bottom: 1.5rem;
}

.quiz-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin: 1.5rem 0;
}

.quiz-stat {
  background: #f7fafc;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}

.module-completed {
  background: linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('/placeholder.svg?height=800&width=1200');
  background-size: cover;
  background-position: center;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 2rem;
}

.module-completed h1 {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.module-completed p {
  font-size: 1.5rem;
  margin-bottom: 3rem;
}

.module-completed-buttons {
  display: flex;
  gap: 1rem;
}

.module-completed-button {
  padding: 0.75rem 2rem;
  font-weight: bold;
  border-radius: 0.25rem;
  transition: all 0.2s;
  cursor: pointer;
}

.module-completed-button.primary {
  background-color: #e53e3e;
  color: white;
}

.module-completed-button.primary:hover {
  background-color: #c53030;
}

.module-completed-button.secondary {
  background-color: #2d3748;
  color: white;
}

.module-completed-button.secondary:hover {
  background-color: #1a202c;
}
`

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

        // Fetch module data
        const moduleRef = doc(db, "courses", courseId, "modules", moduleId)
        const moduleSnap = await getDoc(moduleRef)

        // Fetch course data for history records
        const courseRef = doc(db, "courses", courseId)
        const courseSnap = await getDoc(courseRef)

        // Fetch user data
        const userRef = doc(db, "learner", user.uid)
        const userSnap = await getDoc(userRef)

        // Try intern collection if learner doesn't exist
        if (!userSnap.exists()) {
          const internRef = doc(db, "intern", user.uid)
          const internSnap = await getDoc(internRef)
          if (internSnap.exists()) {
            setUserData(internSnap.data())
          } else {
            console.warn("User document not found in 'learner' or 'intern' collection")
          }
        } else {
          setUserData(userSnap.data())
        }

        // Check if module is already completed in history
        const historyCollection = collection(db, "learner", user.uid, "history")
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
        const userProgressRef = doc(db, "learner", user.uid, "progress", courseId)
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

        // Fetch quizzes for this module
        try {
          const quizzesCollection = collection(db, "courses", courseId, "modules", moduleId, "quizzes")
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
                // Try learner collection first
                let moduleScoreQuery = query(
                  collection(db, "learner", user.uid, "moduleScore"),
                  where("moduleId", "==", moduleId),
                  where("courseId", "==", courseId),
                )

                let moduleScoreSnapshot = await getDocs(moduleScoreQuery)

                // If no results, try intern collection
                if (moduleScoreSnapshot.empty) {
                  moduleScoreQuery = query(
                    collection(db, "intern", user.uid, "moduleScore"),
                    where("moduleId", "==", moduleId),
                    where("courseId", "==", courseId),
                  )
                  moduleScoreSnapshot = await getDocs(moduleScoreQuery)
                }

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

          // Save to Firestore
          const userProgressRef = doc(db, "learner", user.uid, "progress", courseId)
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

      // 1. Mark the module as completed in Firestore
      const userProgressRef = doc(db, "learner", user.uid, "progress", courseId)
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
        const historyCollection = collection(db, "learner", user.uid, "history")
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
        }

        // Add to user's moduleScore collection
        await addDoc(collection(db, "learner", user.uid, "moduleScore"), scoreData)
        setQuizAttemptCount((prevCount) => prevCount + 1)

        console.log("Quiz results saved to Firestore")

        // Set has previous attempt since we just submitted a quiz
        setHasPreviousAttempt(true)
        setPreviousQuizAttempt(scoreData)

        // Automatically complete the module after quiz submission
        await completeModule()
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

  // Show loading state
  if (loading || contentLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading module content...</p>
        </div>
      </div>
    )
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center max-w-md p-8 bg-gray-800 rounded-xl shadow-2xl">
          <FaSignInAlt className="text-5xl text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Login Required</h2>
          <p className="mb-6">You need to be logged in to view this module and track your progress.</p>
          <button
            onClick={handleLoginRedirect}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
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
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center max-w-md p-8 bg-gray-800 rounded-xl shadow-2xl">
          <div className="text-red-500 text-5xl mx-auto mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-4">Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
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
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center max-w-md p-8 bg-gray-800 rounded-xl shadow-2xl">
          <div className="text-yellow-500 text-5xl mx-auto mb-4">📋</div>
          <h2 className="text-xl font-bold text-white mb-4">Module Not Found</h2>
          <p className="text-gray-300 mb-6">The module data is missing or has no chapters.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
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
      <>
        {/* Add the styles */}
        <style dangerouslySetInnerHTML={{ __html: styles }} />

        <div className="module-completed">
          <h1 className="text-white">MODULE COMPLETED</h1>
          <p className="text-white">Congratulations! You have completed this module.</p>

          <div className="module-completed-buttons">
            {/* <button onClick={handleRestartModule} className="module-completed-button secondary">
              RESTART MODULE
            </button> */}
            <button onClick={() => window.close()} className="module-completed-button primary">
              FINISH
            </button>
          </div>
        </div>
      </>
    )
  }

  // If showing previous quiz results
  if (showQuiz && showQuizResults && quizResults) {
    return (
      <>
        {/* Add the styles */}
        <style dangerouslySetInnerHTML={{ __html: styles }} />

        <div className="flex h-screen bg-gray-900 text-white">
          {/* Sidebar Navigation */}
          <div className="w-64 p-4 bg-gray-800 flex flex-col">
            <h2 className="text-xl font-semibold mb-4">Chapters</h2>
            <ul className="space-y-2">
              {module.chapters.map((chapter, index) => {
                const isUnlocked = isChapterUnlocked(index)
                const isCompleted = moduleChapters.includes(index)

                return (
                  <li
                    key={index}
                    className={`p-2 flex items-center gap-2 rounded transition-colors ${
                      index === selectedChapterIndex
                        ? "bg-blue-900 text-blue-300"
                        : isUnlocked
                          ? "hover:bg-gray-700 cursor-pointer"
                          : "text-gray-500 cursor-not-allowed"
                    } ${isCompleted ? "border-l-4 border-green-500" : ""}`}
                    onClick={() => {
                      if (isUnlocked) {
                        setShowQuiz(false)
                        setShowQuizResults(false)
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
                    {!isUnlocked ? (
                      <FaLock className="text-gray-500" />
                    ) : isCompleted ? (
                      <FaCheck className="text-green-500" />
                    ) : (
                      <FaLockOpen className="text-blue-400" />
                    )}
                    <span className={isCompleted ? "text-green-400" : ""}>{chapter.title}</span>
                  </li>
                )
              })}

              {/* Add quiz to sidebar if available */}
              {quizzes.length > 0 && (
                <li className={`p-2 flex items-center gap-2 rounded transition-colors bg-blue-900 text-blue-300`}>
                  {hasPreviousAttempt ? (
                    <FaCheck className="text-green-500" />
                  ) : (
                    <FaClipboardCheck className="text-blue-400" />
                  )}
                  <span>Module Quiz</span>
                </li>
              )}

              {/* Add Module Completed to sidebar if module is completed */}
              {moduleAlreadyCompleted && (
                <li
                  className="p-2 flex items-center gap-2 rounded transition-colors bg-green-800 text-white hover:bg-green-700 cursor-pointer"
                  onClick={() => setShowModuleCompleted(true)}
                >
                  <FaMedal className="text-yellow-400" />
                  <span>Module Completed</span>
                </li>
              )}
            </ul>

            <div className="mt-auto p-2 bg-gray-700 rounded">
              <div className="text-sm text-gray-300 mb-1">Progress</div>
              <div className="w-full bg-gray-600 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-green-500 h-full"
                  style={{
                    width: `${(moduleChapters.length / module.chapters.length) * 100}%`,
                  }}
                ></div>
              </div>
              <div className="text-xs text-right mt-1 text-gray-300">
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
                className="flex items-center text-blue-400 hover:text-blue-300 transition-colors"
              >
                <FaChevronLeft className="mr-2" /> Back to Module
              </button>
            </div>

            <div className="quiz-container animate-fadeIn">
              <div className="quiz-header">
                <h2 className="text-2xl font-bold mb-2">
                  {showPreviousAttempt && previousQuizAttempt ? previousQuizAttempt.quizTitle : currentQuiz?.title}
                </h2>
                <p className="text-blue-200">Quiz Results</p>
              </div>

              <div className="quiz-body">
                <div className="quiz-result">
                  <div className="flex items-center justify-center mb-4">
                    <div
                      className={`h-20 w-20 rounded-full flex items-center justify-center ${
                        quizResults.passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                      }`}
                    >
                      {quizResults.passed ? <FaTrophy className="text-3xl" /> : <FaTimes className="text-3xl" />}
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold mb-2">
                    {quizResults.passed ? "Congratulations!" : "Quiz Completed"}
                  </h3>

                  <p className="text-blue-200">
                    {quizResults.passed
                      ? "You've successfully passed the quiz!"
                      : "You didn't pass this time, but you can try again."}
                  </p>
                </div>

                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-blue-600 mb-2">{quizResults.percentage}%</div>
                  <div className="text-gray-500">Your Score</div>
                </div>

                <div className="quiz-stats">
                  <div className="quiz-stat">
                    <div className="text-2xl font-bold text-gray-800">
                      {quizResults.score}/{quizResults.totalPoints}
                    </div>
                    <div className="text-sm text-gray-500">Points</div>
                  </div>

                  <div className="quiz-stat">
                    <div className="text-2xl font-bold text-gray-800">
                      {quizResults.correctAnswers}/{quizResults.totalQuestions}
                    </div>
                    <div className="text-sm text-gray-500">Correct</div>
                  </div>

                  <div className="quiz-stat">
                    <div className="text-2xl font-bold text-gray-800">{quizResults.passed ? "Passed" : "Failed"}</div>
                    <div className="text-sm text-gray-500">Result</div>
                  </div>
                </div>

                <div className="flex justify-center gap-4 mt-8">
                  <button
                    onClick={() => {
                      setShowQuizResults(false)
                      setCurrentQuizSection(0)
                      setCurrentQuizQuestion(0)
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg flex items-center justify-center"
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
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md hover:shadow-lg flex items-center justify-center"
                    >
                      <FaClipboardCheck className="mr-2" /> Retake Quiz
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
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
      <>
        {/* Add the styles */}
        <style dangerouslySetInnerHTML={{ __html: styles }} />

        <div className="flex h-screen bg-gray-900 text-white">
          {/* Sidebar Navigation */}
          <div className="w-64 p-4 bg-gray-800 flex flex-col">
            <h2 className="text-xl font-semibold mb-4">Chapters</h2>
            <ul className="space-y-2">
              {module.chapters.map((chapter, index) => {
                const isUnlocked = isChapterUnlocked(index)
                const isCompleted = moduleChapters.includes(index)

                return (
                  <li
                    key={index}
                    className={`p-2 flex items-center gap-2 rounded transition-colors ${
                      index === selectedChapterIndex && !showQuiz
                        ? "bg-blue-900 text-blue-300"
                        : isUnlocked
                          ? "hover:bg-gray-700 cursor-pointer"
                          : "text-gray-500 cursor-not-allowed"
                    } ${isCompleted ? "border-l-4 border-green-500" : ""}`}
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
                    {!isUnlocked ? (
                      <FaLock className="text-gray-500" />
                    ) : isCompleted ? (
                      <FaCheck className="text-green-500" />
                    ) : (
                      <FaLockOpen className="text-blue-400" />
                    )}
                    <span className={isCompleted ? "text-green-400" : ""}>{chapter.title}</span>
                  </li>
                )
              })}

              {/* Add quiz to sidebar if available */}
              {quizzes.length > 0 && (
                <li className={`p-2 flex items-center gap-2 rounded transition-colors bg-blue-900 text-blue-300`}>
                  {hasPreviousAttempt ? (
                    <FaCheck className="text-green-500" />
                  ) : (
                    <FaClipboardCheck className="text-blue-400" />
                  )}
                  <span>Module Quiz</span>
                </li>
              )}

              {/* Add Module Completed to sidebar if module is completed */}
              {moduleAlreadyCompleted && (
                <li className="p-2 flex items-center gap-2 rounded transition-colors bg-green-800 text-white">
                  <FaMedal className="text-yellow-400" />
                  <span>Module Completed</span>
                </li>
              )}
            </ul>

            <div className="mt-auto p-2 bg-gray-700 rounded">
              <div className="text-sm text-gray-300 mb-1">Progress</div>
              <div className="w-full bg-gray-600 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-green-500 h-full"
                  style={{
                    width: `${(moduleChapters.length / module.chapters.length) * 100}%`,
                  }}
                ></div>
              </div>
              <div className="text-xs text-right mt-1 text-gray-300">
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
                className="flex items-center text-blue-400 hover:text-blue-300 transition-colors"
              >
                <FaChevronLeft className="mr-2" /> Back to Module
              </button>

              <div className="bg-blue-900 text-blue-200 px-4 py-2 rounded-full font-medium flex items-center">
                Question {getCurrentQuizQuestionNumber()} of {getTotalQuizQuestions()}
              </div>
            </div>

            <div className="quiz-container">
              <div className="quiz-header">
                <h2 className="text-2xl font-bold mb-2">
                  {showPreviousAttempt && previousQuizAttempt ? previousQuizAttempt.quizTitle : currentQuiz.title}
                </h2>
                <p className="text-blue-200">
                  {showPreviousAttempt
                    ? "Review Previous Attempt"
                    : currentSectionData.title || `Section ${currentQuizSection + 1}`}
                </p>
              </div>

              <div className="quiz-body">
                {/* Progress bar */}
                <div className="mb-6">
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-500 ease-out"
                      style={{ width: `${(getAnsweredQuizQuestionsCount() / getTotalQuizQuestions()) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-2 text-sm text-gray-600">
                    <span>
                      Progress: {getAnsweredQuizQuestionsCount()}/{getTotalQuizQuestions()} questions answered
                    </span>
                    {!isReview && (
                      <span className="font-medium text-blue-600">
                        {Math.round((getAnsweredQuizQuestionsCount() / getTotalQuizQuestions()) * 100)}% complete
                      </span>
                    )}
                  </div>
                </div>

                {/* Question */}
                <div className="quiz-question">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-medium text-gray-800">{currentQuestionData.question}</h3>
                    {isReview && (
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          isCorrect
                            ? "bg-green-100 text-green-800 border border-green-200"
                            : "bg-red-100 text-red-800 border border-red-200"
                        }`}
                      >
                        {isCorrect ? "Correct" : "Incorrect"}
                      </div>
                    )}
                  </div>

                  {/* Show correct answer banner if the user got it wrong */}
                  {isReview && !isCorrect && selectedAnswer !== null && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center text-blue-800">
                      <FaLightbulb className="mr-2 text-blue-500" />
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
                          className={`quiz-option ${
                            selectedAnswer === optionIndex
                              ? isReview
                                ? isCorrect
                                  ? "correct"
                                  : "incorrect"
                                : "selected"
                              : isReview && currentQuestionData.correctOption === optionIndex
                                ? "correct"
                                : ""
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
                                      : "bg-red-500 text-white"
                                    : "bg-blue-600 text-white"
                                  : isReview && currentQuestionData.correctOption === optionIndex
                                    ? "bg-green-500 text-white"
                                    : "bg-gray-200 text-gray-700"
                              }`}
                            >
                              {String.fromCharCode(65 + optionIndex)}
                            </div>
                            <span className="flex-1">{option}</span>
                            {isReview && (
                              <div className="ml-2">
                                {optionIndex === currentQuestionData.correctOption && (
                                  <FaCheck className="text-green-500 text-xl" />
                                )}
                                {selectedAnswer === optionIndex &&
                                  optionIndex !== currentQuestionData.correctOption && (
                                    <FaTimes className="text-red-500 text-xl" />
                                  )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Explanation (in review mode) */}
                  {isReview && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="font-medium text-gray-800 mb-2 flex items-center">
                        <FaLightbulb className="mr-2 text-blue-500" /> Answer Explanation
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
                    className={`px-4 py-2 rounded-lg flex items-center ${
                      currentQuizSection === 0 && currentQuizQuestion === 0
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-gray-700 text-white hover:bg-gray-600"
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
                      className={`px-6 py-2 rounded-lg flex items-center ${
                        quizSubmitting ||
                        Object.values(quizAnswers).some((a) => a === null) ||
                        getTotalQuizQuestions() === 0
                          ? "bg-gray-400 text-white cursor-not-allowed"
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
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
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
                    className={`px-4 py-2 rounded-lg flex items-center ${
                      currentQuizSection === currentQuiz.sections.length - 1 &&
                      currentQuizQuestion === currentQuiz.sections[currentQuizSection].questions.length - 1
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-gray-700 text-white hover:bg-gray-600"
                    }`}
                  >
                    Next <FaChevronRight className="ml-2" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Add the styles */}
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div className="flex h-screen bg-gray-900 text-white">
        {/* Sidebar Navigation */}
        <div className="w-64 p-4 bg-gray-800 flex flex-col">
          <h2 className="text-xl font-semibold mb-4">Chapters</h2>
          <ul className="space-y-2">
            {module.chapters.map((chapter, index) => {
              const isUnlocked = isChapterUnlocked(index)
              const isCompleted = moduleChapters.includes(index)

              return (
                <li
                  key={index}
                  className={`p-2 flex items-center gap-2 rounded transition-colors ${
                    index === selectedChapterIndex
                      ? "bg-blue-900 text-blue-300"
                      : isUnlocked
                        ? "hover:bg-gray-700 cursor-pointer"
                        : "text-gray-500 cursor-not-allowed"
                  } ${isCompleted ? "border-l-4 border-green-500" : ""}`}
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
                  {!isUnlocked ? (
                    <FaLock className="text-gray-500" />
                  ) : isCompleted ? (
                    <FaCheck className="text-green-500" />
                  ) : (
                    <FaLockOpen className="text-blue-400" />
                  )}
                  <span className={isCompleted ? "text-green-400" : ""}>{chapter.title}</span>
                </li>
              )
            })}

            {/* Add quiz to sidebar if available */}
            {quizzes.length > 0 && (
              <li
                className={`p-2 flex items-center gap-2 rounded transition-colors hover:bg-gray-700 cursor-pointer`}
                onClick={() => {
                  // If there's a previous attempt, automatically show the results
                  if (hasPreviousAttempt) {
                    viewPreviousQuizAttempt()
                  } else {
                    setShowQuiz(true)
                  }
                }}
              >
                {hasPreviousAttempt ? (
                  <FaCheck className="text-green-500" />
                ) : (
                  <FaClipboardCheck className="text-blue-400" />
                )}
                <span>Module Quiz</span>
              </li>
            )}

            {/* Add Module Completed to sidebar if module is completed */}
            {moduleAlreadyCompleted && (
              <li className="p-2 flex items-center gap-2 rounded transition-colors bg-green-800 text-white">
                <FaMedal className="text-yellow-400" />
                <span>Module Completed</span>
              </li>
            )}
          </ul>

          <div className="mt-auto p-2 bg-gray-700 rounded">
            <div className="text-sm text-gray-300 mb-1">Progress</div>
            <div className="w-full bg-gray-600 h-2 rounded-full overflow-hidden">
              <div
                className="bg-green-500 h-full"
                style={{
                  width: `${(moduleChapters.length / module.chapters.length) * 100}%`,
                }}
              ></div>
            </div>
            <div className="text-xs text-right mt-1 text-gray-300">
              {moduleChapters.length}/{module.chapters.length} completed
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div ref={contentRef} className="flex-1 p-6 overflow-y-auto">
          <h1 className="text-3xl font-bold text-blue-300 mb-4">{selectedChapter.title}</h1>
          <p className="text-gray-400 mb-6">{selectedChapter.description}</p>

          {/* Previous quiz attempt notification */}
          {hasPreviousAttempt && previousQuizAttempt && (
            <div className="bg-blue-800 text-white p-4 rounded-lg mb-6 animate-fadeIn">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold mb-1">Previous Quiz Attempt Found</h3>
                  <p>
                    You've already taken the quiz for this module. Your score was {previousQuizAttempt.percentage}%.
                  </p>
                  <p className="text-sm text-blue-200 mt-1">
                    Completed on: {previousQuizAttempt.completedAt?.toDate?.().toLocaleDateString() || "Unknown date"}
                  </p>
                </div>
                <button
                  onClick={viewPreviousQuizAttempt}
                  className="px-4 py-2 bg-white text-blue-800 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                >
                  View Results
                </button>
              </div>
            </div>
          )}

          {/* Content Display - Video or iframe based on content type */}
          {isVideoContent(selectedChapter.fileUrl.url || selectedChapter.fileUrl) ? (
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <VideoPlayer
                src={selectedChapter.fileUrl.url || selectedChapter.fileUrl}
                onComplete={handleVideoComplete}
                isCompleted={isCurrentChapterCompleted}
                className="max-h-[600px]"
              />
              {videoCompleted && !isCurrentChapterCompleted && (
                <div className="mt-3 bg-green-800 text-white p-3 rounded animate-pulse">
                  <p className="text-sm">Video completed!</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg p-4 mb-6">
              <iframe
                src={selectedChapter.fileUrl.url || selectedChapter.fileUrl}
                width="100%"
                height="600px"
                className="border rounded"
                title="Chapter Content"
              />
            </div>
          )}

          {isCurrentChapterCompleted && !isLastChapter && (
            <div className="bg-green-800 text-white p-4 rounded-lg mb-6">
              <p className="font-medium">You've completed this chapter!</p>
            </div>
          )}

          {/* Module Quiz Button (if available) */}
          {quizzes.length > 0 && isLastChapter && canFinish && !hasPreviousAttempt && (
            <div className="bg-blue-800 text-white p-4 rounded-lg mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold mb-1">Module Quiz Available</h3>
                  <p>Test your knowledge with a quiz on this module's content.</p>
                </div>
                <button
                  onClick={() => {
                    setShowQuiz(true)
                  }}
                  className="px-4 py-2 bg-white text-blue-800 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                >
                  Take Quiz
                </button>
              </div>
            </div>
          )}

          <button
            className={`px-4 py-2 ${
              canFinish ? "bg-blue-600 hover:bg-blue-500" : "bg-blue-600 hover:bg-blue-500"
            } rounded disabled:opacity-50 transition-colors`}
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
            {isLastChapter && canFinish ? "Next" : "Next"}
          </button>
        </div>
      </div>
    </>
  )
}

export default ModuleView
