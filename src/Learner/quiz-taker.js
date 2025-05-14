"use client"

import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useAuthState } from "react-firebase-hooks/auth"
import { collection, doc, getDoc, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore"
import { auth, db } from "../firebase.config"
import { FaArrowLeft, FaCheck, FaTimes, FaSpinner, FaClipboardList, FaRedo, FaTrophy } from "react-icons/fa"
import styled from "styled-components"

// Styled components
const QuizContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`

const QuestionCard = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  }
`

const OptionButton = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  text-align: left;
  padding: 1rem;
  margin: 0.5rem 0;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background-color: white;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    background-color: #f7fafc;
  }

  &.selected {
    border-color: #4c1d95;
    background-color: #ede9fe;
  }

  &.correct {
    border-color: #10b981;
    background-color: #d1fae5;
  }

  &.incorrect {
    border-color: #ef4444;
    background-color: #fee2e2;
  }

  &.user-selected {
    border-width: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`

const OptionLabel = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #e2e8f0;
  margin-right: 1rem;
  font-weight: 600;
`

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background-color: #e2e8f0;
  border-radius: 4px;
  margin: 1.5rem 0;
  overflow: hidden;
`

const ProgressFill = styled.div`
  height: 100%;
  background-color: #4c1d95;
  border-radius: 4px;
  transition: width 0.3s ease;
`

const ResultCard = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  margin-top: 2rem;
  border: 1px solid #e2e8f0;
  text-align: center;
`

const PerfectScoreCard = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  border: 1px solid #e2e8f0;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`

const QuizTaker = () => {
  const [user] = useAuthState(auth)
  const navigate = useNavigate()
  const searchParams = useSearchParams()[0]

  const courseId = searchParams.get("courseId")
  const quizId = searchParams.get("quizId")
  const mode = searchParams.get("mode") || "take" // "take" or "review"

  const [loading, setLoading] = useState(true)
  const [quiz, setQuiz] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0, points: 0, totalPoints: 0 })
  const [allQuestions, setAllQuestions] = useState([])
  const [savingScore, setSavingScore] = useState(false)
  const [userType, setUserType] = useState("learner") // Default to learner, will check if intern
  const [previousScore, setPreviousScore] = useState(null)
  const [quizAttempts, setQuizAttempts] = useState(0)
  const [showPerfectScore, setShowPerfectScore] = useState(false) // New state for perfect score demo

  // Flatten all questions from all sections into a single array for easier navigation
  useEffect(() => {
    const fetchQuiz = async () => {
      if (!courseId || !quizId || !user) return

      try {
        setLoading(true)

        // Check if user is an intern or learner
        const internRef = doc(db, "intern", user.uid)
        const internDoc = await getDoc(internRef)

        if (internDoc.exists()) {
          setUserType("intern")
        } else {
          setUserType("learner")
        }

        // Fetch quiz data
        const quizRef = doc(db, "courses", courseId, "quizzes", quizId)
        const quizDoc = await getDoc(quizRef)

        if (!quizDoc.exists()) {
          console.error("Quiz not found")
          navigate(`/lmodules/${courseId}`)
          return
        }

        const quizData = quizDoc.data()
        setQuiz(quizData)

        // Flatten all questions from all sections
        const questions = []
        quizData.sections.forEach((section) => {
          section.questions.forEach((question) => {
            questions.push({
              ...question,
              sectionTitle: section.title,
            })
          })
        })

        setAllQuestions(questions)

        // If in review mode, fetch previous score
        if (mode === "review") {
          const scoresCollection = collection(db, userType, user.uid, "course score")
          const q = query(scoresCollection, where("courseId", "==", courseId), where("quizId", "==", quizId))

          const scoresSnapshot = await getDocs(q)
          if (!scoresSnapshot.empty) {
            const scoreData = scoresSnapshot.docs[0].data()
            setPreviousScore(scoreData)

            // Get the number of attempts
            setQuizAttempts(scoreData.attempts || 1)

            // Pre-fill selected options from previous attempt
            if (scoreData.answers) {
              // Convert the answers format from the database to our format
              const formattedAnswers = {}
              Object.entries(scoreData.answers).forEach(([key, value]) => {
                // The key might be in format "0-0", "0-1", etc.
                // Extract just the question index (second number)
                const questionIndex = Number.parseInt(key.split("-")[1] || key)
                formattedAnswers[questionIndex] = value
              })
              setSelectedOptions(formattedAnswers)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching quiz:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchQuiz()
  }, [courseId, quizId, user, navigate, mode])

  const handleOptionSelect = (questionIndex, optionIndex) => {
    if (quizSubmitted) return

    setSelectedOptions((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }))
  }

  const calculateScore = () => {
    let correctCount = 0
    let totalPoints = 0
    let earnedPoints = 0

    allQuestions.forEach((question, index) => {
      const selectedOption = selectedOptions[index]
      const correctOption = question.correctOption

      // Add to total points
      totalPoints += question.points || 0

      // Check if answer is correct
      if (selectedOption === correctOption) {
        correctCount++
        earnedPoints += question.points || 0
      }
    })

    const scoreData = {
      correct: correctCount,
      total: allQuestions.length,
      points: earnedPoints,
      totalPoints: totalPoints,
      percentage: Math.round((earnedPoints / totalPoints) * 100) || 0,
      passed: earnedPoints / totalPoints >= 0.7, // Pass threshold is 70%
    }

    setScore(scoreData)
    return scoreData
  }

  const handleSubmitQuiz = async () => {
    if (quizSubmitted) return

    // Calculate score
    const scoreData = calculateScore()
    setQuizSubmitted(true)

    // Save score to Firestore
    try {
      setSavingScore(true)

      const scoreToSave = {
        userId: user.uid,
        courseId,
        quizId,
        quizTitle: quiz.title,
        score: scoreData.points,
        totalPoints: scoreData.totalPoints,
        percentage: scoreData.percentage,
        correct: scoreData.correct,
        total: scoreData.total,
        totalQuestions: allQuestions.length,
        correctAnswers: scoreData.correct,
        passed: scoreData.passed,
        completedAt: serverTimestamp(),
        answers: selectedOptions, // Store user's answers
        attempts: quizAttempts + 1, // Increment attempts count
      }

      // Save to the appropriate collection based on user type
      await addDoc(collection(db, userType, user.uid, "course score"), scoreToSave)
    } catch (error) {
      console.error("Error saving quiz score:", error)
    } finally {
      setSavingScore(false)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  const getCurrentQuestion = () => {
    return allQuestions[currentQuestionIndex]
  }

  const isQuestionAnswered = (questionIndex) => {
    return selectedOptions[questionIndex] !== undefined
  }

  const isQuizComplete = () => {
    return allQuestions.length > 0 && Object.keys(selectedOptions).length === allQuestions.length
  }

  // Function to show perfect score demo
  const showPerfectScoreDemo = () => {
    setShowPerfectScore(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <FaSpinner className="animate-spin text-4xl text-purple-700" />
        <span className="ml-2 text-xl">Loading quiz...</span>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-red-600">Quiz not found</h2>
        <p className="mt-2 text-gray-600">The quiz you're looking for doesn't exist or you don't have access to it.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800"
        >
          <FaArrowLeft className="inline mr-2" /> Back to Course
        </button>
      </div>
    )
  }

  const currentQuestion = getCurrentQuestion()
  const isReviewMode = mode === "review"

  // Perfect score demo view
  if (showPerfectScore) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900">
              <FaArrowLeft className="mr-2" /> Back to Course
            </button>
            <div className="text-right">
              <h2 className="text-xl font-bold">AIA Philippines Orientation Quiz</h2>
              <p className="text-sm text-gray-500">Quiz Mode</p>
            </div>
          </div>

          <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
            <span>Question 5 of 5</span>
            <span>5 of 5 answered</span>
          </div>
          <div className="h-2 w-full bg-purple-600 rounded-full mb-8"></div>

          <PerfectScoreCard>
            <div className="text-7xl font-bold mb-4 text-purple-600">100%</div>
            <h3 className="text-3xl font-bold mb-6">Congratulations!</h3>
            <p className="text-lg text-gray-700 mb-8">You scored 7 out of 7 points (5 of 5 questions correct)</p>
            <div className="inline-block px-6 py-2 rounded-full text-base font-medium mb-8 bg-green-100 text-green-800">
              <FaCheck className="inline mr-2" /> Passed
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
              <button
                onClick={() => setShowPerfectScore(false)}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center"
              >
                <FaClipboardList className="mr-2" /> Review Answers
              </button>
              <button
                onClick={() => navigate(-1)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center justify-center"
              >
                <FaArrowLeft className="mr-2" /> Back to Course
              </button>
            </div>
          </PerfectScoreCard>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <QuizContainer>
        {/* Quiz Header */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900">
            <FaArrowLeft className="mr-2" /> Back to Course
          </button>

          <div className="text-right">
            <h2 className="text-xl font-bold">{quiz.title}</h2>
            <p className="text-sm text-gray-500">{isReviewMode ? "Review Mode" : "Quiz Mode"}</p>
          </div>
        </div>

        {/* Demo Button */}
        <div className="mb-4">
          <button
            onClick={showPerfectScoreDemo}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center"
          >
            <FaTrophy className="mr-2" /> Show Perfect Score Demo
          </button>
        </div>

        {/* Quiz Progress */}
        <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
          <span>
            Question {currentQuestionIndex + 1} of {allQuestions.length}
          </span>
          <span>
            {Object.keys(selectedOptions).length} of {allQuestions.length} answered
          </span>
        </div>
        <ProgressBar>
          <ProgressFill style={{ width: `${(Object.keys(selectedOptions).length / allQuestions.length) * 100}%` }} />
        </ProgressBar>

        {/* Question Display */}
        {!quizSubmitted ? (
          <>
            <QuestionCard>
              <div className="text-sm text-gray-500 mb-2">{currentQuestion?.sectionTitle || "Question"}</div>
              <h3 className="text-xl font-semibold mb-4">{currentQuestion?.question}</h3>

              {/* Question Image if available */}
              {currentQuestion?.questionImage && (
                <div className="mb-4">
                  <img
                    src={currentQuestion.questionImage || "/placeholder.svg"}
                    alt="Question"
                    className="max-w-full rounded-lg"
                  />
                </div>
              )}

              {/* Points display */}
              <div className="text-sm text-gray-500 mb-4">Points: {currentQuestion?.points || 0}</div>

              {/* Options */}
              <div className="space-y-2">
                {currentQuestion?.options.map((option, optionIndex) => {
                  const isSelected = selectedOptions[currentQuestionIndex] === optionIndex
                  const isCorrect = currentQuestion.correctOption === optionIndex
                  const isUserIncorrect = isReviewMode && isSelected && !isCorrect

                  let className = ""
                  if (quizSubmitted || isReviewMode) {
                    if (isCorrect) className = "correct"
                    if (isUserIncorrect) className = "incorrect"
                    if (isSelected) className += " user-selected"
                  } else if (isSelected) {
                    className = "selected"
                  }

                  return (
                    <OptionButton
                      key={optionIndex}
                      className={className}
                      onClick={() => handleOptionSelect(currentQuestionIndex, optionIndex)}
                      disabled={isReviewMode || quizSubmitted}
                    >
                      <OptionLabel>{String.fromCharCode(65 + optionIndex)}</OptionLabel>
                      <span>{option}</span>
                      {(quizSubmitted || isReviewMode) && (
                        <div className="ml-auto flex items-center">
                          {isCorrect && <FaCheck className="text-green-600 ml-2" />}
                          {isUserIncorrect && <FaTimes className="text-red-600 ml-2" />}
                        </div>
                      )}
                    </OptionButton>
                  )
                })}
              </div>
            </QuestionCard>

            {/* Review Mode Legend */}
            {(isReviewMode || quizSubmitted) && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                <h4 className="font-medium mb-2">Legend:</h4>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-100 border border-green-500 rounded mr-2"></div>
                    <span>Correct Answer</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-100 border border-red-500 rounded mr-2"></div>
                    <span>Your Incorrect Answer</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-purple-500 rounded mr-2"></div>
                    <span>Your Selected Answer</span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <button
                onClick={handlePrevQuestion}
                disabled={currentQuestionIndex === 0}
                className={`px-4 py-2 rounded-lg ${
                  currentQuestionIndex === 0
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Previous
              </button>

              {currentQuestionIndex < allQuestions.length - 1 ? (
                <button
                  onClick={handleNextQuestion}
                  className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={!isQuizComplete() || isReviewMode}
                  className={`px-6 py-2 rounded-lg ${
                    !isQuizComplete() || isReviewMode
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {savingScore ? (
                    <>
                      <FaSpinner className="inline animate-spin mr-2" /> Submitting...
                    </>
                  ) : (
                    "Submit Quiz"
                  )}
                </button>
              )}
            </div>

            {/* Question Navigation */}
            <div className="mt-8">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Question Navigation</h4>
              <div className="flex flex-wrap gap-2">
                {allQuestions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium
                      ${currentQuestionIndex === index ? "bg-purple-700 text-white" : ""}
                      ${isQuestionAnswered(index) ? "bg-green-100 border border-green-500" : "bg-gray-100"}
                    `}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          // Quiz Results
          <div className="animate-fadeIn">
            <ResultCard>
              <div className="text-5xl font-bold mb-4 text-purple-700">{score.percentage}%</div>

              <h3 className="text-2xl font-bold mb-2">{score.passed ? "Congratulations!" : "Quiz Completed"}</h3>

              <p className="text-gray-600 mb-6">
                You scored {score.points} out of {score.totalPoints} points ({score.correct} of {score.total} questions
                correct)
              </p>

              <div
                className={`inline-block px-4 py-2 rounded-full text-sm font-medium mb-6
                ${score.passed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
              `}
              >
                {score.passed ? (
                  <>
                    <FaCheck className="inline mr-1" /> Passed
                  </>
                ) : (
                  <>
                    <FaTimes className="inline mr-1" /> Failed
                  </>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
                <button
                  onClick={() => {
                    setQuizSubmitted(false)
                    setCurrentQuestionIndex(0)
                  }}
                  className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 flex items-center justify-center"
                >
                  <FaClipboardList className="mr-2" /> Review Answers
                </button>

                <button
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center justify-center"
                >
                  <FaArrowLeft className="mr-2" /> Back to Course
                </button>

                {!score.passed && quizAttempts === 0 && (
                  <button
                    onClick={() => {
                      // Reset the quiz to take it again
                      setSelectedOptions({})
                      setQuizSubmitted(false)
                      setCurrentQuestionIndex(0)
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
                  >
                    <FaRedo className="mr-2" /> Retake Quiz
                    <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      1 attempt left
                    </span>
                  </button>
                )}
              </div>
            </ResultCard>
          </div>
        )}

        {/* Review Mode - Show previous score and retake button if available */}
        {isReviewMode && previousScore && !quizSubmitted && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <div>
                <h3 className="font-medium mb-2">Your Previous Score</h3>
                <div className="flex gap-4">
                  <span>Score: {previousScore.percentage}%</span>
                  <span className={`font-medium ${previousScore.passed ? "text-green-600" : "text-red-600"}`}>
                    {previousScore.passed ? "Passed" : "Failed"}
                  </span>
                </div>
              </div>

              {quizAttempts === 1 && (
                <button
                  onClick={() => {
                    // Navigate to take mode to retake the quiz
                    navigate(`/quiz-taker?courseId=${courseId}&quizId=${quizId}&mode=take`)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center mt-4 sm:mt-0"
                >
                  <FaRedo className="mr-2" /> Retake Quiz
                  <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                    1 attempt left
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
      </QuizContainer>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}

export default QuizTaker
