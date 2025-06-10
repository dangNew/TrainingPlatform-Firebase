"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { db, auth } from "../firebase.config"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import {
  FaEye,
  FaEyeSlash,
  FaUser,
  FaEnvelope,
  FaLock,
  FaPhone,
  FaMapMarker,
  FaArrowLeft,
  FaUserTie,
  FaGraduationCap,
  FaBriefcase,
  FaCheck,
} from "react-icons/fa"

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
  const [userRole, setUserRole] = useState("")
  const [showRoleSelection, setShowRoleSelection] = useState(true)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleRoleSelect = (role) => {
    setUserRole(role)
    setShowRoleSelection(false)
  }

  const handleBackToRoles = () => {
    setShowRoleSelection(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { fullName, username, email, password, confirmPassword, phoneNumber, address } = formData

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Determine collection based on user role
      let collectionName = "users" // default for admin
      if (userRole === "learner") {
        collectionName = "learner"
      } else if (userRole === "intern") {
        collectionName = "intern"
      }

      await setDoc(doc(db, collectionName, user.uid), {
        fullName,
        username,
        email,
        phoneNumber,
        address,
        role: userRole,
        createdAt: new Date(),
      })

      navigate("/login")
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const roleOptions = [
    {
      role: "admin",
      title: "Administrator",
      description: "Full system access with management capabilities",
      icon: <FaUserTie className="text-2xl" />,
      color: "from-purple-500 to-indigo-600",
      features: ["User Management", "System Configuration", "Analytics Dashboard"],
    },
    {
      role: "learner",
      title: "Applicant",
      description: "Access educational content and learning resources",
      icon: <FaGraduationCap className="text-2xl" />,
      color: "from-blue-500 to-cyan-600",
      features: ["Course Access", "Progress Tracking", "Certificates"],
    },
    {
      role: "intern",
      title: "Intern",
      description: "Gain practical experience with guided mentorship",
      icon: <FaBriefcase className="text-2xl" />,
      color: "from-green-500 to-emerald-600",
      features: ["Project Access", "Mentor Support", "Skill Development"],
    },
  ]

  // Role selection screen
  if (showRoleSelection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-12 py-8">
            <div className="text-center text-white">
              <h1 className="text-4xl font-bold mb-2">Choose Your Path</h1>
              <p className="text-xl text-blue-100">Select your role to get started with the right experience</p>
            </div>
          </div>

          {/* Role Cards */}
          <div className="p-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {roleOptions.map((option) => (
                <div
                  key={option.role}
                  onClick={() => handleRoleSelect(option.role)}
                  className="group relative bg-white dark:bg-gray-700 rounded-2xl border-2 border-gray-200 dark:border-gray-600 hover:border-transparent hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden"
                >
                  {/* Gradient Border Effect */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${option.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`}
                  ></div>
                  <div className="relative bg-white dark:bg-gray-700 m-0.5 rounded-2xl p-8 h-full">
                    {/* Icon */}
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${option.color} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300`}
                    >
                      {option.icon}
                    </div>

                    {/* Content */}
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{option.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">{option.description}</p>

                    {/* Features */}
                    <div className="space-y-3">
                      {option.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full bg-gradient-to-r ${option.color} flex items-center justify-center`}
                          >
                            <FaCheck className="text-white text-xs" />
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Select Button */}
                    <button
                      className={`w-full mt-8 py-3 px-6 bg-gradient-to-r ${option.color} text-white font-semibold rounded-xl opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300`}
                    >
                      Select {option.title}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-12 text-center">
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Already have an account?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline transition-colors"
                >
                  Sign In
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Sign-up form screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-0 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Left Panel - Hero Section */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-800 p-12 flex flex-col justify-center text-white overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-72 h-72 bg-white rounded-full translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/3 translate-y-1/3"></div>
          </div>

          <div className="relative z-10">
            <div className="mb-8">
              <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">Join Our Community</h1>
              <p className="text-xl text-purple-100 leading-relaxed">
                Create your account and start your journey towards success.
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-6">
              {[
                { step: 1, title: "Choose Your Role", desc: "Select the path that fits you" },
                { step: 2, title: "Complete Profile", desc: "Fill in your details" },
                { step: 3, title: "Start Learning", desc: "Begin your journey" },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                    <span className="text-white font-bold">{item.step}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{item.title}</h4>
                    <p className="text-purple-100 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            {/* Back Button */}
            <button
              onClick={handleBackToRoles}
              className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-6 hover:underline transition-colors"
            >
              <FaArrowLeft /> Back to role selection
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Create {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Account
              </h2>
              <p className="text-gray-600 dark:text-gray-400">Fill in your details to get started</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400 text-center font-medium">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Personal Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Full Name", name: "fullName", icon: <FaUser />, type: "text" },
                  { label: "Username", name: "username", icon: <FaUser />, type: "text" },
                  { label: "Email", name: "email", icon: <FaEnvelope />, type: "email" },
                  { label: "Phone", name: "phoneNumber", icon: <FaPhone />, type: "tel" },
                ].map(({ label, name, icon, type }) => (
                  <div key={name} className="space-y-1">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        {icon}
                      </div>
                      <input
                        type={type}
                        name={name}
                        value={formData[name]}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder={label}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FaMapMarker />
                  </div>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Address"
                  />
                </div>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Password", name: "password" },
                  { label: "Confirm Password", name: "confirmPassword" },
                ].map(({ label, name }) => (
                  <div key={name} className="space-y-1">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <FaLock />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        name={name}
                        value={formData[name]}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder={label}
                      />
                      {name === "password" && (
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none transition-all duration-200 flex items-center justify-center gap-2 mt-6"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Already have an account?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline transition-colors"
                >
                  Sign In
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignUp
