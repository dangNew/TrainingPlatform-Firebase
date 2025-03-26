import {
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
} from "react-router-dom";
import SignUp from "./Authentication/Signup";
import Login from "./Authentication/login";
import Dashboard from "./Dashboard/Dashboard";
import LandingPage from "./Dashboard/Landing";
import Addmodule from "./adviser/AddModule";
import AddCourses from "./adviser/Addcourse";
import ModuleDetails from './adviser/ModuleDetails';
import Moduledisplay from "./adviser/ModuleDisplay";
import AddQuiz from './adviser/addquiz';
import Courses from "./adviser/courses";
import FileLibrary from "./adviser/filelibrary";
import Adviser from "./adviser/sidebar";
import UploadContent from "./adviser/uploadcontent";
import NavBar from "./components/Navbar";
import "./index.css";



//learners
import CertificatePage from "./Learner/Certificates";
import ChatRoom from "./Learner/Chatroom";
import LCourses from "./Learner/LCourses";
import ModuleViewer from "./Learner/LModuleView";
import ModuleDisplay from "./Learner/LModules";
import LProfile from "./Learner/LProfile";
import UserDashboard from "./Learner/userdashboard";

// Create a wrapper component for the NavBar
const NavBarWrapper = () => {
  const location = useLocation();
  const showNavBar = ["/", "/login", "/signup"].includes(location.pathname);
  return showNavBar ? <NavBar /> : null;
};

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
        <Route path="/file-library" element={<FileLibrary />} />
        <Route path="/addmodule" element={<Addmodule />} />
        <Route path="/modules/:courseId" element={<Moduledisplay />} />
        <Route path="/course/:courseId/module/:moduleId" element={<ModuleDetails />} />
        <Route path="/addquiz" element={<AddQuiz />} />




        <Route path="/user-dashboard" element={<UserDashboard />} />
        <Route path="/chatroom" element={<ChatRoom />} />
        <Route path="/lprofile" element={<LProfile />} />
        <Route path="/lcourses" element={<LCourses />} />
        <Route path="/lcourse/:courseId" element={<ModuleDisplay />} />
        <Route path="/lmodules/:courseId" element={<ModuleDisplay />} />
        <Route path="/certificates" element={<CertificatePage />} /> 
        <Route path="/module-viewer" element={<ModuleViewer />} />     
      </Routes>
    </Router>
  );
}

export default App;
