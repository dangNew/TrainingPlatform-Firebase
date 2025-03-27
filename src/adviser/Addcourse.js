"use client";

import React, { useState, useRef } from "react";
import { FaCloudUploadAlt, FaTimes, FaBook, FaCheckCircle } from "react-icons/fa";
import IntSidebar from "./sidebar";
import Header from "../Dashboard/Header";
import uploadToCloudinary from "../uploadToCloudinary";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase.config";

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
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <div
          className={`${
            isSidebarOpen ? "w-64" : "w-20"
          } transition-width duration-300`}
        >
          <IntSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        </div>
        <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
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
                >
                  Upload Course
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
                  <FaCheckCircle className="text-green-500 text-4xl mb-4" />
                  <h2 className="text-xl font-bold text-gray-800">Success!</h2>
                  <p className="mt-2 text-gray-600">Your course has been uploaded successfully.</p>
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      OK
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddCourse;
