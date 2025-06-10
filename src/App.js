// App.js
import React, { useState } from "react";
import {
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
} from "react-router-dom";
import { SidebarToggleContext } from "./components/LgNavbar";
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
import LibraryPage from "./adviser/LibraryPage";
import Adviser from "./adviser/sidebar";
import UploadContent from "./adviser/uploadcontent";
import AdviserChatroom from "./adviser/AdChatroom";
import Aprofile from "./adviser/Profile";

// Admin
import Adash from "./Admin/Adashboard";
import Admincourse from "./Admin/Acourse";
import AdminAddcourse from "./Admin/Aaddcourse";
import AdminAchat from "./Admin/AChat";
import Adminfilelibrary from "./Admin/Afilelibrary";
import Adminaddmodule from "./Admin/AModule";
import AdminQuiz from "./Admin/Aquiz";
import AdminModuldisplay from "./Admin/AModuleDisplay";
import AdminModuledetails from "./Admin/AModuleDetails";
import AdminUsersfile from "./Admin/Ausersfile";

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
import UserSettings from "./Learner/userSettings";
import AboutUs from "./Learner/aboutus";

// Components
import NavBar from "./components/Navbar";
import LNavbar from "./components/LgNavbar";
import LSidebar from "./components/LSidebar";

import "./index.css";

const NavBarWrapper = () => {
  const location = useLocation();
  const showNavBar = ["/login", "/signup"].includes(location.pathname);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return showNavBar ? (
    <NavBar
      onHomeClick={() => scrollToSection("home")}
      onAboutClick={() => scrollToSection("about")}
      onProgramsClick={() => scrollToSection("programs")}
      onContactClick={() => scrollToSection("contact")}
    />
  ) : null;
};

const LNavBarWrapper = () => {
  const location = useLocation();
  const excludePaths = ["/", "/login", "/signup"];
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
    "/settings",
  ];
  const isLearnerPath = learnerPaths.some(path =>
    location.pathname === path || location.pathname.startsWith(`${path}/`)
  );
  const showLNavBar = isLearnerPath && !excludePaths.includes(location.pathname);

  return showLNavBar ? <LNavbar /> : null;
};

const LSidebarWrapper = () => {
  const location = useLocation();
  const learnerPaths = [
    "/user-dashboard",
    "/chatroom",
    "/lcourses",
    "/lcourse",
    "/lmodules",
    "/certificates",
    "/resources",
    "/announcement",
    "/settings",
  ];
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
        <LSidebarWrapper />
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
          <Route path="/library/:libraryId" element={<LibraryPage />} />
          <Route path="/addmodule" element={<Addmodule />} />
          <Route path="/modules/:courseId" element={<Moduledisplay />} />
          <Route path="/course/:courseId/module/:moduleId" element={<ModuleDetails />} />
          <Route path="/addquiz" element={<AddQuiz />} />
          <Route path="/Achat" element={<AdviserChatroom />} />
          <Route path="/profile" element={<Aprofile />} />

          {/* Admin Routes */}
          <Route path="/admin-dashboard" element={<Adash />} />
          <Route path="/admin-course" element={<Admincourse />} />
          <Route path="/admin-addcourse" element={<AdminAddcourse />} />
          <Route path="/admin-filelibrary" element={<Adminfilelibrary />} />
          <Route path="/admin-addmodule" element={<Adminaddmodule />} />
          <Route path="/admin-quiz" element={<AdminQuiz />} />
          <Route path="/admin-display" element={<AdminModuldisplay />} />
          <Route path="/admin-modules/:courseId" element={<AdminModuldisplay />} />
          <Route path="/admin-course/:courseId/module/:moduleId" element={<AdminModuledetails />} />
          <Route path="/file/:userId" element={<AdminUsersfile />} />
          <Route path="/file/:userId/videos" element={<AdminUsersfile />} />

          {/* Learner Routes */}
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
          <Route path="/announcement/:announcementId?" element={<AnnouncementPage />} />
          <Route path="/settings" element={<UserSettings />} />
          <Route path="/about" element={<AboutUs />} />

        </Routes>
      </Router>
    </SidebarToggleContext.Provider>
  );
}

export default App;
