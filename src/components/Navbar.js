import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.jpg";

const Navbar = ({ onHomeClick, onAboutClick, onProgramsClick, onContactClick }) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLoginClick = () => {
    navigate("/login");
    setMobileDrawerOpen(false);
  };

  const handleSignUpClick = () => {
    navigate("/signup");
    setMobileDrawerOpen(false);
  };

  const wrapScroll = (action) => {
    if (location.pathname !== "/") {
      navigate("/", { replace: true });
      setTimeout(() => action(), 100); // Delay to ensure component is mounted
    } else {
      action();
    }
    setMobileDrawerOpen(false);
  };

  const navItems = [
    { label: "Home", action: () => wrapScroll(onHomeClick) },
    { label: "About", action: () => wrapScroll(onAboutClick) },
    { label: "Programs", action: () => wrapScroll(onProgramsClick) },
    { label: "Contact", action: () => wrapScroll(onContactClick) },
  ];

  return (
    <nav className="sticky top-0 z-50 py-6 bg-[#201E43] text-white">
      <div className="container px-4 mx-auto relative text-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center flex-shrink-0">
            <img className="h-10 w-10 mr-2" src={logo} alt="logo" />
            <span className="text-xl tracking-tight">WealthFinancials</span>
          </div>
          <ul className="hidden lg:flex ml-14 space-x-12">
            {navItems.map((item, index) => (
              <li key={index}>
                <button onClick={item.action} className="hover:text-yellow-400 transition-colors">
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
          <div className="hidden lg:flex justify-center space-x-2 items-center">
            <button onClick={handleLoginClick} className="bg-gradient-to-r from-yellow-500 to-yellow-600 py-2 px-3 text-white rounded-md">
              Login
            </button>
            <button onClick={handleSignUpClick} className="py-2 px-3 border rounded-md">
              Register Now
            </button>
          </div>
          <div className="lg:hidden flex flex-col justify-end">
            <button onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}>
              {mobileDrawerOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {mobileDrawerOpen && (
          <div className="fixed top-0 right-0 bg-white text-black w-full py-8 z-50 flex flex-col items-center">
            <ul>
              {navItems.map((item, index) => (
                <li key={index} className="py-4">
                  <button onClick={item.action} className="text-black hover:text-yellow-500 transition-colors">
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex space-x-6 mt-6">
              <button onClick={handleLoginClick} className="py-2 px-3 border border-black rounded-md">
                Login
              </button>
              <button onClick={handleSignUpClick} className="bg-gradient-to-r from-yellow-500 to-yellow-600 py-2 px-3 text-white rounded-md">
                Register Now
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
