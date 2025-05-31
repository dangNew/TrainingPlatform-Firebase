import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Admin/Aside";
import Header from "../Dashboard/Header";
import { FaUser, FaSortAlphaDown, FaSortAlphaUp, FaSearch, FaEye, FaFolder } from "react-icons/fa";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase.config";
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

const UserTable = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  const navigate = useNavigate();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Fetch users from Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "learner"));
        const usersData = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSort = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const handleUserClick = (userId) => {
    navigate(`/file/${userId}`);
  };

  const handleViewFiles = (userId) => {
    navigate(`/file/${userId}/videos`);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    return sortOrder === "asc"
      ? a.fullName.localeCompare(b.fullName)
      : b.fullName.localeCompare(a.fullName);
  });

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
          {/* Header Section */}
          <div className="bg-gradient-to-r from-sky-500 to-indigo-600 rounded-2xl shadow-lg mb-8 overflow-hidden">
            <div className="p-8 flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="bg-white p-3 rounded-full shadow-md mr-4">
                  <FaUser className="text-indigo-600 text-3xl" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white">User Library</h1>
                  <p className="text-indigo-100 mt-1">Manage and organize your users</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter Section */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

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

          {/* Users Table */}
          {loading ? (
            <div className="bg-white rounded-2xl shadow-md p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
              <p className="text-gray-500 text-lg">Loading users...</p>
            </div>
          ) : sortedUsers.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-md p-12 text-center">
              <div className="bg-gray-100 p-4 rounded-full inline-flex items-center justify-center mb-4">
                <FaUser className="text-gray-400 text-4xl" />
              </div>
              <h3 className="text-xl font-medium text-gray-700 mb-2">No users found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm ? "Try adjusting your search criteria" : "No users available"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-2xl shadow-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certificates</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Files</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleUserClick(user.id)}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          {user.fullName}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.phoneNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.address}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.certificatesCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => window.open(user.photoURL?.url, "_blank")}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          <FaEye />
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewFiles(user.id)}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          <FaFolder />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </MainContent>
      </ContentContainer>
    </PageContainer>
  );
};

export default UserTable;
