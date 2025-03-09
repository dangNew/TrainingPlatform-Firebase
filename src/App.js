import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./Dashboard/Landing";
import Login from "./Authentication/login"; // Updated path
import SignUp from "./Authentication/Signup"; // Added SignUp route
import Adviser from "./adviser/sidebar";
import Dashboard from "./Dashboard/Dashboard";
import UploadContent from "./adviser/uploadcontent";
import Courses from "./adviser/courses"
import AddCourses from "./adviser/Addcourse"
import FileLibrary from "./adviser/filelibrary"
import Addmodule from "./adviser/AddModule"
import Moduledisplay from "./adviser/ModuleDisplay"

  
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />{" "}
        {/* Explicit route for /login */}
        <Route path="/signup" element={<SignUp />} />
        <Route path="/sidebar" element={<Adviser />} />
        <Route path="/upload-content" element={<UploadContent />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/addcourse" element={<AddCourses />} />
        <Route path="/file-library" element={<FileLibrary />} />
        <Route path="/addmodule" element={<Addmodule />} />
        <Route path="/modules/:courseId" element={<Moduledisplay />} />
        
      </Routes>
    </Router>
  );
}

export default App;
