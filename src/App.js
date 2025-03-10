import "./index.css";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import LandingPage from "./Dashboard/Landing";
import Login from "./Authentication/login";
import SignUp from "./Authentication/Signup";
import Adviser from "./adviser/sidebar";
import Dashboard from "./Dashboard/Dashboard";
import UploadContent from "./adviser/uploadcontent";
<<<<<<< HEAD
import Courses from "./adviser/courses"
import AddCourses from "./adviser/Addcourse"
import FileLibrary from "./adviser/filelibrary"
import Addmodule from "./adviser/AddModule"
import Moduledisplay from "./adviser/ModuleDisplay"
=======
import Courses from "./adviser/courses";
import AddCourses from "./adviser/Addcourse";
import NavBar from "./components/Navbar";


//learners
import UserDashboard from "./Learner/userdashboard";
import ChatRoom from "./Learner/Chatroom";
import LProfile from "./Learner/LProfile";
import LCourses from "./Learner/LCourses";
import ModuleDisplay from "./Learner/LModules";

// Create a wrapper component for the NavBar
const NavBarWrapper = () => {
  const location = useLocation();
  const showNavBar = ["/", "/login", "/signup"].includes(location.pathname);
  return showNavBar ? <NavBar /> : null;
};
>>>>>>> d9661d7 (Added Learners features)

function App() {
  return (
    <Router>
      <NavBarWrapper />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/sidebar" element={<Adviser />} />
        <Route path="/upload-content" element={<UploadContent />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/addcourse" element={<AddCourses />} />
<<<<<<< HEAD
        <Route path="/file-library" element={<FileLibrary />} />
        <Route path="/addmodule" element={<Addmodule />} />
        <Route path="/modules/:courseId" element={<Moduledisplay />} />
        
=======

        <Route path="/user-dashboard" element={<UserDashboard />} />
        <Route path="/chatroom" element={<ChatRoom />} />
        <Route path="/lprofile" element={<LProfile/>}/>
        <Route path="/lcourses" element={<LCourses />} />
        <Route path="/lcourse/:courseId" element={<ModuleDisplay />} />      
>>>>>>> d9661d7 (Added Learners features)
      </Routes>
    </Router>
  );
}

export default App;
