import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/Logo-removebg-preview.png"; // Adjust the path as necessary

const Header = () => {
  return (
    <header className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center">
          <img src={logo} alt="Logo" className="h-12 mr-2" />
          <span className="text-xl font-bold">Infinite Wealth Financials</span>
        </div>

        {/* Navigation */}
        <nav>
          <ul className="flex space-x-4">
            <li>
              <Link to="/" className="hover:text-gray-400">Home</Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-gray-400">About Us</Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-gray-400">Contact Us</Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
