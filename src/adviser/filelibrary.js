import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import IntSidebar from "./sidebar";
import Header from "../Dashboard/Header";
import { FaCloudUploadAlt, FaTrashAlt, FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase.config"; // Ensure the path is correct
import uploadToCloudinary from "../uploadToCloudinary";


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

const MainContent = styled.div.attrs(({ isSidebarOpen }) => ({
  style: {
    marginLeft: isSidebarOpen ? "10px" : "240px",
    width: `calc(100% - ${isSidebarOpen ? "60px" : "240px"})`,
  },
}))`
  padding: 2rem;
  background-color: #fff;
  transition: margin-left 0.3s ease, width 0.3s ease;
  flex: 1;
  overflow-y: auto;
  height: 100%;
  border-radius: 8px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
`;

const FileLibrary = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [files, setFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log("Selected file:", file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setUploading(true);

    setTimeout(() => {
      setUploading(false);
      alert("File uploaded successfully!");
    }, 2000);
  };

  const handleDelete = (id) => {
    setFiles(files.filter((file) => file.id !== id));
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "courses"));
        const coursesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFiles(coursesData);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };

    fetchCourses();
  }, []);

  return (
    <PageContainer>
      <HeaderWrapper>
        <Header />
      </HeaderWrapper>

      <ContentContainer>
        <SidebarWrapper>
          <IntSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        </SidebarWrapper>

        <MainContent isSidebarOpen={isSidebarOpen}>
          <h1 className="text-2xl font-bold mb-4">File Library</h1>
          <div className="mb-6">
            <button
              className="flex items-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={() => fileInputRef.current.click()}
            >
              <FaCloudUploadAlt className="mr-2" /> Upload New File
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <form onSubmit={handleSubmit} className="mt-4">
              <button
                type="submit"
                className="bg-green-500 text-white py-2 px-6 rounded-md hover:bg-green-600"
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </form>
          </div>

          <h2 className="text-xl font-semibold mt-6">Uploaded Files</h2>
          <div className="mt-4 flex justify-between items-center">
            <select
              className="p-2 border rounded"
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="desc">Sort by Date Last</option>
              <option value="asc">Sort by Date First</option>
            </select>
            <input
              type="text"
              placeholder="Search"
              className="p-2 border rounded"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border-b font-semibold text-left">Title</th>
                  <th className="py-2 px-4 border-b font-semibold text-left">File URL</th>
                  <th className="py-2 px-4 border-b font-semibold text-left">Created At</th>
                  <th className="py-2 px-4 border-b font-semibold text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{file.title || "N/A"}</td>
                    <td className="py-3 px-4">
                      <a
                        href={file.fileURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        View File
                      </a>
                    </td>
                    <td className="py-3 px-4">
                      {new Date(file.createdAt?.seconds * 1000).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 flex gap-2">
                      <button
                        onClick={() => handleDelete(file.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTrashAlt />
                      </button>
                      <button className="text-yellow-500 hover:text-yellow-700">
                        <FaArrowRight />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </MainContent>
      </ContentContainer>
    </PageContainer>
  );
};

export default FileLibrary;
