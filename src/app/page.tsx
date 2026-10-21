"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { STEPS, STRETCHES } from "@/lib/journey";
import Scaler from "@/components/Scaler";
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

  let screen: ReactNode;
  switch (current.type) {
    case "scan":
      screen = <Scan onNext={next} />;
      break;
    case "scanned":
      screen = <Scanned onNext={next} onBack={back} />;
      break;
    case "join":
      screen = <Join onNext={next} />;
      break;
    case "question":
      screen = <Question stretch={stretch!} onNext={next} />;
      break;
    case "response":
      screen = <Response stretch={stretch!} onSubmit={submit} />;
      break;
    case "wait":
      screen = (
        <Wait
          stretch={stretch!}
          answer={answers[stretch!.id] ?? stretch!.preset}
          onNext={next}
          onChange={back}
        />
      );
      break;
    case "results":
      screen = (
        <Results
          stretch={stretch!}
          answer={answers[stretch!.id] ?? stretch!.preset}
          onNext={next}
          onEnd={goSummary}
        />
      );
      break;
    case "summary":
      screen = <TripSummary answers={answers} onFinish={restart} />;
      break;
  }

  return <Scaler>{screen}</Scaler>;
}
