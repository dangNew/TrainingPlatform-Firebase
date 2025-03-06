import { Menu, X } from "lucide-react";
import { useState } from "react";
import logo from "../assets/Logo-removebg-preview.png"; // Corrected path
import { navItems } from "../constants/indexes";

const Navbar = () => {
    const[mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

    const toggleNavbar = () => {
        setMobileDrawerOpen(!mobileDrawerOpen);
    };

  return (
    <nav className="sticky top-0 z-50 py-3 bg-[#201E43] text-white">
        <div className="container px-4 mx-auto relative text-sm">
            <div className="flex justify-between items-center">
                <div className="flex items-center flex-shrink-0">
                    <img className="h-10 w-10 mr-2" src={logo} alt="logo"/>
                    <span className="text-xl tracking-tight">WealthFinancials</span>
                </div>
                <ul className="hidden lg:flex ml-14 space-x-12">
                    {navItems.map ((item, index) => (
                        <li key={index}>
                            <a href={item.href}>{item.label}</a>
                        </li>
                    ))}
                </ul>
                <div className="hidden lg:flex justify-center space-x-2 items-center">
                    <a href="#" className="bg-gradient-to-r from-yellow-500 to-yellow-600 py-2 px-3 text-white rounded-md">
                        Login
                    </a>
                    <a href="#" className="py-2 px-3 border rounded-md">
                        Register Now
                    </a>
                </div>
                <div className="lg:hidden flex flex-col justify-end">
                    <button onClick={toggleNavbar}>
                        {mobileDrawerOpen ? <X /> : <Menu />}
                    </button>
            </div>
        </div>
        {mobileDrawerOpen && ( 
            <div style={{ background: 'lightblue', position: 'fixed', right: 0, zIndex: 20, width: '100%', padding: '3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }} className="lg:hidden">
            <ul>
                    {navItems.map((item, index) => (
                        <li key={index} className="py-4">
                            <a href={item.href}>{item.label}</a>
                        </li>
                    ))}
                </ul>
                <div className="flex space-x-6">
                    <a href="#" className="py-2 px-3 border rounded-md">
                        Login
                    </a>
                    <a href="#" className="bg-gradient-to-r from-yellow-500 to-yellow-600 py-2 px-3 text-white rounded-md">
                        Register Now
                    </a>
                </div>
            </div>
        )}
        </div>
    </nav>
  )
}

export default Navbar
