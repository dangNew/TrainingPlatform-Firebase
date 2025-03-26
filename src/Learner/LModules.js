"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { db } from "../firebase.config"
import { collection, getDocs, doc, getDoc } from "firebase/firestore"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "../firebase.config"
import Sidebar from "../components/LSidebar"
import styled from "styled-components"
import { FaLock, FaChevronRight, FaChevronDown, FaLockOpen, FaCheck } from "react-icons/fa"

const MainContent = styled.div`
  flex: 1;
  padding: 2rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  margin-left: 10px;
`

const ModuleDisplay = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [user] = useAuthState(auth)
  const [modules, setModules] = useState([])
  const [courseData, setCourseData] = useState(null)
  const [completedModules, setCompletedModules] = useState([])
  const [completedChapters, setCompletedChapters] = useState({})
  const [expandedModules, setExpandedModules] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const modulesCollection = collection(db, "courses", courseId, "modules")
        const querySnapshot = await getDocs(modulesCollection)
        const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

        // Sort modules by their order if available
        const sortedData = data.sort((a, b) => (a.order || 0) - (b.order || 0))
        setModules(sortedData)
      } catch (error) {
        console.error("Error fetching modules:", error)
      }
    }

    const fetchCourseData = async () => {
      try {
        const courseDoc = doc(db, "courses", courseId)
        const courseSnapshot = await getDoc(courseDoc)
        if (courseSnapshot.exists()) {
          setCourseData(courseSnapshot.data())
        }
      } catch (error) {
        console.error("Error fetching course data:", error)
      }
    }

    // Load progress from Firestore instead of localStorage
    const loadProgress = async () => {
      if (!user) return

      try {
        const userProgressRef = doc(db, "learner", user.uid, "progress", courseId)
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

    Promise.all([fetchModules(), fetchCourseData(), loadProgress()]).finally(() => setLoading(false))
  }, [courseId, user])

  const handleStartModule = (module) => {
    // Open module viewer in a new tab
    window.open(`/module-viewer?courseId=${courseId}&moduleId=${module.id}`, "_blank")
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

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <MainContent>
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
        <MainContent>
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

  return (
    <div className="flex h-screen">
      <Sidebar />
      <MainContent>
        {/* Header with Background Image */}
        <div
          className="h-48 bg-cover bg-center mb-6 relative rounded-xl overflow-hidden"
          style={{ backgroundImage: `url(${courseData.fileUrl})` }}
        >
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 bg-white bg-opacity-30 backdrop-blur-md text-white px-4 py-2 rounded-lg shadow-md hover:bg-opacity-40 transition"
          >
            ← Back
          </button>

          <div className="bg-black bg-opacity-50 h-full flex flex-col justify-center p-6">
            <h1 className="text-white text-4xl font-bold">{courseData.title}</h1>
            <p className="text-white text-sm mt-1">{courseData.description}</p>
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
                      className="text-[12px] pt-[50px] text-[#cccccc] cursor-pointer flex items-center gap-1"
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
      </MainContent>
    </div>
  )
}

export default ModuleDisplay

