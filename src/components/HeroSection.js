import video1 from "../assets/video1.mp4";
import video2 from "../assets/video2.mp4";


const HeroSection = () => {
  return (
    <div className="flelx flex-col flex items-center mt-6 lg:mt-20">
        <h1 className="text-4xl sm:text-6xl lg:text-7xl text-center tracking-wide text-neutral-700 font-bold">
            Empower your 
            <span className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-transparent bg-clip-text">
            {" "}
            Career Journey
            </span>
        </h1>
        <p className="mt-10 text-l text-center text-neutral-500 max-w-4xl">
        Master essential work skills and accelerate your career with our comprehensive e-learning platform.
        </p>
        <div className="flex justify-center m-10">
            <a href="#" className="bg-gradient-to-r from-yellow-500 to-yellow-600 py-3 px-4 mx-3 text-white rounded-md">
                Get Started
            </a>
            <a href="#" className="py-3 px-4 mx-3 border border-neutral-700 text-neutral-700 rounded-md">
                Learn More
            </a>
        </div>
        <div className="flex mt-10 justify-center">
            <video autoPlay loop muted className="rounded-lg w-1/2 border border-yellow-700 shadow-yellow-400 mx-2 my-4">
                <source src={video1} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
            <video autoPlay loop muted className="rounded-lg w-1/2 border border-yellow-700 shadow-yellow-400 mx-2 my-4">
                <source src={video2} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
        </div>
    </div>
  );
}

export default HeroSection
