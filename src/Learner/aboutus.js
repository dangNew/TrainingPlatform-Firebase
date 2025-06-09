import React from "react";
import logo from "../assets/logo.jpg"; // adjust the path if AboutUs.js is in a different folder

const AboutUs = () => {
  return (
    <div className="bg-white text-gray-800">
      {/* Hero Section with Overlayed Text */}
      <div className="relative w-full h-[400px] md:h-[500px]">
        <img
          src={logo}
          alt="AIA Philippines"
          className="w-full h-full object-cover brightness-50"
        />
        <div className="absolute inset-0 flex flex-col justify-center items-center text-white text-center px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">
            We are the premier life insurance company in the Philippines
          </h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xl font-semibold">
            <div>
              <p>₱276.73 B</p>
              <span className="text-sm font-normal">Total assets</span>
            </div>
            <div>
              <p>₱72.21 B</p>
              <span className="text-sm font-normal">Net worth</span>
            </div>
            <div>
              <p>800K</p>
              <span className="text-sm font-normal">Individual policyholders</span>
            </div>
            <div>
              <p>800K</p>
              <span className="text-sm font-normal">Insured group members</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vision & Mission */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
        <p className="mb-8 text-lg">
          To be the Philippines' leading life insurance provider.
        </p>

        <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
        <p className="mb-8 text-lg">
          We race against risk to protect every Filipino family and empower them to live Healthier, Longer, Better Lives.
        </p>

        <h2 className="text-2xl font-bold mb-4">Protecting Filipinos One Step at a Time</h2>
        <p className="mb-6 text-lg">
          At AIA Philippines, we know that life never stops changing, and that people need a partner who understands and supports them through life’s challenges and opportunities.
        </p>
        <p className="mb-6 text-lg">
          This is why we are committed to engage with our customers through meaningful dialogue. By talking to them, we know that we can better provide them with the right solutions and the right plans that turn struggles into successes, fears into peace in mind, and dreams into reality.
        </p>
        <p className="mb-6 text-lg">
          We at AIA Philippines are proud to be part of AIA, the largest independent publicly listed pan-Asian life insurance group. Together, we endeavor to help each and every customer live Healthier, Longer and Better Lives.
        </p>

        <p className="text-lg font-semibold mt-8">Serving Filipinos for over 75 years</p>
      </div>
    </div>
  );
};

export default AboutUs;
