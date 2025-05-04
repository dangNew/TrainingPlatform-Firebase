import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, getDoc, doc, getDocs, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase.config";
import { FaEdit, FaTrash, FaTimes, FaSearch, FaFilter, FaBook, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import IntSidebar from "./sidebar";
import Header from "../Dashboard/Header";

const ModuleDisplay = () => {
  const { courseId } = useParams();
  const [modules, setModules] = useState([]);
  const [course, setCourse] = useState(null);
  const [editingModule, setEditingModule] = useState(null);
  const [deletingModuleId, setDeletingModuleId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", content: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [modal, setModal] = useState({ isOpen: false, type: '', message: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const courseDocRef = doc(db, "courses", courseId);
        const courseDocSnap = await getDoc(courseDocRef);
        if (courseDocSnap.exists()) {
          setCourse(courseDocSnap.data());
        }

        const modulesCollectionRef = collection(courseDocRef, "modules");
        const querySnapshot = await getDocs(modulesCollectionRef);
        const modulesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setModules(modulesData);
      } catch (error) {
        console.error("Error fetching data:", error);
        showModal("error", "An error occurred while fetching data.");
      }
    };

    fetchData();
  }, [courseId]);

  const handleEditModule = (module) => {
    setEditingModule(module);
    setFormData({ title: module.title, description: module.description, content: module.content });
    setIsEditing(true);
  };

  const handleDeleteModule = (moduleId) => {
    setDeletingModuleId(moduleId);
    setIsDeleting(true);
  };

  const confirmDeleteModule = async () => {
    try {
      const courseDocRef = doc(db, "courses", courseId);
      await deleteDoc(doc(courseDocRef, "modules", deletingModuleId));
      setModules(modules.filter((module) => module.id !== deletingModuleId));
      setIsDeleting(false);
      showModal("success", "Module deleted successfully!");
    } catch (error) {
      console.error("Error deleting module:", error);
      showModal("error", "An error occurred while deleting the module.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    try {
      const courseDocRef = doc(db, "courses", courseId);
      const moduleDocRef = doc(courseDocRef, "modules", editingModule.id);

      console.log("Updating module with ID:", editingModule.id);
      console.log("New data:", formData);

      await updateDoc(moduleDocRef, formData);

      setModules(modules.map((module) =>
        module.id === editingModule.id ? { ...module, ...formData } : module
      ));
      setIsEditing(false);
      showModal("success", "Module updated successfully!");
    } catch (error) {
      console.error("Error updating module:", error);
      showModal("error", "An error occurred while updating the module.");
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredModules = modules.filter((module) =>
    module.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModuleDetails = (moduleId) => {
    window.open(`/course/${courseId}/module/${moduleId}`, '_blank', 'noopener,noreferrer');
  };

  const showModal = (type, message) => {
    setModal({ isOpen: true, type, message });
    setTimeout(() => {
      setModal({ isOpen: false, type: '', message: '' });
    }, 3000);
  };

  if (!course) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <IntSidebar />
        <div className="flex-1 p-6 overflow-y-auto bg-white rounded-lg shadow-lg">
          <div className="mb-6 relative bg-blue-100 p-6 rounded-lg shadow-inner">
            <div className="flex items-center mb-4">
              <FaBook className="text-blue-500 text-4xl mr-4" />
              <h1 className="text-3xl font-bold text-blue-600">{course.title}</h1>
            </div>
            <div className="relative w-full h-48 rounded-2xl overflow-hidden shadow-lg">
              <img src={course.fileUrl?.url || "https://res.cloudinary.com/trainingplat-a/image/upload/v1743084091/modules/module_file_1743084087558_download%20(1).jpg"} alt={course.title} className="w-full h-full object-cover rounded-2xl" />
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-center p-4 rounded-2xl">
                <p className="text-lg">{course.description}</p>
              </div>
            </div>
          </div>
          <div className="flex justify-between mb-4">
            <input
              type="text"
              placeholder="Search modules by title..."
              value={searchTerm}
              onChange={handleSearch}
              className="flex-1 p-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500"
            />
            <button className="ml-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              <FaSearch />
            </button>
            <button className="ml-2 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400">
              <FaFilter /> Filter
            </button>
          </div>
          <div className="space-y-4">
            {filteredModules.map((module, index) => (
              <div key={module.id} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-lg">
                <div
                  className="flex items-center flex-1 cursor-pointer"
                  onClick={() => openModuleDetails(module.id)}
                >
                  <div className="w-10 h-10 bg-red-500 text-white flex items-center justify-center rounded-full mr-4 text-lg font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      Module {index + 1} – {module.title}
                    </h2>
                    <p className="text-sm text-gray-600">{module.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <button onClick={() => handleEditModule(module)} className="text-yellow-500 hover:text-yellow-700 rounded-full">
                    <FaEdit />
                  </button>
                  <button onClick={() => handleDeleteModule(module.id)} className="text-red-500 hover:text-red-700 rounded-full">
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {isEditing && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Edit Module</h2>
              <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-gray-700">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleSubmitEdit} className="space-y-4">
              <input
                type="text"
                name="title"
                placeholder="Module Title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              ></textarea>
              <textarea
                name="content"
                placeholder="Content"
                value={formData.content}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              ></textarea>
              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
      {isDeleting && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-2xl">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-xl font-bold text-gray-800">Confirm Delete</h2>
              <button onClick={() => setIsDeleting(false)} className="text-gray-500 hover:text-gray-700">
                <FaTimes />
              </button>
            </div>
            <div className="flex items-center mb-4">
              <FaTrash className="text-red-500 text-4xl mr-4" />
              <p className="font-bold text-lg">Are you sure you want to delete this module?</p>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => setIsDeleting(false)} className="mr-2 px-4 py-2 bg-gray-300 rounded">Cancel</button>
              <button onClick={confirmDeleteModule} className="px-4 py-2 bg-red-600 text-white rounded">Delete</button>
            </div>
          </div>
        </div>
      )}
      {modal.isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-16 rounded-2xl shadow-lg w-full max-w-2xl">
            <div className="flex items-center mb-10">
              {modal.type === "success" ? (
                <FaCheckCircle className="text-green-500 text-6xl mr-6" />
              ) : (
                <FaExclamationTriangle className="text-red-500 text-6xl mr-6" />
              )}
              <p className="text-gray-900 font-bold text-2xl">{modal.message}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-700 text-lg">
                Additional details or actions can go here if needed.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuleDisplay;
