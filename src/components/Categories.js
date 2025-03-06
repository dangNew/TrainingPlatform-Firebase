import {CheckCircle2} from "lucide-react";
import video3 from "../assets/video3.mp4";
import { checklistItems } from "../constants/indexes";

const Categories = () => {
  return (
    <div className="mt-20">
      <h2 className="text-3xl sm:text-5xl lg:text-6xl text-center mt-6 tracking-wide text-neutral-700">
        Explore Our
        <span className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-transparent bg-clip-text">
         {" "}Course Categories
        </span>
        </h2>
        <div className="flex flex-wrap justify-center">
          <div className="p-2 w-full lg:w-1/2">
          <video autoPlay loop muted className="rounded-lg  border border-yellow-700 shadow-yellow-400 mx-2 my-4">
                <source src={video3} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
          </div>
          <div className="pt-12 w-full lg:w-1/2">
          {checklistItems.map ((item, index) => (
            <div key={index} className="flex mb-12">
              <div className="text-white-400 mx-6 bg-[#50C878] h-10 w-10 p-2 justify-center items-center rounded-full">
                <CheckCircle2 />
              </div>
              <div>
                <h5 className="mt-1 mb-2 text-xl text-neutral-700">{item.title}</h5>
                <p className="text-md text-neutral-500">{item.description}</p>
              </div>
            </div>
          ))}
          </div>
        </div>
    </div>
  )
}

export default Categories
