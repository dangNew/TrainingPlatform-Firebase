"use client"

import React, { useState, useContext } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db } from "../firebase.config"
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { SidebarToggleContext } from "../components/LgNavbar"
import Sidebar from "../components/LSidebar"
import styled from "styled-components"

const MainContent = styled.div`
  flex: 1;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  transition: margin-left 0.3s ease;
  margin-left: ${({ expanded }) => (expanded ? "16rem" : "4rem")};
  width: ${({ expanded }) => (expanded ? "calc(100% - 16rem)" : "calc(100% - 4rem)")};
`

const SettingsPage = () => {
  const [user, loading] = useAuthState(auth)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const { expanded } = useContext(SidebarToggleContext)

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.")
      return
    }

    try {
      if (user && user.email) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword)
        await reauthenticateWithCredential(user, credential)
        await updatePassword(user, newPassword)
        setSuccess("Password updated successfully!")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      }
    } catch (error) {
      setError(error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-800 text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-white text-gray-800">
        <div className="text-center max-w-md p-8 bg-gray-100 rounded-xl shadow-2xl">
          <h2 className="text-2xl font-bold mb-4">Login Required</h2>
          <p className="mb-6">You need to be logged in to view your settings.</p>
          <button
            onClick={() => (window.location.href = "/login")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-gray-800 flex">
      <Sidebar />
      <MainContent expanded={expanded}>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Settings</h1>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            {!showPasswordForm ? (
              <div>
                <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  Change Password
                </button>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-semibold mb-4">Change Password</h2>
                <form onSubmit={handlePasswordChange}>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="current-password">
                      Current Password
                    </label>
                    <input
                      type="password"
                      id="current-password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="new-password">
                      New Password
                    </label>
                    <input
                      type="password"
                      id="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                  <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirm-password">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      id="confirm-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                  {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
                  {success && <p className="text-green-500 text-xs italic mb-4">{success}</p>}
                  <div className="flex items-center justify-between">
                    <button
                      type="submit"
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                      Update Password
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPasswordForm(false)}
                      className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </MainContent>
    </div>
  )
}

export default SettingsPage
