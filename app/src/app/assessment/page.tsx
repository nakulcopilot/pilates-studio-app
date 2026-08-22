"use client";

import { useRouter } from "next/navigation";
import AssessmentModal from "@/components/ai/AssessmentModal";

export default function AssessmentPage() {
  const router = useRouter();

  // The assessment component owns the full journey, including the
  // post-completion demo class results screen. The host page stays mounted.
  const onComplete = () => {};

  const onClose = () => {
    router.push("/");
  };

  return <AssessmentModal onComplete={onComplete} onClose={onClose} />;
}
