import React, { useState, useEffect } from "react";
import IntSidebar from "./sidebar";
import Header from "../Dashboard/Header";
import { FaFolder, FaSortAlphaDown, FaSortAlphaUp, FaUpload } from "react-icons/fa";
import { BsThreeDotsVertical, BsSearch } from "react-icons/bs";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase.config";
import styled from 'styled-components';

// Styled Components
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f4f6f9;
`;

const HeaderWrapper = styled.div`
  width: 100%;
  z-index: 10;
`;

const ContentContainer = styled.div`
  display: flex;
  flex: 1;
`;

const SidebarWrapper = styled.div`
  height: 100%;
  z-index: 5;
`;

const MainContent = styled.div`
  flex: 1;n
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  transition: margin-left 0.3s ease, width 0.3s ease;
  margin-left: ${({ expanded }) => (expanded ? "0rem" : "4rem")};
  width: ${({ expanded }) => (expanded ? "calc(100% - 16rem)" : "calc(100% - 4rem)")};
`;

const FileLibrary = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [files, setFiles] = useState([]);
  const [menuOpen, setMenuOpen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Fetch files from Firestore
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "courses"));
        const filesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFiles(filesData);
      } catch (error) {
        console.error("Error fetching files:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  // Toggle menu for each file
  const toggleMenu = (fileId) => {
    setMenuOpen(menuOpen === fileId ? null : fileId);
  };

  // Handle file deletion
  const handleDelete = async (fileId) => {
    try {
      await deleteDoc(doc(db, "courses", fileId));
      setFiles(files.filter((file) => file.id !== fileId));
      setMenuOpen(null);
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  // Handle file edit
  const handleEdit = (file) => {
    alert(`Editing file: ${file.title}`);
    setMenuOpen(null);
  };

  // Simulated Upload File (Replace with actual upload logic)
  const handleUpload = () => {
    alert("Upload feature coming soon!");
  };

  // Search functionality
  const filteredFiles = files.filter((file) =>
    file.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sorting functionality
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    return sortOrder === "asc"
      ? a.title.localeCompare(b.title)
      : b.title.localeCompare(a.title);
  });

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
          <div className="p-6 bg-white rounded-lg shadow-md mb-6">
            <div className="flex items-center mb-4">
              <FaFolder className="text-blue-500 text-3xl mr-4" />
              <h1 className="text-2xl font-bold text-blue-600">File Library</h1>
            </div>
            <button
              onClick={handleUpload}
              className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300"
            >
              <FaUpload className="mr-2" /> Upload File
            </button>
          </div>

          {/* Search & Sort Bar */}
          <div className="flex items-center mb-4">
            <div className="relative flex-1 mr-2">
              <input
                type="text"
                placeholder="Search files..."
                className="w-full px-4 py-2 text-gray-900 border rounded-md focus:outline-none focus:ring focus:ring-blue-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <BsSearch className="absolute top-3 right-4 text-gray-600" />
            </div>
            <button
              className="px-4 py-2 bg-gray-800 text-white rounded-md flex items-center space-x-2 hover:bg-gray-700"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? <FaSortAlphaDown /> : <FaSortAlphaUp />}
              <span>Sort {sortOrder === "asc" ? "A-Z" : "Z-A"}</span>
            </button>
          </div>

          {/* Files Grid */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading files...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {sortedFiles.map((file) => (
                <div key={file.id} className="relative bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition duration-300">
                  {/* Folder Item */}
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => window.open(file.fileURL, "_blank")}
                  >
                    <div className="flex items-center space-x-3">
                      <FaFolder className="text-blue-500 text-2xl" />
                      <h3
                        className="text-md font-semibold text-gray-900 truncate w-40"
                        title={file.title} // Tooltip for full title
                      >
                        {file.title.length > 20 ? `${file.title.substring(0, 20)}...` : file.title}
                      </h3>
                    </div>
                    {/* Three-dot Menu Icon */}
                    <button
                      className="text-gray-600 hover:text-gray-900"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMenu(file.id);
                      }}
                    >
                      <BsThreeDotsVertical className="text-xl" />
                    </button>
                  </div>

                  {/* Dropdown Menu (Edit, Delete) */}
                  {menuOpen === file.id && (
                    <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-md z-10 border">
                      <button
                        onClick={() => handleEdit(file)}
                        className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(file.id)}
                        className="block w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </MainContent>
      </ContentContainer>
    </PageContainer>
  );
};

export default FileLibrary;
