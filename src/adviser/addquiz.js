import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { FaCloudUploadAlt } from "react-icons/fa";
import IntSidebar from "./sidebar";
import Header from "../Dashboard/Header";
import { collection, doc, getDocs, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase.config"; // Firestore instance

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

const AddQuiz = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([{ question: "", options: ["", ""], correctOption: 0 }]);
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

  const addQuestion = () => {
    setQuestions([...questions, { question: "", options: ["", ""], correctOption: 0 }]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedCourseId || !title || questions.some((q) => !q.question || q.options.some((opt) => !opt))) {
      alert("Please fill all required fields and ensure each question has options.");
      return;
    }

    try {
      setLoading(true);
      const courseDocRef = doc(db, "courses", selectedCourseId);
      const quizzesCollectionRef = collection(courseDocRef, "quizzes");

      const querySnapshot = await getDocs(quizzesCollectionRef);
      const newQuizId = (querySnapshot.size + 1).toString();

      await setDoc(doc(quizzesCollectionRef, newQuizId), {
        id: newQuizId,
        title,
        questions,
        createdAt: serverTimestamp(),
      });

      alert("Quiz added successfully!");
      setTitle("");
      setQuestions([{ question: "", options: ["", ""], correctOption: 0 }]);
      setLoading(false);
    } catch (error) {
      console.error("Error adding quiz:", error);
      alert("An error occurred while adding the quiz.");
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
                <h1 className="text-2xl font-bold">Create New Quiz</h1>
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

                <AccordionItem title="Step 2: Add Quiz Details" isOpen={true} toggle={() => {}}>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Quiz Title *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter quiz title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </AccordionItem>

                {questions.map((question, index) => (
                  <AccordionItem
                    key={index}
                    title={`Question ${index + 1}`}
                    isOpen={true}
                    toggle={() => {}}
                  >
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Question Text *
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Enter question text"
                      value={question.question}
                      onChange={(e) => {
                        const updatedQuestions = [...questions];
                        updatedQuestions[index].question = e.target.value;
                        setQuestions(updatedQuestions);
                      }}
                      required
                    />
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex} className="mb-2">
                        <label className="block text-gray-700 text-sm font-bold mb-1">
                          Option {optIndex + 1}
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Enter option text"
                          value={option}
                          onChange={(e) => {
                            const updatedQuestions = [...questions];
                            updatedQuestions[index].options[optIndex] = e.target.value;
                            setQuestions(updatedQuestions);
                          }}
                          required
                        />
                      </div>
                    ))}
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Correct Option *
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      value={question.correctOption}
                      onChange={(e) => {
                        const updatedQuestions = [...questions];
                        updatedQuestions[index].correctOption = parseInt(e.target.value, 10);
                        setQuestions(updatedQuestions);
                      }}
                      required
                    >
                      {question.options.map((_, optIndex) => (
                        <option key={optIndex} value={optIndex}>
                          Option {optIndex + 1}
                        </option>
                      ))}
                    </select>
                  </AccordionItem>
                ))}

                <button
                  type="button"
                  onClick={addQuestion}
                  className="mt-4 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
                >
                  Add Another Question
                </button>

                <div className="mt-6 flex justify-center">
                  <button
                    type="submit"
                    className="bg-green-500 text-white py-2 px-6 rounded-md hover:bg-green-600"
                  >
                    Create Quiz
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

export default AddQuiz;
