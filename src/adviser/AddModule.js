"use client";

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { FaCloudUploadAlt } from "react-icons/fa";
import IntSidebar from "./sidebar";
import Header from "../Dashboard/Header";
import { collection, addDoc, serverTimestamp, doc, getDocs } from "firebase/firestore";
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

const AddModule = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Fetch courses from Firestore
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "courses"));
        const coursesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          title: doc.data().title,
        }));
        setCourses(coursesData);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };

    fetchCourses();
  }, []);

  // Toggle Sidebar function
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Handle Form Submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedCourseId || !title || !description || !content) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      // Add module to the course's modules subcollection
      const moduleRef = collection(doc(db, "courses", selectedCourseId), "modules");
      await addDoc(moduleRef, {
        title,
        description,
        content,
        createdAt: serverTimestamp(),
      });

      alert("Module added successfully!");

      // Reset form fields
      setTitle("");
      setDescription("");
      setContent("");
      setSelectedCourseId("");
    } catch (error) {
      console.error("Error adding module:", error);
      alert("An error occurred while adding the module.");
    }
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
                <h1 className="text-2xl font-bold">Add New Module</h1>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Select Course *
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      value={selectedCourseId}
                      onChange={(e) => setSelectedCourseId(e.target.value)}
                      required
                    >
                      <option value="">Select a course</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Module Title *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      placeholder="Enter module title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Description
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      placeholder="Describe the module content"
                      rows="4"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Content
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      placeholder="Enter module content"
                      rows="4"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    ></textarea>
                  </div>
                </div>
                <div className="mt-6 flex justify-center">
                  <button
                    type="submit"
                    className="bg-green-500 text-white py-2 px-6 rounded-md hover:bg-green-600"
                  >
                    Add Module
                  </button>
                </div>
              </form>
            </div>
          </div>
        </MainContent>
      </ContentContainer>
    </PageContainer>
  );
};

export default AddModule;
