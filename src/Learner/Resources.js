"use client"

import { useEffect, useState, useContext } from "react"
import { db, auth } from "../firebase.config"
import { collection, getDocs, doc, getDoc } from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import { useAuthState } from "react-firebase-hooks/auth"
import Sidebar from "../components/LSidebar"
import styled, { keyframes } from "styled-components"
import { SidebarToggleContext } from "../components/LgNavbar"
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Video,
  Search,
  Filter,
  BookOpen,
  FileText,
  ChevronRight,
  Calendar,
  Tag,
  RefreshCw,
  Layers,
  User,
  Briefcase,
} from "lucide-react"
import VideoUploader from "./video-uploader"
import VideoList from "./video-list"

// Animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`

// Styled Components
const PageContainer = styled.div`
  display: flex;
  height: 100vh;
  background-color: #f4f6f9;
`

const SidebarWrapper = styled.div`
  height: 100%;
  z-index: 5;
`

const MainContent = styled.div`
  flex: 1;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  transition: margin-left 0.3s ease;
  margin-left: ${({ expanded }) => (expanded ? "16rem" : "4rem")};
  width: ${({ expanded }) => (expanded ? "calc(100% - 16rem)" : "calc(100% - 4rem)")};
`

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  position: relative;
  background: linear-gradient(to right, #4f46e5, #3b82f6);
  color: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`

const HeaderContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`

const Subtitle = styled.p`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
`

const ActionBar = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  align-items: center;
`

const SearchBar = styled.div`
  flex: 1;
  min-width: 250px;
  position: relative;
`

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  background-color: white;
  font-size: 0.875rem;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
`

const SearchIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
`

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #4b5563;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  &:hover {
    background-color: #f9fafb;
    border-color: #d1d5db;
  }
`

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(to right, #3b82f6, #2563eb);
  border: none;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);

  &:hover {
    background: linear-gradient(to right, #2563eb, #1d4ed8);
    transform: translateY(-1px);
    box-shadow: 0 6px 8px -1px rgba(59, 130, 246, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: linear-gradient(to right, #9ca3af, #6b7280);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`

const AddCourseButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(to right, #8b5cf6, #7c3aed);
  border: none;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(139, 92, 246, 0.3);

  &:hover {
    background: linear-gradient(to right, #7c3aed, #6d28d9);
    transform: translateY(-1px);
    box-shadow: 0 6px 8px -1px rgba(139, 92, 246, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`

const CourseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  animation: ${fadeIn} 0.5s ease-out;
`

const CourseCard = styled.div`
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  position: relative;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
`

const CourseImageContainer = styled.div`
  height: 180px;
  background: linear-gradient(135deg, #dbeafe, #eff6ff);
  position: relative;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.5), transparent);
    background-size: 200% 100%;
    animation: ${shimmer} 1.5s infinite;
    opacity: 0;
    transition: opacity 0.3s;
  }

  ${CourseCard}:hover &::after {
    opacity: 1;
  }
`

const CourseImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s;

  ${CourseCard}:hover & {
    transform: scale(1.05);
  }
`

const CategoryBadge = styled.div`
  position: absolute;
  top: 1rem;
  left: 1rem;
  background-color: rgba(255, 255, 255, 0.9);
  color: #3b82f6;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  text-transform: uppercase;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 0.35rem;
`

const QuizCountBadge = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background-color: rgba(59, 130, 246, 0.9);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 0.35rem;
`

const CourseContent = styled.div`
  padding: 1.5rem;
`

const CourseTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`

const CourseDescription = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 1.25rem 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 3.9rem;
`

const CourseFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const StartButton = styled.button`
  background: linear-gradient(to right, #3b82f6, #2563eb);
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);

  &:hover {
    background: linear-gradient(to right, #2563eb, #1d4ed8);
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(59, 130, 246, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`

const QuizGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  animation: ${fadeIn} 0.5s ease-out;
`

const QuizCard = styled.div`
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  position: relative;
  cursor: pointer;
  padding: 1.5rem;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(to bottom, #3b82f6, #2563eb);
    border-radius: 0 2px 2px 0;
  }
`

const QuizTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.75rem 0;
  padding-right: 2rem;
`

const QuizDescription = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 1rem 0;
  line-height: 1.5;
  min-height: 2.625rem;
`

const CompletedBadge = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background-color: #10b981;
  color: white;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
`

const ScoreBadge = styled.div`
  display: inline-flex;
  align-items: center;
  background-color: ${(props) => (props.passed ? "#d1fae5" : "#fee2e2")};
  color: ${(props) => (props.passed ? "#047857" : "#b91c1c")};
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.35rem 0.75rem;
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;
`

const DateInfo = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.5rem;
  gap: 0.35rem;
`

const AttemptInfo = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.5rem;
  gap: 0.35rem;
`

const UserTypeBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background-color: ${(props) => (props.isIntern ? "#dbeafe" : "#f3e8ff")};
  color: ${(props) => (props.isIntern ? "#1e40af" : "#6b21a8")};
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-left: 1rem;
`

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #4b5563;
  cursor: pointer;
  margin-bottom: 1.5rem;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  &:hover {
    background-color: #f9fafb;
    border-color: #d1d5db;
    color: #3b82f6;
  }
`

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 1.5rem;
`

const Tab = styled.button`
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  background: transparent;
  border: none;
  border-bottom: 3px solid ${(props) => (props.active ? "#3b82f6" : "transparent")};
  color: ${(props) => (props.active ? "#3b82f6" : "#6b7280")};
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    color: #3b82f6;
  }
`

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
`

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  background-color: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  animation: ${fadeIn} 0.5s ease-out;
`

const EmptyStateIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  color: #9ca3af;
  font-size: 2rem;
`

const EmptyStateTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
`

const EmptyStateText = styled.p`
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 1.5rem 0;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
`

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
`

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 3px solid rgba(59, 130, 246, 0.2);
  border-radius: 50%;
  border-top-color: #3b82f6;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`

const LoadingText = styled.p`
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
`

const ResourcesPage = () => {
  const [user] = useAuthState(auth)
  const [courseData, setCourseData] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [quizzes, setQuizzes] = useState([])
  const [quizScores, setQuizScores] = useState({})
  const [loading, setLoading] = useState(true)
  const [userType, setUserType] = useState("learner") // Default to learner
  const [courseCollectionName, setCourseCollectionName] = useState("courses") // Default collection name
  const { expanded } = useContext(SidebarToggleContext)
  const navigate = useNavigate()

  // New state for video functionality
  const [activeTab, setActiveTab] = useState("quizzes") // "quizzes" or "videos"
  const [refreshVideos, setRefreshVideos] = useState(0) // Counter to trigger video list refresh
  const [searchTerm, setSearchTerm] = useState("")

  // Determine user type and set the appropriate course collection
  useEffect(() => {
    const determineUserType = async () => {
      if (!user) return

      try {
        setLoading(true)

        // Check if user exists in intern collection
        const internRef = doc(db, "intern", user.uid)
        const internDoc = await getDoc(internRef)

        if (internDoc.exists()) {
          setUserType("intern")
          setCourseCollectionName("Intern_Course")
          console.log("User is an intern, using Intern_Course collection")
        } else {
          // Default to learner
          setUserType("learner")
          setCourseCollectionName("courses")
          console.log("User is a learner, using courses collection")
        }
      } catch (error) {
        console.error("Error determining user type:", error)
        // Default to learner if there's an error
        setUserType("learner")
        setCourseCollectionName("courses")
      } finally {
        setLoading(false)
      }
    }

    determineUserType()
  }, [user])

  // Fetch courses based on the determined collection
  useEffect(() => {
    const fetchCourses = async () => {
      if (!user || !courseCollectionName) return

      try {
        setLoading(true)
        console.log(`Fetching courses from ${courseCollectionName} collection`)

        const querySnapshot = await getDocs(collection(db, courseCollectionName))
        const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setCourseData(data)
      } catch (error) {
        console.error(`Error fetching courses from ${courseCollectionName}:`, error)
      } finally {
        setLoading(false)
      }
    }

    // Only fetch courses once we've determined the collection name
    if (courseCollectionName) {
      fetchCourses()
    }
  }, [user, courseCollectionName])

  // Check for courses with quizzes
  useEffect(() => {
    const checkCoursesWithQuizzes = async () => {
      if (courseData.length === 0 || !courseCollectionName) return

      try {
        setLoading(true)

        // Create a new array to store courses with quizzes info
        const coursesWithQuizzesInfo = await Promise.all(
          courseData.map(async (course) => {
            // Check if the course has a quizzes subcollection
            const quizzesSnapshot = await getDocs(collection(db, courseCollectionName, course.id, "quizzes"))
            const hasQuizzes = !quizzesSnapshot.empty
            const quizzesCount = quizzesSnapshot.size

            return {
              ...course,
              hasQuizzes,
              quizzesCount,
            }
          }),
        )

        setCourseData(coursesWithQuizzesInfo)
      } catch (error) {
        console.error("Error checking courses with quizzes:", error)
      } finally {
        setLoading(false)
      }
    }

    checkCoursesWithQuizzes()
  }, [courseData.length, courseCollectionName])

  // Fetch quiz scores for the user
  const fetchQuizScores = async (courseId) => {
    if (!user) return {}

    try {
      console.log(`Fetching quiz scores for course ${courseId} for user type ${userType}`)

      // First, check if the progress document exists for this course
      const progressRef = doc(db, userType, user.uid, "progress", courseId)
      const progressDoc = await getDoc(progressRef)

      if (!progressDoc.exists()) {
        console.log(`No progress document found for course ${courseId}`)
        return {}
      }

      // Get the course score collection from the progress document
      const courseScoreCollection = collection(db, userType, user.uid, "progress", courseId, "course score")
      const scoresSnapshot = await getDocs(courseScoreCollection)

      if (scoresSnapshot.empty) {
        console.log(`No quiz scores found for course ${courseId}`)
        return {}
      }

      console.log(`Found ${scoresSnapshot.size} quiz scores for course ${courseId}`)

      // Group scores by quizId
      const scoresByQuiz = {}

      scoresSnapshot.forEach((doc) => {
        const scoreData = doc.data()
        const quizId = scoreData.quizId

        // If we don't have this quiz in our map yet, or if this score is newer
        if (
          !scoresByQuiz[quizId] ||
          (scoreData.completedAt &&
            (!scoresByQuiz[quizId].completedAt ||
              scoreData.completedAt.toDate() > scoresByQuiz[quizId].completedAt.toDate()))
        ) {
          // Convert Firestore timestamp to JS Date for easier comparison
          if (scoreData.completedAt) {
            scoreData.completedAtDate = scoreData.completedAt.toDate()
          }

          scoresByQuiz[quizId] = scoreData
        }
      })

      console.log("Quiz scores by quiz ID:", scoresByQuiz)
      return scoresByQuiz
    } catch (error) {
      console.error("Error fetching quiz scores:", error)
      return {}
    }
  }

  const handleCourseClick = async (course) => {
    try {
      setLoading(true)
      setSelectedCourse(course)
      setActiveTab("quizzes") // Default to quizzes tab when selecting a course

      // Fetch quizzes from the subcollection using the appropriate collection name
      const quizzesSnapshot = await getDocs(collection(db, courseCollectionName, course.id, "quizzes"))

      if (quizzesSnapshot.empty) {
        setQuizzes([])
        setQuizScores({})
      } else {
        const quizzesData = quizzesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

        // Fetch the user's scores for this course's quizzes
        const scores = await fetchQuizScores(course.id)
        setQuizScores(scores)

        setQuizzes(quizzesData)
      }
    } catch (error) {
      console.error("Error fetching quizzes:", error)
      setQuizzes([])
      setQuizScores({})
    } finally {
      setLoading(false)
    }
  }

  const handleQuizClick = (quizId) => {
    // Check if the user has already completed this quiz
    const quizScore = quizScores[quizId]

    if (quizScore) {
      // If the user has a score, navigate to review mode
      navigate(`/quiz-taker?courseId=${selectedCourse.id}&quizId=${quizId}&mode=review`)
    } else {
      // If no score exists, navigate to take mode
      navigate(`/quiz-taker?courseId=${selectedCourse.id}&quizId=${quizId}&mode=take`)
    }
  }

  const handleBackToCourses = () => {
    setSelectedCourse(null)
    setQuizzes([])
    setQuizScores({})
    setActiveTab("quizzes")
  }

  // Format date for display
  const formatDate = (date) => {
    if (!date) return "Unknown date"

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date)
  }

  // Get course image URL or use a placeholder
  const getCourseImageUrl = (course) => {
    // Check if course has fileUrl with a url property (nested structure)
    if (course.fileUrl && course.fileUrl.url) {
      return course.fileUrl.url
    }

    // Check if course has an imageUrl
    if (course.imageUrl) {
      return course.imageUrl
    }

    // Check if course has a fileUrl as a direct string
    if (typeof course.fileUrl === "string") {
      return course.fileUrl
    }

    // Return a placeholder image if no image is available
    return "/placeholder.svg?height=180&width=320"
  }

  // Filter courses that have quizzes
  const filteredCourses = courseData.filter((course) => course.hasQuizzes)

  // Filter courses by search term
  const searchFilteredCourses =
    searchTerm.trim() === ""
      ? filteredCourses
      : filteredCourses.filter(
          (course) =>
            course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.category?.toLowerCase().includes(searchTerm.toLowerCase()),
        )

  const isIntern = userType === "intern"

  // Handle video upload completion
  const handleVideoUploaded = () => {
    // Increment the refresh counter to trigger a re-fetch of videos
    setRefreshVideos((prev) => prev + 1)
  }

  // Handle video deletion
  const handleVideoDeleted = () => {
    // Increment the refresh counter to trigger a re-fetch of videos
    setRefreshVideos((prev) => prev + 1)
  }

  return (
    <PageContainer>
      <SidebarWrapper>
        <Sidebar />
      </SidebarWrapper>
      <MainContent expanded={expanded}>
        {selectedCourse ? (
          // Show content for the selected course
          <>
            <BackButton onClick={handleBackToCourses}>
              <ArrowLeft size={16} /> Back to Resources
            </BackButton>

            <PageHeader>
              <HeaderContent>
                <Title>
                  <BookOpen /> {selectedCourse.title}
                </Title>
                <Subtitle>
                  {selectedCourse.category ? (
                    <>
                      <Tag size={14} className="inline-block mr-1" /> {selectedCourse.category}
                    </>
                  ) : (
                    "Explore quizzes and video resources"
                  )}
                </Subtitle>
              </HeaderContent>
            </PageHeader>

            {/* Tabs for Quizzes and Videos */}
            <TabContainer>
              <Tab active={activeTab === "quizzes"} onClick={() => setActiveTab("quizzes")}>
                <FileText size={16} /> Quizzes
              </Tab>
              <Tab active={activeTab === "videos"} onClick={() => setActiveTab("videos")}>
                <Video size={16} /> Video Comments
              </Tab>
            </TabContainer>

            {loading ? (
              <LoadingContainer>
                <LoadingSpinner />
                <LoadingText>Loading content...</LoadingText>
              </LoadingContainer>
            ) : activeTab === "quizzes" ? (
              // Quizzes Tab Content
              quizzes.length === 0 ? (
                <EmptyState>
                  <EmptyStateIcon>
                    <FileText size={32} />
                  </EmptyStateIcon>
                  <EmptyStateTitle>No quizzes available</EmptyStateTitle>
                  <EmptyStateText>
                    There are no quizzes available for this course yet. Check back later or try another course.
                  </EmptyStateText>
                </EmptyState>
              ) : (
                <QuizGrid>
                  {quizzes.map((quiz) => {
                    const quizScore = quizScores[quiz.id]
                    const hasCompleted = !!quizScore
                    const hasPassed = hasCompleted && quizScore.passed
                    const completedDate = quizScore?.completedAtDate

                    return (
                      <QuizCard key={quiz.id} onClick={() => handleQuizClick(quiz.id)}>
                        {hasCompleted && (
                          <CompletedBadge>
                            <CheckCircle size={12} /> Completed
                          </CompletedBadge>
                        )}
                        <QuizTitle>
                          {quiz.title}
                          {hasCompleted && (
                            <span
                              style={{
                                marginLeft: "0.5rem",
                                fontSize: "0.875rem",
                                fontWeight: "500",
                                color: hasPassed ? "#10b981" : "#ef4444",
                              }}
                            >
                              ({quizScore.percentage}%)
                            </span>
                          )}
                        </QuizTitle>
                        <QuizDescription>
                          {quiz.description ||
                            (hasCompleted
                              ? "Click to review your answers and see your score"
                              : "Click to start this quiz")}
                        </QuizDescription>

                        {hasCompleted && (
                          <>
                            <ScoreBadge
                              passed={hasPassed}
                              style={{
                                fontSize: "0.875rem",
                                fontWeight: "700",
                                padding: "0.5rem 1rem",
                                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                              }}
                            >
                              Score: {quizScore.percentage}% - {hasPassed ? "✅ Passed" : "❌ Failed"}
                            </ScoreBadge>

                            {completedDate && (
                              <DateInfo>
                                <Clock size={12} /> Latest attempt: {formatDate(completedDate)}
                              </DateInfo>
                            )}

                            {quizScore.attempts > 1 && (
                              <AttemptInfo>
                                <Layers size={12} /> Attempts: {quizScore.attempts}
                              </AttemptInfo>
                            )}
                          </>
                        )}
                      </QuizCard>
                    )
                  })}
                </QuizGrid>
              )
            ) : (
              // Videos Tab Content
              <>
                <SectionHeader>
                  <SectionTitle>
                    <Video size={20} />
                    Video Comments
                  </SectionTitle>
                </SectionHeader>

                {/* Video Uploader Component */}
                <VideoUploader courseId={selectedCourse.id} userType={userType} onVideoUploaded={handleVideoUploaded} />

                {/* Video List Component */}
                <VideoList
                  courseId={selectedCourse.id}
                  userType={userType}
                  onVideoDeleted={handleVideoDeleted}
                  key={refreshVideos} // Force re-render when videos are added/deleted
                />
              </>
            )}
          </>
        ) : (
          // Show list of courses with the new design
          <>
            <PageHeader>
              <HeaderContent>
                <div className="flex items-center">
                  <Title>
                    <BookOpen /> Resources
                  </Title>
                  <UserTypeBadge isIntern={isIntern}>
                    {isIntern ? <Briefcase size={14} /> : <User size={14} />}
                    {isIntern ? "Intern" : "Learner"}
                  </UserTypeBadge>
                </div>
                <Subtitle>Explore courses, quizzes, and learning materials</Subtitle>
              </HeaderContent>
            </PageHeader>

            <ActionBar>
              <SearchBar>
                <SearchIcon>
                  <Search size={18} />
                </SearchIcon>
                <SearchInput
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </SearchBar>

              <FilterButton>
                <Filter size={16} />
                Filter
              </FilterButton>

              <RefreshButton
                onClick={() => {
                  setLoading(true)
                  setCourseData([])
                  setTimeout(() => {
                    if (courseCollectionName) {
                      const fetchCourses = async () => {
                        try {
                          const querySnapshot = await getDocs(collection(db, courseCollectionName))
                          const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
                          setCourseData(data)
                        } catch (error) {
                          console.error(`Error refreshing courses:`, error)
                        } finally {
                          setLoading(false)
                        }
                      }
                      fetchCourses()
                    }
                  }, 500)
                }}
                disabled={loading}
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                {loading ? "Refreshing..." : "Refresh"}
              </RefreshButton>
            </ActionBar>

            {loading ? (
              <LoadingContainer>
                <LoadingSpinner />
                <LoadingText>Loading courses...</LoadingText>
              </LoadingContainer>
            ) : searchFilteredCourses.length === 0 ? (
              searchTerm.trim() !== "" ? (
                <EmptyState>
                  <EmptyStateIcon>
                    <Search size={32} />
                  </EmptyStateIcon>
                  <EmptyStateTitle>No matching courses found</EmptyStateTitle>
                  <EmptyStateText>
                    We couldn't find any courses matching "{searchTerm}". Try a different search term or clear your
                    search.
                  </EmptyStateText>
                </EmptyState>
              ) : (
                <EmptyState>
                  <EmptyStateIcon>
                    <BookOpen size={32} />
                  </EmptyStateIcon>
                  <EmptyStateTitle>No courses with quizzes available</EmptyStateTitle>
                  <EmptyStateText>
                    There are no courses with quizzes available at the moment. Check back later for new content.
                  </EmptyStateText>
                </EmptyState>
              )
            ) : (
              <CourseGrid>
                {searchFilteredCourses.map((course) => (
                  <CourseCard key={course.id} onClick={() => handleCourseClick(course)}>
                    <CourseImageContainer>
                      <CourseImage src={getCourseImageUrl(course)} alt={course.title} />
                      {course.category && (
                        <CategoryBadge>
                          <Tag size={12} />
                          {course.category}
                        </CategoryBadge>
                      )}
                      <QuizCountBadge>
                        <FileText size={12} />
                        {course.quizzesCount || 0} {course.quizzesCount === 1 ? "quiz" : "quizzes"}
                      </QuizCountBadge>
                    </CourseImageContainer>
                    <CourseContent>
                      <CourseTitle>{course.title}</CourseTitle>
                      <CourseDescription>{course.description || "No description available"}</CourseDescription>
                      <CourseFooter>
                        <DateInfo>
                          <Calendar size={14} />
                          {course.createdAt ? formatDate(course.createdAt.toDate()) : "Date not available"}
                        </DateInfo>
                        <StartButton>
                          Explore <ChevronRight size={16} />
                        </StartButton>
                      </CourseFooter>
                    </CourseContent>
                  </CourseCard>
                ))}
              </CourseGrid>
            )}
          </>
        )}
      </MainContent>
    </PageContainer>
  )
}

export default ResourcesPage
