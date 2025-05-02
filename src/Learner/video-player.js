"use client"

import { useEffect, useRef, useState } from "react"

// Convert from TypeScript to JavaScript
export default function VideoPlayer({ src, onComplete, isCompleted = false, className = "" }) {
  const videoRef = useRef(null)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [completed, setCompleted] = useState(isCompleted)
  const [lastValidTime, setLastValidTime] = useState(0)
  const [allowSkip, setAllowSkip] = useState(false)

  useEffect(() => {
    setCompleted(isCompleted)
  }, [isCompleted])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      if (!video) return

      // Check if user is trying to skip ahead too much
      if (!allowSkip && video.currentTime > lastValidTime + 10) {
        // If skipping ahead more than 10 seconds, reset to last valid time
        video.currentTime = lastValidTime
      } else {
        // Update last valid time (allow continuous progress)
        setLastValidTime(video.currentTime)
      }

      setProgress(video.currentTime)

      // Mark as completed when 95% watched
      if (video.duration > 0 && video.currentTime / video.duration > 0.95 && !completed) {
        setCompleted(true)
        setAllowSkip(true) // Allow skipping once near the end
        if (onComplete) onComplete()
      }
    }

    const handleLoadedMetadata = () => {
      if (!video) return
      setDuration(video.duration)
    }

    const handleEnded = () => {
      setCompleted(true)
      setAllowSkip(true) // Allow skipping once completed
      if (onComplete) onComplete()
    }

    // Handle seeking attempts
    const handleSeeking = () => {
      if (!allowSkip && video.currentTime > lastValidTime + 10) {
        video.currentTime = lastValidTime
      }
    }

    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    video.addEventListener("ended", handleEnded)
    video.addEventListener("seeking", handleSeeking)

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      video.removeEventListener("ended", handleEnded)
      video.removeEventListener("seeking", handleSeeking)
    }
  }, [completed, onComplete, lastValidTime, allowSkip])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  return (
    <div className="relative">
      <video ref={videoRef} src={src} className={`w-full rounded-lg ${className}`} controls playsInline />

      {completed && (
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">Completed</div>
      )}

      <div className="mt-2 text-sm text-gray-300 flex justify-between">
        <span>{formatTime(progress)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      <div className="mt-1 h-1 w-full bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${duration > 0 ? (progress / duration) * 100 : 0}%` }}
        />
      </div>
    </div>
  )
}
