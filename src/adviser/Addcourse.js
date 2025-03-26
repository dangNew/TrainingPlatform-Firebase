"use client";

import React, { useState, useRef } from "react";
import styled from "styled-components";
import { FaCloudUploadAlt, FaTimes } from "react-icons/fa";
import IntSidebar from "./sidebar";
import Header from "../Dashboard/Header";
import uploadToCloudinary from "../uploadToCloudinary";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase.config"; // Import Firestore instance

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
`;

const HeaderWrapper = styled.div`
  width: 100%;
  z-index: 10;
`;

const ContentContainer = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const SidebarWrapper = styled.div`
  height: 100%;
  z-index: 5;
`;

const MainContent = styled.div.attrs(({ isSidebarOpen }) => ({
  style: {
    marginLeft: isSidebarOpen ? "10px" : "60px",
    width: `calc(100% - ${isSidebarOpen ? "38px" : "60px"})`,
  },
}))`
  padding: 2rem;
  background-color: #fff;
  transition: margin-left 0.3s ease, width 0.3s ease;
  flex: 1;
  overflow-y: auto;
  height: 100%;
`;

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
        <div className="flex justify-end">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
};

const AddCourse = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      // Upload file to Cloudinary
      const fileUrl = await uploadToCloudinary(file);
      if (!fileUrl) {
        alert("File upload to Cloudinary failed.");
        return;
      }

      // Store course details in Firestore
      await addDoc(collection(db, "courses"), {
        title,
        description,
        category,
        fileUrl, // Store Cloudinary file URL
        createdAt: serverTimestamp(), // Timestamp for sorting
      });

      // Open modal to confirm success
      setIsModalOpen(true);

      // Reset form fields
      setTitle("");
      setDescription("");
      setCategory("");
      setFile(null);
      fileInputRef.current.value = "";
    } catch (error) {
      console.error("Error uploading course:", error);
      alert("An error occurred while uploading.");
    }
  };

  // Close Modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <PageContainer className="bg-gray-100">
      <HeaderWrapper>
        <Header />
      </HeaderWrapper>
      <ContentContainer>
        <SidebarWrapper>
          <IntSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        </SidebarWrapper>
        <MainContent isSidebarOpen={isSidebarOpen}>
          <div className="flex justify-center items-start p-6">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-3xl">
              <div className="flex items-center mb-6">
                <FaCloudUploadAlt className="text-green-500 text-3xl mr-3" />
                <h1 className="text-2xl font-bold">Add New Course</h1>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Course Title *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      placeholder="Describe the course content"
                      rows="4"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
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
                    className="bg-green-500 text-white py-2 px-6 rounded-md hover:bg-green-600"
                  >
                    Upload Course
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Modal */}
          <Modal isOpen={isModalOpen} onClose={closeModal}>
            <h2 className="text-xl font-bold text-gray-800">Success!</h2>
            <p className="mt-2 text-gray-600">Your course has been uploaded successfully.</p>
            <div className="flex justify-end mt-4">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                OK
              </button>
            </div>
          </Modal>
        </MainContent>
      </ContentContainer>
    </PageContainer>
  );
};

export default AddCourse;
