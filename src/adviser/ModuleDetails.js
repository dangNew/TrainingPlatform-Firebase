import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase.config";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import {
  FaBook,
  FaFilePdf,
  FaFileVideo,
  FaFileImage,
  FaFilePowerpoint,
  FaSpinner,
  FaArrowLeft,
  FaArrowRight,
  FaComment,
  FaCheckCircle,
} from "react-icons/fa";

const LoadingModal = ({ isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
    let url = fileUrl;
    if (typeof fileUrl === "object" && fileUrl !== null && "url" in fileUrl) {
      url = fileUrl.url;
    }

    if (!url || typeof url !== "string") {
      return "application/octet-stream"; // Default unknown type
    }
    if (url.endsWith(".pdf")) return "application/pdf";
    if (url.match(/\.(jpg|jpeg|png)$/)) return "image/jpeg";
    if (url.match(/\.(mp4|mov)$/)) return "video/mp4";
    if (url.match(/\.(ppt|pptx)$/)) return "application/vnd.ms-powerpoint";
    return "application/octet-stream";
  };

  const renderFile = (fileUrl, contentType) => {
    if (!fileUrl) return <p className="text-red-500">No file available</p>;

    // Ensure fileUrl is a string
    const url = typeof fileUrl === "object" ? fileUrl.url : fileUrl;

    if (contentType === "application/pdf") {
      return (
        <div
          className="border rounded-lg shadow-lg bg-gray-700"
          style={{ height: "600px" }}
          key={url}
        >
          <Worker
            workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}
          >
            <Viewer fileUrl={url} plugins={[defaultLayoutPluginInstance]} />
          </Worker>
        </div>
      );
    }

    if (contentType.startsWith("video/")) {
      return (
        <video
          controls
          className="w-full max-w-4xl mx-auto border rounded-lg shadow-lg bg-gray-700"
          key={url}
        >
          <source src={url} type={contentType} />
          Your browser does not support the video tag.
        </video>
      );
    }

    if (contentType.startsWith("image/")) {
      return (
        <img
          src={url}
          alt="Illustration"
          className="w-full max-w-4xl mx-auto border rounded-lg shadow-lg bg-gray-700"
          key={url}
        />
      );
    }

    if (contentType.includes("powerpoint")) {
      return (
        <iframe
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
            url
          )}`}
          className="w-full border rounded-lg shadow-lg bg-gray-700"
          style={{ height: "600px" }}
          title="PowerPoint Presentation"
          key={url}
        />
      );
    }

    return <p className="text-yellow-400">Unsupported file type.</p>;
  };

  const handleChapterClick = (index) => {
    setSelectedChapterIndex(index);
  };

  const handleNextChapter = () => {
    if (selectedChapterIndex < module.chapters.length - 1) {
      setSelectedChapterIndex(selectedChapterIndex + 1);
    }
  };

  const handlePreviousChapter = () => {
    if (selectedChapterIndex > 0) {
      setSelectedChapterIndex(selectedChapterIndex - 1);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Loading Modal */}
      <LoadingModal isOpen={loading} />

      {/* Sidebar for Chapter Navigation */}
      <div className="w-64 p-4 bg-gray-800 flex flex-col shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-blue-300 flex items-center">
          <FaBook className="mr-2" /> Chapters
        </h2>
        <ul className="overflow-y-auto">
          {module?.chapters?.map((chapter, index) => (
            <li
              key={index}
              className={`p-3 cursor-pointer rounded mb-2 flex items-center transition-colors ${
                index === selectedChapterIndex
                  ? "bg-blue-700 text-blue-300"
                  : "hover:bg-gray-700"
              }`}
              onClick={() => handleChapterClick(index)}
            >
              {index === selectedChapterIndex ? (
                <FaSpinner className="mr-2 animate-spin" />
              ) : (
                <FaBook className="mr-2" />
              )}
              {chapter.title}
            </li>
          ))}
        </ul>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-y-auto bg-gray-800">
        {module && module.chapters && module.chapters.length > 0 ? (
          <>
            <div className="bg-gray-700 p-6 rounded-lg shadow-lg mb-6">
              <h1 className="text-3xl font-bold text-blue-300 mb-4 flex items-center">
                <FaBook className="mr-2" />{" "}
                {module.chapters[selectedChapterIndex].title}
              </h1>
              <p className="text-gray-300">
                {module.chapters[selectedChapterIndex].description}
              </p>
            </div>

            {/* Module Overview Section */}
            <div className="bg-gray-700 p-6 rounded-lg shadow-lg mb-6">
              <h2 className="text-2xl font-semibold text-blue-300 mb-4 flex items-center">
                <FaCheckCircle className="mr-2" /> Module Overview
              </h2>
              <p className="text-gray-300">
                In this module, you will learn about...
              </p>
            </div>

            {/* Render File */}
            {module.chapters[selectedChapterIndex].fileUrl && (
              <div className="mt-4">
                {renderFile(
                  module.chapters[selectedChapterIndex].fileUrl,
                  inferContentType(
                    module.chapters[selectedChapterIndex].fileUrl
                  )
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <button
                onClick={handlePreviousChapter}
                disabled={selectedChapterIndex === 0}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 disabled:opacity-50"
              >
                <FaArrowLeft className="mr-2" /> Previous
              </button>
              <button
                onClick={handleNextChapter}
                disabled={selectedChapterIndex === module.chapters.length - 1}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 disabled:opacity-50"
              >
                Next <FaArrowRight className="ml-2" />
              </button>
            </div>

            {/* Discussion Section */}
            <div className="bg-gray-700 p-6 rounded-lg shadow-lg mt-6">
              <h2 className="text-2xl font-semibold text-blue-300 mb-4 flex items-center">
                <FaComment className="mr-2" /> Discussion
              </h2>
              <p className="text-gray-300">
                Join the discussion or ask questions related to this module.
              </p>
            </div>
          </>
        ) : (
          <div className="text-red-500">
            Module data is missing or incomplete.
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleDetails;
