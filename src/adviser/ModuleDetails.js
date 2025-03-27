import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase.config";
import { Viewer, Worker } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

const LoadingModal = ({ isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        <h2 className="text-xl font-semibold text-gray-800">Loading...</h2>
        <p className="mt-2 text-gray-600">Please wait while we fetch the data.</p>
      </div>
    </div>
  );
};

const ModuleDetails = () => {
  const { courseId, moduleId } = useParams();
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [error, setError] = useState(null);
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  useEffect(() => {
    const fetchModule = async () => {
      try {
        console.log("Fetching module data...");
        const moduleRef = doc(db, "courses", courseId, "modules", moduleId);
        const moduleSnap = await getDoc(moduleRef);

        if (moduleSnap.exists()) {
          const moduleData = moduleSnap.data();
          console.log("Module Data:", moduleData);

          // Debug: Log all fileUrls in chapters
          moduleData.chapters?.forEach((ch, index) =>
            console.log(`Chapter ${index + 1} File URL:`, ch.fileUrl)
          );

          setModule(moduleData);
        } else {
          console.error("Module not found");
          setError("Module not found.");
        }
      } catch (error) {
        console.error("Error fetching module:", error);
        setError("Failed to load module.");
      } finally {
        setLoading(false);
      }
    };

    fetchModule();
  }, [courseId, moduleId]);

  const inferContentType = (fileUrl) => {
    if (!fileUrl || typeof fileUrl !== "string") {
      return "application/octet-stream"; // Default unknown type
    }
    if (fileUrl.endsWith(".pdf")) return "application/pdf";
    if (fileUrl.match(/\.(jpg|jpeg|png)$/)) return "image/jpeg";
    if (fileUrl.match(/\.(mp4|mov)$/)) return "video/mp4";
    if (fileUrl.match(/\.(ppt|pptx)$/)) return "application/vnd.ms-powerpoint";
    return "application/octet-stream";
  };

  const renderFile = (fileUrl, contentType) => {
    if (!fileUrl) return <p className="text-red-500">No file available</p>;

    console.log("Rendering file:", fileUrl, "Type:", contentType);

    if (contentType === "application/pdf") {
      return (
        <div className="border rounded" style={{ height: '600px' }}>
          <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
            <Viewer fileUrl={fileUrl} plugins={[defaultLayoutPluginInstance]} />
          </Worker>
        </div>
      );
    }

    if (contentType.startsWith("video/")) {
      return (
        <video controls width="100%" height="600px" className="border rounded">
          <source src={fileUrl} type={contentType} />
          Your browser does not support the video tag.
        </video>
      );
    }

    if (contentType.startsWith("image/")) {
      return <img src={fileUrl} alt="Illustration" width="100%" className="border rounded" />;
    }

    if (contentType.includes("powerpoint")) {
      return (
        <iframe
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`}
          width="100%"
          height="600px"
          className="border rounded"
          title="PowerPoint Presentation"
        />
      );
    }

    return <p className="text-yellow-400">Unsupported file type.</p>;
  };

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Loading Modal */}
      <LoadingModal isOpen={loading} />

      {/* Sidebar for Chapter Navigation */}
      <div className="w-64 p-4 bg-gray-900 flex flex-col">
        <h2 className="text-xl font-semibold mb-4">Chapters</h2>
        <ul className="overflow-y-auto">
          {module?.chapters?.map((chapter, index) => (
            <li
              key={index}
              className={`p-2 cursor-pointer rounded ${
                index === selectedChapterIndex ? "bg-gray-800 text-blue-300" : "hover:bg-gray-700"
              }`}
              onClick={() => setSelectedChapterIndex(index)}
            >
              {chapter.title}
            </li>
          ))}
        </ul>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        {module && module.chapters && module.chapters.length > 0 ? (
          <>
            <h1 className="text-3xl font-bold text-blue-300 mb-4">{module.chapters[selectedChapterIndex].title}</h1>
            <p className="text-gray-400">{module.chapters[selectedChapterIndex].description}</p>

            {/* Debugging: Display raw file URL */}

            {/* Render File */}
            {module.chapters[selectedChapterIndex].fileUrl && (
              <div className="mt-4">
                {renderFile(module.chapters[selectedChapterIndex].fileUrl, inferContentType(module.chapters[selectedChapterIndex].fileUrl))}
              </div>
            )}
          </>
        ) : (
          <div className="text-red-500">Module data is missing or incomplete.</div>
        )}
      </div>
    </div>
  );
};

export default ModuleDetails;
