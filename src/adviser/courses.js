import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, deleteDoc, doc, updateDoc, query, orderBy, limit, where } from "firebase/firestore";
import { db } from "../firebase.config";
import { FaTrash, FaEdit, FaSearch, FaSortAlphaDown, FaSortAlphaUp, FaFilter, FaTimes } from "react-icons/fa";
import IntSidebar from "./sidebar";
import Header from "../Dashboard/Header";
import ModuleDisplay from "./ModuleDisplay"; // Import the new component


// Styled Components
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f4f6f9;
`;

const HeaderWrapper = styled.div`
  width: 100%;
  z-index: 10;
`;

const ContentContainer = styled.div`
  display: flex;
  flex: 1;
`;

const SidebarWrapper = styled.div`
  height: 100%;
  z-index: 5;
`;

const MainContent = styled.div.attrs(({ isSidebarOpen }) => ({
  style: {
    marginLeft: isSidebarOpen ? "10px" : "240px",
    width: `calc(100% - ${isSidebarOpen ? "60px" : "240px"})`,
  },
}))`
  padding: 2rem;
  background-color: #f9f9f9;
  transition: margin-left 0.3s ease, width 0.3s ease;
  flex: 1;
  overflow-y: auto;
  height: 100%;
  border-radius: 8px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
`;

const CourseTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #333;
  border-bottom: 3px solid #3498db;
  padding-bottom: 10px;
  margin-bottom: 20px;
  letter-spacing: 0.5px;
`;

const CourseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;

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
`;

const CourseImage = styled.img`
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-bottom: 2px solid #ddd;
`;

const CourseDetails = styled.div`
  padding: 15px;
`;

const CourseCategory = styled.p`
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 5px;
`;

const CourseTitleCard = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
`;

const CourseDescription = styled.p`
  font-size: 14px;
  color: #555;
  margin-top: 5px;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

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
`;

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
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  width: 1000px;
  max-width: 220%;
  height: 50%;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h2 {
    font-size: 20px;
    font-weight: 600;
  }

  button {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
  }
`;

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;

  input, textarea, select {
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
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
    align-self: flex-end;

    &:hover {
      background-color: #2980b9;
    }
  }
`;

const CourseDashboard = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCourse, setEditingCourse] = useState(null);
  const coursesPerPage = 6;

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        let queryConstraints = [];
        if (categoryFilter !== "all") {
          queryConstraints.push(where("category", "==", categoryFilter));
        }
        queryConstraints.push(orderBy("title", sortOrder));
        queryConstraints.push(limit(coursesPerPage));

        const q = query(collection(db, "courses"), ...queryConstraints);
        const querySnapshot = await getDocs(q);
        const coursesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCourses(coursesData);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };

    fetchCourses();
  }, [sortOrder, categoryFilter, currentPage]);

  const handleAddCourse = () => {
    navigate("/addcourse");
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
  };

  const handleDeleteCourse = async (courseId) => {
    try {
      await deleteDoc(doc(db, "courses", courseId));
      setCourses(courses.filter((course) => course.id !== courseId));
      alert("Course deleted successfully!");
    } catch (error) {
      console.error("Error deleting course:", error);
      alert("An error occurred while deleting the course.");
    }
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSort = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const handleCategoryChange = (event) => {
    setCategoryFilter(event.target.value);
    setCurrentPage(1); // Reset to the first page when filtering
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setEditingCourse({ ...editingCourse, [name]: value });
  };

  const handleSubmitEdit = async () => {
    try {
      await updateDoc(doc(db, "courses", editingCourse.id), {
        ...editingCourse,
      });
      setCourses(courses.map((course) =>
        course.id === editingCourse.id ? editingCourse : course
      ));
      setEditingCourse(null);
      alert("Course updated successfully!");
    } catch (error) {
      console.error("Error updating course:", error);
      alert("An error occurred while updating the course.");
    }
  };

  const closeModal = () => {
    setEditingCourse(null);
  };

  const handleCourseClick = (courseId) => {
    navigate(`/modules/${courseId}`);
  };

  const filteredCourses = courses
    .filter((course) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * coursesPerPage,
    currentPage * coursesPerPage
  );

  return (
    <div>
      <CourseTitle>Courses</CourseTitle>
      <button
        onClick={handleAddCourse}
        className="flex items-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300 ease-in-out"
      >
        <i className="fas fa-plus mr-2"></i> Add Course
      </button>
      <br></br>
      <SearchInput>
        <input
          type="text"
          placeholder="Search courses..."
          value={searchTerm}
          onChange={handleSearch}
        />
        <button>
          <FaSearch />
        </button>
      </SearchInput>
      <FilterOptions>
        <button onClick={handleSort}>
          {sortOrder === "asc" ? <FaSortAlphaDown /> : <FaSortAlphaUp />} Sort
        </button>
        <select value={categoryFilter} onChange={handleCategoryChange}>
          <option value="all">All Categories</option>
          <option value="programming">Programming</option>
          <option value="design">Design</option>
          <option value="business">Business</option>
          <option value="marketing">Marketing</option>
          <option value="other">Other</option>
        </select>
      </FilterOptions>
      <CourseGrid>
        {paginatedCourses.map((course) => (
          <CourseCard key={course.id} onClick={() => handleCourseClick(course.id)}>
            <CourseImage src={course.fileUrl} alt={course.title} />
            <CourseDetails>
              <CourseTitleCard>{course.title}</CourseTitleCard>
              <CourseCategory>{course.category}</CourseCategory>
              <CourseDescription>{course.description}</CourseDescription>
              <ActionButtons>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditCourse(course);
                  }}
                  className="text-yellow-500 hover:text-yellow-700"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCourse(course.id);
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <FaTrash />
                </button>
              </ActionButtons>
            </CourseDetails>
          </CourseCard>
        ))}
      </CourseGrid>
      <div className="pagination">
        {Array.from({ length: Math.ceil(filteredCourses.length / coursesPerPage) }, (_, i) => (
          <button
            key={i}
            onClick={() => handlePageChange(i + 1)}
            disabled={i + 1 === currentPage}
            className={`px-3 py-1 m-1 ${i + 1 === currentPage ? "bg-blue-500 text-white" : "bg-gray-200"
              } rounded`}
          >
            {i + 1}
          </button>
        ))}
      </div>
      {editingCourse && (
        <ModalOverlay>
          <ModalContent>
            <ModalHeader>
              <h2>Edit Course</h2>
              <button onClick={closeModal}>
                <FaTimes />
              </button>
            </ModalHeader>
            <ModalBody>
              <input
                type="text"
                name="title"
                placeholder="Course Title"
                value={editingCourse.title}
                onChange={handleInputChange}
              />
              <textarea
                name="description"
                placeholder="Course Description"
                value={editingCourse.description}
                onChange={handleInputChange}
              ></textarea>
              <select
                name="category"
                value={editingCourse.category}
                onChange={handleInputChange}
              >
                <option value="programming">Programming</option>
                <option value="design">Design</option>
                <option value="business">Business</option>
                <option value="marketing">Marketing</option>
                <option value="other">Other</option>
              </select>
              <button onClick={handleSubmitEdit}>Save Changes</button>
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}
    </div>
  );
};

const ElearningDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <PageContainer>
      <HeaderWrapper>
        <Header />
      </HeaderWrapper>

      <ContentContainer>
        <SidebarWrapper>
          <IntSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        </SidebarWrapper>

        <MainContent isSidebarOpen={isSidebarOpen}>
          <CourseDashboard />
        </MainContent>
      </ContentContainer>
    </PageContainer>
  );
};

export default ElearningDashboard;