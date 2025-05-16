"use client"

import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../firebase.config"
import { Viewer, Worker } from "@react-pdf-viewer/core"
import "@react-pdf-viewer/core/lib/styles/index.css"
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout"
import "@react-pdf-viewer/default-layout/lib/styles/index.css"
import {
  FaFilePdf,
  FaFileVideo,
  FaFileImage,
  FaFilePowerpoint,
  FaSpinner,
  FaArrowLeft,
  FaArrowRight,
  FaComment,
  FaCheckCircle,
  FaPlay,
  FaFileAlt,
  FaChalkboardTeacher,
  FaLayerGroup,
} from "react-icons/fa"
import styled from "styled-components"

// Styled Components
const PageContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #f4f6f9;
`

const Sidebar = styled.div`
  width: 320px;
  background-color: white;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
  z-index: 10;
  transition: transform 0.3s ease;
  overflow-y: auto;

  @media (max-width: 768px) {
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    transform: ${({ isOpen }) => (isOpen ? "translateX(0)" : "translateX(-100%)")};
  }
`

const MainContent = styled.div`
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
`

const LoadingModal = ({ isOpen }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="text-gray-700 font-medium">Loading module content...</p>
        </div>
      </div>
    </div>
  )
}

const ModuleDetails = () => {
  const { courseId, moduleId } = useParams()
  const [module, setModule] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0)
  const [error, setError] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const defaultLayoutPluginInstance = defaultLayoutPlugin()

  useEffect(() => {
    const fetchModule = async () => {
      try {
        console.log("Fetching module data...")
        const moduleRef = doc(db, "courses", courseId, "modules", moduleId)
        const moduleSnap = await getDoc(moduleRef)

        if (moduleSnap.exists()) {
          const moduleData = moduleSnap.data()
          console.log("Module Data:", moduleData)

          setModule(moduleData)
        } else {
          console.error("Module not found")
          setError("Module not found.")
        }
      } catch (error) {
        console.error("Error fetching module:", error)
        setError("Failed to load module.")
      } finally {
        setLoading(false)
      }
    }

    fetchModule()
  }, [courseId, moduleId])

  const inferContentType = (fileUrl) => {
    let url = fileUrl
    if (typeof fileUrl === "object" && fileUrl !== null && "url" in fileUrl) {
      url = fileUrl.url
    }

    if (!url || typeof url !== "string") {
      return "application/octet-stream" // Default unknown type
    }
    if (url.endsWith(".pdf")) return "application/pdf"
    if (url.match(/\.(jpg|jpeg|png)$/)) return "image/jpeg"
    if (url.match(/\.(mp4|mov)$/)) return "video/mp4"
    if (url.match(/\.(ppt|pptx)$/)) return "application/vnd.ms-powerpoint"
    return "application/octet-stream"
  }

  const getFileIcon = (contentType) => {
    if (contentType === "application/pdf") return <FaFilePdf className="text-rose-500" />
    if (contentType.startsWith("video/")) return <FaFileVideo className="text-blue-500" />
    if (contentType.startsWith("image/")) return <FaFileImage className="text-emerald-500" />
    if (contentType.includes("powerpoint")) return <FaFilePowerpoint className="text-amber-500" />
    return <FaFileAlt className="text-gray-500" />
  }

  const renderFile = (fileUrl, contentType) => {
    if (!fileUrl) return <p className="text-rose-500 p-4 bg-rose-50 rounded-xl">No file available for this chapter</p>

    // Ensure fileUrl is a string
    const url = typeof fileUrl === "object" ? fileUrl.url : fileUrl

    if (contentType === "application/pdf") {
      return (
        <div className="border rounded-xl shadow-md bg-white" style={{ height: "700px" }} key={url}>
          <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
            <Viewer fileUrl={url} plugins={[defaultLayoutPluginInstance]} />
          </Worker>
        </div>
      )
    }

    if (contentType.startsWith("video/")) {
      return (
        <div className="rounded-xl overflow-hidden shadow-md bg-gray-900" key={url}>
          <video controls className="w-full max-w-4xl mx-auto">
            <source src={url} type={contentType} />
            Your browser does not support the video tag.
          </video>
        </div>
      )
    }

    if (contentType.startsWith("image/")) {
      return (
        <div className="rounded-xl overflow-hidden shadow-md bg-white p-4" key={url}>
          <img src={url || "/placeholder.svg"} alt="Illustration" className="w-full max-w-4xl mx-auto" />
        </div>
      )
    }

    if (contentType.includes("powerpoint")) {
      return (
        <div className="rounded-xl overflow-hidden shadow-md" key={url}>
          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
            className="w-full"
            style={{ height: "700px" }}
            title="PowerPoint Presentation"
          />
        </div>
      )
    }

    return (
      <p className="text-amber-600 p-4 bg-amber-50 rounded-xl">
        Unsupported file type. Please download the file to view it.
      </p>
    )
  }

  const handleChapterClick = (index) => {
    setSelectedChapterIndex(index)
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  const handleNextChapter = () => {
    if (selectedChapterIndex < module.chapters.length - 1) {
      setSelectedChapterIndex(selectedChapterIndex + 1)
    }
  }

  const handlePreviousChapter = () => {
    if (selectedChapterIndex > 0) {
      setSelectedChapterIndex(selectedChapterIndex - 1)
    }
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <PageContainer>
      {/* Loading Modal */}
      <LoadingModal isOpen={loading} />

      {/* Sidebar for Chapter Navigation */}
      <Sidebar isOpen={sidebarOpen}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <FaLayerGroup className="mr-2 text-indigo-600" /> Module Content
            </h2>
            <button
              className="md:hidden text-gray-500 hover:text-gray-700"
              onClick={toggleSidebar}
              aria-label="Close sidebar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {module && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700">{module.title}</h3>
              <p className="text-gray-500 text-sm mt-1">{module.description}</p>
            </div>
          )}

          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Chapters</h3>
              <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-1 rounded-full">
                {module?.chapters?.length || 0} Chapters
              </span>
            </div>
            <div className="h-0.5 bg-gray-100 my-2"></div>
          </div>

          <ul className="space-y-1">
            {module?.chapters?.map((chapter, index) => {
              const contentType = inferContentType(chapter.fileUrl)
              const fileIcon = getFileIcon(contentType)

              return (
                <li key={index}>
                  <button
                    className={`w-full text-left p-3 rounded-xl flex items-start transition-colors ${
                      index === selectedChapterIndex ? "bg-indigo-50 text-indigo-700" : "hover:bg-gray-50 text-gray-700"
                    }`}
                    onClick={() => handleChapterClick(index)}
                  >
                    <div
                      className={`p-2 rounded-lg mr-3 ${
                        index === selectedChapterIndex ? "bg-indigo-100" : "bg-gray-100"
                      }`}
                    >
                      {index === selectedChapterIndex ? <FaPlay className="text-indigo-600" /> : fileIcon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-medium truncate ${
                            index === selectedChapterIndex ? "text-indigo-700" : "text-gray-800"
                          }`}
                        >
                          {chapter.title}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">{chapter.description}</p>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </Sidebar>

      {/* Mobile Sidebar Toggle */}
      <button
        className="fixed bottom-4 left-4 md:hidden z-20 bg-indigo-600 text-white p-3 rounded-full shadow-lg"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Main Content Area */}
      <MainContent>
        {error ? (
          <div className="bg-rose-50 text-rose-600 p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold mb-2">Error</h2>
            <p>{error}</p>
          </div>
        ) : module && module.chapters && module.chapters.length > 0 ? (
          <>
            {/* Chapter Header */}
            <div className="bg-gradient-to-r from-sky-500 to-indigo-600 rounded-2xl shadow-lg mb-8 overflow-hidden">
              <div className="p-8">
                <div className="flex items-center mb-2">
                  <div className="bg-white p-2 rounded-full shadow-md mr-3">
                    <FaChalkboardTeacher className="text-indigo-600 text-xl" />
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">
                    {module.chapters[selectedChapterIndex].title}
                  </h1>
                </div>
                <p className="text-indigo-100 ml-12">
                  {module.chapters[selectedChapterIndex].description || "No description available"}
                </p>
              </div>
            </div>

            {/* Module Overview Section */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-100 p-2 rounded-full mr-3">
                  <FaCheckCircle className="text-indigo-600 text-xl" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Chapter Content</h2>
              </div>
              <p className="text-gray-600 ml-12 mb-4">
                This chapter covers important concepts and materials to help you understand the topic better.
              </p>

              {/* Render File */}
              {module.chapters[selectedChapterIndex].fileUrl && (
                <div className="mt-6">
                  {renderFile(
                    module.chapters[selectedChapterIndex].fileUrl,
                    inferContentType(module.chapters[selectedChapterIndex].fileUrl),
                  )}
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 mb-8">
              <button
                onClick={handlePreviousChapter}
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
                onClick={handleNextChapter}
                disabled={selectedChapterIndex === module.chapters.length - 1}
                className={`flex items-center px-6 py-3 rounded-xl font-medium transition-colors ${
                  selectedChapterIndex === module.chapters.length - 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                Next Chapter <FaArrowRight className="ml-2" />
              </button>
            </div>

            {/* Discussion Section */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-100 p-2 rounded-full mr-3">
                  <FaComment className="text-indigo-600 text-xl" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Discussion</h2>
              </div>
              <p className="text-gray-600 ml-12">
                Join the discussion or ask questions related to this chapter. Your instructor and peers are here to
                help.
              </p>

              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <textarea
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Type your question or comment here..."
                  rows="3"
                ></textarea>
                <div className="flex justify-end mt-3">
                  <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                    Post Comment
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8 bg-white rounded-xl shadow-md">
              <FaSpinner className="animate-spin text-4xl text-indigo-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading module content...</h2>
              <p className="text-gray-500">Please wait while we prepare your learning materials.</p>
            </div>
          </div>
        )}
      </MainContent>
    </PageContainer>
  )
}

export default ModuleDetails
