import React, { useEffect, useRef, useState } from "react";
import {
  GitFork,
  ArrowUpRight,
  BookOpen,
  RotateCcw,
  Play,
  Pause,
  StepBack,
  StepForward,
  SkipForward,
} from "lucide-react";

export function Header({ active = "minimax", onGuide, onConcepts }) {
  return (
    <header className="site-header">
      <a className="brand" href="#/" aria-label="Branch home">
        <span className="brand-mark">
          <GitFork size={23} />
        </span>
        branch<span className="brand-dot">.</span>
      </a>
      <div className="header-divider" />
      <span className="brand-descriptor">
        A little clarity for complex decisions.
      </span>
      <nav aria-label="Main navigation">
        <a
          className={active === "minimax" ? "nav-active" : ""}
          aria-current={active === "minimax" ? "page" : undefined}
          href="#/"
        >
          Minimax
        </a>
        <a
          className={active === "search" ? "nav-active" : ""}
          aria-current={active === "search" ? "page" : undefined}
          href="#/search"
        >
          Graph search
        </a>
        <a
          className={active === "queens" ? "nav-active" : ""}
          aria-current={active === "queens" ? "page" : undefined}
          href="#/queens"
        >
          N-Queens
        </a>
        <button className="concept-nav" onClick={onConcepts}>
          The concepts
        </button>
        <button
          aria-label="Quick guide"
          className="nav-guide"
          onClick={onGuide}
        >
          <BookOpen size={15} />
          <span>Quick guide</span>
          <ArrowUpRight size={14} />
        </button>
      </nav>
    </header>
  );
}
export function Footer({ onTop }) {
  return (
    <footer>
      <a className="brand footer-brand" href="#/">
        <GitFork size={18} />
        branch.
      </a>
      <span>Less memorizing. More understanding.</span>
      <button onClick={onTop}>
        Back to the playground <ArrowUpRight size={13} />
      </button>
    </footer>
  );
}
export function usePlayback(frames, { interval = 800, enabled = true } = {}) {
  const [step, setStep] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1);
  const last = frames.length - 1;
  const reset = () => {
    setStep(0);
    setPlaying(false);
  };
  useEffect(() => {
    reset();
  }, [frames]);
  useEffect(() => {
    if (step >= last) setPlaying(false);
  }, [step, last, playing]);
  useEffect(() => {
    if (!playing || !enabled) return;
    const timer = setInterval(
      () => setStep((s) => Math.min(s + 1, last)),
      interval / speed,
    );
    return () => clearInterval(timer);
  }, [playing, speed, last, interval, enabled]);
  const move = (delta) => {
    setPlaying(false);
    setStep((s) => Math.max(0, Math.min(last, s + delta)));
  };
  const toggle = () => {
    if (step >= last) setStep(0);
    setPlaying((p) => !p);
  };
  useEffect(() => {
    const key = (e) => {
      if (!enabled) return;
      if (
        ["INPUT", "BUTTON", "SELECT", "TEXTAREA", "A"].includes(
          e.target.tagName,
        ) ||
        document.querySelector('[role="dialog"]')
      )
        return;
      if (e.code === "Space") {
        e.preventDefault();
        toggle();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        move(1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        move(-1);
      }
      if (e.key.toLowerCase() === "r") reset();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });
  return {
    step: Math.min(step, last),
    setStep,
    playing,
    setPlaying,
    speed,
    setSpeed,
    reset,
    move,
    toggle,
    last,
    frame: frames[Math.min(step, last)],
  };
}
export function Playback({
  playback: p,
  unit = "Step",
  playLabel = "Play",
  nextLabel = "Next step",
  previousLabel = "Previous step",
}) {
  return (
    <div className="playback">
      <div className="timeline-row">
        <span>
          {unit} <strong>{p.step}</strong>
          <span> / {p.last}</span>
        </span>
        <input
          aria-label={`${unit} timeline`}
          type="range"
          min="0"
          max={p.last}
          value={p.step}
          style={{ "--progress": `${p.last ? (p.step / p.last) * 100 : 100}%` }}
          onChange={(e) => {
            p.setPlaying(false);
            p.setStep(Number(e.target.value));
          }}
        />
        <span className="timeline-end">
          {p.last ? Math.round((p.step / p.last) * 100) : 100}%
        </span>
      </div>
      <div className="playback-buttons">
        <div className="playback-main">
          <button
            aria-label="Reset search"
            title="Reset (R)"
            onClick={p.reset}
            disabled={!p.step && !p.playing}
          >
            <RotateCcw size={16} />
          </button>
          <button
            aria-label={previousLabel}
            disabled={!p.step}
            onClick={() => p.move(-1)}
          >
            <StepBack size={19} />
          </button>
          <button className="play-button" onClick={p.toggle} disabled={!p.last}>
            {p.playing ? (
              <Pause size={15} fill="currentColor" />
            ) : (
              <Play size={15} fill="currentColor" />
            )}
            {p.playing ? "Pause" : p.step === p.last ? "Replay" : playLabel}
            <span>space</span>
          </button>
          <button
            aria-label={nextLabel}
            disabled={p.step === p.last}
            onClick={() => p.move(1)}
          >
            <StepForward size={19} />
          </button>
          <button
            aria-label="Jump to result"
            disabled={p.step === p.last}
            onClick={() => {
              p.setPlaying(false);
              p.setStep(p.last);
            }}
          >
            <SkipForward size={16} />
          </button>
        </div>
        <label className="speed-control">
          Speed
          <select
            aria-label="Playback speed"
            value={p.speed}
            onChange={(e) => p.setSpeed(Number(e.target.value))}
          >
            {[0.5, 1, 2, 4].map((v) => (
              <option key={v} value={v}>
                {v}×
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
export function Modal({ title, children, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    const previous = document.activeElement,
      old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current.focus();
    const handler = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const buttons = dialog.current.querySelectorAll(
          'button:not(:disabled), a, input, select, [tabindex="0"]',
        ),
        first = buttons[0],
        last = buttons[buttons.length - 1];
      if (
        e.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === dialog.current)
      ) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        className="modal"
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex="-1"
      >
        <div className="modal-heading">
          <span className="eyebrow">BRANCH / FIELD NOTES</span>
          <button aria-label="Close dialog" onClick={onClose}>
            ×
          </button>
        </div>
        <h2 id="modal-title">{title}</h2>
        {children}
      </section>
    </div>
  );
}
export function WorkspaceHeading({
  right = "Experiment. Observe. Understand.",
}) {
  return (
    <div className="workspace-heading">
      <div>
        <span className="live-dot" />
        INTERACTIVE WORKSPACE
        <span className="workspace-line" />
      </div>
      <span>{right}</span>
    </div>
  );
}
