import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.jpg";

const Navbar = () => {
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const navigate = useNavigate();

    const toggleNavbar = () => {
        setMobileDrawerOpen(!mobileDrawerOpen);
    };

    const handleLoginClick = () => {
        navigate("/login");
        setMobileDrawerOpen(false);
    };

    const handleSignUpClick = () => {
        navigate("/signup");
        setMobileDrawerOpen(false);
    };

    const navItems = [
        { label: "Home", href: "/" },
        { label: "About", href: "#" },
        { label: "Programs", href: "#" },
        { label: "Contact", href: "#" },
    ];

    return (
        <nav className="sticky top-0 z-50 py-6 bg-[#201E43] text-white">
            <div className="container px-4 mx-auto relative text-sm">
                <div className="flex justify-between items-center">
                    <div className="flex items-center flex-shrink-0">
                        <img className="h-10 w-10 mr-2" src={logo} alt="logo"/>
                        <span className="text-xl tracking-tight">WealthFinancials</span>
                    </div>
                    <ul className="hidden lg:flex ml-14 space-x-12">
                        {navItems.map((item, index) => (
                            <li key={index} className="nav-item">
                                <a
                                    href={item.href}
                                    style={{
                                        position: 'relative',
                                        textDecoration: 'none',
                                        color: 'white',
                                        transition: 'color 0.3s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.color = '#FFD700';
                                        e.target.style.setProperty('--hover-color', '#FFD700');
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.color = 'white';
                                        e.target.style.setProperty('--hover-color', 'transparent');
                                    }}
                                >
                                    {item.label}
                                    <span
                                        style={{
                                            content: '""',
                                            position: 'absolute',
                                            width: '100%',
                                            transform: 'scaleX(0)',
                                            height: '2px',
                                            bottom: 0,
                                            left: 0,
                                            backgroundColor: 'var(--hover-color)',
                                            transformOrigin: 'bottom right',
                                            transition: 'transform 0.3s ease-out',
                                        }}
                                    ></span>
                                </a>
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
                        <button onClick={toggleNavbar}>
                            {mobileDrawerOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>
                {mobileDrawerOpen && (
                    <div style={{ background: 'white', position: 'fixed', right: 0, zIndex: 20, width: '100%', padding: '3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'black' }} className="lg:hidden">
                        <ul>
                            {navItems.map((item, index) => (
                                <li key={index} className="py-4 nav-item">
                                    <a
                                        href={item.href}
                                        style={{
                                            position: 'relative',
                                            textDecoration: 'none',
                                            color: 'black',
                                            transition: 'color 0.3s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.color = '#FFD700';
                                            e.target.style.setProperty('--hover-color', '#FFD700');
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.color = 'black';
                                            e.target.style.setProperty('--hover-color', 'transparent');
                                        }}
                                    >
                                        {item.label}
                                        <span
                                            style={{
                                                content: '""',
                                                position: 'absolute',
                                                width: '100%',
                                                transform: 'scaleX(0)',
                                                height: '2px',
                                                bottom: 0,
                                                left: 0,
                                                backgroundColor: 'var(--hover-color)',
                                                transformOrigin: 'bottom right',
                                                transition: 'transform 0.3s ease-out',
                                            }}
                                        ></span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                        <div className="flex space-x-6">
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
}

export default Navbar;
