"use client"

import { useState, useEffect } from "react"
import IntSidebar from "./sidebar"
import Header from "../Dashboard/Header"
import { FaFolder, FaSortAlphaDown, FaSortAlphaUp, FaUpload, FaEdit, FaTrash, FaEye, FaFileAlt } from "react-icons/fa"
import { BsThreeDotsVertical, BsSearch } from "react-icons/bs"
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore"
import { db } from "../firebase.config"
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

const FileLibrary = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [files, setFiles] = useState([])
  const [menuOpen, setMenuOpen] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOrder, setSortOrder] = useState("asc")
  const [confirmDelete, setConfirmDelete] = useState(null)

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  // Fetch files from Firestore
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "courses"))
        const filesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setFiles(filesData)
      } catch (error) {
        console.error("Error fetching files:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFiles()
  }, [])

  // Toggle menu for each file
  const toggleMenu = (fileId) => {
    setMenuOpen(menuOpen === fileId ? null : fileId)
  }

  // Handle file deletion
  const handleDelete = async (fileId) => {
    try {
      await deleteDoc(doc(db, "courses", fileId))
      setFiles(files.filter((file) => file.id !== fileId))
      setMenuOpen(null)
      setConfirmDelete(null)
    } catch (error) {
      console.error("Error deleting file:", error)
    }
  }

  // Handle file edit
  const handleEdit = (file) => {
    alert(`Editing file: ${file.title}`)
    setMenuOpen(null)
  }

  // Simulated Upload File (Replace with actual upload logic)
  const handleUpload = () => {
    alert("Upload feature coming soon!")
  }

  // Search functionality
  const filteredFiles = files.filter((file) => file.title.toLowerCase().includes(searchTerm.toLowerCase()))

  // Sorting functionality
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    return sortOrder === "asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
  })

  // Get file type icon
  const getFileIcon = (file) => {
    const fileUrl = file.fileUrl?.url || ""
    if (fileUrl.endsWith(".pdf")) return "pdf"
    if (fileUrl.endsWith(".doc") || fileUrl.endsWith(".docx")) return "doc"
    if (fileUrl.endsWith(".ppt") || fileUrl.endsWith(".pptx")) return "ppt"
    if (fileUrl.endsWith(".xls") || fileUrl.endsWith(".xlsx")) return "xls"
    if (fileUrl.endsWith(".jpg") || fileUrl.endsWith(".jpeg") || fileUrl.endsWith(".png")) return "image"
    return "generic"
  }

  // Get file icon color
  const getFileIconColor = (fileType) => {
    const colors = {
      pdf: "text-rose-500",
      doc: "text-sky-500",
      ppt: "text-amber-500",
      xls: "text-emerald-500",
      image: "text-purple-500",
      generic: "text-gray-500",
    }
    return colors[fileType] || colors.generic
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
          {/* Header Section */}
          <div className="bg-gradient-to-r from-sky-500 to-indigo-600 rounded-2xl shadow-lg mb-8 overflow-hidden">
            <div className="p-8 flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="bg-white p-3 rounded-full shadow-md mr-4">
                  <FaFolder className="text-indigo-600 text-3xl" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white">File Library</h1>
                  <p className="text-indigo-100 mt-1">Manage and organize your files</p>
                </div>
              </div>
              <button
                onClick={handleUpload}
                className="flex items-center bg-white text-indigo-600 px-6 py-3 rounded-full hover:bg-indigo-50 transition duration-300 shadow-md"
              >
                <FaUpload className="mr-2" /> Upload File
              </button>
            </div>
          </div>

          {/* Search & Filter Section */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BsSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search files by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-3 px-4 rounded-xl border border-gray-200 transition-colors"
              >
                {sortOrder === "asc" ? (
                  <FaSortAlphaDown className="text-indigo-500" />
                ) : (
                  <FaSortAlphaUp className="text-indigo-500" />
                )}
                <span>Sort {sortOrder === "asc" ? "A-Z" : "Z-A"}</span>
              </button>
            </div>
          </div>

          {/* Files Grid */}
          {loading ? (
            <div className="bg-white rounded-2xl shadow-md p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
              <p className="text-gray-500 text-lg">Loading files...</p>
            </div>
          ) : sortedFiles.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-md p-12 text-center">
              <div className="bg-gray-100 p-4 rounded-full inline-flex items-center justify-center mb-4">
                <FaFolder className="text-gray-400 text-4xl" />
              </div>
              <h3 className="text-xl font-medium text-gray-700 mb-2">No files found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm ? "Try adjusting your search criteria" : "Upload files to get started"}
              </p>
              <button
                onClick={handleUpload}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <FaUpload className="mr-2" /> Upload File
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {sortedFiles.map((file) => {
                const fileType = getFileIcon(file)
                const iconColor = getFileIconColor(fileType)

                return (
                  <div
                    key={file.id}
                    className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 group"
                  >
                    <div className="p-6 border-b border-gray-100">
                      <div className="flex justify-between items-start">
                        <div className={`p-3 rounded-xl ${iconColor.replace("text-", "bg-").replace("500", "100")}`}>
                          <FaFileAlt className={`text-2xl ${iconColor}`} />
                        </div>
                        <div className="relative">
                          <button
                            className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                            onClick={() => toggleMenu(file.id)}
                          >
                            <BsThreeDotsVertical />
                          </button>

                          {/* Dropdown Menu */}
                          {menuOpen === file.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg z-10 border border-gray-100 overflow-hidden">
                              <button
                                onClick={() => {
                                  window.open(file.fileUrl?.url, "_blank")
                                  setMenuOpen(null)
                                }}
                                className="flex items-center w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50"
                              >
                                <FaEye className="mr-2 text-indigo-500" /> View File
                              </button>
                              <button
                                onClick={() => handleEdit(file)}
                                className="flex items-center w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50"
                              >
                                <FaEdit className="mr-2 text-amber-500" /> Edit Details
                              </button>
                              <button
                                onClick={() => {
                                  setConfirmDelete(file.id)
                                  setMenuOpen(null)
                                }}
                                className="flex items-center w-full px-4 py-3 text-left text-rose-600 hover:bg-gray-50"
                              >
                                <FaTrash className="mr-2" /> Delete File
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 cursor-pointer" onClick={() => window.open(file.fileUrl?.url, "_blank")}>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-1" title={file.title}>
                        {file.title}
                      </h3>
                      <p className="text-gray-500 text-sm mb-3">
                        {file.category || "Uncategorized"} •{" "}
                        {file.createdAt?.toDate().toLocaleDateString() || "Unknown date"}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          {file.description ? `${file.description.substring(0, 30)}...` : "No description"}
                        </span>
                        <button className="text-indigo-600 hover:text-indigo-800">
                          <FaEye />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Confirm Delete Modal */}
          {confirmDelete && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded-2xl shadow-lg max-w-md w-full">
                <div className="text-center">
                  <div className="bg-rose-100 p-3 rounded-full inline-flex items-center justify-center mb-4">
                    <FaTrash className="text-rose-500 text-2xl" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Delete File</h3>
                  <p className="text-gray-500 mb-6">
                    Are you sure you want to delete this file? This action cannot be undone.
                  </p>
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(confirmDelete)}
                      className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </MainContent>
      </ContentContainer>
    </PageContainer>
  )
}

export default FileLibrary
