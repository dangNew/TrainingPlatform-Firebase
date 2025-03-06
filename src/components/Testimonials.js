import { testimonials } from "../constants/indexes";

const Testimonials = () => {
  return (
    <div className="mt-20 tracking-wide">
      <h2 className="text-3xl sm:text-5xl lg:text-6xl text-center text-neutral-700 lg:my-20">What people are saying</h2>
      <div className="flex flex-wrap justify-center">
        {testimonials.map((testimonial, index) => (
          <div key={index} className="w-full sm:w-1/2 lg:w-1/3 p-4">
            <div className="backdrop-blur-sm bg-white/30 shadow-md rounded-xl border border-neutral-300 overflow-hidden transition-transform duration-300 ease-in-out hover:-translate-y-2 hover:shadow-lg">
              <div className="p-6">
                <p className="text-md text-neutral-600">
                  {testimonial.text}
                </p>
                <div className="flex mt-8 items-start">
                  <img className="w-12 h-12 mr-6 rounded-full border border-neutral-300" src={testimonial.image} alt={testimonial.user} />
                  <div>
                    <h6 className="text-neutral-700 font-bold">{testimonial.user}</h6>
                    <span className="text-sm italic text-neutral-500">{testimonial.company}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Testimonials;
