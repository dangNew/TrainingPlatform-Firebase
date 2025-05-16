"use client"

import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { collection, getDoc, doc, getDocs, deleteDoc, updateDoc } from "firebase/firestore"
import { db } from "../firebase.config"
import {
  FaEdit,
  FaTrash,
  FaTimes,
  FaSearch,
  FaFilter,
  FaBook,
  FaCheckCircle,
  FaExclamationTriangle,
  FaChevronDown,
  FaChevronRight,
  FaLockOpen,
  FaLayerGroup,
  FaPlay,
} from "react-icons/fa"
import IntSidebar from "./sidebar"
import Header from "../Dashboard/Header"
import styled from "styled-components"

// Styled Components
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f4f6f9;
`

const HeaderWrapper = styled.div`
  width: 100%;
  z-index: 10;
`

const ContentContainer = styled.div`
  display: flex;
  flex: 1;
`

const SidebarWrapper = styled.div`
  height: 100%;
  z-index: 5;
`

const MainContent = styled.div`
  flex: 1;
  padding: 2rem;
  border-radius: 8px;
  overflow-y: auto;
  transition: margin-left 0.3s ease, width 0.3s ease;
  margin-left: ${({ expanded }) => (expanded ? "0rem" : "4rem")};
  width: ${({ expanded }) => (expanded ? "calc(100% - 16rem)" : "calc(100% - 4rem)")};
`

const ModuleDisplay = () => {
  const { courseId } = useParams()
  const [modules, setModules] = useState([])
  const [course, setCourse] = useState(null)
  const [editingModule, setEditingModule] = useState(null)
  const [deletingModuleId, setDeletingModuleId] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState({ title: "", description: "", content: "" })
  const [searchTerm, setSearchTerm] = useState("")
  const [modal, setModal] = useState({ isOpen: false, type: "", message: "" })
  const [expandedModules, setExpandedModules] = useState({})
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(true)

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const courseDocRef = doc(db, "courses", courseId)
        const courseDocSnap = await getDoc(courseDocRef)
        if (courseDocSnap.exists()) {
          setCourse(courseDocSnap.data())
        }

        const modulesCollectionRef = collection(courseDocRef, "modules")
        const querySnapshot = await getDocs(modulesCollectionRef)
        const modulesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setModules(modulesData)
      } catch (error) {
        console.error("Error fetching data:", error)
        showModal("error", "An error occurred while fetching data.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [courseId])

  const handleEditModule = (module) => {
    setEditingModule(module)
    setFormData({ title: module.title, description: module.description, content: module.content || "" })
    setIsEditing(true)
  }

  const handleDeleteModule = (moduleId) => {
    setDeletingModuleId(moduleId)
    setIsDeleting(true)
  }

  const confirmDeleteModule = async () => {
    try {
      const courseDocRef = doc(db, "courses", courseId)
      await deleteDoc(doc(courseDocRef, "modules", deletingModuleId))
      setModules(modules.filter((module) => module.id !== deletingModuleId))
      setIsDeleting(false)
      showModal("success", "Module deleted successfully!")
    } catch (error) {
      console.error("Error deleting module:", error)
      showModal("error", "An error occurred while deleting the module.")
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmitEdit = async (e) => {
    e.preventDefault()
    try {
      const courseDocRef = doc(db, "courses", courseId)
      const moduleDocRef = doc(courseDocRef, "modules", editingModule.id)

      console.log("Updating module with ID:", editingModule.id)
      console.log("New data:", formData)

      await updateDoc(moduleDocRef, formData)

      setModules(modules.map((module) => (module.id === editingModule.id ? { ...module, ...formData } : module)))
      setIsEditing(false)
      showModal("success", "Module updated successfully!")
    } catch (error) {
      console.error("Error updating module:", error)
      showModal("error", "An error occurred while updating the module.")
    }
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const filteredModules = modules.filter((module) => module.title.toLowerCase().includes(searchTerm.toLowerCase()))

  const openModuleDetails = (moduleId) => {
    window.open(`/course/${courseId}/module/${moduleId}`, "_blank", "noopener,noreferrer")
  }

  const showModal = (type, message) => {
    setModal({ isOpen: true, type, message })
    setTimeout(() => {
      setModal({ isOpen: false, type: "", message: "" })
    }, 3000)
  }

  const toggleChapters = (moduleId) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }))
  }

  return (
    <PageContainer>
      <HeaderWrapper>
        <Header />
      </HeaderWrapper>
      <ContentContainer>
        <SidebarWrapper>
          <IntSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        </SidebarWrapper>
        <MainContent expanded={isSidebarOpen}>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : !course ? (
            <div className="bg-rose-50 text-rose-600 p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-bold mb-2">Course Not Found</h2>
              <p>The course you're looking for doesn't exist or you don't have access to it.</p>
            </div>
          ) : (
            <>
              {/* Course Header */}
              <div className="bg-gradient-to-r from-sky-500 to-indigo-600 rounded-2xl shadow-lg mb-8 overflow-hidden">
                <div className="p-8">
                  <div className="flex items-center mb-4">
                    <div className="bg-white p-3 rounded-full shadow-md mr-4">
                      <FaBook className="text-indigo-600 text-3xl" />
                    </div>
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold text-white">{course.title}</h1>
                      <p className="text-indigo-100 mt-1">Course Modules</p>
                    </div>
                  </div>
                </div>
                <div className="relative w-full h-48">
                  <img
                    src={
                      course.fileUrl?.url ||
                      "https://res.cloudinary.com/trainingplat-a/image/upload/v1743084091/modules/module_file_1743084087558_download%20(1).jpg" ||
                      "/placeholder.svg"
                    }
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                    <div className="p-6 w-full">
                      <p className="text-white text-lg max-w-3xl">{course.description}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaSearch className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search modules by title..."
                      value={searchTerm}
                      onChange={handleSearch}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <button className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-3 px-4 rounded-xl border border-gray-200 transition-colors">
                    <FaFilter className="text-indigo-500" />
                    <span>Filter</span>
                  </button>
                </div>
              </div>

              {/* Modules List */}
              <div className="space-y-6">
                {filteredModules.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-md p-8 text-center">
                    <FaLayerGroup className="text-gray-300 text-5xl mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-700 mb-2">No modules found</h3>
                    <p className="text-gray-500">
                      {searchTerm ? "Try adjusting your search criteria" : "This course doesn't have any modules yet"}
                    </p>
                  </div>
                ) : (
                  filteredModules.map((module, index) => {
                    const isExpanded = expandedModules[module.id]
                    return (
                      <div key={module.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
                        <div className="flex flex-col md:flex-row">
                          <div className="bg-indigo-900 text-white p-6 md:w-64">
                            <p className="text-xs uppercase tracking-wider text-indigo-300 mb-2">Module {index + 1}</p>
                            <h2 className="text-xl font-semibold mb-4">{module.title}</h2>
                            <button
                              className="flex items-center text-sm text-indigo-300 hover:text-white transition-colors mt-4"
                              onClick={() => toggleChapters(module.id)}
                            >
                              {isExpanded ? "Hide chapters" : "View chapters"}
                              {isExpanded ? <FaChevronDown className="ml-1" /> : <FaChevronRight className="ml-1" />}
                            </button>
                          </div>

                          <div className="flex-1 p-6">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center">
                                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                                    Available
                                  </span>
                                </div>
                                <p className="text-gray-600 mt-4 mb-6">
                                  {module.description || "No description available"}
                                </p>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditModule(module)}
                                  className="p-2 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-full transition-colors"
                                  title="Edit module"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={() => handleDeleteModule(module.id)}
                                  className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-full transition-colors"
                                  title="Delete module"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </div>

                            <div className="flex justify-end">
                              <button
                                className="flex items-center bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-indigo-700 transition-colors"
                                onClick={() => openModuleDetails(module.id)}
                              >
                                <FaPlay className="mr-2" /> Start Module
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Chapters List (Expandable) */}
                        {isExpanded && (
                          <div className="bg-gray-50 p-4 border-t border-gray-200">
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3 px-2">
                              Chapters
                            </h3>
                            <ul className="divide-y divide-gray-100">
                              {module.chapters?.length > 0 ? (
                                module.chapters.map((chapter, chapIndex) => (
                                  <li
                                    key={chapIndex}
                                    className="p-3 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                    onClick={() => openModuleDetails(module.id)}
                                  >
                                    <div className="flex items-center">
                                      <div className="p-2 bg-indigo-100 rounded-full mr-3">
                                        <FaLockOpen className="text-indigo-600" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-800">{chapter.title}</p>
                                        {chapter.description && (
                                          <p className="text-sm text-gray-500 truncate mt-1">{chapter.description}</p>
                                        )}
                                      </div>
                                    </div>
                                  </li>
                                ))
                              ) : (
                                <li className="p-4 text-center text-gray-500">No chapters available for this module</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </>
          )}

          {/* Edit Module Modal */}
          {isEditing && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Edit Module</h2>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
                  >
                    <FaTimes />
                  </button>
                </div>
                <form onSubmit={handleSubmitEdit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Module Title</label>
                    <input
                      type="text"
                      name="title"
                      placeholder="Module Title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      name="description"
                      placeholder="Description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                    <textarea
                      name="content"
                      placeholder="Content"
                      value={formData.content}
                      onChange={handleInputChange}
                      rows="4"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    ></textarea>
                  </div>

                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {isDeleting && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md">
                <div className="text-center">
                  <div className="bg-rose-100 p-3 rounded-full inline-flex items-center justify-center mb-4">
                    <FaTrash className="text-rose-500 text-2xl" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Module</h3>
                  <p className="text-gray-500 mb-6">
                    Are you sure you want to delete this module? This action cannot be undone.
                  </p>
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={() => setIsDeleting(false)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDeleteModule}
                      className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success/Error Modal */}
          {modal.isOpen && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded-2xl shadow-lg max-w-md w-full">
                <div className="text-center py-4">
                  {modal.type === "success" ? (
                    <div className="bg-emerald-100 p-3 rounded-full inline-flex items-center justify-center mb-4">
                      <FaCheckCircle className="text-emerald-500 text-2xl" />
                    </div>
                  ) : (
                    <div className="bg-rose-100 p-3 rounded-full inline-flex items-center justify-center mb-4">
                      <FaExclamationTriangle className="text-rose-500 text-2xl" />
                    </div>
                  )}

                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {modal.type === "success" ? "Success!" : "Error"}
                  </h3>
                  <p className="text-gray-500 mb-6">{modal.message}</p>

                  <button
                    onClick={() => setModal({ ...modal, isOpen: false })}
                    className={`px-6 py-2 rounded-lg font-medium ${
                      modal.type === "success"
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-rose-600 text-white hover:bg-rose-700"
                    }`}
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}
        </MainContent>
      </ContentContainer>
    </PageContainer>
  )
}

export default ModuleDisplay
