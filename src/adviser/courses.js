import React, { useState } from "react";
import styled from "styled-components";
import IntSidebar from "./sidebar";
import Header from "../Dashboard/Header";
import { useNavigate } from "react-router-dom";

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
    marginLeft: isSidebarOpen ? "60px" : "240px",
    width: `calc(100% - ${isSidebarOpen ? "60px" : "240px"})`,
  },
}))`
  padding: 2rem;
  background-color: #fff;
  transition: margin-left 0.3s ease, width 0.3s ease;
  flex: 1;
  overflow-y: auto;
  height: 100%;
  border-radius: 8px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
`;

// Styling for the title
const CourseTitle = styled.h1`
  font-size: 22px;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 3px solid #3498db;
  padding-bottom: 10px;
  margin-bottom: 20px;
  letter-spacing: 0.5px;
`;

// Table styling with better spacing and a clean look
const TableWrapper = styled.div`
  width: 100%;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  background: #3498db;
  color: white;
  padding: 14px;
  text-align: left;
  font-weight: 600;
  letter-spacing: 0.5px;
`;

const Td = styled.td`
  padding: 12px;
  border-bottom: 1px solid #ddd;
`;

const Tr = styled.tr`
  &:nth-child(even) {
    background: #f8f9fa;
  }
  &:hover {
    background: #eef5ff;
  }
`;

// Styled action buttons
const ActionButton = styled.button`
  background-color: ${(props) => (props.delete ? "#e74c3c" : "#3498db")};
  color: white;
  border: none;
  padding: 8px 12px;
  margin: 4px;
  cursor: pointer;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  transition: background 0.3s ease;

  &:hover {
    background-color: ${(props) => (props.delete ? "#c0392b" : "#2980b9")};
  }
`;

// Search input styling
const SearchInput = styled.input`
  padding: 10px;
  margin-bottom: 15px;
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 14px;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
`;

// Add Course Button
const AddButton = styled.button`
  background-color: #2ecc71;
  color: white;
  border: none;
  padding: 12px;
  cursor: pointer;
  font-size: 14px;
  border-radius: 6px;
  font-weight: 600;
  transition: background 0.3s ease;

  &:hover {
    background-color: #27ae60;
  }
`;

// Course Dashboard Component
const CourseDashboard = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleDelete = (id) => {
    setCourses(courses.filter((course) => course.id !== id));
  };

  const handleAddCourse = () => {
    navigate("/addcourse");
  };

  return (
    <div>
      <CourseTitle>Courses</CourseTitle>
      <SearchInput
        type="text"
        placeholder="Search courses..."
        value={search}
        onChange={handleSearchChange}
      />
      <AddButton onClick={handleAddCourse}>+ Add Course</AddButton>

      <TableWrapper>
        <Table>
          <thead>
            <tr>
              <Th>ID</Th>
              <Th>Name</Th>
              <Th>Created</Th>
              <Th>Lessons</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {courses
              .filter((course) => course.name.toLowerCase().includes(search.toLowerCase()))
              .map((course) => (
                <Tr key={course.id}>
                  <Td>{course.id}</Td>
                  <Td>{course.name}</Td>
                  <Td>{course.created}</Td>
                  <Td>{course.lessons}</Td>
                  <Td>
                    <ActionButton>Add Participants</ActionButton>
                    <ActionButton delete onClick={() => handleDelete(course.id)}>
                      Delete
                    </ActionButton>
                  </Td>
                </Tr>
              ))}
          </tbody>
        </Table>
      </TableWrapper>
    </div>
  );
};

// Elearning Dashboard Component
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
