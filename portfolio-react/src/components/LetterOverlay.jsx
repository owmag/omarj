import React, { useEffect, useRef, forwardRef } from "react";
import { getProjectLetterConfig } from "../utils/projectLetters";

const AB_TEST_NO_LOAD_ANIMATIONS = false;
const NON_LETTERS = "0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/~`";

function cascadeLanding(ref, finalLetter, delay) {
  if (!ref?.current) return;
  const el = ref.current;
  const randomChars = [...Array(6)].map(
    () => NON_LETTERS[Math.floor(Math.random() * NON_LETTERS.length)],
  );
  let idx = 0;
  let isLanding = false;
  const tick = () => {
    if (!isLanding) {
      el.textContent = randomChars[idx % randomChars.length];
      idx++;
      setTimeout(tick, 125);
    } else {
      el.textContent = finalLetter;
    }
  };
  tick();
  setTimeout(() => (isLanding = true), delay);
}

function animateLetter(ref, finalLetter, delay) {
  if (!ref?.current) return;
  const el = ref.current;
  el.textContent = "";
  const randomChars = [...Array(6)].map(
    () => NON_LETTERS[Math.floor(Math.random() * NON_LETTERS.length)],
  );
  let idx = 0;
  const tick = () => {
    if (idx < randomChars.length) {
      el.textContent = randomChars[idx];
      idx++;
      setTimeout(tick, 125);
    } else {
      el.textContent = finalLetter;
    }
  };
  setTimeout(tick, 250 + delay);
}

const PROJECT_LETTER_IDS = [
  "p",
  "r",
  "o",
  "j",
  "e",
  "c",
  "t",
  "space1",
  "lparen",
  "c2",
  "l",
  "i",
  "c3",
  "k",
  "e2",
  "d",
  "rparen",
];

export const LetterOverlay = forwardRef(function LetterOverlay(
  { cols, rows, overlayRef },
  letterGridRef,
) {
  const letterRefs = useRef({});
  const getRef = (id) => {
    if (!letterRefs.current[id]) letterRefs.current[id] = { current: null };
    return letterRefs.current[id];
  };

  const letterCols = Math.ceil(window.innerWidth / 30);
  const letterRows = Math.ceil(window.innerHeight / 30);
  const isSmallScreen = window.innerWidth < 660;
  const topLetterRow = 1;
  const bottomLetterRow = isSmallScreen ? letterRows - 3 : letterRows - 2;
  const startCol = letterCols - 7;
  const letterSpacing = 30;

  const omarLetters = ["O", "M", "A", "R", "J"];
  const fullstackLetters = "FULL-STACK".split("");
  const developerLetters = ["", "D", "E", "V", "E", "L", "O", "P", "E", "R"];

  useEffect(() => {
    if (AB_TEST_NO_LOAD_ANIMATIONS) return;
    omarLetters.forEach((letter, i) => {
      animateLetter(getRef(`omar-${i}`), letter, i * 50);
    });
    fullstackLetters.forEach((letter, i) => {
      animateLetter(getRef(`fullstack-${i}`), letter, 250 + i * 50);
    });
    developerLetters.forEach((letter, i) => {
      if (letter) animateLetter(getRef(`developer-${i}`), letter, 750 + i * 50);
    });
  }, [cols, rows]);

  const tickerTimeoutRef = useRef(null);

  const removeTicker = () => {
    if (tickerTimeoutRef.current) {
      clearTimeout(tickerTimeoutRef.current);
      tickerTimeoutRef.current = null;
    }
    PROJECT_LETTER_IDS.forEach((id) => {
      const r = getRef(`project-${id}`);
      if (r?.current) {
        r.current.classList.remove("ticker-crawl");
        r.current.style.removeProperty("--start-position");
        r.current.style.removeProperty("--total-width");
        r.current.style.removeProperty("--steps");
        r.current.style.removeProperty("--duration");
        const parent = r.current.parentNode;
        if (parent) {
          parent.querySelectorAll(`[data-clone-of="project-${id}"]`).forEach((clone) => clone.remove());
        }
      }
    });
  };

  const applyTicker = (projectName) => {
    const shouldApplyTicker =
      (projectName === "Pomodoro Timer" && window.innerWidth < 450) ||
      (projectName === "TEMPUS Katoomba" && window.innerWidth < 480) ||
      (projectName === "welcome.audio" && window.innerWidth < 420);

    if (!shouldApplyTicker) return;

    let totalWidth = 0;
    const lettersWithContent = [];

    PROJECT_LETTER_IDS.forEach((id) => {
      const r = getRef(`project-${id}`);
      if (r?.current && r.current.textContent) {
        lettersWithContent.push({ id, el: r.current });
        const left = parseFloat(r.current.style.left);
        if (!isNaN(left)) totalWidth = Math.max(totalWidth, left + 30);
      }
    });

    const steps = Math.floor(totalWidth / 4);
    const pixelsPerSecond = 30;
    const duration = (totalWidth + 40) / pixelsPerSecond;

    lettersWithContent.forEach(({ id, el }) => {
      const currentLeft = el.style.left;
      if (!currentLeft) return;
      const leftNum = parseFloat(currentLeft);

      const clone = el.cloneNode(true);
      clone.setAttribute("data-clone-of", `project-${id}`);
      clone.style.left = `${leftNum + totalWidth + 40}px`;
      clone.style.setProperty("--start-position", `${leftNum + totalWidth + 40}px`);
      clone.style.setProperty("--total-width", `${totalWidth}px`);
      clone.style.setProperty("--steps", steps);
      clone.style.setProperty("--duration", `${duration}s`);
      clone.classList.add("ticker-crawl");
      el.parentNode.appendChild(clone);

      el.style.setProperty("--start-position", currentLeft);
      el.style.setProperty("--total-width", `${totalWidth}px`);
      el.style.setProperty("--steps", steps);
      el.style.setProperty("--duration", `${duration}s`);
      el.classList.add("ticker-crawl");
    });
  };

  useEffect(() => {
    if (!overlayRef) return;
    const updateProject = (projectName) => {
      removeTicker();

      if (!projectName) {
        PROJECT_LETTER_IDS.forEach((id) => {
          const r = getRef(`project-${id}`);
          if (r?.current) r.current.textContent = "";
        });
        return;
      }

      const config = getProjectLetterConfig(projectName);
      PROJECT_LETTER_IDS.forEach((id, i) => {
        const cfg = config[i];
        const r = getRef(`project-${id}`);
        if (r?.current && cfg) {
          r.current.textContent = cfg.char;
          r.current.style.left = cfg.left + "px";
        }
      });

      tickerTimeoutRef.current = setTimeout(() => applyTicker(projectName), 600);
    };
    overlayRef.current = { updateProject, removeTicker };
    return () => {
      removeTicker();
      if (overlayRef?.current) overlayRef.current = null;
    };
  }, [overlayRef, cols, rows]);

  const addHover = (ref, letter) => {
    if (!ref?.current) return;
    ref.current._originalLetter = letter;
    const onHover = () => cascadeLanding(ref, letter, 0);
    ref.current.onmouseenter = onHover;
    ref.current.ontouchstart = onHover;
  };

  useEffect(() => {
    omarLetters.forEach((l, i) => addHover(getRef(`omar-${i}`), l));
    fullstackLetters.forEach((l, i) => addHover(getRef(`fullstack-${i}`), l));
    developerLetters.forEach(
      (l, i) => l && addHover(getRef(`developer-${i}`), l),
    );
  }, []);

  const omarClipX = startCol * 30;
  const omarClipY = topLetterRow * 30;
  const endCol = letterCols - 2;
  const fullStackRow = isSmallScreen ? letterRows - 3 : letterRows - 2;
  const developerRow = letterRows - 2;
  const fullStackClipX = isSmallScreen ? (endCol - 9) * 30 : (endCol - 19) * 30;
  const fullStackClipW = 10 * 30;
  const fullStackClipY = fullStackRow * 30;
  const devClipY = developerRow * 30;
  const devStartCol = endCol - 9;

  return (
    <>
      <div
        ref={letterGridRef}
        className="letter-grid"
        style={{
          gridTemplateColumns: Array(letterCols).fill("30px").join(" "),
          gridTemplateRows: Array(letterRows).fill("30px").join(" "),
        }}
      >
        {Array.from({ length: letterCols * letterRows }).map((_, i) => {
          const r = Math.floor(i / letterCols);
          const isLetterRow = r <= topLetterRow || r >= bottomLetterRow;
          return (
            <div
              key={i}
              className={`letter-grid-cell ${isLetterRow ? "letter-row-cell" : ""}`}
            />
          );
        })}
      </div>

      <div className="letter-overlay">
        <div
          className="omar-clip-container"
          style={{
            left: omarClipX,
            top: omarClipY,
            width: 6 * 30,
            height: 30,
          }}
        >
          {omarLetters.map((letter, i) => (
            <div
              key={i}
              ref={(el) => {
                getRef(`omar-${i}`).current = el;
              }}
              className="letter"
              style={{
                left: 15 + (i === 4 ? 5 * letterSpacing : i * letterSpacing),
                top: 15,
                transform: "translate(-50%, -50%)",
              }}
            >
              {letter}
            </div>
          ))}
        </div>

        <div
          className="fullstack-clip-container"
          style={{
            left: fullStackClipX,
            top: fullStackClipY,
            width: fullStackClipW,
            height: 30,
          }}
        >
          {fullstackLetters.map((letter, i) => (
            <div
              key={i}
              ref={(el) => {
                getRef(`fullstack-${i}`).current = el;
              }}
              className="letter fullstack"
              style={{
                left: 15 + i * letterSpacing,
                top: 15,
                transform: "translate(-50%, -50%)",
              }}
            >
              {letter}
            </div>
          ))}
        </div>

        <div
          className="developer-clip-container"
          style={{
            left: 0,
            top: devClipY,
            width: window.innerWidth,
            height: 28,
          }}
        >
          {developerLetters.map((letter, i) => (
            <div
              key={i}
              ref={(el) => {
                getRef(`developer-${i}`).current = el;
              }}
              className="letter developer"
              style={{
                left: devStartCol * 30 + 15 + i * letterSpacing,
                top: 15,
                transform: "translate(-50%, -50%)",
              }}
            >
              {letter}
            </div>
          ))}
          {PROJECT_LETTER_IDS.map((id, i) => (
            <div
              key={id}
              ref={(el) => {
                getRef(`project-${id}`).current = el;
              }}
              className="letter project-letter"
              style={{
                left: (endCol - 12) * 30 + 15 + i * letterSpacing,
                top: -15,
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
});
