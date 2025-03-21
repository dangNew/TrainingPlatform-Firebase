import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { auth, db } from "../firebase.config"; // Ensure Firestore is imported
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [quote, setQuote] = useState("");
  const navigate = useNavigate();

  // Fetch a random quote from the Quotable API
  const fetchQuote = async () => {
    try {
      const response = await axios.get("https://api.quotable.io/random");
      setQuote(response.data.content);
    } catch (err) {
      console.error("Error fetching quote:", err);
      setQuote("An inspiring quote will appear here!");
    }
  };

  useEffect(() => {
    fetchQuote();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Sign in with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if the user exists in the 'users' collection
      const usersRef = collection(db, "users");
      const qUsers = query(usersRef, where("email", "==", email));
      const querySnapshotUsers = await getDocs(qUsers);

      if (!querySnapshotUsers.empty) {
        navigate("/dashboard"); // Redirect to Dashboard
        return;
      }

      // Check if the user exists in the 'learner' collection
      const learnersRef = collection(db, "learner");
      const qLearners = query(learnersRef, where("email", "==", email));
      const querySnapshotLearners = await getDocs(qLearners);

      if (!querySnapshotLearners.empty) {
        navigate("/user-dashboard"); // Redirect to User Dashboard
        return;
      }

      setError("User not found. Please check your email and password.");
    } catch (err) {
      if (err.code === "auth/invalid-email" || err.code === "auth/user-not-found") {
        setError("Invalid email address. Please check your email.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else {
        setError("An error occurred. Please try again later.");
      }
      console.error("Login Error:", err.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex w-full max-w-4xl bg-gray-900 text-white shadow-2xl rounded-lg overflow-hidden">
        {/* Login Form */}
        <div className="w-1/2 p-8">
          <h2 className="text-3xl font-bold text-center text-blue-500">
            Login
          </h2>
          <form onSubmit={handleSubmit} className="mt-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full px-4 py-2 border border-gray-600 bg-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Password Input with Eye Toggle */}
            <div className="mb-4 relative">
              <label className="block text-sm font-medium text-gray-400">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 w-full px-4 py-2 border border-gray-600 bg-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  className="absolute top-2/4 right-3 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center mb-4">{error}</p>
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-200 font-semibold"
            >
              Login
            </button>
            <p className="text-center text-sm text-gray-400 mt-4">
              Don't have an account?
            </p>
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="w-full bg-red-600 text-white py-2 mt-2 rounded-lg hover:bg-red-700 transition duration-200 font-semibold"
            >
              Sign Up
            </button>
          </form>
        </div>

        {/* Quote Container */}
        <div className="w-1/2 bg-gray-800 flex items-center justify-center p-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-blue-400 mb-4">
              Quote of the Day
            </h3>
            <p className="text-gray-300 italic font-serif text-lg">"{quote}"</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
