"use client"

import { useState, useEffect } from "react"
import styled from "styled-components"
import { FaCloudUploadAlt, FaPlus, FaTrash, FaImage, FaEllipsisV, FaCopy } from "react-icons/fa"
import { BsImage } from "react-icons/bs"
import IntSidebar from "./sidebar"
import Header from "../Dashboard/Header"
import { collection, doc, getDocs, setDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase.config" // Firestore instance

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
`

const HeaderWrapper = styled.div`
  width: 100%;
  z-index: 10;
`

const ContentContainer = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`

const SidebarWrapper = styled.div`
  height: 100%;
  z-index: 5;
`

const MainContent = styled.div.attrs(({ isSidebarOpen }) => ({
  style: {
    marginLeft: isSidebarOpen ? "250px" : "60px",
    width: `calc(100% - ${isSidebarOpen ? "250px" : "60px"})`,
  },
}))`
  padding: 3rem;
  background-color: #f9f9f9;
  transition: margin-left 0.3s ease, width 0.3s ease;
  flex: 1;
  overflow-y: auto;
  height: 100%;
`

const AccordionItem = ({ title, children, isOpen, toggle }) => (
  <div className="border rounded-lg mb-4 shadow-sm">
    <button onClick={toggle} className="w-full flex justify-between items-center p-4 bg-white hover:bg-gray-50">
      <span className="font-medium text-lg">{title}</span>
      <span className="text-xl">{isOpen ? "▲" : "▼"}</span>
    </button>
    {isOpen && <div className="p-4 bg-white">{children}</div>}
  </div>
)

const QuestionCard = styled.div`
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 24px;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`

const QuestionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background-color: #f1f1f1;
`

const QuestionContent = styled.div`
  padding: 20px;
`

const QuestionFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
`

const AddOtherText = styled.span`
  color: #1a73e8;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`

const ToggleSwitch = styled.div`
  display: flex;
  align-items: center;
`

const Switch = styled.label`
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
  margin-left: 12px;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: .4s;
    border-radius: 34px;
  }

  span:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }

  input:checked + span {
    background-color: #1a73e8;
  }

  input:checked + span:before {
    transform: translateX(24px);
  }
`

const BulkOptionsTextarea = styled.textarea`
  width: 100%;
  min-height: 150px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 16px;
  font-size: 14px;
  resize: vertical;
`

const AddQuiz = () => {
  const [courses, setCourses] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState(null)
  const [sections, setSections] = useState([
    {
      title: "",
      description: "",
      questions: [
        {
          question: "",
          options: ["Option 1"],
          correctOption: 0,
          points: 0,
          required: true,
          questionType: "Multiple choice",
          questionImage: null,
        },
      ],
    },
  ])
  const [loading, setLoading] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showBulkOptions, setShowBulkOptions] = useState(false)
  const [bulkOptionsText, setBulkOptionsText] = useState("")
  const [currentEditingQuestion, setCurrentEditingQuestion] = useState({ sectionIndex: 0, questionIndex: 0 })

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev)

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "courses"))
        const coursesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          title: doc.data().title,
        }))
        setCourses(coursesData)
      } catch (error) {
        console.error("Error fetching courses:", error)
      }
    }
    fetchCourses()
  }, [])

  const addQuestion = (sectionIndex) => {
    const updatedSections = [...sections]
    updatedSections[sectionIndex].questions.push({
      question: "",
      options: ["Option 1"],
      correctOption: 0,
      points: 0,
      required: true,
      questionType: "Multiple choice",
      questionImage: null,
    })
    setSections(updatedSections)
  }

  const removeQuestion = (sectionIndex, questionIndex) => {
    const updatedSections = [...sections]
    updatedSections[sectionIndex].questions.splice(questionIndex, 1)
    setSections(updatedSections)
  }

  const duplicateQuestion = (sectionIndex, questionIndex) => {
    const updatedSections = [...sections]
    const questionToDuplicate = { ...updatedSections[sectionIndex].questions[questionIndex] }
    updatedSections[sectionIndex].questions.splice(questionIndex + 1, 0, questionToDuplicate)
    setSections(updatedSections)
  }

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
            points: 0,
            required: true,
            questionType: "Multiple choice",
            questionImage: null,
          },
        ],
      },
    ])
  }

  const removeSection = (sectionIndex) => {
    const updatedSections = [...sections]
    updatedSections.splice(sectionIndex, 1)
    setSections(updatedSections)
  }

  const addOption = (sectionIndex, questionIndex) => {
    const updatedSections = [...sections]
    const optionCount = updatedSections[sectionIndex].questions[questionIndex].options.length
    updatedSections[sectionIndex].questions[questionIndex].options.push(`Option ${optionCount + 1}`)
    setSections(updatedSections)
  }

  const addOtherOption = (sectionIndex, questionIndex) => {
    const updatedSections = [...sections]
    updatedSections[sectionIndex].questions[questionIndex].options.push("Other")
    setSections(updatedSections)
  }

  const handleOptionKeyPress = (e, sectionIndex, questionIndex) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addOption(sectionIndex, questionIndex)
    }
  }

  // Function to parse pasted options
  const parseOptions = (text) => {
    // Split by new lines
    const lines = text.split("\n").filter((line) => line.trim() !== "")
    // Check if the format matches lettered options (A., B., etc.)
    const letterPattern = /^([A-Z]\.|$$[A-Z]$$)\s+(.+)$/
    const numberedPattern = /^(\d+\.|$$\d+$$)\s+(.+)$/

    let parsedOptions = []

    // Try to match lettered pattern
    if (lines.every((line) => letterPattern.test(line.trim()))) {
      parsedOptions = lines.map((line) => {
        const match = line.trim().match(letterPattern)
        return match ? match[2] : line.trim()
      })
    }
    // Try to match numbered pattern
    else if (lines.every((line) => numberedPattern.test(line.trim()))) {
      parsedOptions = lines.map((line) => {
        const match = line.trim().match(numberedPattern)
        return match ? match[2] : line.trim()
      })
    }
    // If no pattern matches, just use the lines as is
    else {
      parsedOptions = lines
    }

    return parsedOptions
  }

  const handleBulkOptionsSubmit = () => {
    if (!bulkOptionsText.trim()) {
      setShowBulkOptions(false)
      return
    }

    const { sectionIndex, questionIndex } = currentEditingQuestion
    const parsedOptions = parseOptions(bulkOptionsText)

    if (parsedOptions.length > 0) {
      const updatedSections = [...sections]
      updatedSections[sectionIndex].questions[questionIndex].options = parsedOptions
      setSections(updatedSections)
    }

    setShowBulkOptions(false)
    setBulkOptionsText("")
  }

  // Function to handle option paste event
  const handleOptionPaste = (e, sectionIndex, questionIndex, optionIndex) => {
    // Get pasted text
    const pastedText = e.clipboardData.getData("text")
    // Check if it contains multiple lines (potential bulk options)
    if (pastedText.includes("\n")) {
      e.preventDefault() // Prevent default paste

      // If this is the first option and it's empty, replace it
      const currentOptions = sections[sectionIndex].questions[questionIndex].options
      if (optionIndex === 0 && currentOptions.length === 1 && currentOptions[0] === "Option 1") {
        const parsedOptions = parseOptions(pastedText)

        if (parsedOptions.length > 0) {
          const updatedSections = [...sections]
          updatedSections[sectionIndex].questions[questionIndex].options = parsedOptions
          setSections(updatedSections)
        }
      } else {
        // Show bulk options modal
        setCurrentEditingQuestion({ sectionIndex, questionIndex })
        setBulkOptionsText(pastedText)
        setShowBulkOptions(true)
      }
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (
      !selectedCourseId ||
      !title ||
      sections.some(
        (section) => !section.title || section.questions.some((q) => !q.question || q.options.some((opt) => !opt)),
      )
    ) {
      alert("Please fill all required fields and ensure each question has options.")
      return
    }

    try {
      setLoading(true)
      const courseDocRef = doc(db, "courses", selectedCourseId)
      const quizzesCollectionRef = collection(courseDocRef, "quizzes")

      const querySnapshot = await getDocs(quizzesCollectionRef)
      const newQuizId = (querySnapshot.size + 1).toString()

      await setDoc(doc(quizzesCollectionRef, newQuizId), {
        id: newQuizId,
        title,
        description,
        image,
        sections,
        createdAt: serverTimestamp(),
      })

      alert("Quiz added successfully!")
      setTitle("")
      setDescription("")
      setImage(null)
      setSections([
        {
          title: "",
          description: "",
          questions: [
            {
              question: "",
              options: ["Option 1"],
              correctOption: 0,
              points: 0,
              required: true,
              questionType: "Multiple choice",
              questionImage: null,
            },
          ],
        },
      ])
      setLoading(false)
    } catch (error) {
      console.error("Error adding quiz:", error)
      alert("An error occurred while adding the quiz.")
      setLoading(false)
    }
  }

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
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-4xl">
              <div className="flex items-center mb-6">
                <FaCloudUploadAlt className="text-green-500 text-3xl mr-3" />
                <h1 className="text-2xl font-bold">Create New Quiz</h1>
              </div>

              {/* Bulk Options Modal */}
              {showBulkOptions && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-md">
                    <h3 className="text-lg font-bold mb-4">Bulk Add Options</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Each line will be added as a separate option. Format like "A. Option 1" will be parsed
                      automatically.
                    </p>
                    <BulkOptionsTextarea
                      value={bulkOptionsText}
                      onChange={(e) => setBulkOptionsText(e.target.value)}
                      placeholder="A. Option 1&#10;B. Option 2&#10;C. Option 3&#10;D. Option 4"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="px-4 py-2 bg-gray-200 rounded-md"
                        onClick={() => setShowBulkOptions(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2 bg-blue-500 text-white rounded-md"
                        onClick={handleBulkOptionsSubmit}
                      >
                        Add Options
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <AccordionItem title="Step 1: Select Course" isOpen={true} toggle={() => {}}>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Select Course *</label>
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
                  <label className="block text-gray-700 text-sm font-bold mb-2">Quiz Title *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter quiz title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                  <label className="block text-gray-700 text-sm font-bold mb-2 mt-4">Quiz Description</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter quiz description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <label className="block text-gray-700 text-sm font-bold mb-2 mt-4">Quiz Image</label>
                  <div className="flex items-center">
                    <input
                      type="file"
                      id="quiz-image"
                      className="hidden"
                      onChange={(e) => setImage(e.target.files[0])}
                    />
                    <label
                      htmlFor="quiz-image"
                      className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded cursor-pointer hover:bg-gray-300"
                    >
                      <FaImage className="mr-2" />
                      {image ? "Change Image" : "Upload Image"}
                    </label>
                    {image && <span className="ml-3 text-sm text-gray-600">{image.name}</span>}
                  </div>
                </AccordionItem>

                {sections.map((section, sectionIndex) => (
                  <AccordionItem
                    key={sectionIndex}
                    title={`Section ${sectionIndex + 1}: ${section.title || "Untitled Section"}`}
                    isOpen={true}
                    toggle={() => {}}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">Section Title *</label>
                      {sections.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSection(sectionIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Enter section title"
                      value={section.title}
                      onChange={(e) => {
                        const updatedSections = [...sections]
                        updatedSections[sectionIndex].title = e.target.value
                        setSections(updatedSections)
                      }}
                      required
                    />
                    <label className="block text-gray-700 text-sm font-bold mb-2 mt-4">Section Description</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Enter section description"
                      value={section.description}
                      onChange={(e) => {
                        const updatedSections = [...sections]
                        updatedSections[sectionIndex].description = e.target.value
                        setSections(updatedSections)
                      }}
                    />

                    {/* Questions */}
                    <div className="mt-4">
                      {section.questions.map((question, questionIndex) => (
                        <QuestionCard key={questionIndex}>
                          <QuestionHeader>
                            <span className="text-gray-500">Question {questionIndex + 1}</span>
                            <button type="button" className="text-gray-500">
                              <FaEllipsisV />
                            </button>
                          </QuestionHeader>

                          <QuestionContent>
                            <div className="flex justify-between mb-4">
                              <input
                                type="text"
                                className="w-full px-3 py-2 border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                                placeholder="Question"
                                value={question.question}
                                onChange={(e) => {
                                  const updatedSections = [...sections]
                                  updatedSections[sectionIndex].questions[questionIndex].question = e.target.value
                                  setSections(updatedSections)
                                }}
                                required
                              />

                              <div className="flex items-center ml-4">
                                <button
                                  type="button"
                                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                                  onClick={() => {
                                    // Handle image upload
                                    const fileInput = document.createElement("input")
                                    fileInput.type = "file"
                                    fileInput.accept = "image/*"
                                    fileInput.onchange = (e) => {
                                      const updatedSections = [...sections]
                                      updatedSections[sectionIndex].questions[questionIndex].questionImage =
                                        e.target.files[0]
                                      setSections(updatedSections)
                                    }
                                    fileInput.click()
                                  }}
                                >
                                  <BsImage size={20} />
                                </button>

                                <div className="relative ml-2">
                                  <select
                                    className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-8 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    value={question.questionType}
                                    onChange={(e) => {
                                      const updatedSections = [...sections]
                                      updatedSections[sectionIndex].questions[questionIndex].questionType =
                                        e.target.value
                                      setSections(updatedSections)
                                    }}
                                  >
                                    <option>Multiple choice</option>
                                    <option>Short answer</option>
                                    <option>True/False</option>
                                  </select>
                                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <svg
                                      className="fill-current h-4 w-4"
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Display image if uploaded */}
                            {question.questionImage && (
                              <div className="mb-4">
                                <div className="relative w-full h-32 bg-gray-100 rounded-md overflow-hidden">
                                  <img
                                    src={URL.createObjectURL(question.questionImage) || "/placeholder.svg"}
                                    alt="Question"
                                    className="w-full h-full object-contain"
                                  />
                                  <button
                                    type="button"
                                    className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md"
                                    onClick={() => {
                                      const updatedSections = [...sections]
                                      updatedSections[sectionIndex].questions[questionIndex].questionImage = null
                                      setSections(updatedSections)
                                    }}
                                  >
                                    <FaTrash size={12} />
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Options */}
                            {question.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center mb-3">
                                <input
                                  type="radio"
                                  name={`question-${sectionIndex}-${questionIndex}`}
                                  checked={question.correctOption === optionIndex}
                                  onChange={() => {
                                    const updatedSections = [...sections]
                                    updatedSections[sectionIndex].questions[questionIndex].correctOption = optionIndex
                                    setSections(updatedSections)
                                  }}
                                  className="mr-2"
                                />
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    className="w-full border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 text-blue-600 underline"
                                    value={option}
                                    onChange={(e) => {
                                      const updatedSections = [...sections]
                                      updatedSections[sectionIndex].questions[questionIndex].options[optionIndex] =
                                        e.target.value
                                      setSections(updatedSections)
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
                                      const updatedSections = [...sections]
                                      updatedSections[sectionIndex].questions[questionIndex].options.splice(
                                        optionIndex,
                                        1,
                                      )
                                      if (question.correctOption >= optionIndex && question.correctOption > 0) {
                                        updatedSections[sectionIndex].questions[questionIndex].correctOption--
                                      }
                                      setSections(updatedSections)
                                    }}
                                    className="ml-2 text-red-500 hover:text-red-700"
                                  >
                                    <FaTrash size={14} />
                                  </button>
                                )}
                              </div>
                            ))}

                            <div className="flex items-center mt-2">
                              <input type="radio" disabled className="mr-2 opacity-50" />
                              <span className="text-gray-600">Add option or </span>
                              <AddOtherText
                                className="ml-1"
                                onClick={() => addOtherOption(sectionIndex, questionIndex)}
                              >
                                add "Other"
                              </AddOtherText>
                            </div>

                            {/* Bulk Options Button */}
                            <div className="mt-3">
                              <button
                                type="button"
                                className="text-blue-600 text-sm hover:underline"
                                onClick={() => {
                                  setCurrentEditingQuestion({ sectionIndex, questionIndex })
                                  setShowBulkOptions(true)
                                }}
                              >
                                Bulk add options
                              </button>
                              <span className="text-gray-500 text-xs ml-2">
                                (Paste formatted options like "A. Option 1")
                              </span>
                            </div>
                          </QuestionContent>

                          <QuestionFooter>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id={`answer-key-${sectionIndex}-${questionIndex}`}
                                className="mr-2"
                                checked={true} // Always checked since we're using it for the answer key
                                readOnly
                              />
                              <label
                                htmlFor={`answer-key-${sectionIndex}-${questionIndex}`}
                                className="text-blue-600 font-medium"
                              >
                                Answer key
                              </label>
                              <span className="text-gray-500 ml-2">({question.points} points)</span>
                              <input
                                type="number"
                                min="0"
                                className="ml-2 w-12 border border-gray-300 rounded px-1"
                                value={question.points}
                                onChange={(e) => {
                                  const updatedSections = [...sections]
                                  updatedSections[sectionIndex].questions[questionIndex].points =
                                    Number.parseInt(e.target.value) || 0
                                  setSections(updatedSections)
                                }}
                              />
                            </div>

                            <div className="flex items-center">
                              <button
                                type="button"
                                onClick={() => duplicateQuestion(sectionIndex, questionIndex)}
                                className="mr-3 text-gray-500 hover:text-gray-700"
                              >
                                <FaCopy />
                              </button>

                              <button
                                type="button"
                                onClick={() => removeQuestion(sectionIndex, questionIndex)}
                                className="mr-3 text-gray-500 hover:text-gray-700"
                              >
                                <FaTrash />
                              </button>

                              <ToggleSwitch>
                                <span className="text-gray-700">Required</span>
                                <Switch>
                                  <input
                                    type="checkbox"
                                    checked={question.required}
                                    onChange={() => {
                                      const updatedSections = [...sections]
                                      updatedSections[sectionIndex].questions[questionIndex].required =
                                        !question.required
                                      setSections(updatedSections)
                                    }}
                                  />
                                  <span></span>
                                </Switch>
                              </ToggleSwitch>
                            </div>
                          </QuestionFooter>
                        </QuestionCard>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => addQuestion(sectionIndex)}
                      className="mt-4 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 flex items-center"
                    >
                      <FaPlus className="mr-2" />
                      Add Another Question
                    </button>
                  </AccordionItem>
                ))}

                <button
                  type="button"
                  onClick={addSection}
                  className="mt-4 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 flex items-center"
                >
                  <FaPlus className="mr-2" />
                  Add Another Section
                </button>

                <div className="mt-6 flex justify-center">
                  <button
                    type="submit"
                    className={`bg-green-500 text-white py-2 px-6 rounded-md hover:bg-green-600 flex items-center ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "Create Quiz"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </MainContent>
      </ContentContainer>
    </PageContainer>
  )
}

export default AddQuiz
