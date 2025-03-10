import { IoIosArrowForward } from "react-icons/io";
import video1 from "../assets/video1.mp4";
import video2 from "../assets/video2.mp4";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export const FadeUp = (delay) => {
  return {
    initial: {
      opacity: 0,
      y: 50,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        duration: 0.5,
        delay: delay,
        ease: "easeInOut",
      }
    }
  }
}

const HeroSection = () => {
  const [currentVideo, setCurrentVideo] = useState(0);
  const videos = [video1, video2];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVideo((prevVideo) => (prevVideo + 1) % videos.length);
    }, 10000); // Change video every 10 seconds

    return () => clearInterval(interval);
  }, [videos.length]);

  const handleDotClick = (index) => {
    setCurrentVideo(index);
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-screen">
      {/* Video Background */}
      <div className="container p-0 relative w-screen h-3/4 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          className="absolute top-0 left-0 w-full h-full object-cover m-auto"
          key={currentVideo}
        >
          <source src={videos[currentVideo]} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Content Overlay with Blurry Effect */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 backdrop-blur-sm bg-black bg-opacity-40">
          <motion.h1
            variants={FadeUp(0.6)}
            initial="initial"
            animate="animate"
            className="text-4xl sm:text-6xl lg:text-7xl tracking-wide text-white-400 font-bold font-poppins pt-10">
            Empower your
            <span className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-transparent bg-clip-text">
              {" "}
              Career Journey
            </span>
          </motion.h1>
          <motion.p
            variants={FadeUp(0.8)}
            initial="initial"
            animate="animate"
            className="mt-10 text-l text-center text-white-500 max-w-4xl font-poppins">
            Master essential work skills and accelerate your career with our comprehensive e-learning platform.
          </motion.p>
          <motion.div
            variants={FadeUp(0.8)}
            initial="initial"
            animate="animate"
            className="flex justify-center m-10">
            <button className="primary-btn flex bg-gradient-to-r from-yellow-500 to-yellow-600 py-3 px-4 mx-3 text-white rounded-md gap-2 group">
              Get Started
              <IoIosArrowForward className="text-xl group-hover:translate-x-2 group-hover:-rotate-45 duration-300" />
            </button>
            <a href="#" className="py-3 px-4 mx-3 border border-white-700 text-white-700 rounded-md">
              Learn More
            </a>
          </motion.div>
        </div>

        {/* Navigation Dots */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10 pt-10">
          {videos.map((_, index) => (
            <span
              key={index}
              onClick={() => handleDotClick(index)}
              className={`w-3 h-3 rounded-full cursor-pointer ${
                currentVideo === index ? "bg-yellow-500" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default HeroSection;
