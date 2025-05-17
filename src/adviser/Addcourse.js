import { useState, useRef } from "react";
import {
  FaCloudUploadAlt,
  FaTimes,
  FaBook,
  FaCheckCircle,
  FaUpload,
  FaFileAlt,
  FaExclamationTriangle,
} from "react-icons/fa";
import IntSidebar from "./sidebar";
import LgNavbar from "../components/LgNavbar";
import uploadToCloudinary from "../uploadToCloudinary";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase.config";
import styled from "styled-components";

// Styled Components
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f4f6f9;
`;

const HeaderWrapper = styled.div`
  width: 100%;
  position: fixed;
  top: 0;
  z-index: 10;
`;

const ContentContainer = styled.div`
  display: flex;
  flex: 1;
  margin-top: 100px; // Adjust this value based on your header's height
`;

const SidebarWrapper = styled.div`
  position: fixed;
  height: 100%;
  z-index: 5;
  width: ${({ expanded }) => (expanded ? "16rem" : "4rem")};
`;

const MainContent = styled.div`
  flex: 1;
  padding: 2rem;
  border-radius: 8px;
  overflow-y: auto;
  transition: margin-left 0.3s ease, width 0.3s ease;
  margin-left: ${({ expanded }) => (expanded ? "16rem" : "4rem")};
  width: ${({ expanded }) => (expanded ? "calc(100% - 16rem)" : "calc(100% - 4rem)")};
`;

const AddCourse = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState(null);
  const [targetAudience, setTargetAudience] = useState("public");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [modal, setModal] = useState({ isOpen: false, type: "success", content: "" });
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef(null);

  // Toggle Sidebar function
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Handle File Selection
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Handle Form Submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file || !title || !category) {
      setModal({
        isOpen: true,
        type: "error",
        content: "Please fill all required fields and upload a file.",
      });
      return;
    }

    try {
      setLoading(true);

      // Upload file to Cloudinary
      const fileUrl = await uploadToCloudinary(file);
      if (!fileUrl) {
        setModal({
          isOpen: true,
          type: "error",
          content: "File upload to Cloudinary failed.",
        });
        return;
      }

      // Determine the collection based on the target audience
      let collectionName;
      switch (targetAudience) {
        case "intern":
          collectionName = "Intern_Course";
          break;
        case "learner":
          collectionName = "Learner_Course";
          break;
        case "applicant":
          collectionName = "Applicant_Course";
          break;
        default:
          collectionName = "courses"; // Default collection
      }

      // Store course details in the determined Firestore collection
      await addDoc(collection(db, collectionName), {
        title,
        description,
        category,
        fileUrl, // Store Cloudinary file URL
        targetAudience, // Store target audience option
        createdAt: serverTimestamp(), // Timestamp for sorting
      });

      // Open modal to confirm success
      setModal({
        isOpen: true,
        type: "success",
        content: "Your course has been uploaded successfully.",
      });

      // Reset form fields
      setTitle("");
      setDescription("");
      setCategory("");
      setTargetAudience("public");
      setFile(null);
      setFileName("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error uploading course:", error);
      setModal({
        isOpen: true,
        type: "error",
        content: "An error occurred while uploading the course.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Close Modal
  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  return (
    <PageContainer>
      <HeaderWrapper>
        <LgNavbar />
      </HeaderWrapper>
      <ContentContainer>
        <SidebarWrapper expanded={isSidebarOpen}>
          <IntSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        </SidebarWrapper>
        <MainContent expanded={isSidebarOpen}>
          {/* Header Section */}
          <div className="bg-gradient-to-r from-sky-500 to-indigo-600 rounded-2xl shadow-lg mb-8 overflow-hidden">
            <div className="p-8">
              <div className="flex items-center mb-4">
                <div className="bg-white p-3 rounded-full shadow-md mr-4">
                  <FaBook className="text-indigo-600 text-3xl" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white">Add New Course</h1>
                  <p className="text-indigo-100 mt-1">Create and upload learning materials</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="bg-white rounded-2xl shadow-md p-8 mb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Course Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter course title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  >
                    <option value="">Select a category</option>
                    <option value="programming">Programming</option>
                    <option value="design">Design</option>
                    <option value="business">Business</option>
                    <option value="marketing">Marketing</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Target Audience <span className="text-rose-500">*</span>
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    required
                  >
                    <option value="public">ALL</option>
                    <option value="intern">INTERN</option>
                    <option value="learner">LEARNERS</option>
                    <option value="applicant">APPLICANT</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-700 text-sm font-medium mb-2">Description</label>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Describe the course content"
                    rows="4"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  ></textarea>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Upload Course File <span className="text-rose-500">*</span>
                  </label>

                  <div
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                      file
                        ? "border-indigo-300 bg-indigo-50"
                        : "border-gray-300 hover:border-indigo-300 hover:bg-indigo-50"
                    }`}
                    onClick={triggerFileInput}
                  >
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} required />

                    <div className="flex flex-col items-center justify-center">
                      {file ? (
                        <>
                          <div className="bg-indigo-100 p-3 rounded-full mb-3">
                            <FaFileAlt className="text-indigo-600 text-xl" />
                          </div>
                          <p className="text-indigo-600 font-medium mb-1">{fileName}</p>
                          <p className="text-gray-500 text-sm">Click to change file</p>
                        </>
                      ) : (
                        <>
                          <div className="bg-gray-100 p-3 rounded-full mb-3">
                            <FaCloudUploadAlt className="text-gray-500 text-xl" />
                          </div>
                          <p className="text-gray-700 font-medium mb-1">Drag and drop or click to upload</p>
                          <p className="text-gray-500 text-sm">PDF, DOC, PPT, or image files</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mt-8">
                <button
                  type="submit"
                  className="flex items-center justify-center bg-indigo-600 text-white py-3 px-8 rounded-xl hover:bg-indigo-700 transition-colors font-medium min-w-[200px]"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <FaUpload className="mr-2" />
                      <span>Upload Course</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Modal */}
          {modal.isOpen && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded-2xl shadow-lg max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">{modal.type === "success" ? "Success" : "Error"}</h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
                  >
                    <FaTimes />
                  </button>
                </div>

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
                  <p className="text-gray-500 mb-6">{modal.content}</p>

                  <button
                    onClick={closeModal}
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
  );
};

export default AddCourse;
