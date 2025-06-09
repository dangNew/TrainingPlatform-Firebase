import { Facebook, Linkedin, Youtube } from "lucide-react";
import { resourcesLinks } from "../constants/indexes";

const Footer = () => {
  return (
    <footer className="mt-20 border-t py-10 bg-neutral-900 text-white w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Resources Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-300">Resources</h3>
            <ul className="space-y-2">
              {resourcesLinks.map((link, index) => (
                <li key={index}>
                  <a className="text-gray-400 hover:text-white transition" href={link.href}>
                    {link.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Us + Social Icons */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-300">Contact Us</h3>
            <div className="text-gray-400 space-y-1">
              <p>(02) 8528 2000</p>
              <p>PLDT NDD Toll-Free:</p>
              <p>1800 10528 2000</p>
            </div>

            <div className="flex items-center gap-5 mt-6">
              <a
                href="https://www.facebook.com/AIAPhilippines/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <Facebook className="w-7 h-7 hover:text-blue-500 transition" />
              </a>
              <a
                href="https://www.linkedin.com/company/aiaphilippines/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-7 h-7 hover:text-blue-400 transition" />
              </a>
              <a
                href="https://www.youtube.com/aiaphilippines"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
              >
                <Youtube className="w-7 h-7 hover:text-red-500 transition" />
              </a>
            </div>
          </div>
        </div>

        {/* Optional footer bottom text */}
        <div className="mt-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} AIA Philippines. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
