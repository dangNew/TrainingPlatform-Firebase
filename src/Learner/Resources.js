"use client"

import { useEffect, useState, useContext } from "react"
import { db, auth } from "../firebase.config"
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import { useAuthState } from "react-firebase-hooks/auth"
import Sidebar from "../components/LSidebar"
import styled from "styled-components"
import { SidebarToggleContext } from "../components/LgNavbar"
import { ArrowLeft, CheckCircle, Clock, Video } from "lucide-react" // Added Video icon
import VideoUploader from "./video-uploader" // Import the VideoUploader component
import VideoList from "./video-list" // Import the VideoList component

// Styled Components
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f4f6f9;
`

const HeaderWrapper = styled.div`
  width: 100%;
  z-index: 10;
`

const ContentContainer = styled.div`
  display: flex;
  flex: 1;
`

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #333;
  border-bottom: 3px solid #3498db;
  padding-bottom: 10px;
  margin-bottom: 20px;
`

const SubTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
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

const CourseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`

// Updated CourseCard to match the design in the image
const CourseCard = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  }
`

const CourseImageContainer = styled.div`
  height: 150px;
  background-color: #f0f2f5;
  position: relative;
  overflow: hidden;
`

const CourseImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`

const CourseContent = styled.div`
  padding: 15px;
`

const CourseTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
`

const CourseCategory = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: #666;
  text-transform: uppercase;
  margin-bottom: 8px;
`

const CourseDescription = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 15px;
  min-height: 40px;
`

const CourseFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const QuizCount = styled.span`
  font-size: 13px;
  color: #666;
`

const StartButton = styled.button`
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #2563eb;
  }
`

const QuizCard = styled.div`
  background: linear-gradient(145deg, #ffffff, #f5f5f5);
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  padding: 15px;
  position: relative;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
  }
`

const QuizTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
`

const QuizDescription = styled.p`
  font-size: 14px;
  color: #666;
`

const BackButton = styled.button`
  display: flex;
  align-items: center;
  background-color: #f0f0f0;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  cursor: pointer;
  margin-bottom: 20px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #e0e0e0;
  }

  svg {
    margin-right: 8px;
  }
`

const LoadingIndicator = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  font-size: 16px;
  color: #666;
`

const CompletedBadge = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #10b981;
  color: white;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
`

const ScoreBadge = styled.div`
  background-color: ${(props) => (props.passed ? "#d1fae5" : "#fee2e2")};
  color: ${(props) => (props.passed ? "#047857" : "#b91c1c")};
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
  margin-top: 8px;
`

const DateInfo = styled.div`
  display: flex;
  align-items: center;
  font-size: 11px;
  color: #666;
  margin-top: 6px;
  gap: 4px;
`

const UserTypeBadge = styled.div`
  display: inline-block;
  background-color: ${(props) => (props.isIntern ? "#dbeafe" : "#f3e8ff")};
  color: ${(props) => (props.isIntern ? "#1e40af" : "#6b21a8")};
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 4px;
  margin-left: 10px;
`

// New styled components for video section
const SectionDivider = styled.div`
  border-top: 1px solid #e5e7eb;
  margin: 30px 0;
`

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
`

const SectionTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 10px;
`

const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 20px;
`

const Tab = styled.button`
  padding: 10px 20px;
  font-size: 16px;
  font-weight: 500;
  background: transparent;
  border: none;
  border-bottom: 3px solid ${(props) => (props.active ? "#3b82f6" : "transparent")};
  color: ${(props) => (props.active ? "#3b82f6" : "#6b7280")};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #3b82f6;
  }
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
      // Query the user's scores for this course
      const scoresCollection = collection(db, userType, user.uid, "course score")
      const q = query(scoresCollection, where("courseId", "==", courseId))
      const scoresSnapshot = await getDocs(q)

      if (scoresSnapshot.empty) return {}

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
    return "/placeholder.svg?height=150&width=300"
  }

  // Filter courses that have quizzes
  const filteredCourses = courseData.filter((course) => course.hasQuizzes)

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
      <HeaderWrapper>{/* Header component can be placed here */}</HeaderWrapper>
      <ContentContainer>
        <SidebarWrapper>
          <Sidebar />
        </SidebarWrapper>
        <MainContent expanded={expanded}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <Title>Resources</Title>
            <UserTypeBadge isIntern={isIntern}>{isIntern ? "Intern" : "Learner"}</UserTypeBadge>
          </div>

          {selectedCourse ? (
            // Show content for the selected course
            <>
              <BackButton onClick={handleBackToCourses}>
                <ArrowLeft size={16} /> Back to Courses
              </BackButton>

              <SubTitle>{selectedCourse.title}</SubTitle>

              {/* Tabs for Quizzes and Videos */}
              <TabContainer>
                <Tab active={activeTab === "quizzes"} onClick={() => setActiveTab("quizzes")}>
                  Quizzes
                </Tab>
                <Tab active={activeTab === "videos"} onClick={() => setActiveTab("videos")}>
                  Video Comments
                </Tab>
              </TabContainer>

              {loading ? (
                <LoadingIndicator>Loading content...</LoadingIndicator>
              ) : activeTab === "quizzes" ? (
                // Quizzes Tab Content
                quizzes.length === 0 ? (
                  <div>No quizzes available for this course.</div>
                ) : (
                  <CourseGrid>
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
                          <QuizTitle>{quiz.title}</QuizTitle>
                          <QuizDescription>
                            {quiz.description ||
                              (hasCompleted ? "Click to review your answers" : "Click to start this quiz")}
                          </QuizDescription>

                          {hasCompleted && (
                            <>
                              <ScoreBadge passed={hasPassed}>
                                Score: {quizScore.percentage}% - {hasPassed ? "Passed" : "Failed"}
                              </ScoreBadge>

                              {completedDate && (
                                <DateInfo>
                                  <Clock size={12} /> Latest attempt: {formatDate(completedDate)}
                                </DateInfo>
                              )}

                              {quizScore.attempts > 1 && (
                                <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
                                  Attempts: {quizScore.attempts}
                                </div>
                              )}
                            </>
                          )}
                        </QuizCard>
                      )
                    })}
                  </CourseGrid>
                )
              ) : (
                // Videos Tab Content Here!!!!!!!
                <>
                  <SectionHeader>
                    <SectionTitle>
                      <Video size={20} />
                      Video Comments
                    </SectionTitle>
                  </SectionHeader>

                  {/* Video Uploader Component */}
                  <VideoUploader
                    courseId={selectedCourse.id}
                    userType={userType}
                    onVideoUploaded={handleVideoUploaded}
                  />

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
              {loading ? (
                <LoadingIndicator>Loading courses...</LoadingIndicator>
              ) : filteredCourses.length === 0 ? (
                <div>No courses with quizzes available.</div>
              ) : (
                <CourseGrid>
                  {filteredCourses.map((course) => (
                    <CourseCard key={course.id} onClick={() => handleCourseClick(course)}>
                      <CourseImageContainer>
                        <CourseImage src={getCourseImageUrl(course)} alt={course.title} />
                      </CourseImageContainer>
                      <CourseContent>
                        <CourseTitle>{course.title}</CourseTitle>
                        <CourseCategory>{course.category || "OTHER"}</CourseCategory>
                        <CourseDescription>{course.description || "No description available"}</CourseDescription>
                        <CourseFooter>
                          <QuizCount>
                            {course.quizzesCount || 0} {course.quizzesCount === 1 ? "quiz" : "quizzes"} available
                          </QuizCount>
                          <StartButton>START</StartButton>
                        </CourseFooter>
                      </CourseContent>
                    </CourseCard>
                  ))}
                </CourseGrid>
              )}
            </>
          )}
        </MainContent>
      </ContentContainer>
    </PageContainer>
  )
}

export default ResourcesPage
