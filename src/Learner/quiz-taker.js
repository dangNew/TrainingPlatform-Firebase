"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db } from "../firebase.config"
import {
  FaArrowLeft,
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaClipboardCheck,
  FaTimes,
  FaLightbulb,
  FaRegClock,
  FaTrophy,
} from "react-icons/fa"
import styled from "styled-components"

// Styled components with improved design
const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 2rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`

const MainContent = styled.div`
  flex: 1;
  padding: 2.5rem;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  max-width: 1000px;
  margin: 0 auto;
  width: 100%;
  position: relative;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
`

const QuizHeader = styled.div`
  position: relative;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
`

const QuizTitle = styled.h1`
  font-size: 2.25rem;
  font-weight: 700;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-align: center;
  margin-bottom: 0.5rem;
`

const QuizSubtitle = styled.p`
  text-align: center;
  color: #6b7280;
  font-size: 1.1rem;
`

const ProgressBarContainer = styled.div`
  margin: 2rem 0;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`

const QuestionCard = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 2rem;
  margin-bottom: 2rem;
  border-left: 5px solid #6366f1;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }
`

const QuestionText = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
  line-height: 1.5;
`

const OptionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.5rem;
`

const NavigationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
`

const ResultsContainer = styled.div`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  margin-top: 1rem;
`

const ResultsHeader = styled.div`
  background: linear-gradient(90deg, #3b82f6, #4f46e5);
  padding: 2rem;
  color: white;
  text-align: center;
`

const ResultsBody = styled.div`
  padding: 2rem;
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin: 2rem 0;
`

const StatCard = styled.div`
  background: #f9fafb;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`

const ScoreSummary = styled.div`
  background: linear-gradient(to right, #4f46e5, #7c3aed);
  color: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
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
  const [correctAnswersMap, setCorrectAnswersMap] = useState({})
  const [previousScoreData, setPreviousScoreData] = useState(null)

  // Get query parameters
  const queryParams = new URLSearchParams(window.location.search)
  const courseId = queryParams.get("courseId")
  const quizId = queryParams.get("quizId")
  const mode = queryParams.get("mode")
  const isReviewMode = mode === "review"

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

        // Set correct answers map immediately after fetching quiz data
        const correctAnswers = {}
        quizData.sections.forEach((section, sectionIndex) => {
          if (section.questions && Array.isArray(section.questions)) {
            section.questions.forEach((question, questionIndex) => {
              correctAnswers[`${sectionIndex}-${questionIndex}`] = question.correctOption
            })
          }
        })
        setCorrectAnswersMap(correctAnswers)
        console.log("Correct answers map:", correctAnswers)

        // Check if user has already completed this quiz (even if not in review mode)
        if (user) {
          try {
            // Try to fetch from learner collection first
            let scoresCollection = collection(db, "learner", user.uid, "course score")
            let scoresQuery = query(
              scoresCollection,
              where("courseId", "==", courseId),
              where("quizId", "==", quizId),
              orderBy("completedAt", "desc"),
              limit(1),
            )

            let scoresSnapshot = await getDocs(scoresQuery)

            // If not found in learner, try intern collection
            if (scoresSnapshot.empty) {
              scoresCollection = collection(db, "intern", user.uid, "course score")
              scoresQuery = query(
                scoresCollection,
                where("courseId", "==", courseId),
                where("quizId", "==", quizId),
                orderBy("completedAt", "desc"),
                limit(1),
              )
              scoresSnapshot = await getDocs(scoresQuery)
            }

            if (!scoresSnapshot.empty) {
              const scoreData = scoresSnapshot.docs[0].data()
              setPreviousScoreData(scoreData)
              console.log("Previous score data:", scoreData)

              // Set quiz results for existing result
              setQuizResults({
                score: scoreData.score,
                totalPoints: scoreData.totalPoints,
                percentage: scoreData.percentage,
                correctAnswers: scoreData.correctAnswers,
                totalQuestions: scoreData.totalQuestions,
                passed: scoreData.passed,
              })

              // If not in review mode, show the results screen
              if (!isReviewMode) {
                setShowResults(true)
              }
            }
          } catch (error) {
            console.error("Error fetching previous quiz results:", error)
          }
        }

        // If in review mode, fetch previous answers
        if (isReviewMode && user) {
          try {
            // Try to fetch from learner collection first
            let scoresCollection = collection(db, "learner", user.uid, "course score")
            let scoresQuery = query(
              scoresCollection,
              where("courseId", "==", courseId),
              where("quizId", "==", quizId),
              orderBy("completedAt", "desc"),
              limit(1),
            )

            let scoresSnapshot = await getDocs(scoresQuery)

            // If not found in learner, try intern collection
            if (scoresSnapshot.empty) {
              scoresCollection = collection(db, "intern", user.uid, "course score")
              scoresQuery = query(
                scoresCollection,
                where("courseId", "==", courseId),
                where("quizId", "==", quizId),
                orderBy("completedAt", "desc"),
                limit(1),
              )
              scoresSnapshot = await getDocs(scoresQuery)
            }

            if (!scoresSnapshot.empty) {
              const scoreData = scoresSnapshot.docs[0].data()
              setPreviousScoreData(scoreData)

              if (scoreData.answers) {
                setAnswers(scoreData.answers)
                setQuizSubmitted(true) // Treat it as submitted so answers are shown

                // Set quiz results for review mode
                setQuizResults({
                  score: scoreData.score,
                  totalPoints: scoreData.totalPoints,
                  percentage: scoreData.percentage,
                  correctAnswers: scoreData.correctAnswers,
                  totalQuestions: scoreData.totalQuestions,
                  passed: scoreData.passed,
                })
              }
            }
          } catch (error) {
            console.error("Error fetching previous quiz answers:", error)
          }
        }

        // Initialize answers object
        const initialAnswers = {}
        quizData.sections.forEach((section, sectionIndex) => {
          if (section.questions && Array.isArray(section.questions)) {
            section.questions.forEach((question, questionIndex) => {
              initialAnswers[`${sectionIndex}-${questionIndex}`] = null
            })
          }
        })

        if (!isReviewMode) {
          setAnswers(initialAnswers)
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching quiz data:", error)
        setLoading(false)
      }
    }

    fetchQuizData()
  }, [courseId, quizId, user, navigate, isReviewMode])

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

  const handleShowResults = () => {
    // Make sure we have the latest quiz results
    if (!quizResults) {
      const results = calculateResults()
      setQuizResults(results)
    }
    setShowResults(true)
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
          attempts: 2, // Mark as second attempt
        }

        // Add to user's course score collection
        await addDoc(collection(db, "learner", user.uid, "course score"), scoreData)
        console.log("Quiz results saved to Firestore in course score collection")
        setPreviousScoreData(scoreData)
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

  // Check if the user's answer is correct based on the correct answers map
  const isAnswerCorrect = (questionKey, selectedAnswer) => {
    return selectedAnswer !== null && correctAnswersMap[questionKey] === selectedAnswer
  }

  if (loading) {
    return (
      <PageContainer>
        <MainContent>
          <div className="flex items-center justify-center h-64 flex-col">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mb-4"></div>
            <p className="text-indigo-600 font-medium">Loading quiz...</p>
          </div>
        </MainContent>
      </PageContainer>
    )
  }

  if (!quiz) {
    return (
      <PageContainer>
        <MainContent>
          <div className="text-center p-8">
            <div className="text-red-500 text-5xl mb-4">
              <FaTimes className="mx-auto" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">Quiz not found</h2>
            <p className="text-gray-600 mb-6">The quiz you're looking for doesn't exist or has been removed.</p>
            <button
              onClick={() => navigate(`/lmodules/${courseId}`)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg flex items-center mx-auto"
            >
              <FaArrowLeft className="mr-2" /> Back to Course
            </button>
          </div>
        </MainContent>
      </PageContainer>
    )
  }

  // If showing results
  if (showResults && quizResults) {
    return (
      <PageContainer>
        <MainContent>
          <div className="mb-6">
            <button
              onClick={() => navigate(`/lmodules/${courseId}`)}
              className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <FaArrowLeft className="mr-2" /> Back to Course
            </button>
          </div>

          <QuizHeader>
            <QuizTitle>{quiz.title}</QuizTitle>
            <QuizSubtitle>{courseData?.title}</QuizSubtitle>
          </QuizHeader>

          <ResultsContainer>
            <ResultsHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="h-24 w-24 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                  <FaTrophy className="text-4xl" />
                </div>
              </div>

              <h2 className="text-3xl font-bold mb-2">Congratulations!</h2>
              <p className="text-indigo-100 text-lg">You've successfully passed the quiz!</p>
            </ResultsHeader>

            <ResultsBody>
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-blue-600 mb-2">{quizResults.percentage}%</div>
                <div className="text-gray-500">Your Score</div>
              </div>

              <StatsGrid>
                <StatCard>
                  <div className="text-3xl font-bold text-gray-800">
                    {quizResults.score}/{quizResults.totalPoints}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Points</div>
                </StatCard>

                <StatCard>
                  <div className="text-3xl font-bold text-gray-800">
                    {quizResults.correctAnswers}/{quizResults.totalQuestions}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Correct</div>
                </StatCard>

                <StatCard>
                  <div className="text-3xl font-bold text-gray-800">{quizResults.passed ? "Passed" : "Failed"}</div>
                  <div className="text-sm text-gray-500 mt-1">Result</div>
                </StatCard>
              </StatsGrid>

              <div className="flex justify-center mt-8">
                <button
                  onClick={() => {
                    setShowResults(false)
                    setCurrentSection(0)
                    setCurrentQuestion(0)
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg flex items-center justify-center"
                >
                  <FaLightbulb className="mr-2" /> Review Answers
                </button>
              </div>
            </ResultsBody>
          </ResultsContainer>
        </MainContent>
      </PageContainer>
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
  const isReview = quizSubmitted || isReviewMode
  const isCorrect = isReview && isAnswerCorrect(questionKey, selectedAnswer)

  return (
    <PageContainer>
      <MainContent>
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => navigate(`/lmodules/${courseId}`)}
            className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            <FaArrowLeft className="mr-2" /> Back to Course
          </button>

          <div className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full font-medium flex items-center">
            <FaRegClock className="mr-2" />
            Question {getCurrentQuestionNumber()} of {getTotalQuestions()}
          </div>
        </div>

        <QuizHeader>
          <QuizTitle>{quiz.title}</QuizTitle>
          <QuizSubtitle>{courseData?.title}</QuizSubtitle>
        </QuizHeader>

        {/* Score summary for review mode */}
        {isReview && quizResults && (
          <div className="bg-blue-600 text-white p-6 rounded-xl mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-blue-100 rounded-full p-4">
                <FaTrophy className="text-green-500 text-3xl" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center mb-2">Congratulations!</h2>
            <p className="text-center text-blue-100 mb-6">You've successfully passed the quiz!</p>

            <div className="text-center mb-6">
              <div className="text-5xl font-bold">{quizResults.percentage}%</div>
              <div className="text-blue-200 mt-1">Your Score</div>
            </div>

            <div className="grid grid-cols-3 gap-4 bg-white bg-opacity-10 rounded-lg p-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {quizResults.score}/{quizResults.totalPoints}
                </div>
                <div className="text-sm text-blue-200">Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {quizResults.correctAnswers}/{quizResults.totalQuestions}
                </div>
                <div className="text-sm text-blue-200">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{quizResults.passed ? "Passed" : "Failed"}</div>
                <div className="text-sm text-blue-200">Result</div>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <button
                onClick={() => {
                  setShowResults(false)
                  setCurrentSection(0)
                  setCurrentQuestion(0)
                }}
                className="px-6 py-2.5 rounded-lg flex items-center transition-all bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
              >
                <FaLightbulb className="mr-2" /> Review Answers
              </button>
            </div>
          </div>
        )}

        {/* Progress bar - only show if not in review mode and no existing results */}
        {!isReview && !quizResults && (
          <ProgressBarContainer>
            <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
                style={{ width: `${(getAnsweredQuestionsCount() / getTotalQuestions()) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-3 text-sm text-gray-600">
              <span className="font-medium">
                Progress: {getAnsweredQuestionsCount()}/{getTotalQuestions()} questions answered
              </span>
              {!quizSubmitted && !isReviewMode && (
                <span className="font-medium text-indigo-600">
                  {Math.round((getAnsweredQuestionsCount() / getTotalQuestions()) * 100)}% complete
                </span>
              )}
            </div>
          </ProgressBarContainer>
        )}

        {/* Question */}
        <QuestionCard>
          <div className="flex justify-between items-start mb-4">
            <QuestionText>{currentQuestionData.question}</QuestionText>
            {isReview && selectedAnswer !== null && (
              <div
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  isCorrect
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : "bg-red-100 text-red-800 border border-red-200"
                }`}
              >
                {isCorrect ? "Correct" : "Incorrect"}
              </div>
            )}
          </div>

          <OptionsList>
            {currentQuestionData.options &&
              currentQuestionData.options.map((option, optionIndex) => {
                // Determine if this option is the correct answer
                const isCorrectOption = correctAnswersMap[questionKey] === optionIndex
                // Determine if this is the user's selected answer
                const isSelectedOption = selectedAnswer === optionIndex

                return (
                  <div
                    key={optionIndex}
                    className={`p-4 border-2 rounded-xl transition-all hover:shadow-md ${
                      isSelectedOption
                        ? isReview
                          ? isCorrectOption
                            ? "border-green-500 bg-green-50" // Selected and correct
                            : "border-red-500 bg-red-50" // Selected but incorrect
                          : "border-indigo-500 bg-indigo-50" // Selected (not in review mode)
                        : isReview && isCorrectOption
                          ? "border-green-500 bg-green-50" // Not selected but is correct answer
                          : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50" // Not selected, not correct
                    } ${isReview ? "cursor-default" : "cursor-pointer"}`}
                    onClick={() => {
                      if (!isReview) {
                        handleAnswerSelect(questionKey, optionIndex)
                      }
                    }}
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-8 h-8 flex items-center justify-center rounded-full mr-3 ${
                          isSelectedOption
                            ? isReview
                              ? isCorrectOption
                                ? "bg-green-500 text-white" // Selected and correct
                                : "bg-red-500 text-white" // Selected but incorrect
                              : "bg-indigo-600 text-white" // Selected (not in review mode)
                            : isReview && isCorrectOption
                              ? "bg-green-500 text-white" // Not selected but is correct answer
                              : "bg-gray-100 text-gray-700 border border-gray-300" // Not selected, not correct
                        }`}
                      >
                        {String.fromCharCode(65 + optionIndex)}
                      </div>
                      <span className="flex-1 text-gray-800">{option}</span>
                      {isReview && isCorrectOption && (
                        <div className="ml-2">
                          <FaCheck className="text-green-500 text-xl" />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
          </OptionsList>
        </QuestionCard>

        {/* Navigation buttons */}
        <NavigationContainer>
          <button
            onClick={goToPreviousQuestion}
            disabled={currentSection === 0 && currentQuestion === 0}
            className={`px-5 py-2.5 rounded-lg flex items-center transition-all ${
              currentSection === 0 && currentQuestion === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-sm"
            }`}
          >
            <FaChevronLeft className="mr-2" /> Previous
          </button>

          <div>
            {isReview ? (
              <button
                onClick={handleShowResults}
                className="px-6 py-2.5 rounded-lg flex items-center transition-all bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg"
              >
                <FaClipboardCheck className="mr-2" /> Show Score Summary
              </button>
            ) : (
              <button
                onClick={submitQuiz}
                disabled={submitting || Object.values(answers).some((a) => a === null)}
                className={`px-6 py-2.5 rounded-lg flex items-center transition-all ${
                  submitting || Object.values(answers).some((a) => a === null)
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg"
                }`}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <FaClipboardCheck className="mr-2" /> Submit Quiz
                  </>
                )}
              </button>
            )}
          </div>

          <button
            onClick={goToNextQuestion}
            disabled={
              currentSection === quiz.sections.length - 1 &&
              currentQuestion === quiz.sections[currentSection].questions.length - 1
            }
            className={`px-5 py-2.5 rounded-lg flex items-center transition-all ${
              currentSection === quiz.sections.length - 1 &&
              currentQuestion === quiz.sections[currentSection].questions.length - 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-sm"
            }`}
          >
            Next <FaChevronRight className="ml-2" />
          </button>
        </NavigationContainer>
      </MainContent>
    </PageContainer>
  )
}

export default QuizTaker
