export function useVoiceInteraction() {
  const [isListening, setIsListening] = React.useState(false);
  const [transcript, setTranscript] = React.useState("");
  const [isSpeaking, setIsSpeaking] = React.useState(false);

  const recognition = React.useRef<
    webkitSpeechRecognition | null
  >(null);

  const setupRecognition = () => {
    if ("webkitSpeechRecognition" in window) {
      const recognition = new webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      return recognition;
    }
    return null;
  };

  const startListening = () => {
    const recog = setupRecognition();
    if (!recog) {
      console.warn("Speech recognition not supported");
      return;
    }
    recog.onstart = () => setIsListening(true);
    recog.onresult = (
      event: { results: { isFinal: boolean; [index: number]: { transcript: string } } }
    ) => {
      const interimTranscripts: string[] = [];
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          setTranscript((prev: string) => prev + event.results[i][0].transcript + " ");
        } else {
          interimTranscripts.push(event.results[i][0].transcript);
        }
      }
      if (interimTranscripts.length > 0) {
        setTranscript((prev: string) => prev + interimTranscripts.join(" ") + " ");
      }
    };
    recog.onerror = (event: { error: string }) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };
    recog.onend = () => {
      if (isListening) {
        setIsListening(false);
        setTimeout(startListening, 100);
      }
    };
    recog.start();
  };

  const stopListening = () => {
    if (recognition.current) {
      recognition.current.stop();
    }
  };

  const speak = React.useCallback(
    (text: string, voiceName?: string) => {
      if ("speechSynthesis" in window && "speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;

        if (voiceName) {
          const availableVoices: SpeechSynthesisVoice[] =
            speechSynthesis.getVoices();
          const selectedVoice = availableVoices.find(
            (v: SpeechSynthesisVoice) => v.name === voiceName
          );
          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        speechSynthesis.speak(utterance);
      }
    },
    []
  );

  return {
    isListening,
    transcript,
    isSpeaking,
    speak,
    startListening,
    stopListening,
  };
}