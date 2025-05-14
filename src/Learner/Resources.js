"use client"

import { useEffect, useState, useContext } from "react"
import { db } from "../firebase.config"
import { collection, getDocs } from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import Sidebar from "../components/LSidebar"
import styled from "styled-components"
import { SidebarToggleContext } from "../components/LgNavbar"; // Import the context


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
`;



const CourseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`

const CourseCard = styled.div`
  background: linear-gradient(145deg, #ffffff, #e6e6e6);
  border-radius: 8px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  }
`

const CourseTitleCard = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
  padding: 15px;
`

const ResourcesPage = () => {
  const [courseData, setCourseData] = useState([])
  const { expanded } = useContext(SidebarToggleContext);
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, "courses"))
      const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setCourseData(data)
    }

    fetchData()
  }, [])

  const handleCourseClick = (courseId) => {
    navigate(`/quiz-taker/${courseId}`)
  }

  const filteredCourses = courseData.filter((course) => course.quizzes && course.quizzes.length > 0)

  return (
    <PageContainer>
      <HeaderWrapper>{/* Header component can be placed here */}</HeaderWrapper>
      <ContentContainer>
        <SidebarWrapper>
                        <Sidebar />
                      </SidebarWrapper>
        <MainContent expanded={expanded}>
          <Title>Resources</Title>
          <CourseGrid>
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} onClick={() => handleCourseClick(course.id)}>
                <CourseTitleCard>{course.title}</CourseTitleCard>
              </CourseCard>
            ))}
          </CourseGrid>
        </MainContent>
      </ContentContainer>
    </PageContainer>
  )
}

export default ResourcesPage
git fetch origin