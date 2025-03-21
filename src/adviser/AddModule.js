import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { FaCloudUploadAlt } from "react-icons/fa";
import IntSidebar from "./sidebar";
import Header from "../Dashboard/Header";
import { collection, doc, getDocs, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase.config"; // Firestore instance
import uploadToCloudinary from "../uploadToCloudinary";

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

const AccordionItem = ({ title, children, isOpen, toggle }) => (
  <div className="border rounded-lg mb-3">
    <button
      onClick={toggle}
      className="w-full flex justify-between items-center p-3 bg-gray-100 hover:bg-gray-200"
    >
      <span className="font-medium">{title}</span>
      <span>{isOpen ? "▲" : "▼"}</span>
    </button>
    {isOpen && <div className="p-3 bg-white">{children}</div>}
  </div>
);

const AddModule = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [chapters, setChapters] = useState([{ title: "", description: "", file: null }]);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

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

  const handleFileChange = (index, e) => {
    const updatedChapters = [...chapters];
    updatedChapters[index].file = e.target.files[0];
    setChapters(updatedChapters);
  };

  const addChapter = () => {
    setChapters([...chapters, { title: "", description: "", file: null }]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedCourseId || !title || chapters.some((chapter) => !chapter.title || !chapter.file)) {
      alert("Please fill all required fields and upload files for each chapter.");
      return;
    }

    try {
      setLoading(true);
      const courseDocRef = doc(db, "courses", selectedCourseId);
      const modulesCollectionRef = collection(courseDocRef, "modules");

      const querySnapshot = await getDocs(modulesCollectionRef);
      const newModuleId = (querySnapshot.size + 1).toString();

      const uploadedUrls = await Promise.all(
        chapters.map(async (chapter) => {
          const url = await uploadToCloudinary(chapter.file);
          if (!url) {
            throw new Error("Failed to upload file to Cloudinary.");
          }
          return url;
        })
      );

      const chaptersData = chapters.map((chapter, index) => ({
        title: chapter.title,
        description: chapter.description,
        fileUrl: uploadedUrls[index],
      }));

      await setDoc(doc(modulesCollectionRef, newModuleId), {
        id: newModuleId,
        title,
        description,
        chapters: chaptersData,
        createdAt: serverTimestamp(),
      });

      alert("Module added successfully!");
      setTitle("");
      setDescription("");
      setChapters([{ title: "", description: "", file: null }]);
      setLoading(false);
    } catch (error) {
      console.error("Error adding module:", error);
      alert("An error occurred while adding the module.");
      setLoading(false);
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
                <AccordionItem title="Step 1: Select Course" isOpen={true} toggle={() => {}}>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Select Course *
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                </AccordionItem>

                <AccordionItem title="Step 2: Add Module Details" isOpen={true} toggle={() => {}}>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Module Title *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter module title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Describe the module content"
                    rows="4"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  ></textarea>
                </AccordionItem>

                {chapters.map((chapter, index) => (
                  <AccordionItem
                    key={index}
                    title={`Chapter ${index + 1} Details`}
                    isOpen={true}
                    toggle={() => {}}
                  >
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Chapter Title *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Enter chapter title"
                      value={chapter.title}
                      onChange={(e) => {
                        const updatedChapters = [...chapters];
                        updatedChapters[index].title = e.target.value;
                        setChapters(updatedChapters);
                      }}
                      required
                    />
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Description
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Describe the chapter content"
                      rows="4"
                      value={chapter.description}
                      onChange={(e) => {
                        const updatedChapters = [...chapters];
                        updatedChapters[index].description = e.target.value;
                        setChapters(updatedChapters);
                      }}
                    ></textarea>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Upload File (PDF, Video, Slides, Image) *
                    </label>
                    <input
                      type="file"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      accept="application/pdf, video/*, application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation, image/*"
                      onChange={(e) => handleFileChange(index, e)}
                      required
                    />
                  </AccordionItem>
                ))}

                <button
                  type="button"
                  onClick={addChapter}
                  className="mt-4 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
                >
                  Add Another Chapter
                </button>

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
