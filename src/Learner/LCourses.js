"use client"

import { useEffect, useState, useContext } from "react"
import { db } from "../firebase.config"
import { collection, getDocs, doc, getDoc } from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import Sidebar from "../components/LSidebar"
import { SidebarToggleContext } from "../components/LgNavbar"
import { auth } from "../firebase.config"
import { FaSearch, FaChevronDown, FaChevronUp, FaSpinner, FaGraduationCap, FaFilter, FaBook } from "react-icons/fa"

const CourseCards = () => {
  const [courseData, setCourseData] = useState([])
  const { expanded } = useContext(SidebarToggleContext)
  const [expandedCourse, setExpandedCourse] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const navigate = useNavigate()
  const [userType, setUserType] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUserTypeAndFetchCourses = async () => {
      try {
        setLoading(true)

        // Get current user
        const user = auth.currentUser
        if (!user) {
          console.error("No user is logged in")
          setLoading(false)
          return
        }

        // Check if user exists in learner collection
        const learnerDocRef = doc(db, "learner", user.uid)
        const learnerDoc = await getDoc(learnerDocRef)

        // Check if user exists in intern collection
        const internDocRef = doc(db, "intern", user.uid)
        const internDoc = await getDoc(internDocRef)

        let collectionName = "courses" // Default collection

        if (learnerDoc.exists()) {
          setUserType("learner")
          collectionName = "courses"
        } else if (internDoc.exists()) {
          setUserType("intern")
          collectionName = "Intern_Course"
        } else {
          console.warn("User not found in either learner or intern collection")
        }

        // Fetch courses from the appropriate collection
        const querySnapshot = await getDocs(collection(db, collectionName))
        const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setCourseData(data)

        // Extract unique categories
        const uniqueCategories = [...new Set(data.map((course) => course.category).filter(Boolean))]
        setCategories(uniqueCategories)

        setLoading(false)
      } catch (error) {
        console.error("Error checking user type or fetching courses:", error)
        setLoading(false)
      }
    }

    checkUserTypeAndFetchCourses()
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

  // Show loading spinner while data is being fetched
  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-gray-100">
        <div className="w-full z-10"></div>
        <div className="flex flex-1">
          <div className="h-full z-5">
            <Sidebar />
          </div>
          <div
            className="flex-1 p-8 rounded-lg shadow-md overflow-y-auto transition-all duration-300 ease-in-out"
            style={{
              marginLeft: expanded ? "16rem" : "4rem",
              width: expanded ? "calc(100% - 16rem)" : "calc(100% - 4rem)",
            }}
          >
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FaSpinner className="animate-spin text-4xl text-indigo-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-800">Loading courses...</h2>
                <p className="text-gray-500 mt-2">Please wait while we fetch your courses</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show message if no courses are found
  if (!courseData.length) {
    return (
      <div className="flex flex-col h-screen bg-gray-100">
        <div className="w-full z-10"></div>
        <div className="flex flex-1">
          <div className="h-full z-5">
            <Sidebar />
          </div>
          <div
            className="flex-1 p-8 bg-white rounded-lg shadow-md overflow-y-auto transition-all duration-300 ease-in-out"
            style={{
              marginLeft: expanded ? "16rem" : "4rem",
              width: expanded ? "calc(100% - 16rem)" : "calc(100% - 4rem)",
            }}
          >
            <div className="text-center p-8">
              <div className="bg-indigo-100 p-4 rounded-full inline-flex items-center justify-center mb-4">
                <FaBook className="text-indigo-600 text-3xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">No courses found</h2>
              <p className="text-gray-600">Try changing your search criteria or check back later.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="w-full z-10"></div>
      <div className="flex flex-1">
        <div className="h-full z-5">
          <Sidebar />
        </div>
        <div
          className="flex-1 p-8 overflow-y-auto transition-all duration-300 ease-in-out"
          style={{
            marginLeft: expanded ? "16rem" : "4rem",
            width: expanded ? "calc(100% - 16rem)" : "calc(100% - 4rem)",
          }}
        >
          {/* Page Header */}
          <div className="bg-gradient-to-r from-sky-500 to-indigo-600 rounded-2xl shadow-lg mb-8 overflow-hidden">
            <div className="p-8">
              <div className="flex items-center mb-2">
                <div className="bg-white p-2 rounded-full shadow-md mr-3">
                  <FaGraduationCap className="text-indigo-600 text-xl" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  Courses {userType && `(${userType === "intern" ? "Intern" : "Learner"})`}
                </h1>
              </div>
              <p className="text-indigo-100 ml-12">Browse and enroll in our available courses</p>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              {/* Dropdown for Course Categories */}
              <div className="relative w-full md:w-48">
                <div className="text-sm text-gray-600 mb-1 font-medium">Category</div>
                <div
                  className="cursor-pointer flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
                  onClick={toggleDropdown}
                >
                  <span className="text-gray-700">
                    {selectedCategory === "all" ? "All Categories" : selectedCategory}
                  </span>
                  {isDropdownOpen ? (
                    <FaChevronUp className="text-gray-400" />
                  ) : (
                    <FaChevronDown className="text-gray-400" />
                  )}
                </div>
                {isDropdownOpen && (
                  <div className="absolute left-0 mt-1 w-full bg-white rounded-lg shadow-lg z-10 border border-gray-200">
                    <div
                      className="p-3 cursor-pointer hover:bg-gray-50"
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
                        className="p-3 cursor-pointer hover:bg-gray-50"
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
              <div className="relative w-full md:flex-1">
                <div className="text-sm text-gray-600 mb-1 font-medium">Search</div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Search for courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Show message if no filtered courses */}
          {filteredCourses.length === 0 ? (
            <div className="text-center p-8 bg-white rounded-xl shadow-md">
              <div className="bg-amber-100 p-4 rounded-full inline-flex items-center justify-center mb-4">
                <FaFilter className="text-amber-600 text-3xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No courses match your search</h3>
              <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
              <button
                onClick={() => {
                  setSearchTerm("")
                  setSelectedCategory("all")
                }}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={getCourseImageUrl(course) || "/placeholder.svg"}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = "/placeholder.svg?height=150&width=300"
                      }}
                    />
                    {course.category && (
                      <div className="absolute top-3 right-3 bg-indigo-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                        {course.category}
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{course.title}</h3>
                    <div className="text-gray-600 mb-4 min-h-[4rem]">
                      {expandedCourse === course.id ? (
                        <>
                          {course.description}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleDescription(course.id)
                            }}
                            className="text-indigo-600 hover:text-indigo-800 font-medium mt-2 inline-flex items-center"
                          >
                            Show Less <FaChevronUp className="ml-1" />
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
                              className="text-indigo-600 hover:text-indigo-800 font-medium mt-2 inline-flex items-center"
                            >
                              Show More <FaChevronDown className="ml-1" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleButtonClick(course.id)}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md font-medium"
                      >
                        {hasCourseStarted(course.id) ? "Continue" : "Start Course"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CourseCards
