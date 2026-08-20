import { useScreenShare } from "@/lib/use-screen-share";
import { useVoiceInteraction } from "@/lib/use-voice-interaction";

export function InteractiveAvatar({
  name,
  onScreenShareToggle,
  onVoiceToggle,
}: {
  name: string;
  onScreenShareToggle: () => void;
  onVoiceToggle: () => void;
}) {
  const { isSharing, stream } = useScreenShare();
  const { isListening, transcript, isSpeaking } = useVoiceInteraction();

  return (
    <div className="relative rounded-lg border border-[#2a2420] bg-[#12100e] p-4 min-w-[160px]">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-[#3a3025] flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-[#f0e6dd]">
            {name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-[#e5ddd4]">{name}</div>
          <div className="text-xs text-[#85776c]">Instructor</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <button
          className={`btn !p-1 !rounded ${isSharing ? "btn-primary" : "btn-outline"} text-[5px]`}
          onClick={onScreenShareToggle}
          disabled={isSharing}
        >
          {isSharing ? "📹 Share Screen" : "📹 Screen"}
        </button>
        <button
          className={`btn !p-1 !rounded ${isListening ? "btn-primary" : "btn-outline"} text-[5px]`}
          onClick={onVoiceToggle}
          disabled={isListening}
        >
          {isListening ? "🎤 Listening" : "🎤 Voice"}
        </button>
      </div>

      {isSpeaking && (
        <div className="mt-2 text-center text-amber-400 text-xs">
          {transcript || "Speaking..."}
        </div>
      )}
    </div>
  );
}