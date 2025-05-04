"use client"

import { onAuthStateChanged } from "firebase/auth"
import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore"
import { useEffect, useRef, useState } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { FaCheck, FaLock, FaLockOpen, FaSignInAlt } from "react-icons/fa"
import { useLocation, useNavigate } from "react-router-dom"
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
`

const ModuleView = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, loading] = useAuthState(auth) // Removed unused authError variable
  const searchParams = new URLSearchParams(location.search)
  const courseId = searchParams.get("courseId")
  const moduleId = searchParams.get("moduleId")
  const initialChapterIndex = Number.parseInt(searchParams.get("chapterIndex") || "0", 10)

  const [module, setModule] = useState(null)
  const [course, setCourse] = useState(null)
  const [userData, setUserData] = useState(null) // Keep this for future use
  const [contentLoading, setContentLoading] = useState(true)
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(initialChapterIndex)
  const [error, setError] = useState(null)
  const [unlockedChapters, setUnlockedChapters] = useState({})
  const [isLastChapterScrolledToBottom, setIsLastChapterScrolledToBottom] = useState(false)
  const [savingCompletion, setSavingCompletion] = useState(false)
  const [showCompletionAlert, setShowCompletionAlert] = useState(false)
  const [moduleAlreadyCompleted, setModuleAlreadyCompleted] = useState(false)
  const [historyDocId, setHistoryDocId] = useState(null) // Keep this for future use
  const contentRef = useRef(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [videoCompleted, setVideoCompleted] = useState(false)

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

  // Fetch module data and unlocked chapters from Firestore
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

        // Fetch user data for certificate
        const userRef = doc(db, "learner", user.uid)
        const userSnap = await getDoc(userRef)
        if (userSnap.exists()) {
          setUserData(userSnap.data())
        } else {
          console.warn("User document not found in 'learner' collection")
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

      // 3. Show completion alert
      setShowCompletionAlert(true)
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

          {isLastChapter && canFinish && (
            <div className="bg-green-800 text-white p-4 rounded-lg mb-6">
              <p className="font-medium">
                Congratulations! You've completed all chapters in this module. Click "Finish" to mark the module as
                complete and save your progress.
              </p>
              {moduleAlreadyCompleted && (
                <p className="text-green-300 mt-2 text-sm">
                  <FaCheck className="inline mr-1" /> You've already completed this module
                </p>
              )}
            </div>
          )}

          <div className="mt-4 flex justify-between">
            <button
              className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-600 transition-colors"
              disabled={selectedChapterIndex === 0}
              onClick={() => setSelectedChapterIndex((prev) => prev - 1)}
            >
              Previous
            </button>

            <button
              className={`px-4 py-2 ${
                canFinish ? "bg-green-600 hover:bg-green-500" : "bg-blue-600 hover:bg-blue-500"
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
                  completeModule()
                } else {
                  goToNextChapter()
                }
              }}
            >
              {isLastChapter ? (savingCompletion ? "Saving..." : "Finish") : "Next"}
            </button>
          </div>
        </div>

        {/* Module Completion Alert */}
        {showCompletionAlert && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-gray-900 border border-blue-500 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all animate-slideIn">
              <div className="flex items-center mb-4">
                <div className="bg-green-500 rounded-full p-2 mr-4">
                  <FaCheck className="text-white text-xl" />
                </div>
                <h3 className="text-xl font-bold text-white">Success!</h3>
              </div>
              <p className="text-gray-300 mb-6">Module completed successfully! Your progress has been saved.</p>

              <div className="flex justify-between">
                <button
                  onClick={() => {
                    setShowCompletionAlert(false)
                    window.close()
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Maybe Later
                </button>
                <button
                  onClick={() => {
                    setShowCompletionAlert(false)
                    window.close()
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default ModuleView
