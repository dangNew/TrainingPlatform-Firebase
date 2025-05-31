// components/LibraryPage.js
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase.config";
import Header from "../Dashboard/Header";
import IntSidebar from "./sidebar";
import styled from "styled-components";

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
  margin-left: ${({ expanded }) => (expanded ? "16rem" : "4rem")};
  width: ${({ expanded }) => (expanded ? "calc(100% - 16rem)" : "calc(100% - 4rem)")};
`;

const LibraryPage = () => {
  const { libraryId } = useParams();
  const [modules, setModules] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!libraryId) {
      console.error('Course ID is undefined');
      return;
    }

    const fetchModules = async () => {
      try {
        const modulesRef = collection(db, `courses/${libraryId}/modules`);
        const modulesSnapshot = await getDocs(modulesRef);
        const modulesData = modulesSnapshot.docs.map((doc) => doc.data());
        setModules(modulesData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching modules:', error);
        setLoading(false);
      }
    };

    fetchModules();
  }, [libraryId]);

  return (
    <PageContainer>
      <HeaderWrapper>
        <Header />
      </HeaderWrapper>
      <ContentContainer>
        <SidebarWrapper expanded={isSidebarOpen}>
          <IntSidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        </SidebarWrapper>
        <MainContent expanded={isSidebarOpen}>
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Modules in Course {libraryId}</h1>

          {loading ? (
            <p>Loading...</p>
          ) : modules.length === 0 ? (
            <p>No modules found in this course.</p>
          ) : (
            <ul className="space-y-4">
              {modules.map((module, index) => (
                <li key={index} className="bg-white p-4 rounded-xl shadow">
                  <h2 className="font-semibold">{module.title}</h2>
                  <p className="text-sm text-gray-500">{module.description}</p>
                </li>
              ))}
            </ul>
          )}
        </MainContent>
      </ContentContainer>
    </PageContainer>
  );
};

export default LibraryPage;
