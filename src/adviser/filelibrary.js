import React, { useState, useRef, useEffect } from "react";
import IntSidebar from "./sidebar";
import Header from "../Dashboard/Header";
import { FaCloudUploadAlt, FaTrashAlt, FaArrowRight, FaInfoCircle, FaEdit } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase.config";

const FileLibrary = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [files, setFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ isOpen: false, type: '', content: null });

  const fileInputRef = useRef(null);
  const filesPerPage = 10;

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log("Selected file:", file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    // Simulate file upload progress
    for (let i = 0; i <= 100; i++) {
      setTimeout(() => {
        setUploadProgress(i);
      }, 20 * i);
    }

    setTimeout(() => {
      setUploading(false);
      setUploadProgress(0);
      alert("File uploaded successfully!");
    }, 2000);
  };

  const handleDelete = (id) => {
    setModal({ isOpen: true, type: 'delete', content: id });
  };

  const confirmDelete = (id) => {
    setFiles(files.filter((file) => file.id !== id));
    setModal({ isOpen: false, type: '', content: null });
  };

  const handleEdit = (file) => {
    setModal({ isOpen: true, type: 'edit', content: file });
  };

  const handleInfo = (file) => {
    setModal({ isOpen: true, type: 'info', content: file });
  };

  const closeModal = () => {
    setModal({ isOpen: false, type: '', content: null });
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
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const filteredFiles = files
    .filter((file) =>
      file.title?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === "asc") {
        return a.createdAt.seconds - b.createdAt.seconds;
      }
      return b.createdAt.seconds - a.createdAt.seconds;
    });

  const indexOfLastFile = currentPage * filesPerPage;
  const indexOfFirstFile = indexOfLastFile - filesPerPage;
  const currentFiles = filteredFiles.slice(indexOfFirstFile, indexOfLastFile);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="w-full z-10 shadow-md">
        <Header />
      </div>

      <div className="flex flex-1">
        <div className="h-full z-5">
          <IntSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        </div>

        <div
          className={`p-8 bg-white transition-all duration-300 flex-1 overflow-y-auto h-full rounded-lg shadow-lg ${
            isSidebarOpen ? "ml-4" : "ml-60"
          }`}
          style={{ width: `calc(100% - ${isSidebarOpen ? "60px" : "240px"})` }}
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-6">File Library</h1>
          <div className="mb-8 flex items-center space-x-4">
            <button
              className="flex items-center bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 shadow-md"
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
            <form onSubmit={handleSubmit} className="flex items-center">
              <button
                type="submit"
                className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 shadow-md"
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
              {uploading && (
                <div className="ml-4 w-full max-w-xs">
                  <div className="bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </form>
          </div>

          <h2 className="text-2xl font-semibold text-gray-700 mt-6 mb-4">Uploaded Files</h2>
          <div className="flex justify-between items-center mb-4">
            <select
              className="p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="desc">Sort by Date Last</option>
              <option value="asc">Sort by Date First</option>
            </select>
            <input
              type="text"
              placeholder="Search files..."
              className="p-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="text-center py-8">
              <span className="text-gray-600">Loading files...</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-md">
                  <thead>
                    <tr className="bg-gray-200 text-gray-600">
                      <th className="py-3 px-4 border-b font-semibold text-left">Title</th>
                      <th className="py-3 px-4 border-b font-semibold text-left">File URL</th>
                      <th className="py-3 px-4 border-b font-semibold text-left">Created At</th>
                      <th className="py-3 px-4 border-b font-semibold text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentFiles.map((file) => (
                      <tr key={file.id} className="border-b hover:bg-gray-100">
                        <td className="py-4 px-4">{file.title || "N/A"}</td>
                        <td className="py-4 px-4">
                          <a
                            href={file.fileURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View File
                          </a>
                        </td>
                        <td className="py-4 px-4">
                          {new Date(file.createdAt?.seconds * 1000).toLocaleString()}
                        </td>
                        <td className="py-4 px-4 flex gap-2">
                          <button
                            onClick={() => handleDelete(file.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete File"
                          >
                            <FaTrashAlt />
                          </button>
                          <button
                            onClick={() => handleEdit(file)}
                            className="text-yellow-600 hover:text-yellow-800"
                            title="Edit File"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleInfo(file)}
                            className="text-blue-600 hover:text-blue-800"
                            title="File Info"
                          >
                            <FaInfoCircle />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-center mt-4">
                {Array.from({ length: Math.ceil(filteredFiles.length / filesPerPage) }, (_, index) => (
                  <button
                    key={index}
                    onClick={() => paginate(index + 1)}
                    className={`mx-1 px-3 py-2 rounded-full ${
                      currentPage === index + 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {modal.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
            <button onClick={closeModal} className="absolute top-2 right-2 text-gray-600 hover:text-gray-800">
              &times;
            </button>
            {modal.type === 'delete' && (
              <>
                <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
                <p>Are you sure you want to delete this file?</p>
                <div className="flex justify-end mt-4">
                  <button onClick={closeModal} className="mr-2 px-4 py-2 bg-gray-300 rounded">Cancel</button>
                  <button onClick={() => confirmDelete(modal.content)} className="px-4 py-2 bg-red-600 text-white rounded">Delete</button>
                </div>
              </>
            )}
            {modal.type === 'edit' && (
              <>
                <h3 className="text-lg font-semibold mb-4">Edit File</h3>
                <p>Edit the details of the file here.</p>
                <div className="flex justify-end mt-4">
                  <button onClick={closeModal} className="mr-2 px-4 py-2 bg-gray-300 rounded">Cancel</button>
                  <button onClick={closeModal} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
                </div>
              </>
            )}
            {modal.type === 'info' && (
              <>
                <h3 className="text-lg font-semibold mb-4">File Info</h3>
                <p>View the details of the file here.</p>
                <div className="flex justify-end mt-4">
                  <button onClick={closeModal} className="px-4 py-2 bg-gray-300 rounded">Close</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileLibrary;
