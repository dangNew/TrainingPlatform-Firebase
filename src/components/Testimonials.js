import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase.config";

const Testimonials = () => {
  const [comments, setComments] = useState([]);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const commentsRef = collection(db, "courseComments");
        const commentsSnapshot = await getDocs(commentsRef);
        const commentsData = [];

        for (const docSnap of commentsSnapshot.docs) {
          const data = docSnap.data();
          let userImage = "";

          // Try learner collection
          const learnerRef = doc(db, "learner", data.userId);
          const learnerDoc = await getDoc(learnerRef);

          if (learnerDoc.exists() && learnerDoc.data().photoURL?.url) {
            userImage = learnerDoc.data().photoURL.url;
          } else {
            // Try intern collection
            const internRef = doc(db, "intern", data.userId);
            const internDoc = await getDoc(internRef);
            if (internDoc.exists() && internDoc.data().photoURL?.url) {
              userImage = internDoc.data().photoURL.url;
            }
          }

          commentsData.push({
            user: data.userName,
            text: data.comment,
            courseTitle: data.courseTitle,
            image: userImage || "https://via.placeholder.com/100",
          });
        }

        // Only keep the first 6 testimonials
        setComments(commentsData.slice(0, 6));
      } catch (error) {
        console.error("Error fetching testimonials:", error);
      }
    };

    fetchTestimonials();
  }, []);

  return (
    <div className="mt-20 tracking-wide">
      <h2 className="text-3xl sm:text-5xl lg:text-6xl text-center text-neutral-700 lg:my-20">
        What people are saying
      </h2>
      <div className="flex flex-wrap justify-center">
        {comments.length > 0 ? (
          comments.map((testimonial, index) => (
            <div key={index} className="w-full sm:w-1/2 lg:w-1/3 p-4">
              <div className="backdrop-blur-sm bg-white/30 shadow-md rounded-xl border border-neutral-300 overflow-hidden transition-transform duration-300 ease-in-out hover:-translate-y-2 hover:shadow-lg">
                <div className="p-6">
                  <p className="text-md text-neutral-600">{testimonial.text}</p>
                  <div className="flex mt-8 items-start">
                    <img
                      className="w-12 h-12 mr-6 rounded-full border border-neutral-300"
                      src={testimonial.image}
                      alt={testimonial.user}
                    />
                    <div>
                      <h6 className="text-neutral-700 font-bold">{testimonial.user}</h6>
                      <span className="text-sm italic text-neutral-500">
                        {testimonial.courseTitle}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No testimonials available.</p>
        )}
      </div>
    </div>
  );
};

export default Testimonials;
