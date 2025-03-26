"use client"

import { useEffect, useState, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  setDoc,
} from "firebase/firestore"
import { db } from "../firebase.config"
import { FaLock, FaLockOpen, FaCheck, FaCertificate, FaTrophy, FaSignInAlt } from "react-icons/fa"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "../firebase.config"
import { onAuthStateChanged } from "firebase/auth"

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
  const [user, loading, authError] = useAuthState(auth)
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
  const [showCertificateAlert, setShowCertificateAlert] = useState(false)
  const [certificateCreated, setCertificateCreated] = useState(false)
  const [savingCertificate, setSavingCertificate] = useState(false)
  const [moduleAlreadyCompleted, setModuleAlreadyCompleted] = useState(false)
  const [existingCertificate, setExistingCertificate] = useState(null)
  const [historyDocId, setHistoryDocId] = useState(null)
  const [certificateDocId, setCertificateDocId] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const contentRef = useRef(null)

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

        // Check if certificate already exists
        const certificatesCollection = collection(db, "certificates")
        const certificateQuery = query(
          certificatesCollection,
          where("userId", "==", user.uid),
          where("moduleId", "==", moduleId),
          where("courseId", "==", courseId),
        )
        const certificateSnapshot = await getDocs(certificateQuery)

        if (!certificateSnapshot.empty) {
          setExistingCertificate(certificateSnapshot.docs[0].data())
          setCertificateDocId(certificateSnapshot.docs[0].id)
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

  // Set up scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current || !module) return

      const { scrollTop, scrollHeight, clientHeight } = contentRef.current
      const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 50

      if (scrolledToBottom) {
        // Mark current chapter as completed
        markChapterAsCompleted()

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

      // 3. Show completion alert with certificate option
      setShowCompletionAlert(true)
    } catch (error) {
      console.error("Error saving completion:", error)
      setError("There was an error saving your progress. Please try again.")
    } finally {
      setSavingCompletion(false)
    }
  }

  // Function to generate and save certificate
  const generateCertificate = async () => {
    if (!user || !module || !course || !userData) return

    try {
      setSavingCertificate(true)

      // Check if certificate already exists
      if (existingCertificate) {
        setCertificateCreated(true)
        return
      }

      // Create certificate data
      const completionDate = new Date()
      const certificateData = {
        userId: user.uid,
        userName: userData.fullName,
        courseId,
        courseTitle: course.title,
        moduleId,
        moduleTitle: module.title,
        issueDate: serverTimestamp(),
        formattedDate: completionDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        certificateId: `CERT-${Date.now().toString(36).toUpperCase()}`,
      }

      // Save certificate to Firestore
      const certificatesCollection = collection(db, "certificates")
      const certDoc = await addDoc(certificatesCollection, certificateData)

      // Store the certificate document ID
      setCertificateDocId(certDoc.id)

      // Update user's certificates count
      const userRef = doc(db, "learner", user.uid)
      await updateDoc(userRef, {
        certificatesCount: (userData.certificatesCount || 0) + 1,
      })

      // Set existing certificate for future reference
      setExistingCertificate(certificateData)

      // Show success message
      setCertificateCreated(true)

      // Close window after delay
      setTimeout(() => {
        window.close()
      }, 3000)
    } catch (error) {
      console.error("Error generating certificate:", error)
      setError("There was an error generating your certificate. Please try again.")
    } finally {
      setSavingCertificate(false)
    }
  }

  // Function to delete existing certificate
  const deleteCertificate = async () => {
    if (!certificateDocId) return

    try {
      setSavingCertificate(true)

      // Delete the certificate from Firestore
      await deleteDoc(doc(db, "certificates", certificateDocId))

      // Reset certificate state
      setExistingCertificate(null)
      setCertificateDocId(null)
      setCertificateCreated(false)
    } catch (error) {
      console.error("Error deleting certificate:", error)
      setError("There was an error deleting your certificate. Please try again.")
    } finally {
      setSavingCertificate(false)
    }
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
  const canFinish = isLastChapter && (isCurrentChapterCompleted || isLastChapterScrolledToBottom)

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

          <div className="bg-white rounded-lg p-4 mb-6">
            <iframe
              src={selectedChapter.fileUrl}
              width="100%"
              height="600px"
              className="border rounded"
              title="Chapter Content"
            />
          </div>

          {isCurrentChapterCompleted && !isLastChapter && (
            <div className="bg-green-800 text-white p-4 rounded-lg mb-6">
              <p className="font-medium">You've completed this chapter! You can now proceed to the next chapter.</p>
            </div>
          )}

          {canFinish && (
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
                savingCompletion
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

          {!isLastChapter && !isChapterUnlocked(selectedChapterIndex + 1) && (
            <p className="text-center text-gray-400 mt-4">
              Scroll to the bottom of this chapter to unlock the next one
            </p>
          )}

          {isLastChapter && !canFinish && (
            <p className="text-center text-gray-400 mt-4">
              Scroll to the bottom of this chapter to enable the Finish button
            </p>
          )}
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

              <div className="bg-blue-900 bg-opacity-50 p-4 rounded-lg mb-6 border border-blue-400">
                <div className="flex items-center mb-2">
                  <FaCertificate className="text-yellow-400 text-xl mr-2" />
                  <h4 className="text-lg font-semibold text-white">Certificate Available</h4>
                </div>
                <p className="text-gray-300 mb-4">
                  You've earned a certificate for completing this module! Would you like to claim it now?
                </p>
                {existingCertificate ? (
                  <div className="bg-green-800 bg-opacity-50 p-3 rounded-lg mb-2 text-sm">
                    <FaCheck className="inline-block mr-1 text-green-400" />
                    You've already claimed a certificate for this module
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setShowCompletionAlert(false)
                      setShowCertificateAlert(true)
                    }}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center animate-pulse"
                  >
                    <FaTrophy className="mr-2" /> Claim Your Certificate
                  </button>
                )}
              </div>

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

        {/* Certificate Claim Alert */}
        {showCertificateAlert && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-gray-900 border-2 border-yellow-500 rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4 transform transition-all animate-slideIn">
              <div className="flex items-center mb-6">
                <div className="bg-yellow-500 rounded-full p-2 mr-4">
                  <FaCertificate className="text-white text-2xl" />
                </div>
                <h3 className="text-2xl font-bold text-white">Your Certificate</h3>
              </div>

              {certificateCreated || existingCertificate ? (
                <div className="text-center mb-6">
                  <div className="bg-green-500 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                    <FaCheck className="text-white text-3xl" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Certificate Created!</h4>
                  <p className="text-gray-300">
                    Your certificate has been successfully generated and added to your profile. You can view all your
                    certificates in the Certificates page.
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-gray-800 p-5 rounded-lg mb-6 border border-gray-700">
                    <div className="border-4 border-yellow-500 p-6 rounded-lg bg-gradient-to-br from-gray-900 to-blue-900">
                      <div className="text-center">
                        <h4 className="text-yellow-400 text-xl font-bold mb-1">Certificate of Completion</h4>
                        <p className="text-gray-400 text-sm mb-4">This certifies that</p>
                        <h5 className="text-white text-2xl font-bold mb-4">{userData?.fullName || "Student Name"}</h5>
                        <p className="text-gray-300 mb-4">has successfully completed</p>
                        <h6 className="text-blue-300 text-xl font-bold mb-1">{module.title}</h6>
                        <p className="text-gray-400 text-sm mb-4">from the course</p>
                        <h6 className="text-white text-lg font-semibold mb-4">{course.title}</h6>
                        <p className="text-gray-300 text-sm">
                          Issued on{" "}
                          {new Date().toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-300 mb-6 text-center">
                    This certificate will be saved to your profile and can be accessed anytime from the Certificates
                    page.
                  </p>
                </>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => {
                    setShowCertificateAlert(false)
                    window.close()
                  }}
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
      </div>
    </>
  )
}

export default ModuleView

