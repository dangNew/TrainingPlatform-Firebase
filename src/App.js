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
import AdviserChatroom from "./adviser/AdChatroom";

import NavBar from "./components/Navbar";
import LNavbar, { SidebarToggleContext } from "./components/LgNavbar";
import LSidebar from "./components/LSidebar"; // Import the correct sidebar
import "./index.css";
import { useState } from "react";

// Learners
import CertificatePage from "./Learner/Certificates";
import ChatRoom from "./Learner/Chatroom";
import LCourses from "./Learner/LCourses";
import ModuleViewer from "./Learner/LModuleView";
import ModuleDisplay from "./Learner/LModules";
import LProfile from "./Learner/LProfile";
import UserDashboard from "./Learner/userdashboard";
import QuizTaker from "./Learner/quiz-taker";
import ResourcePage from "./Learner/Resources";
import AnnouncementPage from "./Learner/LAnnouncement";

// Create a wrapper component for the NavBar
const NavBarWrapper = () => {
  const location = useLocation();
  const showNavBar = ["/", "/login", "/signup"].includes(location.pathname);
  return showNavBar ? <NavBar /> : null;
};

// Create a wrapper component for the LNavbar
const LNavBarWrapper = () => {
  const location = useLocation();

  // Define paths where LNavbar should NOT be shown
  const excludePaths = ["/", "/login", "/signup"];

  // Define paths where LNavbar should be shown (all learner routes)
  const learnerPaths = [
    "/user-dashboard",
    "/chatroom",
    "/lprofile",
    "/lcourses",
    "/lcourse",
    "/lmodules",
    "/certificates",
    "/resources",
    "/announcement",
  ];

  // Check if current path starts with any learner path
  const isLearnerPath = learnerPaths.some(path =>
    location.pathname === path || location.pathname.startsWith(`${path}/`)
  );

  // Show LNavbar if it's a learner path and not in exclude paths
  const showLNavBar = isLearnerPath && !excludePaths.includes(location.pathname);

  return showLNavBar ? <LNavbar /> : null;
};

// Create a wrapper component for the LSidebar
const LSidebarWrapper = () => {
  const location = useLocation();

  // Define paths where LSidebar should be shown (all learner routes)
  const learnerPaths = [
    "/user-dashboard",
    "/chatroom",
    "/lprofile",
    "/lcourses",
    "/lcourse",
    "/lmodules",
    "/certificates",
    "/resources",
    "/announcement",
  ];

  // Check if current path starts with any learner path
  const isLearnerPath = learnerPaths.some(path =>
    location.pathname === path || location.pathname.startsWith(`${path}/`)
  );

  return isLearnerPath ? <LSidebar /> : null;
};

function App() {
  const [expanded, setExpanded] = useState(true);

  return (
    <SidebarToggleContext.Provider value={{ expanded, setExpanded }}>
      <Router>
        <NavBarWrapper />
        <LNavBarWrapper />
        <LSidebarWrapper /> {/* Conditionally render LSidebar */}
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
          <Route path="/Achat" element={<AdviserChatroom />} />

          <Route path="/user-dashboard" element={<UserDashboard />} />
          <Route path="/chatroom" element={<ChatRoom />} />
          <Route path="/lprofile" element={<LProfile />} />
          <Route path="/lcourses" element={<LCourses />} />
          <Route path="/lcourse/:courseId" element={<ModuleDisplay />} />
          <Route path="/lmodules/:courseId" element={<ModuleDisplay />} />
          <Route path="/certificates" element={<CertificatePage />} />
          <Route path="/module-viewer" element={<ModuleViewer />} />
          <Route path="/quiz-taker" element={<QuizTaker />} />
          <Route path="/resources" element={<ResourcePage />} />
          <Route path="/navbar" element={<LNavbar />} />
          <Route path="/announcement" element={<AnnouncementPage />} />
        </Routes>
      </Router>
    </SidebarToggleContext.Provider>
  );
}

export default App;
