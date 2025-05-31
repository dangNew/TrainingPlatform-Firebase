import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
} from "firebase/firestore";
import { db } from "../firebase.config";
import {
  FaSearch,
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaTimes,
  FaBook,
  FaCheckCircle,
  FaExclamationTriangle,
  FaPlus,
  FaFilter,
  FaEye,
} from "react-icons/fa";
import Sidebar from "../Admin/Aside";
import LgNavbar from "../components/LgNavbar";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import styled from "styled-components";

// Styled Components
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f4f6f9;
`;

const HeaderWrapper = styled.div`
  width: 100%;
  position: fixed;
  top: 0;
  z-index: 10;
`;

const ContentContainer = styled.div`
  display: flex;
  flex: 1;
  margin-top: 100px; // Adjust this value based on your header's height
`;

const SidebarWrapper = styled.div`
  position: fixed;
  height: 100%;
  z-index: 5;
  width: ${({ expanded }) => (expanded ? "16rem" : "4rem")};
`;

const MainContent = styled.div`
  flex: 1;
  padding: 2rem;
  border-radius: 8px;
  overflow-y: auto;
  transition: margin-left 0.3s ease, width 0.3s ease;
  margin-left: ${({ expanded }) => (expanded ? "16rem" : "4rem")};
  width: ${({ expanded }) => (expanded ? "calc(100% - 16rem)" : "calc(100% - 4rem)")};
`;

const CourseDashboard = ({ expanded }) => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [modal, setModal] = useState({ isOpen: false, type: "", content: null });
  const [pdfFile, setPdfFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const coursesPerPage = 6;

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      try {
        const queryConstraints = [];
        queryConstraints.push(orderBy("title", sortOrder));
        queryConstraints.push(limit(coursesPerPage));

        const q = query(collection(db, "courses"), ...queryConstraints);
        const querySnapshot = await getDocs(q);
        const coursesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Fetch from Intern_Course collection
        const internQuery = query(collection(db, "Intern_Course"), ...queryConstraints);
        const internQuerySnapshot = await getDocs(internQuery);
        const internCoursesData = internQuerySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Combine the results
        const combinedCourses = [...coursesData, ...internCoursesData];

        // Fetch comments for each course from the courseComments collection
        for (const course of combinedCourses) {
          const commentsQuery = query(collection(db, "courseComments"), where("courseId", "==", course.id));
          const commentsSnapshot = await getDocs(commentsQuery);
          course.comments = commentsSnapshot.docs.map((doc) => doc.data());
        }

        setCourses(combinedCourses);
      } catch (error) {
        console.error("Error fetching courses:", error);
        setModal({ isOpen: true, type: "error", content: "Error fetching courses." });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [sortOrder, currentPage]);

  const handleAddCourse = () => {
    navigate("/addcourse");
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSort = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const closeModal = () => {
    setModal({ isOpen: false, type: "", content: null });
    setPdfFile(null);
  };

  const handleCourseClick = (courseId) => {
    navigate(`/admin-modules/${courseId}`);
  };

  const handleViewFile = (fileUrl) => {
    if (fileUrl.endsWith(".pdf")) {
      setPdfFile(fileUrl);
      setModal({ isOpen: true, type: "viewPdf", content: fileUrl });
    } else {
      window.open(fileUrl, "_blank");
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
      course.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const paginatedCourses = filteredCourses.slice((currentPage - 1) * coursesPerPage, currentPage * coursesPerPage);

  return (
    <MainContent expanded={expanded}>
      {/* Header Section */}
      <div className="bg-gradient-to-r from-sky-500 to-indigo-600 rounded-2xl shadow-lg mb-8 overflow-hidden">
        <div className="p-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="bg-white p-3 rounded-full shadow-md mr-4">
              <FaBook className="text-indigo-600 text-3xl" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Course Library</h1>
              <p className="text-indigo-100 mt-1">Manage and organize your learning materials</p>
            </div>
          </div>
          <button
            onClick={handleAddCourse}
            className="flex items-center bg-white text-indigo-600 px-6 py-3 rounded-full hover:bg-indigo-50 transition duration-300 shadow-md"
          >
            <FaPlus className="mr-2" /> Add New Course
          </button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search courses by title or description..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSort}
              className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-3 px-4 rounded-xl border border-gray-200 transition-colors"
            >
              {sortOrder === "asc" ? (
                <FaSortAlphaDown className="text-indigo-500" />
              ) : (
                <FaSortAlphaUp className="text-indigo-500" />
              )}
              <span>Sort</span>
            </button>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="mb-8">
        {isLoading ? (
          <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <h3 className="text-xl font-medium text-gray-700 mb-2">Loading courses...</h3>
            <p className="text-gray-500">Please wait while we fetch your courses</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-8 text-center">
            <FaBook className="text-gray-300 text-5xl mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">No courses found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={
                      course.fileUrl?.url ||
                      "https://res.cloudinary.com/trainingplat-a/image/upload/v1743084091/modules/module_file_1743084087558_download%20(1).jpg" ||
                      "/placeholder.svg"
                    }
                    alt={course.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                    <div className="p-4 w-full">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewFile(course.fileUrl?.url);
                          }}
                          className="bg-white/90 p-2 rounded-full text-indigo-600 hover:bg-white transition-colors"
                          title="View Content"
                        >
                          <FaEye />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 cursor-pointer" onClick={() => handleCourseClick(course.id)}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-500 flex items-center">
                      <FaBook className="mr-1" /> {course.comments ? course.comments.length : 0} comments
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-800 mb-2 line-clamp-1">{course.title}</h3>

                  <p className="text-gray-600 text-sm line-clamp-3 mb-4 h-14">{course.description}</p>

                  <button
                    className="w-full text-center py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors font-medium"
                    onClick={() => handleCourseClick(course.id)}
                  >
                    View Modules
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredCourses.length > coursesPerPage && (
        <div className="flex justify-center mt-8 mb-4">
          <nav className="flex items-center space-x-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex space-x-1">
              {Array.from({ length: Math.ceil(filteredCourses.length / coursesPerPage) }, (_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg ${
                    i + 1 === currentPage
                      ? "bg-indigo-600 text-white"
                      : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === Math.ceil(filteredCourses.length / coursesPerPage)}
              className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {/* Modals */}
      {modal.isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {modal.type === "viewPdf"
                  ? "View File"
                  : modal.type === "success"
                    ? "Success"
                    : "Error"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
              >
                <FaTimes />
              </button>
            </div>

            {modal.type === "viewPdf" && pdfFile && (
              <div className="h-[500px] overflow-hidden rounded-xl border border-gray-200">
                <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js`}>
                  <Viewer fileUrl={pdfFile} defaultScale={1.5} />
                </Worker>
              </div>
            )}

            {(modal.type === "success" || modal.type === "error") && (
              <div className="text-center">
                {modal.type === "success" ? (
                  <div className="bg-emerald-100 p-3 rounded-full inline-flex items-center justify-center mb-4">
                    <FaCheckCircle className="text-emerald-500 text-2xl" />
                  </div>
                ) : (
                  <div className="bg-rose-100 p-3 rounded-full inline-flex items-center justify-center mb-4">
                    <FaExclamationTriangle className="text-rose-500 text-2xl" />
                  </div>
                )}
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {modal.type === "success" ? "Success" : "Error"}
                </h3>
                <p className="text-gray-500 mb-6">{modal.content}</p>
                <button
                  onClick={closeModal}
                  className={`px-6 py-2 rounded-lg font-medium ${
                    modal.type === "success"
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-rose-600 text-white hover:bg-rose-700"
                  }`}
                >
                  OK
                </button>
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
        <LgNavbar />
      </HeaderWrapper>
      <ContentContainer>
        <SidebarWrapper expanded={isSidebarOpen}>
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        </SidebarWrapper>
        <CourseDashboard expanded={isSidebarOpen} />
      </ContentContainer>
    </PageContainer>
  );
};

export default ElearningDashboard;
