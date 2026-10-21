"use client";

import { useCallback, useMemo, useState } from "react";
import { STEPS, STRETCHES } from "@/lib/journey";
import Scan from "@/components/screens/Scan";
import Scanned from "@/components/screens/Scanned";
import Join from "@/components/screens/Join";
import Question from "@/components/screens/Question";
import Response from "@/components/screens/Response";
import Wait from "@/components/screens/Wait";
import Results from "@/components/screens/Results";
import TripSummary from "@/components/screens/TripSummary";

export default function Waypoint() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const next = useCallback(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), []);
  const back = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);
  const goSummary = useCallback(
    () => setStep(STEPS.findIndex((s) => s.type === "summary")),
    [],
  );
  const restart = useCallback(() => {
    setAnswers({});
    setStep(0);
  }, []);

  const current = STEPS[step];
  const stretch = useMemo(
    () => (current.stretch != null ? STRETCHES[current.stretch] : null),
    [current],
  );

  const submit = useCallback(
    (answer: string) => {
      if (stretch) setAnswers((a) => ({ ...a, [stretch.id]: answer }));
      next();
    },
    [stretch, next],
  );

  switch (current.type) {
    case "scan":
      return <Scan onNext={next} />;
    case "scanned":
      return <Scanned onNext={next} onBack={back} />;
    case "join":
      return <Join onNext={next} />;
    case "question":
      return <Question stretch={stretch!} onNext={next} />;
    case "response":
      return <Response stretch={stretch!} onSubmit={submit} />;
    case "wait":
      return (
        <Wait
          stretch={stretch!}
          answer={answers[stretch!.id] ?? stretch!.preset}
          onNext={next}
          onChange={back}
        />
      );
    case "results":
      return (
        <Results
          stretch={stretch!}
          answer={answers[stretch!.id] ?? stretch!.preset}
          onNext={next}
          onEnd={goSummary}
        />
      );
    case "summary":
      return <TripSummary answers={answers} onFinish={restart} />;
  }
}
