"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db } from "../firebase.config"
import { FaArrowLeft, FaCheck, FaChevronLeft, FaChevronRight, FaClipboardCheck, FaTimes } from "react-icons/fa"
import styled from "styled-components"

const MainContent = styled.div`
  flex: 1;
  padding: 2rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  max-width: 1000px;
  margin: 0 auto;
`

const QuizTaker = () => {
  const [user] = useAuthState(auth)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [quiz, setQuiz] = useState(null)
  const [courseData, setCourseData] = useState(null)
  const [currentSection, setCurrentSection] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizResults, setQuizResults] = useState(null)
  const [showResults, setShowResults] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Get query parameters
  const queryParams = new URLSearchParams(window.location.search)
  const courseId = queryParams.get("courseId")
  const quizId = queryParams.get("quizId")

  useEffect(() => {
    if (!courseId || !quizId || !user) {
      console.error("Missing required parameters:", { courseId, quizId, user: !!user })
      navigate("/")
      return
    }

    const fetchQuizData = async () => {
      try {
        setLoading(true)
        console.log("Fetching quiz data for courseId:", courseId, "quizId:", quizId)

        // Fetch course data
        const courseDoc = doc(db, "courses", courseId)
        const courseSnapshot = await getDoc(courseDoc)

        if (!courseSnapshot.exists()) {
          console.error("Course not found")
          navigate("/")
          return
        }

        setCourseData(courseSnapshot.data())
        console.log("Course data fetched:", courseSnapshot.data())

        // Fetch quiz data
        const quizDoc = doc(db, "courses", courseId, "quizzes", quizId)
        const quizSnapshot = await getDoc(quizDoc)

        if (!quizSnapshot.exists()) {
          console.error("Quiz not found")
          navigate("/")
          return
        }

        const quizData = quizSnapshot.data()
        console.log("Quiz data fetched:", quizData)

        // Make sure sections exist, if not, create a default structure
        if (!quizData.sections || !Array.isArray(quizData.sections) || quizData.sections.length === 0) {
          console.warn("Quiz has no sections, creating default structure")
          // If the quiz doesn't have sections, create a default structure
          quizData.sections = [
            {
              title: "Quiz Questions",
              questions: [],
            },
          ]

          // If there are questions directly in the quiz object, move them to the default section
          if (quizData.questions && Array.isArray(quizData.questions)) {
            quizData.sections[0].questions = quizData.questions
          }
        }

        setQuiz(quizData)

        // Initialize answers object
        const initialAnswers = {}
        quizData.sections.forEach((section, sectionIndex) => {
          if (section.questions && Array.isArray(section.questions)) {
            section.questions.forEach((question, questionIndex) => {
              initialAnswers[`${sectionIndex}-${questionIndex}`] = null
            })
          }
        })

        setAnswers(initialAnswers)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching quiz data:", error)
        setLoading(false)
      }
    }

    fetchQuizData()
  }, [courseId, quizId, user, navigate])

  const handleAnswerSelect = (questionKey, optionIndex) => {
    setAnswers({
      ...answers,
      [questionKey]: optionIndex,
    })
  }

  const goToNextQuestion = () => {
    if (!quiz || !quiz.sections || quiz.sections.length === 0) return

    const currentSectionQuestions = quiz.sections[currentSection]?.questions || []

    if (currentQuestion < currentSectionQuestions.length - 1) {
      // Go to next question in current section
      setCurrentQuestion(currentQuestion + 1)
    } else if (currentSection < quiz.sections.length - 1) {
      // Go to first question of next section
      setCurrentSection(currentSection + 1)
      setCurrentQuestion(0)
    }
  }

  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      // Go to previous question in current section
      setCurrentQuestion(currentQuestion - 1)
    } else if (currentSection > 0) {
      // Go to last question of previous section
      setCurrentSection(currentSection - 1)
      const previousSectionQuestions = quiz.sections[currentSection - 1]?.questions || []
      setCurrentQuestion(previousSectionQuestions.length - 1)
    }
  }

  const calculateResults = () => {
    if (!quiz || !quiz.sections)
      return { score: 0, totalPoints: 0, percentage: 0, correctAnswers: 0, totalQuestions: 0, passed: false }

    let totalPoints = 0
    let earnedPoints = 0
    let correctAnswers = 0
    let totalQuestions = 0

    quiz.sections.forEach((section, sectionIndex) => {
      if (!section.questions) return

      section.questions.forEach((question, questionIndex) => {
        const questionKey = `${sectionIndex}-${questionIndex}`
        const userAnswer = answers[questionKey]
        const correctOption = question.correctOption
        const points = question.points || 1 // Default to 1 point if not specified

        totalPoints += points
        totalQuestions++

        if (userAnswer === correctOption) {
          earnedPoints += points
          correctAnswers++
        }
      })
    })

    const percentage = Math.round((earnedPoints / totalPoints) * 100) || 0
    const passed = percentage >= 70 // Assuming 70% is passing score

    return {
      score: earnedPoints,
      totalPoints,
      percentage,
      correctAnswers,
      totalQuestions,
      passed,
    }
  }

  const submitQuiz = async () => {
    if (submitting) return

    try {
      setSubmitting(true)

      // Calculate results
      const results = calculateResults()
      setQuizResults(results)

      // Save results to Firestore
      if (user) {
        const scoreData = {
          userId: user.uid,
          courseId,
          quizId,
          quizTitle: quiz.title,
          score: results.score,
          totalPoints: results.totalPoints,
          percentage: results.percentage,
          correctAnswers: results.correctAnswers,
          totalQuestions: results.totalQuestions,
          passed: results.passed,
          answers,
          completedAt: serverTimestamp(),
        }

        // Add to user's course score collection
        await addDoc(collection(db, "learner", user.uid, "course score"), scoreData)
        console.log("Quiz results saved to Firestore in course score collection")
      }

      setQuizSubmitted(true)
      setShowResults(true)
      setSubmitting(false)
    } catch (error) {
      console.error("Error submitting quiz:", error)
      setSubmitting(false)
    }
  }

  const getTotalQuestions = () => {
    if (!quiz || !quiz.sections) return 0

    return quiz.sections.reduce((total, section) => {
      return total + (section.questions ? section.questions.length : 0)
    }, 0)
  }

  const getCurrentQuestionNumber = () => {
    if (!quiz || !quiz.sections) return 0

    let questionNumber = 1

    for (let i = 0; i < currentSection; i++) {
      questionNumber += quiz.sections[i]?.questions?.length || 0
    }

    return questionNumber + currentQuestion
  }

  const getAnsweredQuestionsCount = () => {
    return Object.values(answers).filter((answer) => answer !== null).length
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <MainContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </MainContent>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <MainContent>
          <div className="text-center p-8">
            <h2 className="text-xl font-semibold">Quiz not found</h2>
            <button
              onClick={() => navigate(`/lmodules/${courseId}`)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Back to Course
            </button>
          </div>
        </MainContent>
      </div>
    )
  }

  // If showing results
  if (showResults && quizResults) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <MainContent>
          <div className="mb-6">
            <button
              onClick={() => navigate(`/lmodules/${courseId}`)}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <FaArrowLeft className="mr-2" /> Back to Course
            </button>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">{quiz.title}</h1>
            <p className="text-gray-600">{courseData?.title}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden border-t-8 border-blue-600">
            <div className="p-6">
              <div className="flex items-center justify-center mb-6">
                <div
                  className={`h-24 w-24 rounded-full flex items-center justify-center ${
                    quizResults.passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                  }`}
                >
                  {quizResults.passed ? <FaCheck className="text-4xl" /> : <FaTimes className="text-4xl" />}
                </div>
              </div>

              <h2 className="text-2xl font-bold text-center mb-2">
                {quizResults.passed ? "Congratulations!" : "Quiz Completed"}
              </h2>

              <p className="text-center text-gray-600 mb-6">
                {quizResults.passed
                  ? "You've successfully passed the quiz!"
                  : "You didn't pass this time, but you can try again."}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-600">{quizResults.percentage}%</div>
                  <div className="text-sm text-gray-500">Score</div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {quizResults.score}/{quizResults.totalPoints}
                  </div>
                  <div className="text-sm text-gray-500">Points</div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-600">{quizResults.correctAnswers}</div>
                  <div className="text-sm text-gray-500">Correct Answers</div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-600">{quizResults.totalQuestions}</div>
                  <div className="text-sm text-gray-500">Total Questions</div>
                </div>
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    setShowResults(false)
                    setCurrentSection(0)
                    setCurrentQuestion(0)
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Review Answers
                </button>

                <button
                  onClick={() => navigate(`/lmodules/${courseId}`)}
                  className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Back to Course
                </button>
              </div>
            </div>
          </div>
        </MainContent>
      </div>
    )
  }

  // Get current question data
  const currentSectionData = quiz.sections[currentSection] || { questions: [] }
  const currentQuestionData =
    currentSectionData.questions && currentSectionData.questions[currentQuestion]
      ? currentSectionData.questions[currentQuestion]
      : { question: "Question not found", options: [], correctOption: 0 }
  const questionKey = `${currentSection}-${currentQuestion}`
  const selectedAnswer = answers[questionKey]
  const isReview = quizSubmitted
  const isCorrect = isReview && selectedAnswer === currentQuestionData.correctOption

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <MainContent>
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => navigate(`/lmodules/${courseId}`)}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <FaArrowLeft className="mr-2" /> Back to Course
          </button>

          <div className="text-gray-600">
            Question {getCurrentQuestionNumber()} of {getTotalQuestions()}
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{quiz.title}</h1>
          <p className="text-gray-600">{courseData?.title}</p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${(getAnsweredQuestionsCount() / getTotalQuestions()) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>
              Progress: {getAnsweredQuestionsCount()}/{getTotalQuestions()} questions answered
            </span>
            {!quizSubmitted && (
              <span>{Math.round((getAnsweredQuestionsCount() / getTotalQuestions()) * 100)}% complete</span>
            )}
          </div>
        </div>

        {/* Section title */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-700">
            Section: {currentSectionData.title || `Section ${currentSection + 1}`}
          </h2>
        </div>

        {/* Question */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-medium">{currentQuestionData.question}</h3>
            {isReview && (
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                {isCorrect ? "Correct" : "Incorrect"}
              </div>
            )}
          </div>

          {currentQuestionData.questionImage && (
            <div className="mb-4">
              <img
                src={currentQuestionData.questionImage || "/placeholder.svg"}
                alt="Question"
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          )}

          <div className="mt-6 space-y-3">
            {currentQuestionData.options &&
              currentQuestionData.options.map((option, optionIndex) => (
                <div
                  key={optionIndex}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedAnswer === optionIndex
                      ? isReview
                        ? isCorrect
                          ? "border-green-500 bg-green-50"
                          : "border-red-500 bg-red-50"
                        : "border-blue-500 bg-blue-50"
                      : isReview && currentQuestionData.correctOption === optionIndex
                        ? "border-green-500 bg-green-50"
                        : "border-gray-300 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                  onClick={() => {
                    if (!quizSubmitted) {
                      handleAnswerSelect(questionKey, optionIndex)
                    }
                  }}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-6 h-6 flex items-center justify-center rounded-full mr-3 ${
                        selectedAnswer === optionIndex
                          ? isReview
                            ? isCorrect
                              ? "bg-green-500 text-white"
                              : "bg-red-500 text-white"
                            : "bg-blue-500 text-white"
                          : isReview && currentQuestionData.correctOption === optionIndex
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {String.fromCharCode(65 + optionIndex)}
                    </div>
                    <span className="flex-1">{option}</span>
                    {isReview && (
                      <div className="ml-2">
                        {optionIndex === currentQuestionData.correctOption && <FaCheck className="text-green-500" />}
                        {selectedAnswer === optionIndex && optionIndex !== currentQuestionData.correctOption && (
                          <FaTimes className="text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>

          {isReview && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="font-medium text-blue-800 mb-1">Answer Explanation</div>
              <div className="text-gray-700">
                {currentQuestionData.explanation ||
                  `The correct answer is option ${String.fromCharCode(65 + currentQuestionData.correctOption)}: 
                  ${currentQuestionData.options[currentQuestionData.correctOption]}`}
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between">
          <button
            onClick={goToPreviousQuestion}
            disabled={currentSection === 0 && currentQuestion === 0}
            className={`px-4 py-2 rounded-lg flex items-center ${
              currentSection === 0 && currentQuestion === 0
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            <FaChevronLeft className="mr-2" /> Previous
          </button>

          <div>
            {!quizSubmitted ? (
              <button
                onClick={submitQuiz}
                disabled={submitting || Object.values(answers).some((a) => a === null)}
                className={`px-6 py-2 rounded-lg flex items-center ${
                  submitting || Object.values(answers).some((a) => a === null)
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <FaClipboardCheck className="mr-2" /> Submit Quiz
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => setShowResults(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                View Results <FaChevronRight className="ml-2" />
              </button>
            )}
          </div>

          <button
            onClick={goToNextQuestion}
            disabled={
              currentSection === quiz.sections.length - 1 &&
              currentQuestion === quiz.sections[currentSection].questions.length - 1
            }
            className={`px-4 py-2 rounded-lg flex items-center ${
              currentSection === quiz.sections.length - 1 &&
              currentQuestion === quiz.sections[currentSection].questions.length - 1
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            Next <FaChevronRight className="ml-2" />
          </button>
        </div>
      </MainContent>
    </div>
  )
}

export default QuizTaker
