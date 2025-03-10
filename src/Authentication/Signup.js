"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { db } from "../firebase.config"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { FaEye, FaEyeSlash, FaUser, FaEnvelope, FaLock, FaPhone, FaMapMarker } from "react-icons/fa"
// Signup.js or login.js
import { auth } from '../firebase.config';

function SignUp() {
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    address: "",
  })

  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLearner, setIsLearner] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { fullName, username, email, password, confirmPassword, phoneNumber, address } = formData

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      const collectionName = isLearner ? "learner" : "users"

      await setDoc(doc(db, collectionName, user.uid), {
        fullName,
        username,
        email,
        phoneNumber,
        address,
        createdAt: new Date(),
      })

      navigate("/login")
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-4 py-12">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl shadow-2xl">
        {/* Left decorative panel - visible on medium screens and up */}
        <div className="flex flex-col md:flex-row">
          <div className="hidden md:block md:w-1/3 bg-gradient-to-br from-blue-600 to-purple-700 p-8">
            <div className="h-full flex flex-col justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white mb-6">Join Our Community</h2>
                <p className="text-blue-100 mb-4">Create an account to get started on your journey with us.</p>
              </div>
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <span className="text-white text-sm">{i}</span>
                    </div>
                    <p className="text-sm text-white">
                      {i === 1 && "Create your account"}
                      {i === 2 && "Complete your profile"}
                      {i === 3 && "Start exploring"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form section */}
          <div className="w-full md:w-2/3 bg-white dark:bg-gray-800 p-8">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Create Account
              </h2>
              <p className="mt-2 text-gray-500 dark:text-gray-400">Fill in your details to get started</p>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { label: "Full Name", name: "fullName", icon: <FaUser className="text-gray-400" /> },
                { label: "Username", name: "username", icon: <FaUser className="text-gray-400" /> },
                { label: "Email", name: "email", icon: <FaEnvelope className="text-gray-400" />, type: "email" },
                {
                  label: "Phone Number",
                  name: "phoneNumber",
                  icon: <FaPhone className="text-gray-400" />,
                  type: "tel",
                },
                { label: "Address", name: "address", icon: <FaMapMarker className="text-gray-400" /> },
              ].map(({ label, name, icon, type = "text" }) => (
                <div key={name} className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{icon}</div>
                    <input
                      type={type}
                      name={name}
                      value={formData[name]}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                      placeholder={label}
                    />
                  </div>
                </div>
              ))}

              {/** Password Fields */}
              {[
                { label: "Password", name: "password" },
                { label: "Confirm Password", name: "confirmPassword" },
              ].map(({ label, name }) => (
                <div key={name} className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name={name}
                      value={formData[name]}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                      placeholder={label}
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
              ))}

              {/* Dropdown for Learner */}
              <div className="md:col-span-2 space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Register as Learner</label>
                <select
                  value={isLearner}
                  onChange={(e) => setIsLearner(e.target.value === "true")}
                  className="w-full pl-4 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200"
                >
                  <option value={false}>No</option>
                  <option value={true}>Yes</option>
                </select>
              </div>

              <div className="md:col-span-2 mt-4">
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Create Account
                </button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Already have an account?{" "}
                <span
                  className="text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:underline"
                  onClick={() => navigate("/login")}
                >
                  Sign In
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignUp
