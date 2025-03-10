import React, { useEffect, useState } from 'react';
import { db } from '../firebase.config';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/LSidebar';

const CourseCards = () => {
  const [courseData, setCourseData] = useState([]);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, 'courses'));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCourseData(data);
    };

    fetchData();
  }, []);

  if (!courseData.length) {
    return <div>Loading...</div>;
  }

  const hasCourseStarted = (courseId) => {
    // Replace with actual logic to check if the course has been started
    return false;
  };

  const toggleDescription = (courseId) => {
    setExpandedCourse(expandedCourse === courseId ? null : courseId);
  };

  const handleButtonClick = (courseId) => {
    navigate(`/lcourse/${courseId}`);
  };
  
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-wrap p-4">
        {courseData.map((course, index) => (
          <div key={index} className="w-full sm:w-1/2 md:w-1/3 p-4">
            <div className="relative flex flex-col rounded-xl bg-white bg-clip-border text-gray-700 shadow-md w-80">
              <div className="relative mx-4 -mt-6 h-40 overflow-hidden rounded-xl">
                <img className="w-full h-full object-cover" src={course.fileUrl} alt={course.title} />
              </div>
              <div className="p-6">
                <h5 className="mb-2 block font-sans text-xl font-semibold leading-snug tracking-normal text-blue-gray-900 antialiased">
                  {course.title}
                </h5>
                <p className="mb-2 block font-sans text-sm font-light uppercase leading-relaxed text-inherit antialiased">
                  {course.category}
                </p>
                <p className="block font-sans text-base font-light leading-relaxed text-inherit antialiased">
                  {expandedCourse === course.id ? (
                    <>
                      {course.description}
                      <button
                        onClick={() => toggleDescription(course.id)}
                        className="text-blue-500 mt-2"
                      >
                        Show Less
                      </button>
                    </>
                  ) : (
                    <>
                      {course.description.slice(0, 100)}...
                      <button
                        onClick={() => toggleDescription(course.id)}
                        className="text-blue-500 mt-2"
                      >
                        Show More
                      </button>
                    </>
                  )}
                </p>
              </div>
              <div className="p-6 pt-0">
                <button
                  type="button"
                  onClick={() => handleButtonClick(course.id)}
                  className="select-none rounded-lg bg-blue-500 py-3 px-6 text-center align-middle font-sans text-xs font-bold uppercase text-white shadow-md transition-all hover:shadow-lg focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                >
                  {hasCourseStarted(course.id) ? 'Continue' : 'Start'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseCards;
