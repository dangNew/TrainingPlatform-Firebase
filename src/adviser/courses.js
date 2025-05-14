import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  limit,
  where,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase.config";
import {
  FaTrash,
  FaEdit,
  FaSearch,
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaTimes,
  FaBook,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import IntSidebar from "./sidebar";
import LgNavbar from "../components/LgNavbar"; // Import the LgNavbar component
import ModuleDisplay from "./ModuleDisplay";
import { Viewer, Worker } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import deleteFromCloudinary from "../deleteFromCloudinary";
import styled from 'styled-components';

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

const MainContent = styled.div`
  flex: 1;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  transition: margin-left 0.3s ease, width 0.3s ease;
  margin-left: ${({ expanded }) => (expanded ? "0rem" : "4rem")};
  width: ${({ expanded }) => (expanded ? "calc(100% - 16rem)" : "calc(100% - 4rem)")};
`;

const CourseDashboard = ({ expanded }) => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [modal, setModal] = useState({ isOpen: false, type: '', content: null });
  const [editingCourse, setEditingCourse] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
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
        setModal({ isOpen: true, type: 'error', content: 'Error fetching courses.' });
      }
    };

    fetchCourses();
  }, [sortOrder, categoryFilter, currentPage]);

  const handleAddCourse = () => {
    navigate("/addcourse");
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setModal({ isOpen: true, type: 'edit', content: course });
  };

  const handleDeleteCourse = (courseId) => {
    setModal({ isOpen: true, type: 'delete', content: courseId });
  };

  const confirmDeleteCourse = async (courseId) => {
    try {
      const courseDocRef = doc(db, "courses", courseId);
      const courseDoc = await getDoc(courseDocRef);
      const courseData = courseDoc.data();

      const filePublicIds = courseData.filePublicIds || [];

      for (const publicId of filePublicIds) {
        await deleteFromCloudinary(publicId);
      }

      const modulesCollectionRef = collection(courseDocRef, "modules");
      const modulesSnapshot = await getDocs(modulesCollectionRef);
      const deletePromises = modulesSnapshot.docs.map((moduleDoc) =>
        deleteDoc(doc(modulesCollectionRef, moduleDoc.id))
      );
      await Promise.all(deletePromises);

      await deleteDoc(courseDocRef);
      setCourses(courses.filter((course) => course.id !== courseId));
      setModal({ isOpen: true, type: 'success', content: 'Course deleted successfully!' });
    } catch (error) {
      console.error("Error deleting course:", error);
      setModal({ isOpen: true, type: 'error', content: 'An error occurred while deleting the course.' });
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
    setCurrentPage(1);
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
        title: editingCourse.title,
        description: editingCourse.description,
        category: editingCourse.category,
      });
      setCourses(
        courses.map((course) =>
          course.id === editingCourse.id ? editingCourse : course
        )
      );
      setModal({ isOpen: true, type: 'success', content: 'Course updated successfully!' });
    } catch (error) {
      console.error("Error updating course:", error);
      setModal({ isOpen: true, type: 'error', content: 'An error occurred while updating the course.' });
    }
  };

  const closeModal = () => {
    setModal({ isOpen: false, type: '', content: null });
    setEditingCourse(null);
    setPdfFile(null);
  };

  const handleCourseClick = (courseId) => {
    navigate(`/modules/${courseId}`);
  };

  const handleViewFile = (fileUrl) => {
    if (fileUrl.endsWith('.pdf')) {
      setPdfFile(fileUrl);
      setModal({ isOpen: true, type: 'viewPdf', content: fileUrl });
    } else {
      window.open(fileUrl, '_blank');
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const settings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * coursesPerPage,
    currentPage * coursesPerPage
  );

  return (
    <MainContent expanded={expanded}>
      <div className="p-8 bg-blue-100 rounded-lg shadow-lg mb-6">
        <div className="flex items-center mb-4">
          <FaBook className="text-blue-500 text-4xl mr-4" />
          <h1 className="text-4xl font-bold text-blue-600">Courses</h1>
        </div>
        <button
          onClick={handleAddCourse}
          className="flex items-center bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition duration-300"
        >
          <FaEdit className="mr-2" /> Add Course
        </button>
      </div>
      <div className="p-6 flex-1">
        <div className="flex items-center mb-4">
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={handleSearch}
            className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 mr-2"
          />
          <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            <FaSearch />
          </button>
        </div>
        <div className="flex items-center mb-4">
          <button
            onClick={handleSort}
            className="mr-2 p-2 border border-gray-300 rounded hover:bg-gray-200"
          >
            {sortOrder === "asc" ? <FaSortAlphaDown /> : <FaSortAlphaUp />} Sort
          </button>
          <select
            value={categoryFilter}
            onChange={handleCategoryChange}
            className="p-2 border border-gray-300 rounded-full hover:bg-gray-200"
          >
            <option value="all">All Categories</option>
            <option value="programming">Programming</option>
            <option value="design">Design</option>
            <option value="business">Business</option>
            <option value="marketing">Marketing</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedCourses.map((course) => (
            <div
              key={course.id}
              onClick={() => handleCourseClick(course.id)}
              className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition duration-300 cursor-pointer"
            >
              <img
                src={course.fileUrl?.url || "https://res.cloudinary.com/trainingplat-a/image/upload/v1743084091/modules/module_file_1743084087558_download%20(1).jpg"}
                alt={course.title}
                className="w-full h-40 object-cover rounded-t-2xl mb-4"
              />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {course.title}
              </h3>
              <p className="text-sm text-gray-600 mb-1">{course.category}</p>
              <p className="text-gray-700">{course.description}</p>
              <div className="flex justify-end mt-4 space-x-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditCourse(course);
                  }}
                  className="text-yellow-500 hover:text-yellow-700 rounded-full"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCourse(course.id);
                  }}
                  className="text-red-500 hover:text-red-700 rounded-full"
                >
                  <FaTrash />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewFile(course.fileUrl?.url);
                  }}
                  className="text-blue-500 hover:text-blue-700 rounded-full"
                >
                  <FaBook />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-6 space-x-2">
          {Array.from(
            { length: Math.ceil(filteredCourses.length / coursesPerPage) },
            (_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i + 1)}
                disabled={i + 1 === currentPage}
                className={`px-3 py-1 rounded-full ${
                  i + 1 === currentPage
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
              >
                {i + 1}
              </button>
            )
          )}
        </div>
      </div>
      {modal.isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {modal.type === 'edit' ? 'Edit Course' : modal.type === 'delete' ? 'Confirm Delete' : modal.type === 'viewPdf' ? 'View File' : ''}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>
            {modal.type === 'edit' && editingCourse && (
              <div className="space-y-4">
                <input
                  type="text"
                  name="title"
                  placeholder="Course Title"
                  value={editingCourse.title}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  name="description"
                  placeholder="Course Description"
                  value={editingCourse.description}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                ></textarea>
                <select
                  name="category"
                  value={editingCourse.category}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="programming">Programming</option>
                  <option value="design">Design</option>
                  <option value="business">Business</option>
                  <option value="marketing">Marketing</option>
                  <option value="other">Other</option>
                </select>
                <button
                  onClick={handleSubmitEdit}
                  className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Save Changes
                </button>
              </div>
            )}
            {modal.type === 'delete' && (
              <div className="text-center">
                <FaExclamationTriangle className="text-red-500 text-4xl mb-4" />
                <p>Are you sure you want to delete this course?</p>
                <div className="flex justify-end mt-4">
                  <button onClick={closeModal} className="mr-2 px-4 py-2 bg-gray-300 rounded">Cancel</button>
                  <button onClick={() => confirmDeleteCourse(modal.content)} className="px-4 py-2 bg-red-600 text-white rounded">Delete</button>
                </div>
              </div>
            )}
            {modal.type === 'viewPdf' && pdfFile && (
              <div>
                <Slider {...settings}>
                  {Array.from({ length: numPages }, (_, i) => (
                    <div key={i} style={{ height: '500px' }}>
                      <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js`}>
                        <Viewer fileUrl={pdfFile} defaultScale={1.5} pageNumber={i + 1} />
                      </Worker>
                    </div>
                  ))}
                </Slider>
              </div>
            )}
            {(modal.type === 'success' || modal.type === 'error') && (
              <div className="text-center">
                {modal.type === 'success' ? (
                  <FaCheckCircle className="text-green-500 text-4xl mb-4" />
                ) : (
                  <FaExclamationTriangle className="text-red-500 text-4xl mb-4" />
                )}
                <p>{modal.content}</p>
                <div className="flex justify-center mt-4">
                  <button onClick={closeModal} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">OK</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </MainContent>
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
        <LgNavbar /> {/* Use the LgNavbar component */}
      </HeaderWrapper>
      <ContentContainer>
        <SidebarWrapper>
          <IntSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        </SidebarWrapper>
        <CourseDashboard expanded={isSidebarOpen} />
      </ContentContainer>
    </PageContainer>
  );
};

export default ElearningDashboard;
