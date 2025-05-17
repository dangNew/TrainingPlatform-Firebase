import { useState, useEffect, useRef } from "react";
import {
  FaCloudUploadAlt,
  FaBook,
  FaTrash,
  FaPlus,
  FaFileAlt,
  FaCheckCircle,
  FaTimes,
  FaLayerGroup,
  FaChalkboardTeacher,
} from "react-icons/fa";
import IntSidebar from "./sidebar";
import Header from "../Dashboard/Header";
import { collection, doc, getDocs, setDoc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase.config";
import uploadToCloudinary from "../uploadToCloudinary";
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

const AddModule = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [modules, setModules] = useState([]);
  const [moduleDetails, setModuleDetails] = useState({
    title: "",
    description: "",
  });
  const [chapters, setChapters] = useState([{ title: "", description: "", file: null, fileName: "" }]);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newChapter, setNewChapter] = useState({
    title: "",
    description: "",
    file: null,
    fileName: "",
  });
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [targetAudience, setTargetAudience] = useState("public");
  const [modal, setModal] = useState({ isOpen: false, type: "success", content: "" });
  const fileInputRefs = useRef([]);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        let collectionName;
        switch (targetAudience) {
          case "intern":
            collectionName = "Intern_Course";
            break;
          case "learner":
          case "applicant":
            collectionName = "courses";
            break;
          default:
            collectionName = "courses";
        }

        const querySnapshot = await getDocs(collection(db, collectionName));
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
  }, [targetAudience]);

  useEffect(() => {
    const fetchModules = async () => {
      if (selectedCourseId) {
        try {
          let collectionName;
          switch (targetAudience) {
            case "intern":
              collectionName = "Intern_Course";
              break;
            case "learner":
            case "applicant":
              collectionName = "courses";
              break;
            default:
              collectionName = "courses";
          }

          const courseDocRef = doc(db, collectionName, selectedCourseId);
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
  }, [selectedCourseId, targetAudience]);

  const handleFileChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const updatedChapters = [...chapters];
      updatedChapters[index].file = file;
      updatedChapters[index].fileName = file.name;
      setChapters(updatedChapters);
    }
  };

  const handleModalFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewChapter({
        ...newChapter,
        file: file,
        fileName: file.name,
      });
    }
  };

  const triggerFileInput = (index) => {
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index].click();
    }
  };

  const addChapter = () => {
    setChapters([...chapters, { title: "", description: "", file: null, fileName: "" }]);
    // Ensure fileInputRefs has enough elements
    fileInputRefs.current = fileInputRefs.current.slice(0, chapters.length + 1);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedCourseId || !moduleDetails.title || chapters.some((chapter) => !chapter.title || !chapter.file)) {
      setModal({
        isOpen: true,
        type: "error",
        content: "Please fill all required fields and upload files for each chapter.",
      });
      return;
    }

    try {
      setLoading(true);
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
          collectionName = "courses";
      }

      const courseDocRef = doc(db, collectionName, selectedCourseId);
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
        }),
      );

      const chaptersData = chapters.map((chapter, index) => ({
        title: chapter.title,
        description: chapter.description,
        fileUrl: {
          url: uploadedUrls[index].url,
          publicId: uploadedUrls[index].publicId,
        },
      }));

      await setDoc(doc(modulesCollectionRef, newModuleId), {
        id: newModuleId,
        ...moduleDetails,
        chapters: chaptersData,
        createdAt: serverTimestamp(),
      });

      setModal({
        isOpen: true,
        type: "success",
        content: "Module added successfully!",
      });
      setModuleDetails({ title: "", description: "" });
      setChapters([{ title: "", description: "", file: null, fileName: "" }]);
      setLoading(false);
    } catch (error) {
      console.error("Error adding module:", error);
      setModal({
        isOpen: true,
        type: "error",
        content: "An error occurred while adding the module.",
      });
      setLoading(false);
    }
  };

  const handleAddChapterModal = async () => {
    if (!newChapter.title || !newChapter.file || !selectedModuleId) {
      setModal({
        isOpen: true,
        type: "error",
        content: "Please fill all required fields, select a module, and upload a file for the new chapter.",
      });
      return;
    }

    try {
      setLoading(true);
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
          collectionName = "courses";
      }

      const courseDocRef = doc(db, collectionName, selectedCourseId);
      const moduleDocRef = doc(courseDocRef, "modules", selectedModuleId);

      const url = await uploadToCloudinary(newChapter.file);
      if (!url) {
        throw new Error("Failed to upload file to Cloudinary.");
      }

      const newChapterData = {
        title: newChapter.title,
        description: newChapter.description,
        fileUrl: {
          url: url.url,
          publicId: url.publicId,
        },
      };

      await updateDoc(moduleDocRef, {
        chapters: arrayUnion(newChapterData),
      });

      setModal({
        isOpen: true,
        type: "success",
        content: "Chapter added successfully!",
      });
      setNewChapter({ title: "", description: "", file: null, fileName: "" });
      setIsModalOpen(false);
      setLoading(false);
    } catch (error) {
      console.error("Error adding chapter:", error);
      setModal({
        isOpen: true,
        type: "error",
        content: "An error occurred while adding the chapter.",
      });
      setLoading(false);
    }
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  return (
    <PageContainer>
      <HeaderWrapper>
        <Header />
      </HeaderWrapper>
      <ContentContainer>
        <SidebarWrapper expanded={isSidebarOpen}>
          <IntSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        </SidebarWrapper>
        <MainContent expanded={isSidebarOpen}>
          {/* Header Section */}
          <div className="bg-gradient-to-r from-sky-500 to-indigo-600 rounded-2xl shadow-lg mb-8 overflow-hidden">
            <div className="p-8 flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="bg-white p-3 rounded-full shadow-md mr-4">
                  <FaLayerGroup className="text-indigo-600 text-3xl" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white">Module Management</h1>
                  <p className="text-indigo-100 mt-1">Create and organize course modules</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center bg-white text-indigo-600 px-6 py-3 rounded-full hover:bg-indigo-50 transition duration-300 shadow-md"
              >
                <FaPlus className="mr-2" /> Add Chapter to Module
              </button>
            </div>
          </div>

          <div className="p-6 flex-1">
            <form onSubmit={handleSubmit}>
              {/* Step 1: Select Course */}
              <div className="bg-white rounded-2xl shadow-md p-8 mb-6">
                <div className="flex items-center mb-6">
                  <div className="bg-indigo-100 p-2 rounded-full mr-3">
                    <FaBook className="text-indigo-600 text-xl" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-800">Step 1: Select Course</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Select Course <span className="text-rose-500">*</span>
                    </label>
                    <select
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
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
                </div>
              </div>

              {/* Step 2: Module Details */}
              <div className="bg-white rounded-2xl shadow-md p-8 mb-6">
                <div className="flex items-center mb-6">
                  <div className="bg-indigo-100 p-2 rounded-full mr-3">
                    <FaChalkboardTeacher className="text-indigo-600 text-xl" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-800">Step 2: Module Details</h2>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Module Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">Description</label>
                    <textarea
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                </div>
              </div>

              {/* Step 3: Chapters */}
              <div className="space-y-6">
                {chapters.map((chapter, index) => (
                  <div key={index} className="bg-white rounded-2xl shadow-md p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <div className="bg-indigo-100 p-2 rounded-full mr-3">
                          <FaFileAlt className="text-indigo-600 text-xl" />
                        </div>
                        <h2 className="text-2xl font-semibold text-gray-800">{`Chapter ${index + 1}`}</h2>
                      </div>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updatedChapters = [...chapters];
                            updatedChapters.splice(index, 1);
                            setChapters(updatedChapters);
                          }}
                          className="p-2 text-rose-500 hover:text-rose-700 rounded-full hover:bg-rose-50"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                          Chapter Title <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Enter chapter title"
                          value={chapter.title}
                          onChange={(e) => {
                            const updatedChapters = [...chapters];
                            updatedChapters[index].title = e.target.value;
                            setChapters(updatedChapters);
                          }}
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-gray-700 text-sm font-medium mb-2">Description</label>
                        <textarea
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Describe the chapter content"
                          rows="4"
                          value={chapter.description}
                          onChange={(e) => {
                            const updatedChapters = [...chapters];
                            updatedChapters[index].description = e.target.value;
                            setChapters(updatedChapters);
                          }}
                        ></textarea>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                          Upload File <span className="text-rose-500">*</span>
                        </label>

                        <div
                          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                            chapter.file
                              ? "border-indigo-300 bg-indigo-50"
                              : "border-gray-300 hover:border-indigo-300 hover:bg-indigo-50"
                          }`}
                          onClick={() => triggerFileInput(index)}
                        >
                          <input
                            type="file"
                            className="hidden"
                            accept="application/pdf, video/*, application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation, image/*"
                            onChange={(e) => handleFileChange(index, e)}
                            ref={(el) => (fileInputRefs.current[index] = el)}
                            required
                          />

                          <div className="flex flex-col items-center justify-center">
                            {chapter.file ? (
                              <>
                                <div className="bg-indigo-100 p-3 rounded-full mb-3">
                                  <FaFileAlt className="text-indigo-600 text-xl" />
                                </div>
                                <p className="text-indigo-600 font-medium mb-1">{chapter.fileName}</p>
                                <p className="text-gray-500 text-sm">Click to change file</p>
                              </>
                            ) : (
                              <>
                                <div className="bg-gray-100 p-3 rounded-full mb-3">
                                  <FaCloudUploadAlt className="text-gray-500 text-xl" />
                                </div>
                                <p className="text-gray-700 font-medium mb-1">Drag and drop or click to upload</p>
                                <p className="text-gray-500 text-sm">PDF, Video, Slides, or Image files</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Chapter Button */}
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={addChapter}
                  className="flex items-center bg-indigo-100 text-indigo-600 py-3 px-6 rounded-xl hover:bg-indigo-200 transition-colors font-medium"
                >
                  <FaPlus className="mr-2" /> Add Another Chapter
                </button>
              </div>

              {/* Submit Button */}
              <div className="mt-8 flex justify-center">
                <button
                  type="submit"
                  className="flex items-center justify-center bg-indigo-600 text-white py-3 px-8 rounded-xl hover:bg-indigo-700 transition-colors font-medium min-w-[200px]"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <FaLayerGroup className="mr-2" />
                      <span>Create Module</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Add Chapter Modal */}
            {isModalOpen && (
              <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
                <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Add New Chapter</h2>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
                    >
                      <FaTimes />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        Select Course <span className="text-rose-500">*</span>
                      </label>
                      <select
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
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
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        Select Module <span className="text-rose-500">*</span>
                      </label>
                      <select
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
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
                    </div>

                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        Chapter Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter chapter title"
                        value={newChapter.title}
                        onChange={(e) => setNewChapter({ ...newChapter, title: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">Description</label>
                      <textarea
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Describe the chapter content"
                        rows="4"
                        value={newChapter.description}
                        onChange={(e) => setNewChapter({ ...newChapter, description: e.target.value })}
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        Upload File <span className="text-rose-500">*</span>
                      </label>
                      <div
                        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                          newChapter.file
                            ? "border-indigo-300 bg-indigo-50"
                            : "border-gray-300 hover:border-indigo-300 hover:bg-indigo-50"
                        }`}
                        onClick={() => document.getElementById("modal-file-input").click()}
                      >
                        <input
                          id="modal-file-input"
                          type="file"
                          className="hidden"
                          accept="application/pdf, video/*, application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation, image/*"
                          onChange={handleModalFileChange}
                          required
                        />

                        <div className="flex flex-col items-center justify-center">
                          {newChapter.file ? (
                            <>
                              <div className="bg-indigo-100 p-3 rounded-full mb-3">
                                <FaFileAlt className="text-indigo-600 text-xl" />
                              </div>
                              <p className="text-indigo-600 font-medium mb-1">{newChapter.fileName}</p>
                              <p className="text-gray-500 text-sm">Click to change file</p>
                            </>
                          ) : (
                            <>
                              <div className="bg-gray-100 p-3 rounded-full mb-3">
                                <FaCloudUploadAlt className="text-gray-500 text-xl" />
                              </div>
                              <p className="text-gray-700 font-medium mb-1">Drag and drop or click to upload</p>
                              <p className="text-gray-500 text-sm">PDF, Video, Slides, or Image files</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddChapterModal}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                      >
                        Add Chapter
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Success/Error Modal */}
            {modal.isOpen && (
              <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
                <div className="bg-white p-6 rounded-2xl shadow-lg max-w-md w-full">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">
                      {modal.type === "success" ? "Success" : "Error"}
                    </h2>
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
                        <FaTrash className="text-rose-500 text-2xl" />
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

            {/* Global Loading Overlay */}
            {loading && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                  <div className="flex items-center space-x-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
                    <p className="text-gray-700 font-medium">Processing your request...</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </MainContent>
      </ContentContainer>
    </PageContainer>
  );
};

export default AddModule;
