import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, getDoc, doc, getDocs, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase.config";
import { FaEdit, FaTrash } from "react-icons/fa"; // Import edit and delete icons
import styled from "styled-components";
import IntSidebar from "./sidebar"; // Import your sidebar component
import Header from "../Dashboard/Header"; // Import your header component

const ModuleDisplay = () => {
  const { courseId } = useParams();
  const [modules, setModules] = useState([]);
  const [course, setCourse] = useState(null);
  const [editingModule, setEditingModule] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch course data
        const courseDocRef = doc(db, "courses", courseId);
        const courseDocSnap = await getDoc(courseDocRef);
        if (courseDocSnap.exists()) {
          setCourse(courseDocSnap.data());
        }

        // Fetch modules data
        const modulesCollectionRef = collection(courseDocRef, "modules");
        const querySnapshot = await getDocs(modulesCollectionRef);
        const modulesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setModules(modulesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [courseId]);

  const handleEditModule = (module) => {
    setEditingModule(module);
    // Add logic to handle editing, such as opening a modal
  };

  const handleDeleteModule = async (moduleId) => {
    try {
      const courseDocRef = doc(db, "courses", courseId);
      await deleteDoc(doc(courseDocRef, "modules", moduleId));
      setModules(modules.filter((module) => module.id !== moduleId));
      alert("Module deleted successfully!");
    } catch (error) {
      console.error("Error deleting module:", error);
      alert("An error occurred while deleting the module.");
    }
  };

  if (!course) {
    return <div>Loading...</div>;
  }

  return (
    <PageContainer>
      <HeaderWrapper>
        <Header />
      </HeaderWrapper>
      <ContentContainer>
        <SidebarWrapper>
          <IntSidebar />
        </SidebarWrapper>
        <MainContent>
          <CourseHeader>
            <CourseTitle>{course.title}</CourseTitle>
            <CourseImage src={course.fileUrl} alt={course.title} />
          </CourseHeader>
          <ModuleContainer>
            <ModuleList>
              {modules.map((module, index) => (
                <ModuleItem key={module.id}>
                  <ModuleIcon>
                    {/* Replace with actual icon logic if needed */}
                    {index + 1}
                  </ModuleIcon>
                  <ModuleContent>
                    <ModuleTitle>Module {index + 1} – {module.title}</ModuleTitle>
                  </ModuleContent>
                  <ActionButtons>
                    <button onClick={() => handleEditModule(module)}>
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDeleteModule(module.id)}>
                      <FaTrash />
                    </button>
                  </ActionButtons>
                </ModuleItem>
              ))}
            </ModuleList>
          </ModuleContainer>
        </MainContent>
      </ContentContainer>
    </PageContainer>
  );
};

export default ModuleDisplay;

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
  padding: 2rem;
  background-color: #f9f9f9;
  transition: margin-left 0.3s ease, width 0.3s ease;
  flex: 1;
  overflow-y: auto;
  height: 100%;
  border-radius: 8px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
`;

const CourseHeader = styled.div`
  margin-bottom: 20px;
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

const CourseImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 20px;
`;

const ModuleContainer = styled.div`
  padding: 20px;
  background-color: #f9f9f9;
`;

const ModuleList = styled.ul`
  list-style: none;
  padding: 0;
`;

const ModuleItem = styled.li`
  display: flex;
  align-items: center;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 10px;
  background-color: #fff;
`;

const ModuleIcon = styled.div`
  width: 40px;
  height: 40px;
  background-color: #e74c3c;
  border-radius: 50%;
  margin-right: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
`;

const ModuleContent = styled.div`
  flex: 1;
`;

const ModuleTitle = styled.h2`
  font-size: 18px;
  color: #333;
  margin: 0;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;

  button {
    background: none;
    border: none;
    cursor: pointer;
    color: #333;
    font-size: 20px;

    &:hover {
      color: #e74c3c;
    }
  }
`;

