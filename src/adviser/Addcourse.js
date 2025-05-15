"use client";

import React, { useState, useRef } from "react";
import { FaCloudUploadAlt, FaTimes, FaBook, FaCheckCircle } from "react-icons/fa";
import IntSidebar from "./sidebar";
import LgNavbar from "../components/LgNavbar";
import uploadToCloudinary from "../uploadToCloudinary";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
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
  flex: 1;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  transition: margin-left 0.3s ease, width 0.3s ease;
  margin-left: ${({ expanded }) => (expanded ? "0rem" : "4rem")};
  width: ${({ expanded }) => (expanded ? "calc(100% - 16rem)" : "calc(100% - 4rem)")};
`;

const AddCourse = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState(null);
  const [targetAudience, setTargetAudience] = useState("public");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false); // Loading state
  const fileInputRef = useRef(null);

  // Toggle Sidebar function
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Handle File Selection
  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  // Handle Form Submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file || !title || !category) {
      alert("Please fill all required fields and upload a file.");
      return;
    }

    try {
      setLoading(true); // Set loading to true when form is submitted

      // Upload file to Cloudinary
      const fileUrl = await uploadToCloudinary(file);
      if (!fileUrl) {
        alert("File upload to Cloudinary failed.");
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
      setIsModalOpen(true);

      // Reset form fields
      setTitle("");
      setDescription("");
      setCategory("");
      setTargetAudience("public");
      setFile(null);
      fileInputRef.current.value = "";
    } catch (error) {
      console.error("Error uploading course:", error);
      alert("An error occurred while uploading.");
    } finally {
      setLoading(false); // Set loading to false after submission is complete
    }
  };

  // Close Modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <PageContainer>
      <HeaderWrapper>
        <LgNavbar />
      </HeaderWrapper>
      <ContentContainer>
        <SidebarWrapper>
          <IntSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        </SidebarWrapper>
        <MainContent expanded={isSidebarOpen}>
          <div className="p-8 bg-blue-100 rounded-lg shadow-lg mb-6">
            <div className="flex items-center mb-4">
              <FaBook className="text-blue-500 text-4xl mr-4" />
              <h1 className="text-4xl font-bold text-blue-600">Add New Course</h1>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Course Title *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter course title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Category *
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the course content"
                    rows="4"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  ></textarea>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Target Audience *
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Upload Course File *
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    onChange={handleFileChange}
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-center">
                <button
                  type="submit"
                  className="bg-blue-500 text-white py-2 px-6 rounded-md hover:bg-blue-600"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </div>
                  ) : (
                    "Upload Course"
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
              <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                <div className="flex justify-end">
                  <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                    <FaTimes />
                  </button>
                </div>
                <div className="flex flex-col items-center mt-4">
                  <div className="w-20 h-20 flex items-center justify-center bg-blue-100 rounded-full mb-4">
                    <FaCheckCircle className="text-blue-500 text-4xl" />
                  </div>
                  <h2 className="text-2xl font-bold text-blue-600">Success!</h2>
                  <p className="mt-2 text-gray-700 text-center">Your course has been uploaded successfully.</p>
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={closeModal}
                      className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      OK
                    </button>
                  </div>
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
