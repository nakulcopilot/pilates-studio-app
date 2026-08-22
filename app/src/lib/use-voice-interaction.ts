import * as React from "react";

interface SpeechAlternativeLike {
  transcript: string;
  confidence: number;
}

interface SpeechResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechAlternativeLike;
}

interface SpeechEventLike {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechResultLike };
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

export function useVoiceInteraction() {
  const [isListening, setIsListening] = React.useState(false);
  const [transcript, setTranscript] = React.useState("");
  const [isSpeaking, setIsSpeaking] = React.useState(false);

  const recognition = React.useRef<SpeechRecognitionLike | null>(null);

  const setupRecognition = (): SpeechRecognitionLike | null => {
    const Ctor = window.webkitSpeechRecognition;
    if (!Ctor) return null;
    const recog = new Ctor();
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = "en-US";
    return recog;
  };

  const startListening = () => {
    const recog = setupRecognition();
    if (!recog) {
      console.warn("Speech recognition not supported");
      return;
    }
    recognition.current = recog;
    recog.onstart = () => setIsListening(true);
    recog.onresult = (event: SpeechEventLike) => {
      const interimTranscripts: string[] = [];
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result?.isFinal) {
          setTranscript((prev: string) => prev + result[0].transcript + " ");
        } else if (result) {
          interimTranscripts.push(result[0].transcript);
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
      setIsListening(false);
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
      if ("speechSynthesis" in window) {
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
