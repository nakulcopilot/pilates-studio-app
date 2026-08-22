"use client";

import { useRouter } from "next/navigation";
import AssessmentModal, {
  type AssessmentResult,
} from "@/components/ai/AssessmentModal";

export default function AssessmentPage() {
  const router = useRouter();

  const onComplete = (result: AssessmentResult) => {
    // Assessment results are persisted by the modal; continue the journey.
    router.push("/booking-search");
  };

  const onClose = () => {
    router.push("/");
  };

  return <AssessmentModal onComplete={onComplete} onClose={onClose} />;
}
