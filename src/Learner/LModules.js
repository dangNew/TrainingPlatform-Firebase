import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase.config';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import Sidebar from '../components/LSidebar';

const ModuleDisplay = () => {
  const { courseId } = useParams();
  const [modules, setModules] = useState([]);
  const [courseData, setCourseData] = useState(null);

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

    fetchModules();
    fetchCourseData();
  }, [courseId]);

  if (!modules.length || !courseData) {
    return <div>Loading...</div>;
  }

  // Mock function to determine if a module has been started
  const hasModuleStarted = (moduleId) => {
    // Replace with actual logic to check if the module has been started
    return false;
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-col p-4 w-full">
        {/* Header with Background Image */}
        <div
          className="h-48 bg-cover bg-center mb-4"
          style={{ backgroundImage: `url(${courseData.fileUrl})` }}
        >
          <div className="bg-black bg-opacity-50 h-full flex items-center p-6">
            <div className="text-white">
              <h1 className="text-4xl font-bold">{courseData.title}</h1>
              <p className="text-lg">{courseData.description}</p>
            </div>
          </div>
        </div>

        {/* Module List */}
        <div className="flex flex-col space-y-4">
          {modules.map((module, index) => (
            <div key={module.id} className="h-32 w-full bg-slate-200 flex rounded-xl border dark:border-gray-800 transition-all duration-300 hover:scale-[1.02] hover:shadow-black-500/20">
              <div className="h-full w-60 p-4 text-white bg-[#261a6b] rounded-l-xl flex flex-col justify-center items-center">
                <h1 className="text-lg font-medium tracking-wide">
                  Module {module.module}
                </h1>
              </div>
              <div className="p-4 bg-white w-full rounded-r-xl relative flex flex-col justify-between">
                <div className="flex justify-between">
                  <h1 className="text-gray-600 text-sm tracking-[.5px]">CHAPTER 1</h1>
                  <div className="relative">
                    <div className="h-1 w-[100px] bg-slate-200 rounded-xl">
                      <div className="h-1 w-[60px] bg-[#261a6b] rounded-xl"></div>
                    </div>
                    <p className="text-gray-500 text-xs tracking-[.5px] absolute right-0">
                      {/* Placeholder for challenges */}
                    </p>
                  </div>
                </div>
                <h1 className="text-xl font-semibold tracking-wide">
                  {module.title}
                </h1>
                <input
                  type="button"
                  value={hasModuleStarted(module.id) ? 'Continue' : 'Start'}
                  className="h-8 w-[80px] bg-[#261a6be8] text-white rounded-3xl tracking-wide absolute right-4 bottom-4 cursor-pointer hover:bg-[#4938b6e8]"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModuleDisplay;
