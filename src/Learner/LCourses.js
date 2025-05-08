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

const CourseTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #333;
  border-bottom: 3px solid #3498db;
  padding-bottom: 10px;
  margin-bottom: 20px;
  letter-spacing: 0.5px;
`

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

  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  }
`

const CourseImage = styled.img`
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-bottom: 2px solid #ddd;
`

const CourseDetails = styled.div`
  padding: 15px;
`

const CourseCategory = styled.p`
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 5px;
`

const CourseTitleCard = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
`

const CourseDescription = styled.p`
  font-size: 14px;
  color: #555;
  margin-top: 5px;
`

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`

const SearchInput = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;

  input {
    flex: 1;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
    margin-right: 10px;
  }

  button {
    background-color: #3498db;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.3s ease;

    &:hover {
      background-color: #2980b9;
    }
  }
`

const FilterOptions = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;

  select, button {
    margin-right: 10px;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.3s ease;

    &:hover {
      background-color: #f0f0f0;
    }
  }
`

const CourseCards = () => {
  const [courseData, setCourseData] = useState([])
  const { expanded } = useContext(SidebarToggleContext);
  const [expandedCourse, setExpandedCourse] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, "courses"))
      const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setCourseData(data)

      // Extract unique categories
      const uniqueCategories = [...new Set(data.map((course) => course.category))]
      setCategories(uniqueCategories)
    }

    fetchData()
  }, [])

  // Helper function to get the image URL from the course data
  const getCourseImageUrl = (course) => {
    // Check if fileUrl exists and has a url property (nested structure)
    if (course.fileUrl && course.fileUrl.url) {
      return course.fileUrl.url
    }

    // If fileUrl is a direct string
    if (typeof course.fileUrl === "string") {
      return course.fileUrl
    }

    // Fallback to a placeholder image
    return "/placeholder.svg?height=150&width=300"
  }

  if (!courseData.length) {
    return <div>Loading...</div>
  }

  const hasCourseStarted = (courseId) => {
    // Replace with actual logic to check if the course has been started
    return false
  }

  const toggleDescription = (courseId) => {
    setExpandedCourse(expandedCourse === courseId ? null : courseId)
  }

  const handleButtonClick = (courseId) => {
    navigate(`/lmodules/${courseId}`)
  }

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const filteredCourses = courseData.filter(
    (course) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCategory === "all" || course.category === selectedCategory),
  )

  return (
    <PageContainer>
      <HeaderWrapper>{/* Header component can be placed here */}</HeaderWrapper>
      <ContentContainer>
        <SidebarWrapper>
          <Sidebar />
        </SidebarWrapper>
        <MainContent expanded={expanded}>
          <CourseTitle>Courses</CourseTitle>
          <div className="flex justify-between mb-4">
            {/* Dropdown for Course Categories */}
            <div className="relative w-48 bg-gray-100 rounded-2xl shadow-md p-1 transition-all duration-150 ease-in-out hover:scale-105 hover:shadow-lg">
              <div
                className="cursor-pointer flex items-center justify-between p-2 rounded-lg bg-gray-100"
                onClick={toggleDropdown}
              >
                <span className="text-gray-700">
                  {selectedCategory === "all" ? "All Categories" : selectedCategory}
                </span>
                <svg
                  className={`h-4 w-4 text-gray-400 transition-transform ${isDropdownOpen ? "rotate-0" : "-rotate-90"}`}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                >
                  <path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" />
                </svg>
              </div>
              {isDropdownOpen && (
                <div className="absolute left-0 mt-2 w-full bg-gray-100 rounded-lg shadow-lg z-10">
                  <div
                    className="p-2 cursor-pointer hover:bg-gray-200"
                    onClick={() => {
                      setSelectedCategory("all")
                      setIsDropdownOpen(false)
                    }}
                  >
                    All Categories
                  </div>
                  {categories.map((category, index) => (
                    <div
                      key={index}
                      className="p-2 cursor-pointer hover:bg-gray-200"
                      onClick={() => {
                        setSelectedCategory(category)
                        setIsDropdownOpen(false)
                      }}
                    >
                      {category}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Search Bar */}
            <div className="relative w-full max-w-lg bg-gray-100 rounded-2xl shadow-md p-1 transition-all duration-150 ease-in-out hover:scale-105 hover:shadow-lg">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <svg
                  className="h-4 w-4 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </div>
              <input
                type="text"
                className="w-full pl-7 pr-16 py-2 text-sm text-gray-700 bg-transparent rounded-lg focus:outline-none"
                placeholder="Search for courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="absolute right-1 top-1 bottom-1 px-4 bg-[#5044e4] text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5044e4]">
                Search
              </button>
            </div>
          </div>
          <CourseGrid>
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} onClick={() => handleButtonClick(course.id)}>
                <CourseImage
                  src={getCourseImageUrl(course)}
                  alt={course.title}
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = "/placeholder.svg?height=150&width=300"
                  }}
                />
                <CourseDetails>
                  <CourseTitleCard>{course.title}</CourseTitleCard>
                  <CourseCategory>{course.category}</CourseCategory>
                  <CourseDescription>
                    {expandedCourse === course.id ? (
                      <>
                        {course.description}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleDescription(course.id)
                          }}
                          className="text-blue-500 mt-2 ml-2"
                        >
                          Show Less
                        </button>
                      </>
                    ) : (
                      <>
                        {course.description
                          ? course.description.length > 100
                            ? `${course.description.slice(0, 100)}...`
                            : course.description
                          : "No description available"}
                        {course.description && course.description.length > 100 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleDescription(course.id)
                            }}
                            className="text-blue-500 mt-2 ml-2"
                          >
                            Show More
                          </button>
                        )}
                      </>
                    )}
                  </CourseDescription>
                  <ActionButtons>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleButtonClick(course.id)
                      }}
                      className="select-none rounded-lg bg-blue-500 py-3 px-6 text-center align-middle font-sans text-xs font-bold uppercase text-white shadow-md transition-all hover:shadow-lg focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                    >
                      {hasCourseStarted(course.id) ? "Continue" : "Start"}
                    </button>
                  </ActionButtons>
                </CourseDetails>
              </CourseCard>
            ))}
          </CourseGrid>
        </MainContent>
      </ContentContainer>
    </PageContainer>
  )
}

export default CourseCards
