import { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase.config";
import {
  FaTrash,
  FaTimes,
  FaBook,
  FaCheckCircle,
  FaExclamationTriangle,
  FaCopy,
  FaPlus,
  FaQuestionCircle,
  FaClipboard,
  FaLayerGroup,
  FaImage,
} from "react-icons/fa";
import { BsImage } from "react-icons/bs";
import IntSidebar from "./sidebar";
import Header from "../Dashboard/Header";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
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

const BulkOptionsTextarea = styled.textarea`
  width: 100%;
  min-height: 150px;
  border: 1px solid #e0e0e0;
  border-radius: 0.75rem;
  padding: 12px;
  margin-bottom: 16px;
  font-size: 14px;
  resize: vertical;
  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
  }
`;

const AddQuiz = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [modules, setModules] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [sections, setSections] = useState([
    {
      title: "",
      description: "",
      questions: [
        {
          question: "",
          options: ["Option 1"],
          correctOption: 0,
          points: 1,
          required: true,
          questionType: "Multiple choice",
          questionImage: null,
        },
      ],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showBulkOptions, setShowBulkOptions] = useState(false);
  const [bulkOptionsText, setBulkOptionsText] = useState("");
  const [currentEditingQuestion, setCurrentEditingQuestion] = useState({ sectionIndex: 0, questionIndex: 0 });
  const [userType, setUserType] = useState("Adviser");
  const [modal, setModal] = useState({ isOpen: false, type: "success", content: "" });

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        let collectionName = "courses";
        if (userType === "Intern") {
          collectionName = "Intern_Course";
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
  }, [userType]);

  useEffect(() => {
    const fetchModules = async () => {
      if (selectedCourseId) {
        try {
          let collectionName = "courses";
          if (userType === "Intern") {
            collectionName = "Intern_Course";
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
  }, [selectedCourseId, userType]);

  const addQuestion = (sectionIndex) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].questions.push({
      question: "",
      options: ["Option 1"],
      correctOption: 0,
      points: 1,
      required: true,
      questionType: "Multiple choice",
      questionImage: null,
    });
    setSections(updatedSections);
  };

  const removeQuestion = (sectionIndex, questionIndex) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].questions.splice(questionIndex, 1);
    setSections(updatedSections);
  };

  const duplicateQuestion = (sectionIndex, questionIndex) => {
    const updatedSections = [...sections];
    const questionToDuplicate = { ...updatedSections[sectionIndex].questions[questionIndex] };
    updatedSections[sectionIndex].questions.splice(questionIndex + 1, 0, questionToDuplicate);
    setSections(updatedSections);
  };

  const addSection = () => {
    setSections([
      ...sections,
      {
        title: "",
        description: "",
        questions: [
          {
            question: "",
            options: ["Option 1"],
            correctOption: 0,
            points: 1,
            required: true,
            questionType: "Multiple choice",
            questionImage: null,
          },
        ],
      },
    ]);
  };

  const removeSection = (sectionIndex) => {
    const updatedSections = [...sections];
    updatedSections.splice(sectionIndex, 1);
    setSections(updatedSections);
  };

  const addOption = (sectionIndex, questionIndex) => {
    const updatedSections = [...sections];
    const optionCount = updatedSections[sectionIndex].questions[questionIndex].options.length;
    updatedSections[sectionIndex].questions[questionIndex].options.push(`Option ${optionCount + 1}`);
    setSections(updatedSections);
  };

  const addOtherOption = (sectionIndex, questionIndex) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].questions[questionIndex].options.push("Other");
    setSections(updatedSections);
  };

  const handleOptionKeyPress = (e, sectionIndex, questionIndex) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addOption(sectionIndex, questionIndex);
    }
  };

  const parseOptions = (text) => {
    const lines = text.split("\n").filter((line) => line.trim() !== "");
    const letterPattern = /^([A-Z]\.|$$[A-Z]$$)\s+(.+)$/;
    const numberedPattern = /^(\d+\.|$$\d+$$)\s+(.+)$/;

    let parsedOptions = [];

    if (lines.every((line) => letterPattern.test(line.trim()))) {
      parsedOptions = lines.map((line) => {
        const match = line.trim().match(letterPattern);
        return match ? match[2] : line.trim();
      });
    } else if (lines.every((line) => numberedPattern.test(line.trim()))) {
      parsedOptions = lines.map((line) => {
        const match = line.trim().match(numberedPattern);
        return match ? match[2] : line.trim();
      });
    } else {
      parsedOptions = lines;
    }

    return parsedOptions;
  };

  const handleBulkOptionsSubmit = () => {
    if (!bulkOptionsText.trim()) {
      setShowBulkOptions(false);
      return;
    }

    const { sectionIndex, questionIndex } = currentEditingQuestion;
    const parsedOptions = parseOptions(bulkOptionsText);

    if (parsedOptions.length > 0) {
      const updatedSections = [...sections];
      updatedSections[sectionIndex].questions[questionIndex].options = parsedOptions;
      setSections(updatedSections);
    }

    setShowBulkOptions(false);
    setBulkOptionsText("");
  };

  const handleOptionPaste = (e, sectionIndex, questionIndex, optionIndex) => {
    const pastedText = e.clipboardData.getData("text");
    if (pastedText.includes("\n")) {
      e.preventDefault();

      const currentOptions = sections[sectionIndex].questions[questionIndex].options;
      if (optionIndex === 0 && currentOptions.length === 1 && currentOptions[0] === "Option 1") {
        const parsedOptions = parseOptions(pastedText);

        if (parsedOptions.length > 0) {
          const updatedSections = [...sections];
          updatedSections[sectionIndex].questions[questionIndex].options = parsedOptions;
          setSections(updatedSections);
        }
      } else {
        setCurrentEditingQuestion({ sectionIndex, questionIndex });
        setBulkOptionsText(pastedText);
        setShowBulkOptions(true);
      }
    }
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !selectedCourseId ||
      !selectedModuleId ||
      !title ||
      sections.some(
        (section) => !section.title || section.questions.some((q) => !q.question || q.options.some((opt) => !opt)),
      )
    ) {
      setModal({
        isOpen: true,
        type: "error",
        content: "Please fill all required fields and ensure each question has options.",
      });
      return;
    }

    try {
      setLoading(true);
      let collectionName = "courses";
      if (userType === "Intern") {
        collectionName = "Intern_Course";
      }

      const courseDocRef = doc(db, collectionName, selectedCourseId);
      const moduleDocRef = doc(courseDocRef, "modules", selectedModuleId);
      const quizzesCollectionRef = collection(moduleDocRef, "quizzes");

      const querySnapshot = await getDocs(quizzesCollectionRef);
      const newQuizId = (querySnapshot.size + 1).toString();

      await setDoc(doc(quizzesCollectionRef, newQuizId), {
        id: newQuizId,
        title,
        description,
        image,
        sections,
        createdAt: serverTimestamp(),
      });

      setModal({
        isOpen: true,
        type: "success",
        content: "Quiz added successfully!",
      });
      setTitle("");
      setDescription("");
      setImage(null);
      setSections([
        {
          title: "",
          description: "",
          questions: [
            {
              question: "",
              options: ["Option 1"],
              correctOption: 0,
              points: 1,
              required: true,
              questionType: "Multiple choice",
              questionImage: null,
            },
          ],
        },
      ]);
      setLoading(false);
    } catch (error) {
      console.error("Error adding quiz:", error);
      setModal({
        isOpen: true,
        type: "error",
        content: "An error occurred while adding the quiz.",
      });
      setLoading(false);
    }
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
                  <FaQuestionCircle className="text-indigo-600 text-3xl" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white">Create Quiz</h1>
                  <p className="text-indigo-100 mt-1">Design assessments for your courses</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Form */}
          <div className="max-w-10xl mx-auto">
            <form onSubmit={handleSubmit}>
              {/* Quiz Settings */}
              <div className="bg-white rounded-2xl shadow-md p-8 mb-6">
                <div className="flex items-center mb-6">
                  <div className="bg-indigo-100 p-2 rounded-full mr-3">
                    <FaBook className="text-indigo-600 text-xl" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-800">Quiz Settings</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      User Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
                      value={userType}
                      onChange={(e) => {
                        setUserType(e.target.value);
                        setSelectedCourseId("");
                        setSelectedModuleId("");
                      }}
                      required
                    >
                      <option value="Adviser">Adviser</option>
                      <option value="Intern">Intern</option>
                      <option value="Applicant">Applicant</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Select Course <span className="text-rose-500">*</span>
                    </label>
                    <select
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
                      value={selectedCourseId}
                      onChange={(e) => {
                        setSelectedCourseId(e.target.value);
                        setSelectedModuleId("");
                      }}
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

                  {selectedCourseId && (
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
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Quiz Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter quiz title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-gray-700 text-sm font-medium mb-2">Quiz Description</label>
                    <textarea
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter quiz description"
                      rows="4"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-gray-700 text-sm font-medium mb-2">Quiz Image</label>
                    <div
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                        image
                          ? "border-indigo-300 bg-indigo-50"
                          : "border-gray-300 hover:border-indigo-300 hover:bg-indigo-50"
                      }`}
                      onClick={() => document.getElementById("quiz-image").click()}
                    >
                      <input
                        type="file"
                        id="quiz-image"
                        className="hidden"
                        onChange={(e) => setImage(e.target.files[0])}
                      />

                      <div className="flex flex-col items-center justify-center">
                        {image ? (
                          <>
                            <div className="bg-indigo-100 p-3 rounded-full mb-3">
                              <FaImage className="text-indigo-600 text-xl" />
                            </div>
                            <p className="text-indigo-600 font-medium mb-1">{image.name}</p>
                            <p className="text-gray-500 text-sm">Click to change image</p>
                          </>
                        ) : (
                          <>
                            <div className="bg-gray-100 p-3 rounded-full mb-3">
                              <FaImage className="text-gray-500 text-xl" />
                            </div>
                            <p className="text-gray-700 font-medium mb-1">Upload quiz cover image</p>
                            <p className="text-gray-500 text-sm">Click to browse files</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quiz Sections */}
              {sections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="bg-white rounded-2xl shadow-md p-8 mb-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="bg-indigo-100 p-2 rounded-full mr-3">
                        <FaLayerGroup className="text-indigo-600 text-xl" />
                      </div>
                      <h2 className="text-2xl font-semibold text-gray-800">Section {sectionIndex + 1}</h2>
                    </div>
                    {sections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSection(sectionIndex)}
                        className="p-2 text-rose-500 hover:text-rose-700 rounded-full hover:bg-rose-50"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-6 mb-8">
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        Section Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter section title"
                        value={section.title}
                        onChange={(e) => {
                          const updatedSections = [...sections];
                          updatedSections[sectionIndex].title = e.target.value;
                          setSections(updatedSections);
                        }}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-2">Section Description</label>
                      <textarea
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter section description"
                        rows="3"
                        value={section.description}
                        onChange={(e) => {
                          const updatedSections = [...sections];
                          updatedSections[sectionIndex].description = e.target.value;
                          setSections(updatedSections);
                        }}
                      />
                    </div>
                  </div>

                  {/* Questions */}
                  <div className="space-y-6">
                    {section.questions.map((question, questionIndex) => (
                      <div
                        key={questionIndex}
                        className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-indigo-200 transition-colors"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center">
                            <div className="bg-indigo-100 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                              <span className="text-indigo-600 font-medium">{questionIndex + 1}</span>
                            </div>
                            <h3 className="text-lg font-medium text-gray-800">Question</h3>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => duplicateQuestion(sectionIndex, questionIndex)}
                              className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-200"
                              title="Duplicate question"
                            >
                              <FaCopy />
                            </button>
                            {section.questions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeQuestion(sectionIndex, questionIndex)}
                                className="p-2 text-rose-500 hover:text-rose-700 rounded-full hover:bg-rose-50"
                                title="Remove question"
                              >
                                <FaTrash />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="flex items-center mb-2">
                            <input
                              type="text"
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Enter your question"
                              value={question.question}
                              onChange={(e) => {
                                const updatedSections = [...sections];
                                updatedSections[sectionIndex].questions[questionIndex].question = e.target.value;
                                setSections(updatedSections);
                              }}
                              required
                            />
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center space-x-3">
                              <button
                                type="button"
                                className="flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700"
                                onClick={() => {
                                  const fileInput = document.createElement("input");
                                  fileInput.type = "file";
                                  fileInput.accept = "image/*";
                                  fileInput.onchange = (e) => {
                                    const updatedSections = [...sections];
                                    updatedSections[sectionIndex].questions[questionIndex].questionImage =
                                      e.target.files[0];
                                    setSections(updatedSections);
                                  };
                                  fileInput.click();
                                }}
                              >
                                <BsImage size={16} className="mr-1.5" />
                                {question.questionImage ? "Change Image" : "Add Image"}
                              </button>

                              <select
                                className="appearance-none bg-gray-100 hover:bg-gray-200 border-0 rounded-lg py-1.5 pl-3 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={question.questionType}
                                onChange={(e) => {
                                  const updatedSections = [...sections];
                                  updatedSections[sectionIndex].questions[questionIndex].questionType = e.target.value;
                                  setSections(updatedSections);
                                }}
                              >
                                <option>Multiple choice</option>
                                <option>Short answer</option>
                                <option>True/False</option>
                              </select>
                            </div>

                            <div className="flex items-center">
                              <span className="text-sm text-gray-500 mr-2">Points:</span>
                              <input
                                type="number"
                                min="0"
                                className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-center"
                                value={question.points}
                                onChange={(e) => {
                                  const updatedSections = [...sections];
                                  updatedSections[sectionIndex].questions[questionIndex].points =
                                    Number.parseInt(e.target.value) || 0;
                                  setSections(updatedSections);
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Display image if uploaded */}
                        {question.questionImage && (
                          <div className="mb-4">
                            <div className="relative w-full h-40 bg-gray-100 rounded-xl overflow-hidden">
                              <img
                                src={URL.createObjectURL(question.questionImage) || "/placeholder.svg"}
                                alt="Question"
                                className="w-full h-full object-contain"
                              />
                              <button
                                type="button"
                                className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100"
                                onClick={() => {
                                  const updatedSections = [...sections];
                                  updatedSections[sectionIndex].questions[questionIndex].questionImage = null;
                                  setSections(updatedSections);
                                }}
                              >
                                <FaTrash size={14} className="text-rose-500" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Options */}
                        <div className="mt-4">
                          <label className="block text-gray-700 text-sm font-medium mb-3">Answer Options</label>

                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center mb-3">
                              <input
                                type="radio"
                                name={`question-${sectionIndex}-${questionIndex}`}
                                checked={question.correctOption === optionIndex}
                                onChange={() => {
                                  const updatedSections = [...sections];
                                  updatedSections[sectionIndex].questions[questionIndex].correctOption = optionIndex;
                                  setSections(updatedSections);
                                }}
                                className="mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                              />
                              <div className="flex-1">
                                <input
                                  type="text"
                                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                  value={option}
                                  onChange={(e) => {
                                    const updatedSections = [...sections];
                                    updatedSections[sectionIndex].questions[questionIndex].options[optionIndex] =
                                      e.target.value;
                                    setSections(updatedSections);
                                  }}
                                  onKeyPress={(e) => handleOptionKeyPress(e, sectionIndex, questionIndex)}
                                  onPaste={(e) => handleOptionPaste(e, sectionIndex, questionIndex, optionIndex)}
                                  required
                                />
                              </div>
                              {question.options.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedSections = [...sections];
                                    updatedSections[sectionIndex].questions[questionIndex].options.splice(
                                      optionIndex,
                                      1,
                                    );
                                    if (question.correctOption >= optionIndex && question.correctOption > 0) {
                                      updatedSections[sectionIndex].questions[questionIndex].correctOption--;
                                    }
                                    setSections(updatedSections);
                                  }}
                                  className="ml-2 p-1.5 text-rose-500 hover:text-rose-700 rounded-full hover:bg-rose-50"
                                >
                                  <FaTrash size={14} />
                                </button>
                              )}
                            </div>
                          ))}

                          <div className="flex flex-wrap gap-2 mt-3">
                            <button
                              type="button"
                              onClick={() => addOption(sectionIndex, questionIndex)}
                              className="flex items-center px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-sm"
                            >
                              <FaPlus size={12} className="mr-1.5" /> Add Option
                            </button>
                            <button
                              type="button"
                              onClick={() => addOtherOption(sectionIndex, questionIndex)}
                              className="flex items-center px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-sm"
                            >
                              <FaPlus size={12} className="mr-1.5" /> Add "Other"
                            </button>
                            <button
                              type="button"
                              className="flex items-center px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-sm"
                              onClick={() => {
                                setCurrentEditingQuestion({ sectionIndex, questionIndex });
                                setShowBulkOptions(true);
                              }}
                            >
                              <FaClipboard size={12} className="mr-1.5" /> Bulk Add Options
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => addQuestion(sectionIndex)}
                      className="flex items-center justify-center w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl border border-dashed border-gray-300 transition-colors"
                    >
                      <FaPlus className="mr-2 text-gray-500" />
                      <span>Add Question</span>
                    </button>
                  </div>
                </div>
              ))}

              {/* Add Section Button */}
              <button
                type="button"
                onClick={addSection}
                className="flex items-center justify-center w-full py-3 mb-6 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl border border-dashed border-indigo-300 transition-colors"
              >
                <FaPlus className="mr-2" />
                <span>Add Section</span>
              </button>

              {/* Submit Button */}
              <div className="flex justify-center mb-8">
                <button
                  type="submit"
                  className="flex items-center justify-center bg-indigo-600 text-white py-3 px-8 rounded-xl hover:bg-indigo-700 transition-colors font-medium min-w-[200px]"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                      <span>Creating Quiz...</span>
                    </>
                  ) : (
                    <>
                      <FaCheckCircle className="mr-2" />
                      <span>Create Quiz</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Bulk Options Modal */}
          {showBulkOptions && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800">Bulk Add Options</h3>
                  <button
                    onClick={() => setShowBulkOptions(false)}
                    className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
                  >
                    <FaTimes />
                  </button>
                </div>

                <p className="text-sm text-gray-600 mb-3">
                  Each line will be added as a separate option. Format like "A. Option 1" will be parsed automatically.
                </p>

                <BulkOptionsTextarea
                  value={bulkOptionsText}
                  onChange={(e) => setBulkOptionsText(e.target.value)}
                  placeholder="A. Option 1&#10;B. Option 2&#10;C. Option 3&#10;D. Option 4"
                />

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                    onClick={() => setShowBulkOptions(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                    onClick={handleBulkOptionsSubmit}
                  >
                    Add Options
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Success/Error Modal */}
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

export default AddQuiz;
