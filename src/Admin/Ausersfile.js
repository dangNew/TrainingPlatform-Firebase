import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase.config";
import {
  FaVideo,
  FaSearch,
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaDownload,
  FaTrash,
} from "react-icons/fa";
import Sidebar from "../Admin/Aside";
import Header from "../Dashboard/Header";
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
  margin-top: 100px;
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

const UserVideos = () => {
  const { userId } = useParams();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const videosSnapshot = await getDocs(collection(db, `learner/${userId}/Videos`));
        const videosData = videosSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setVideos(videosData);
      } catch (error) {
        console.error("Error fetching videos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [userId]);

  const handleSearch = (event) => setSearchTerm(event.target.value);
  const handleSort = () => setSortOrder(sortOrder === "asc" ? "desc" : "asc");

  const handleDelete = async (videoId) => {
    try {
      await deleteDoc(doc(db, `learner/${userId}/Videos`, videoId));
      setVideos(videos.filter((video) => video.id !== videoId));
    } catch (error) {
      console.error("Error deleting video:", error);
    }
  };

  const filteredVideos = videos.filter((video) => {
    const matchesSearchTerm = video.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || video.category === selectedCategory;
    return matchesSearchTerm && matchesCategory;
  });

  const sortedVideos = [...filteredVideos].sort((a, b) => {
    return sortOrder === "asc"
      ? a.fileName.localeCompare(b.fileName)
      : b.fileName.localeCompare(a.fileName);
  });

  const categories = ["All", ...new Set(videos.map((video) => video.category))];

  return (
    <PageContainer>
      <HeaderWrapper>
        <Header />
      </HeaderWrapper>
      <ContentContainer>
        <SidebarWrapper expanded={isSidebarOpen}>
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        </SidebarWrapper>
        <MainContent expanded={isSidebarOpen}>
          {/* Header */}
          <div className="bg-gradient-to-r from-sky-500 to-indigo-600 rounded-2xl shadow-lg mb-8 overflow-hidden">
            <div className="p-8 flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="bg-white p-3 rounded-full shadow-md mr-4">
                  <FaVideo className="text-indigo-600 text-3xl" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white">User Videos</h1>
                  <p className="text-indigo-100 mt-1">View and manage user videos</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search videos by filename..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center gap-4">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-3 px-4 rounded-xl border border-gray-200 transition-colors"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleSort}
                  className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-3 px-4 rounded-xl border border-gray-200 transition-colors"
                >
                  {sortOrder === "asc" ? (
                    <FaSortAlphaDown className="text-indigo-500" />
                  ) : (
                    <FaSortAlphaUp className="text-indigo-500" />
                  )}
                  <span>Sort {sortOrder === "asc" ? "A-Z" : "Z-A"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Videos Grid */}
          {loading ? (
            <div className="bg-white rounded-2xl shadow-md p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
              <p className="text-gray-500 text-lg">Loading videos...</p>
            </div>
          ) : sortedVideos.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-md p-12 text-center">
              <div className="bg-gray-100 p-4 rounded-full inline-flex items-center justify-center mb-4">
                <FaVideo className="text-gray-400 text-4xl" />
              </div>
              <h3 className="text-xl font-medium text-gray-700 mb-2">No videos found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm ? "Try adjusting your search criteria" : "No videos available"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedVideos.map((video) => (
                <div key={video.id} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition duration-300 overflow-hidden group">
                  <div className="relative">
                    <div className="bg-gray-200 h-40 flex items-center justify-center">
                      <FaVideo className="text-gray-400 text-4xl" />
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <a href={video.videoUrl} target="_blank" rel="noopener noreferrer" className="bg-indigo-600 text-white rounded-full p-3">
                        ▶
                      </a>
                    </div>
                    <button
                      onClick={() => handleDelete(video.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                    >
                      <FaTrash />
                    </button>
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 truncate" title={video.fileName}>
                      {video.fileName}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {video.comment || "No comment available"}
                    </p>
                    <div className="flex justify-between items-center mb-3 text-xs text-gray-500">
                      <span>{video.uploadedAt?.toDate().toLocaleDateString() || "Unknown date"}</span>
                      <span>{video.duration || "0:00"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <a
                        href={video.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-500 hover:underline flex items-center"
                      >
                        <FaVideo className="mr-2" /> Watch
                      </a>
                      <a
                        href={video.videoUrl}
                        download
                        className="text-green-500 hover:underline flex items-center"
                      >
                        <FaDownload className="mr-2" /> Download
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </MainContent>
      </ContentContainer>
    </PageContainer>
  );
};

export default UserVideos;
