/** A single still frame grabbed from the current browser tab. */
interface CapturedFrame {
  /** Canvas holding the captured pixels, sized to the capture resolution. */
  canvas: HTMLCanvasElement;
  /** Capture width in device pixels (the source surface resolution). */
  width: number;
  /** Capture height in device pixels. */
  height: number;
}

// `preferCurrentTab` is a Chrome-only hint that pre-selects the current tab in
// the share picker; it isn't in the standard `DisplayMediaStreamOptions` type.
type DisplayMediaOptions = DisplayMediaStreamOptions & {
  preferCurrentTab?: boolean;
};

const CAPTURE_OPTIONS: DisplayMediaOptions = {
  video: true,
  audio: false,
  preferCurrentTab: true,
};

/** Waits until the video has produced at least one decodable frame. */
async function waitForFirstFrame(video: HTMLVideoElement): Promise<void> {
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    await new Promise<void>((resolve) => {
      video.onloadeddata = () => resolve();
    });
  }
  // `requestVideoFrameCallback` fires once a frame is actually presented, which
  // avoids drawing a blank canvas on slow first paints. Fall back to a short
  // delay where it isn't available.
  if ("requestVideoFrameCallback" in video) {
    await new Promise<void>((resolve) => {
      video.requestVideoFrameCallback(() => resolve());
    });
    return;
  }
  await new Promise<void>((resolve) => setTimeout(resolve, 100));
}

/**
 * Captures one still frame of the current tab via the Screen Capture API and
 * draws it to a canvas. Returns `null` when capture is unavailable or the user
 * dismisses the share prompt. The media stream is always stopped before
 * returning so the browser's "sharing" indicator doesn't linger.
 */
async function captureViewportFrame(): Promise<CapturedFrame | null> {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    console.warn("[review] getDisplayMedia is unavailable in this browser");
    return null;
  }

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getDisplayMedia(CAPTURE_OPTIONS);
  } catch {
    // User cancelled the picker or denied permission — treat both as a no-op.
    return null;
  }

  try {
    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    await video.play().catch(() => undefined);
    await waitForFirstFrame(video);

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return null;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, width, height);

    video.srcObject = null;
    return { canvas, width, height };
  } finally {
    for (const track of stream.getTracks()) track.stop();
  }
}

/**
 * Exposes a single-frame tab capture built on the Screen Capture API. Capturing
 * at the compositor level lets us screenshot a sandboxed, opaque-origin iframe
 * that a `<canvas>` could never read directly.
 */
export function useViewportCapture() {
  return { captureFrame: captureViewportFrame };
}
