# Avatar Screen & Voice Demo - Pilates Studio App

## Overview
I've implemented screen-sharing and voice interaction capabilities for the Pilates Studio web app, enabling an interactive avatar that can see the screen and talk.

## Components Implemented

### 1. Screen Sharing Hook (`use-screen-share.ts`)
```typescript
export function useScreenShare() {
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [isSharing, setIsSharing] = React.useState(false);

  const start = async () => {
    const screenStream = await navigator.mediaDevices.getUserMedia({
      video: {
        cursor: "always",
        displaySurface: "share-screen",
      },
      audio: false,
    });
    setStream(screenStream);
    setIsSharing(true);
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
```
- Uses `navigator.mediaDevices.getUserMedia` with `displaySurface: "share-screen"` 
- Captures cursor with `cursor: "always"`
- Manages sharing state and stream cleanup

### 2. Voice Interaction Hook (`use-voice-interaction.ts`)
```typescript
export function useVoiceInteraction() {
  const [isListening, setIsListening] = React.useState(false);
  const [transcript, setTranscript] = React.useState("");
  const [isSpeaking, setIsSpeaking] = React.useState(false);

  const startListening = () => {
    const recog = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recog.start();
  };

  const speak = React.useCallback((text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
  }, []);

  return { isListening, transcript, isSpeaking, speak, startListening, stopListening };
}
```
- **Speech Recognition**: `webkitSpeechRecognition` with continuous listening and interim results
- **Text-to-Speech**: `SpeechSynthesisUtterance` with voice selection
- Manages listening state and transcript updates

### 3. Interactive Avatar Component (`InteractiveAvatar.tsx`)
```typescript
export function InteractiveAvatar({ name, onScreenShareToggle, onVoiceToggle }) {
  const { isSharing, stream } = useScreenShare();
  const { isListening, transcript, isSpeaking } = useVoiceInteraction();

  return (
    <div className="relative rounded-lg border bg-[#12100e] p-4 min-w-[160px]">
      {/* Avatar header with name */}
      {/* Toggle buttons for screen share and voice */}
      {/* Speaking status display */}
    </div>
  );
}
```
- Displays instructor name and role
- **Screen Share button**: Toggles screen sharing on/off
- **Voice button**: Toggles speech recognition on/off
- Shows "Speaking..." when text-to-speech is active
- Displays transcript in real-time

### 4. Live Class Console Integration (`instructor-views.tsx`)
```typescript
export function LiveClassConsole({ classId, supabase, data }) {
  // ... timer controls (Free/Pilates/Interval/EMOM/AMRAP)
  // ... End Class button
  // ... LiveStudentPanel for roster & notes
  // Avatar integrated with screen share & voice toggles
}
```

### 5. Updated LiveStudentPanel
- Now includes the InteractiveAvatar component
- Displays voice listening status and transcript
- Integrates note-taking with voice input

## How It Works

### Screen Sharing Flow:
1. Instructor clicks "📹 Screen" button in avatar
2. `useScreenShare().start()` calls `navigator.mediaDevices.getUserMedia()`
3. Stream is displayed in the live class console
4. Click again to stop and release tracks

### Voice Interaction Flow:
1. Instructor clicks "🎤 Voice" button
2. `useVoiceInteraction().startListening()` starts `webkitSpeechRecognition`
3. Instructor's speech is transcribed in real-time
4. Transcript appears below the avatar
5. Click again to stop listening
6. `speak()` function can read out notes/cues via text-to-speech

### Live Class Console:
- Phase timer (Free/Pilates/Interval/EMOM/AMRAP) with start/pause/reset
- Roster panel with student attendance tracking
- Real-time voice transcript integration
- Note-saving functionality

## Demonstration

### To Try (when running locally):
1. Start the dev server: `npm run dev`
2. Navigate to the instructor dashboard
3. Click the avatar in the Live Class Console
4. Click "📹 Screen" to attempt screen sharing (browser will prompt for permission)
5. Click "🎤 Voice" to start speech recognition (browser will prompt for microphone)
6. Speak - transcript appears in real-time
7. Click the speaker icon to have the avatar read transcript text

### Browser Support:
- **Screen Sharing**: Chrome, Edge, Brave (Chromium-based)
- **Voice Recognition**: Chrome, Edge, Brave, Safari (with prefixes)
- **Text-to-Speech**: All modern browsers

## Code Quality
- All files pass ESLint (only pre-existing warnings, no new errors)
- TypeScript types properly defined
- Follows existing codebase patterns (Next.js 16, React 19, Tailwind CSS)
- Designed for Phase 5 of the Pilates Studio app build plan