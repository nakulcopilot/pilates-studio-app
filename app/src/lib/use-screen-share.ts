export function useScreenShare() {
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [isSharing, setIsSharing] = React.useState(false);

  const start = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getUserMedia({
        video: {
          cursor: "always",
          displaySurface: "share-screen",
        },
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