import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEye, FaEyeSlash, FaArrowLeft, FaSpinner } from "react-icons/fa";
import { auth, db } from "../firebase.config"; // Ensure Firestore is imported
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [quote, setQuote] = useState("");
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
    setError("");
    try {
      // Sign in with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
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
      if (
        err.code === "auth/invalid-email" ||
        err.code === "auth/user-not-found"
      ) {
        setError("Invalid email address. Please check your email.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else {
        setError("An error occurred. Please try again later.");
      }
      console.error("Login Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl shadow-2xl">
        <div className="flex flex-col md:flex-row">
          {/* Left decorative panel - visible on medium screens and up */}
          <div className="hidden md:block md:w-1/3 bg-gradient-to-br from-blue-600 to-purple-700 p-8">
            <div className="h-full flex flex-col justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white mb-6">
                  Welcome Back
                </h2>
                <p className="text-blue-100 mb-4">
                  Login to continue your journey with us.
                </p>
              </div>
              <div className="space-y-6">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <span className="text-white text-sm">{i}</span>
                    </div>
                    <p className="text-sm text-white">
                      {i === 1 && "Enter your credentials"}
                      {i === 2 && "Access your account"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form section */}
          <div className="w-full md:w-2/3 bg-white dark:bg-gray-800 p-8">
            <div className="mb-8">
              <button
                onClick={() => navigate("/signup")}
                className="flex items-center text-blue-600 dark:text-blue-400 mb-4 hover:underline"
              >
                <FaArrowLeft className="mr-2" /> Back to sign up
              </button>

              <div className="text-center">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                  Login to Your Account
                </h2>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  Enter your details to login
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400 text-center">
                  {error}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <div className="relative group">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-4 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                    placeholder="Email"
                  />
                </div>
              </div>

              <div className="space-y-1 relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="mt-4 relative">
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center"
                  disabled={loading}
                >
                  {loading ? <FaSpinner className="animate-spin" /> : "Login"}
                </button>
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
                    <FaSpinner className="animate-spin text-blue-500 text-4xl" />
                  </div>
                )}
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Don't have an account?{" "}
                <span
                  className="text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:underline"
                  onClick={() => navigate("/signup")}
                >
                  Sign Up
                </span>
              </p>
            </div>
          </div>

          {/* Quote Container */}
          <div className="w-full md:w-1/3 bg-gray-800 flex items-center justify-center p-8">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-blue-400 mb-4">
                Quote of the Day
              </h3>
              <p className="text-gray-300 italic font-serif text-lg">
                "{quote}"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
