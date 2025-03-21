import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase.config';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import Sidebar from '../components/LSidebar';
import styled from 'styled-components';

const MainContent = styled.div`
  flex: 1;
  padding: 2rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  margin-left: 10px;
`;

const ModuleDisplay = () => {
  const { courseId } = useParams();
  const [modules, setModules] = useState([]);
  const [courseData, setCourseData] = useState(null);
  const [completedModules, setCompletedModules] = useState([]);

  useEffect(() => {
    const fetchModules = async () => {
      const modulesCollection = collection(db, 'courses', courseId, 'modules');
      const querySnapshot = await getDocs(modulesCollection);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setModules(data);
    };

    const fetchCourseData = async () => {
      const courseDoc = doc(db, 'courses', courseId);
      const courseSnapshot = await getDoc(courseDoc);
      if (courseSnapshot.exists()) {
        setCourseData(courseSnapshot.data());
      }
    };

    // Retrieve completed modules from localStorage
    const savedProgress = JSON.parse(localStorage.getItem(`completedModules_${courseId}`)) || [];
    setCompletedModules(savedProgress);

    fetchModules();
    fetchCourseData();
  }, [courseId]);

  const handleStartModule = (module, index) => {
    if (index === 0 || completedModules.includes(modules[index - 1]?.id)) {
      // Open ModuleView in a new tab with the moduleId as a URL parameter
      window.open(`/module-viewer?courseId=${courseId}&moduleId=${module.id}`, "_blank");
      markModuleAsCompleted(module.id);
    }
  };

  const markModuleAsCompleted = (moduleId) => {
    if (!completedModules.includes(moduleId)) {
      const updatedCompletedModules = [...completedModules, moduleId];
      setCompletedModules(updatedCompletedModules);
      localStorage.setItem(`completedModules_${courseId}`, JSON.stringify(updatedCompletedModules));
    }
  };

  if (!modules.length || !courseData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <MainContent>
        {/* Header with Background Image */}
        <div
          className="h-48 bg-cover bg-center mb-4"
          style={{ backgroundImage: `url(${courseData.fileUrl})` }}
        >
          <div className="bg-black bg-opacity-50 h-full flex flex-col justify-center p-6">
            <h1 className="text-white text-4xl font-bold">{courseData.title}</h1>
            <p className="text-white text-sm mt-1">{courseData.description}</p>
          </div>
        </div>

        {/* Module List */}
        <div className="flex flex-col space-y-4">
          {modules.map((module, index) => {
            const isUnlocked = index === 0 || completedModules.includes(modules[index - 1]?.id);
            return (
              <div
                key={module.id}
                className="h-24 w-full bg-slate-200 flex rounded-xl border shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="h-full w-60 p-4 text-white bg-blue-950 rounded-l-xl flex flex-col justify-center items-center">
                  <h1 className="text-lg font-medium tracking-wide">Module {index + 1}</h1>
                </div>
                <div className="p-4 bg-white w-full rounded-r-xl relative flex flex-col justify-between">
                  <h1 className="text-gray-600 text-sm font-bold tracking-[.5px]">{module.title}</h1>
                  <p className="text-gray-500 text-xs">{module.description}</p>
                  <button
                    className={`h-8 w-[80px] ${
                      isUnlocked ? "bg-blue-950 text-white hover:bg-[#4938b6e8]" : "bg-gray-400 text-gray-200 cursor-not-allowed"
                    } rounded-3xl tracking-wide absolute right-4 bottom-4`}
                    disabled={!isUnlocked}
                    onClick={() => handleStartModule(module, index)}
                  >
                    Start
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </MainContent>
    </div>
  );
};

export default ModuleDisplay;
