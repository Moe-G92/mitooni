import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import type { Attempt, Profile, Section, Test } from "@/api/schemas";
import { useAttempt, useMe, useSubmitSection, useTest } from "@/api/queries";
import { SessionProvider, useSession, type ExamSettings } from "@/exam/engine/session";
import { Runner } from "@/exam/engine/runner";
import { useCountdown } from "@/exam/engine/useCountdown";
import { ConfirmScreen, IntroScreen, SoundCheck, SubmissionScreen } from "@/exam/chrome/Screens";
import { OptionsPanel } from "@/exam/chrome/OptionsPanel";
import { ExamHeader } from "@/exam/chrome/ExamHeader";
import { ReadingSection } from "@/exam/sections/ReadingSection";
import { ListeningSection } from "@/exam/sections/ListeningSection";
import { WritingSection } from "@/exam/sections/WritingSection";
import { SpeakingRoom, DeviceCheck } from "@/exam/sections/SpeakingRoom";
import "@/exam/exam.css";

const SETTINGS_KEY = "bw-exam-settings";

function loadSettings(): ExamSettings {
  try {
    return { contrast: "", size: "", ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
  } catch {
    return { contrast: "", size: "" };
  }
}

/** The exam shell root: light, English, left to right, whatever the app settings are. */
export function ExamLayout({ settings, children }: { settings: ExamSettings; children: React.ReactNode }) {
  return (
    <div className="exam-root" lang="en" dir="ltr" data-contrast={settings.contrast || undefined} data-size={settings.size || undefined}>
      {children}
    </div>
  );
}

export default function ExamPage() {
  const { attemptId } = useParams();
  const attempt = useAttempt(attemptId);
  const test = useTest(attempt.data?.testId);
  const me = useMe();
  const [settings, setSettingsState] = useState<ExamSettings>(loadSettings);
  const setSettings = (s: ExamSettings) => {
    setSettingsState(s);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    } catch {
      /* ignore */
    }
  };

  if (attempt.isError) return <Navigate to="/app/mocks" replace />;
  if (!attempt.data || !test.data || !me.data) {
    return (
      <ExamLayout settings={settings}>
        <div className="x-screen" role="status">
          <div className="x-screen-inner">Loading test…</div>
        </div>
      </ExamLayout>
    );
  }
  if (attempt.data.status === "submitted") return <Navigate to={`/app/results/${attempt.data.id}`} replace />;
  const section = test.data.sections[attempt.data.sectionIndex];
  if (!section) return <Navigate to={`/app/results/${attempt.data.id}`} replace />;

  return (
    <ExamLayout settings={settings}>
      <SessionProvider key={section.id} attempt={attempt.data} test={test.data} section={section} showFlag={me.data.showFlag} settings={settings}>
        <SectionRunner attempt={attempt.data} test={test.data} section={section} profile={me.data} settings={settings} setSettings={setSettings} />
      </SessionProvider>
    </ExamLayout>
  );
}

type Phase = "confirm" | "intro" | "running" | "submission";

function SectionRunner({
  attempt,
  test,
  section,
  profile,
  settings,
  setSettings,
}: {
  attempt: Attempt;
  test: Test;
  section: Section;
  profile: Profile;
  settings: ExamSettings;
  setSettings: (s: ExamSettings) => void;
}) {
  const navigate = useNavigate();
  const s = useSession();
  const submit = useSubmitSection();
  const state = attempt.sections[attempt.sectionIndex];
  const resumed = state.status === "in-progress";
  const practice = attempt.mode === "practice";
  const isLast = attempt.sectionIndex === test.sections.length - 1;

  const [phase, setPhase] = useState<Phase>(resumed ? "running" : attempt.sectionIndex === 0 && !practice ? "confirm" : "intro");
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [clockStarted, setClockStarted] = useState(section.skill !== "listening" || false);
  const [noTimeLimit, setNoTimeLimit] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [heard, setHeard] = useState(false);
  const [devicesReady, setDevicesReady] = useState(false);
  const unsaved = useRef(0);

  const doSubmit = useCallback(async () => {
    await s.flush();
    const res = await submit.mutateAsync({ attemptId: attempt.id, sectionId: section.id });
    if (res.resultReady) navigate(`/app/results/${attempt.id}?fresh=1`, { replace: true });
  }, [s, submit, attempt.id, section.id, navigate]);

  const running = (phase === "running" || phase === "submission") && clockStarted && section.skill !== "speaking" && !noTimeLimit;
  const { remaining } = useCountdown({
    initialSec: state.remainingSec,
    running: running && !(practice && timeUp),
    onTick: (rem, delta) => {
      unsaved.current += delta;
      if (unsaved.current >= 10 || rem <= 0) {
        s.addPartTime(unsaved.current);
        s.saveRemaining(rem);
        unsaved.current = 0;
      }
    },
    onExpire: () => {
      if (practice) setTimeUp(true);
      else void doSubmit();
    },
  });

  // Warn before leaving while a section is running.
  useEffect(() => {
    if (phase !== "running") return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [phase]);

  const leave = async () => {
    if (unsaved.current) s.addPartTime(unsaved.current);
    s.saveRemaining(remaining);
    await s.flush();
    navigate(practice ? "/app/practice" : "/app/mocks");
  };

  const ctx = {
    candidate: profile.name,
    remaining,
    startClock: () => setClockStarted(true),
    clockStarted,
    noTimeLimit,
    openOptions: () => setOptionsOpen(true),
    finish: () => setPhase("submission"),
    volume,
    setVolume,
    submitNow: () => void doSubmit(),
  };

  const header = <ExamHeader candidate={profile.name} practice={practice} showClock={false} onOptions={() => setOptionsOpen(true)} />;

  return (
    <Runner.Provider value={ctx}>
      {phase === "confirm" && (
        <>
          {header}
          <ConfirmScreen name={profile.name} attempt={attempt} onConfirm={() => setPhase("intro")} onLeave={leave} />
        </>
      )}
      {phase === "intro" && (
        <>
          {header}
          <IntroScreen
            section={section}
            practice={practice}
            accommodation={attempt.accommodation}
            startDisabled={(section.skill === "listening" && !heard && !practice) || (section.skill === "speaking" && !devicesReady)}
            onStart={() => {
              s.saveRemaining(remaining);
              setPhase("running");
            }}
          >
            {section.skill === "listening" && (
              <SoundCheck sample={test.sections.find((x) => x.skill === "speaking")?.parts[0].speaking?.intro?.audio ?? "/audio/academic-1/speaking-a1-s-intro.m4a"} volume={volume} onVolume={setVolume} onHeard={() => setHeard(true)} />
            )}
            {section.skill === "speaking" && <DeviceCheck onReady={() => setDevicesReady(true)} />}
          </IntroScreen>
        </>
      )}
      {phase === "running" && (
        <>
          {timeUp && (
            <div className="x-practice-note" role="status" style={{ margin: 0, borderRadius: 0, textAlign: "center" }}>
              Time is up. In the real test your answers would be submitted now. You can keep working in practice mode.
            </div>
          )}
          {section.skill === "reading" && <ReadingSection />}
          {section.skill === "listening" && <ListeningSection />}
          {section.skill === "writing" && <WritingSection />}
          {section.skill === "speaking" && <SpeakingRoom />}
        </>
      )}
      {phase === "submission" && (
        <>
          <ExamHeader candidate={profile.name} practice={practice} remaining={section.skill === "speaking" ? undefined : remaining} onOptions={() => setOptionsOpen(true)} />
          <SubmissionScreen
            section={section}
            answers={s.state.answers}
            flags={s.state.flags}
            essays={s.state.essays}
            canGoBack={section.skill !== "speaking" && (remaining > 0 || practice)}
            busy={submit.isPending}
            onBack={() => setPhase("running")}
            onSubmit={() => void doSubmit()}
            isLast={isLast}
          />
        </>
      )}
      {optionsOpen && (
        <OptionsPanel
          settings={settings}
          onChange={setSettings}
          onClose={() => setOptionsOpen(false)}
          onSubmissionPage={() => {
            setOptionsOpen(false);
            if (phase === "running") setPhase("submission");
          }}
          onLeave={leave}
          practiceExtras={
            practice && section.skill !== "speaking" ? (
              <label style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 0" }}>
                <input type="checkbox" checked={noTimeLimit} onChange={(e) => setNoTimeLimit(e.target.checked)} />
                No time limit
              </label>
            ) : undefined
          }
        />
      )}
    </Runner.Provider>
  );
}
