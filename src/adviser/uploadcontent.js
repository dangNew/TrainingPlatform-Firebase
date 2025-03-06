"use client";

import React, { useState, useRef } from "react";
import styled from "styled-components";
import { FaCloudUploadAlt } from "react-icons/fa";
import IntSidebar from "./sidebar";
import Header from "../Dashboard/Header";
import { db, storage } from "../firebase.config"; 
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

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
    marginLeft: isSidebarOpen ? "38px" : "60px",
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

const UploadContentPage = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [course, setCourse] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const fileInputRef = useRef(null);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file || !title || !category || !course) {
      alert("Please fill all required fields and upload a file.");
      return;
    }

    setUploading(true);

    try {
      const fileRef = ref(storage, `uploads/${Date.now()}-${file.name}`);
      const uploadTask = uploadBytesResumable(fileRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
        },
        (error) => {
          console.error("Upload error:", error);
          alert("An error occurred while uploading.");
          setUploading(false);
        },
        async () => {
          const fileURL = await getDownloadURL(uploadTask.snapshot.ref);
          const uploadsCollection = collection(db, "uploads");

          await addDoc(uploadsCollection, {
            title,
            description,
            category,
            course,
            fileURL,
            createdAt: new Date(),
          });

          alert("Content uploaded successfully!");
          setTitle("");
          setDescription("");
          setCategory("");
          setCourse("");
          setFile(null);
          fileInputRef.current.value = "";
          setUploading(false);
        }
      );
    } catch (error) {
      console.error("Upload error:", error);
      alert("An error occurred while uploading.");
      setUploading(false);
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
                <h1 className="text-2xl font-bold">Upload Content</h1>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Content Title *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      placeholder="Enter title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Course *
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      required
                    >
                      <option value="">Select a course</option>
                      <option value="course1">Course 1</option>
                      <option value="course2">Course 2</option>
                      <option value="course3">Course 3</option>
                    </select>
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
                      <option value="lecture">Lecture</option>
                      <option value="assignment">Assignment</option>
                      <option value="resource">Resource</option>
                      <option value="quiz">Quiz</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Upload File *
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
                    disabled={uploading}
                  >
                    {uploading ? "Uploading..." : "Upload Content"}
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

export default UploadContentPage;
