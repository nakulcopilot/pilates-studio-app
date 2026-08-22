import * as React from "react";

export function useScreenShare() {
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [isSharing, setIsSharing] = React.useState(false);

  const start = async () => {
    try {
      const media = navigator.mediaDevices as MediaDevices & {
        getDisplayMedia?: (constraints: DisplayMediaStreamOptions) => Promise<MediaStream>;
      };
      const screenStream = await media.getDisplayMedia({
        video: true,
        audio: false,
      });
      setStream(screenStream);
      setIsSharing(true);
      return screenStream;
    } catch (err) {
      console.error("Screen share error:", err);
      throw err;
    }
  };

  const stop = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsSharing(false);
    }
  };

  return { stream, isSharing, start, stop };
}
