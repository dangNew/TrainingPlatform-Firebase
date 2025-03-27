import React, { useState, useEffect } from "react";
import {
  FaCloudUploadAlt,
  FaSpinner,
  FaBook,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import IntSidebar from "./sidebar";
import Header from "../Dashboard/Header";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase.config";
import uploadToCloudinary from "../uploadToCloudinary";

const AddModule = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [modules, setModules] = useState([]);
  const [moduleDetails, setModuleDetails] = useState({
    title: "",
    description: "",
  });
  const [chapters, setChapters] = useState([
    { title: "", description: "", file: null },
  ]);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newChapter, setNewChapter] = useState({
    title: "",
    description: "",
    file: null,
  });
  const [selectedModuleId, setSelectedModuleId] = useState("");
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

  useEffect(() => {
    const fetchModules = async () => {
      if (selectedCourseId) {
        try {
          const courseDocRef = doc(db, "courses", selectedCourseId);
          const modulesCollectionRef = collection(courseDocRef, "modules");
          const querySnapshot = await getDocs(modulesCollectionRef);
          const modulesData = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            title: doc.data().title,
          }));
          setModules(modulesData);
        } catch (error) {
          console.error("Error fetching modules:", error);
        }
      }
    };
    fetchModules();
  }, [selectedCourseId]);

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

    if (
      !selectedCourseId ||
      !moduleDetails.title ||
      chapters.some((chapter) => !chapter.title || !chapter.file)
    ) {
      alert(
        "Please fill all required fields and upload files for each chapter."
      );
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
        ...moduleDetails,
        chapters: chaptersData,
        createdAt: serverTimestamp(),
      });

      alert("Module added successfully!");
      setModuleDetails({ title: "", description: "" });
      setChapters([{ title: "", description: "", file: null }]);
      setLoading(false);
    } catch (error) {
      console.error("Error adding module:", error);
      alert("An error occurred while adding the module.");
      setLoading(false);
    }
  };

  const handleAddChapterModal = async () => {
    if (!newChapter.title || !newChapter.file || !selectedModuleId) {
      alert(
        "Please fill all required fields, select a module, and upload a file for the new chapter."
      );
      return;
    }

    try {
      setLoading(true);
      const courseDocRef = doc(db, "courses", selectedCourseId);
      const moduleDocRef = doc(courseDocRef, "modules", selectedModuleId);

      const url = await uploadToCloudinary(newChapter.file);
      if (!url) {
        throw new Error("Failed to upload file to Cloudinary.");
      }

      const newChapterData = {
        title: newChapter.title,
        description: newChapter.description,
        fileUrl: url,
      };

      await updateDoc(moduleDocRef, {
        chapters: arrayUnion(newChapterData),
      });

      alert("Chapter added successfully!");
      setNewChapter({ title: "", description: "", file: null });
      setIsModalOpen(false);
      setLoading(false);
    } catch (error) {
      console.error("Error adding chapter:", error);
      alert("An error occurred while adding the chapter.");
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col">
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
              <h1 className="text-4xl font-bold text-blue-600">Modules</h1>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center bg-yellow-500 text-white px-6 py-3 rounded-full hover:bg-yellow-600 transition duration-300 mb-4"
            >
              <FaEdit className="mr-2" /> Add Chapter to Module
            </button>
          </div>
          <div className="p-6 flex-1">
            <form onSubmit={handleSubmit}>
              <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
                <h2 className="text-2xl font-semibold mb-4">
                  Step 1: Select Course
                </h2>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Select Course *
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
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

              <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
                <h2 className="text-2xl font-semibold mb-4">
                  Step 2: Add Module Details
                </h2>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Module Title *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
                  placeholder="Enter module title"
                  value={moduleDetails.title}
                  onChange={(e) =>
                    setModuleDetails({
                      ...moduleDetails,
                      title: e.target.value,
                    })
                  }
                  required
                />
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
                  placeholder="Describe the module content"
                  rows="4"
                  value={moduleDetails.description}
                  onChange={(e) =>
                    setModuleDetails({
                      ...moduleDetails,
                      description: e.target.value,
                    })
                  }
                ></textarea>
              </div>

              {chapters.map((chapter, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-lg p-6 mb-4"
                >
                  <h2 className="text-2xl font-semibold mb-4">{`Chapter ${
                    index + 1
                  } Details`}</h2>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Chapter Title *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
                    accept="application/pdf, video/*, application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation, image/*"
                    onChange={(e) => handleFileChange(index, e)}
                    required
                  />
                </div>
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

            {isModalOpen && (
              <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
                <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                  <h2 className="text-xl font-semibold mb-4">
                    Add New Chapter
                  </h2>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Select Course *
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
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

                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Select Module *
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
                    value={selectedModuleId}
                    onChange={(e) => setSelectedModuleId(e.target.value)}
                    required
                  >
                    <option value="">Select a module</option>
                    {modules.map((module) => (
                      <option key={module.id} value={module.id}>
                        {module.title}
                      </option>
                    ))}
                  </select>

                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Chapter Title *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
                    placeholder="Enter chapter title"
                    value={newChapter.title}
                    onChange={(e) =>
                      setNewChapter({ ...newChapter, title: e.target.value })
                    }
                    required
                  />
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
                    placeholder="Describe the chapter content"
                    rows="4"
                    value={newChapter.description}
                    onChange={(e) =>
                      setNewChapter({
                        ...newChapter,
                        description: e.target.value,
                      })
                    }
                  ></textarea>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Upload File (PDF, Video, Slides, Image) *
                  </label>
                  <input
                    type="file"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
                    accept="application/pdf, video/*, application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation, image/*"
                    onChange={(e) =>
                      setNewChapter({ ...newChapter, file: e.target.files[0] })
                    }
                    required
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="mr-2 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddChapterModal}
                      className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600"
                    >
                      Add Chapter
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <FaSpinner className="text-white text-4xl animate-spin" />
        </div>
      )}
    </div>
  );
};

export default AddModule;
