import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png"; // Adjust the path as necessary

const Header = () => {
  return (
    <header className="bg-red-700 text-white py-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center px-6">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <img src={logo} alt="Logo" className="h-12" />
          <span className="text-2xl font-semibold tracking-wide">
            Infinite Wealth Financials
          </span>
        </div>

        {/* Navigation */}
        <nav>
          <ul className="flex space-x-6">
            <li>
              <Link to="/" className="transition-colors duration-300 hover:text-yellow-400">
                Home
              </Link>
            </li>
            <li>
              <Link to="/about" className="transition-colors duration-300 hover:text-yellow-400">
                About Us
              </Link>
            </li>
            <li>
              <Link to="/contact" className="transition-colors duration-300 hover:text-yellow-400">
                Contact Us
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
