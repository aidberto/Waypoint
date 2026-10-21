"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { STEPS, STRETCHES } from "@/lib/journey";
import Scaler from "@/components/Scaler";
import Countdown from "@/components/Countdown";
import Scan from "@/components/screens/Scan";
import ManualEntry from "@/components/screens/ManualEntry";
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
  const [manual, setManual] = useState(false); // carriage-number entry branch off Scan

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

  // Time-to-next-station countdown. Owned here so it runs continuously across a
  // stretch's question → response → wait screens and resets at each station.
  const total = stretch?.countdownSeconds ?? 0;
  const [left, setLeft] = useState(0);

  useEffect(() => {
    // new stretch arrived → reset the clock
    if (stretch) setLeft(stretch.countdownSeconds);
  }, [stretch?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!stretch || left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left, stretch]);

  // On the Wait screen the train "arrives" when the clock hits 0.
  useEffect(() => {
    if (current.type === "wait" && left <= 0) next();
  }, [current.type, left, next]);

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
      screen = <Scan onNext={next} onManual={() => setManual(true)} />;
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
          left={left}
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

  // Manual carriage entry overlays the Scan step and rejoins at Scanned on submit.
  if (manual) {
    screen = (
      <ManualEntry
        onSubmit={() => {
          setManual(false);
          next();
        }}
        onBack={() => setManual(false)}
      />
    );
  }

  const showTimer = !manual && (current.type === "question" || current.type === "response");

  return (
    <Scaler>
      {screen}
      {showTimer && <Countdown left={left} total={total} />}
    </Scaler>
  );
}
