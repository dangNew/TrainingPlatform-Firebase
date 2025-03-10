import {features} from "../constants/indexes";

const FeatureSection = () => {
  return (
    <div className="relative mt-20 border-b border-neutral-800 min-h-[800px]">
      <div 
      className="text-center">
<span className="backdrop-blur-sm bg-white/30 text-yellow-600 rounded-full h-6 text-sm font-medium px-2 py-1 uppercase">
            Features
        </span>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl mt-10 lg:mt-20 tracking wide text-neutral-700">
            Unlock Powerful 
            <span className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-transparent bg-clip-text">
            {" "}
            Learning Tools
            </span>
        </h2>
      </div>

      <div className="flex flex-wrap mt-10 lg:mt-20">
  {features.map((feature, index) => (
    <div key={index} className="w-full sm:w-1/2 lg:w-1/3 p-4">
      <div className="bg-white border border-neutral-300 rounded-xl shadow-md overflow-hidden transition-transform duration-300 ease-in-out hover:transform hover:-translate-y-2 hover:shadow-lg backdrop-blur-sm bg-white/30">
        <div className="flex items-start p-6">
          <div className="flex h-10 w-10 p-2 text-yellow-500 justify-center items-center rounded-full">
            {feature.icon}
          </div>
          <div className="ml-4">
            <h5 className="mt-1 mb-2 text-xl text-neutral-500 font-bold ">{feature.text}</h5>
            <hr className="my-2 border-t border-neutral-300" />
            <p className="text-md text-neutral-500">{feature.description}</p>
          </div>
        </div>
      </div>
    </div>
  ))}
</div>



    </div>
  )
}

export default FeatureSection
