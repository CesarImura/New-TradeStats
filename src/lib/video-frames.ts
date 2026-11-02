"use client"

/**
 * Pictures from a video file the coach chose, made in the browser: a few frames spread through the video, as small JPEGs.
 * The video itself isn't kept in the prototype; only the frame the coach picks is saved (see Lesson.thumbnail).
 */
export type VideoFrames = { frames: string[]; seconds: number }

const NOT_READ = "This video couldn't be read here. Try an MP4, or add a picture instead."

/** Waits for one event of a media element, or fails with a readable message after `ms`. */
const once = (el: HTMLVideoElement, event: string, ms = 8000) =>
  new Promise<void>((res, rej) => {
    const done = () => (clearTimeout(t), el.removeEventListener(event, done), el.removeEventListener("error", fail), res())
    const fail = () => (clearTimeout(t), el.removeEventListener(event, done), rej(new Error(NOT_READ)))
    const t = setTimeout(fail, ms)
    el.addEventListener(event, done, { once: true })
    el.addEventListener("error", fail, { once: true })
  })

/** `count` frames at even steps through the video, each at most `width` px wide. */
export async function videoFrames(file: File, { count = 5, width = 640 }: { count?: number; width?: number } = {}): Promise<VideoFrames> {
  const url = URL.createObjectURL(file)
  try {
    const video = document.createElement("video")
    video.muted = true
    video.playsInline = true
    video.preload = "metadata"
    video.src = url
    await once(video, "loadedmetadata")
    const seconds = Number.isFinite(video.duration) ? video.duration : 0
    if (!seconds || !video.videoWidth) throw new Error(NOT_READ)
    const canvas = document.createElement("canvas")
    canvas.width = Math.min(width, video.videoWidth)
    canvas.height = Math.round((canvas.width * video.videoHeight) / video.videoWidth)
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error(NOT_READ)
    const frames: string[] = []
    for (let i = 0; i < count; i++) {
      const seeked = once(video, "seeked")
      video.currentTime = (seconds * (i + 0.5)) / count
      await seeked
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      frames.push(canvas.toDataURL("image/jpeg", 0.75))
    }
    return { frames, seconds }
  } finally {
    URL.revokeObjectURL(url)
  }
}
