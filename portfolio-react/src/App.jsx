import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";

document.addEventListener("gesturestart", (e) => e.preventDefault());
document.addEventListener("gesturechange", (e) => e.preventDefault());
document.addEventListener("gestureend", (e) => e.preventDefault());
window.addEventListener(
  "wheel",
  (e) => {
    if (e.ctrlKey) e.preventDefault();
  },
  { passive: false },
);

import { useGridDimensions } from "./hooks/useGridDimensions";
import { BackArrow } from "./components/BackArrow";
import { LetterOverlay } from "./components/LetterOverlay";
import { projects, projectVideos } from "./data/projects";

const AB_TEST_NO_LOAD_ANIMATIONS = false;

function getReservedCells(cols, rows) {
  const reserved = new Set();
  const isSmallScreen =
    typeof window !== "undefined" && window.innerWidth < 660;
  const startCol = cols - 7;
  const startRow = 1;
  for (let i = 0; i < 6; i++) reserved.add(`${startRow}-${startCol + i}`);
  if (isSmallScreen) {
    const fullStackRow = rows - 3;
    const developerRow = rows - 2;
    const endCol = cols - 2;
    for (let i = 0; i < 9; i++)
      reserved.add(`${fullStackRow}-${endCol - 8 + i}`);
    for (let i = 0; i < 9; i++)
      reserved.add(`${developerRow}-${endCol - 8 + i}`);
  } else {
    const bottomRow = rows - 2;
    const endCol = cols - 2;
    for (let i = 0; i < 9; i++) reserved.add(`${bottomRow}-${endCol - 8 + i}`);
  }
  return reserved;
}

function getValidIndices(cols, rows, reserved) {
  const valid = [];
  const isSmallScreen =
    typeof window !== "undefined" && window.innerWidth < 660;
  const omarRow = 2;
  const bottomRow = isSmallScreen ? rows - 4 : rows - 3;
  for (let i = 0; i < cols * rows; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    if (c === cols - 1 || r === rows - 1) continue;
    if (reserved.has(`${r}-${c}`)) continue;
    if (r <= omarRow || r >= bottomRow) continue;
    valid.push(i);
  }
  return valid;
}

function pickRandomFrom(arr, count) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function getRandomValidIndex(cols, rows, reserved) {
  const valid = getValidIndices(cols, rows, reserved);
  return valid[Math.floor(Math.random() * valid.length)] ?? 0;
}

function startShuffleAnimation(
  projectPositions,
  cols,
  rows,
  reserved,
  cellRefs,
  onComplete,
) {
  const shuffleCount = 3;
  let currentShuffle = 0;

  function performShuffle() {
    projectPositions.forEach((pos) => {
      const cell = cellRefs.current[pos.index];
      if (!cell) return;
      const randomIndex = getRandomValidIndex(cols, rows, reserved);
      const randomCol = randomIndex % cols;
      const randomRow = Math.floor(randomIndex / cols);
      cell.style.gridColumn = `${randomCol + 1}`;
      cell.style.gridRow = `${randomRow + 1}`;
    });
    currentShuffle++;
    if (currentShuffle < shuffleCount) {
      setTimeout(performShuffle, 250);
    } else {
      setTimeout(() => {
        projectPositions.forEach((pos) => {
          const cell = cellRefs.current[pos.index];
          if (!cell) return;
          cell.style.gridColumn = `${pos.col + 1}`;
          cell.style.gridRow = `${pos.row + 1}`;
        });
        onComplete?.();
      }, 100);
    }
  }
  setTimeout(performShuffle, 100);
}

function partialExpand(gridEl, cols, rows, row, col) {
  if (!gridEl) return;
  const headerEndRow = 1;
  const isSmallScreen = window.innerWidth < 660;
  const footerStartRow = isSmallScreen ? rows - 3 : rows - 1;
  const centerCol = Math.floor(cols / 2) - 1;
  const centerRow = Math.floor(rows / 2) - 2;
  const expandLeft = col > centerCol;
  const expandUp = row > centerRow;
  const expandedWidth = 210;
  const expandedHeight = 150;
  const normal = 30;
  const minRowHeight = 5;
  const widthDist = expandedWidth - normal;
  const heightDist = expandedHeight - normal;

  const colSizes = Array.from({ length: cols }, (_, c) => {
    if (c === col) return `${expandedWidth}px`;
    let squeeze = normal;
    if (expandLeft && c < col) squeeze = normal - widthDist / (col || 1);
    else if (!expandLeft && c > col)
      squeeze = normal - widthDist / (cols - col - 1 || 1);
    return `${Math.max(squeeze, 5)}px`;
  });

  const rowsAbove = row - headerEndRow - 1;
  const rowsBelow = footerStartRow - row - 1;
  const contentRowsToSqueeze = expandUp
    ? (rowsAbove > 0 ? rowsAbove : rowsBelow) || 0
    : (rowsBelow > 0 ? rowsBelow : rowsAbove) || 0;
  const squeezeDenom = contentRowsToSqueeze || 1;
  const squeezeFromHeaderFooter = contentRowsToSqueeze === 0;
  const headerFooterRows = headerEndRow + 1 + (rows - footerStartRow);
  const maxRecoverableFromContent =
    contentRowsToSqueeze * (normal - minRowHeight);
  const maxRecoverableFromHeaderFooter = squeezeFromHeaderFooter
    ? headerFooterRows * (normal - minRowHeight)
    : 0;
  const actualHeightDist = Math.min(
    heightDist,
    maxRecoverableFromContent + maxRecoverableFromHeaderFooter,
  );

  const rowSizes = Array.from({ length: rows }, (_, r) => {
    if (r === row) return `${normal + actualHeightDist}px`;
    if (r <= headerEndRow || r >= footerStartRow) {
      if (squeezeFromHeaderFooter)
        return `${Math.max(normal - actualHeightDist / headerFooterRows, minRowHeight)}px`;
      return `${normal}px`;
    }
    let squeeze = normal;
    if (expandUp) {
      if (r < row && r > headerEndRow)
        squeeze = normal - actualHeightDist / squeezeDenom;
      else if (rowsAbove === 0 && r > row && r < footerStartRow)
        squeeze = normal - actualHeightDist / squeezeDenom;
    } else {
      if (r > row && r < footerStartRow)
        squeeze = normal - actualHeightDist / squeezeDenom;
      else if (rowsBelow === 0 && r < row && r > headerEndRow)
        squeeze = normal - actualHeightDist / squeezeDenom;
    }
    return `${Math.max(squeeze, minRowHeight)}px`;
  });

  gridEl.style.transition =
    "grid-template-columns 0.4s cubic-bezier(0.4, 0, 0.2, 1), grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1)";
  gridEl.style.gridTemplateColumns = colSizes.join(" ");
  gridEl.style.gridTemplateRows = rowSizes.join(" ");
}

function collapsePartial(gridEl, cols, rows, cellSize) {
  if (!gridEl) return;
  gridEl.style.transition =
    "grid-template-columns 0.4s cubic-bezier(0.4, 0, 0.2, 1), grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1)";
  gridEl.style.gridTemplateColumns = Array(cols)
    .fill(`${cellSize}px`)
    .join(" ");
  gridEl.style.gridTemplateRows = Array(rows).fill(`${cellSize}px`).join(" ");
}

function expandGrid(gridEl, cols, rows, clickedCol, clickedRow, cellSize) {
  if (!gridEl) return;
  gridEl.style.transition =
    "grid-template-columns 0.7s cubic-bezier(0.4, 0, 0.2, 1), grid-template-rows 0.7s cubic-bezier(0.4, 0, 0.2, 1)";
  gridEl.style.gridTemplateColumns = Array.from({ length: cols }, (_, c) =>
    c === clickedCol ? `${window.innerWidth}px` : "0px",
  ).join(" ");
  gridEl.style.gridTemplateRows = Array.from({ length: rows }, (_, r) =>
    r === clickedRow ? `${window.innerHeight}px` : "0px",
  ).join(" ");
}

function collapseGrid(gridEl, cols, rows, cellSize) {
  if (!gridEl) return;
  gridEl.style.transition =
    "grid-template-columns 0.7s cubic-bezier(0.4, 0, 0.2, 1), grid-template-rows 0.7s cubic-bezier(0.4, 0, 0.2, 1)";
  gridEl.style.gridTemplateColumns = Array(cols)
    .fill(`${cellSize}px`)
    .join(" ");
  gridEl.style.gridTemplateRows = Array(rows).fill(`${cellSize}px`).join(" ");
}

export default function App() {
  const { cols, rows, cellSize } = useGridDimensions();
  const gridRef = useRef(null);
  const letterGridRef = useRef(null);
  const mainRef = useRef(null);
  const justCollapsedRef = useRef(false);
  const projectCellRefs = useRef({});
  const expandedCellRef = useRef(null);

  const [projectPositions, setProjectPositions] = useState([]);
  const [isInitialAnimating, setIsInitialAnimating] = useState(false);
  const backArrowRef = useRef(null);
  const letterOverlayRef = useRef(null);

  const reserved = useMemo(() => getReservedCells(cols, rows), [cols, rows]);
  const totalCells = cols * rows;

  useEffect(() => {
    const valid = getValidIndices(cols, rows, reserved);
    const picked = pickRandomFrom(valid, projects.length);
    const positions = projects.map((project, i) => {
      const idx = picked[i] ?? valid[i % valid.length] ?? 0;
      return {
        index: idx,
        row: Math.floor(idx / cols),
        col: idx % cols,
        project,
      };
    });
    setProjectPositions(positions);
    return () => {
      projectCellRefs.current = {};
    };
  }, [cols, rows, reserved]);

  useEffect(() => {
    if (projectPositions.length === 0) return;
    if (AB_TEST_NO_LOAD_ANIMATIONS) return;
    setIsInitialAnimating(true);
    startShuffleAnimation(
      projectPositions,
      cols,
      rows,
      reserved,
      projectCellRefs,
      () => setIsInitialAnimating(false),
    );
  }, [projectPositions, cols, rows, reserved]);

  useEffect(() => {
    if (!gridRef.current) return;
    gridRef.current.style.gridTemplateColumns = Array(cols)
      .fill(`${cellSize}px`)
      .join(" ");
    gridRef.current.style.gridTemplateRows = Array(rows)
      .fill(`${cellSize}px`)
      .join(" ");
  }, [cols, rows, cellSize]);

  const handleMouseEnter = useCallback(
    (e, pos) => {
      if (
        justCollapsedRef.current ||
        expandedCellRef.current ||
        window.matchMedia("(hover: none)").matches
      )
        return;
      if (pos) {
        partialExpand(gridRef.current, cols, rows, pos.row, pos.col);
        e.currentTarget.style.zIndex = "10";
      }

      const vidConfig = pos?.project?.name && projectVideos[pos.project.name];
      if (vidConfig) {
        const cell = e.currentTarget;
        let video = cell.querySelector("[data-hover-video]");
        if (video) {
          if (video._removeTimeout) {
            clearTimeout(video._removeTimeout);
            video._removeTimeout = null;
          }
          video.classList.remove("fade-out");
          video.classList.add("show");
          video.play().catch(() => {});
          return;
        }
        video = document.createElement("video");
        video.setAttribute("data-hover-video", "");
        video.className = "project-preview-video";
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = "auto";
        video.controls = false;
        video.setAttribute("playsinline", "");
        video.setAttribute("webkit-playsinline", "");
        video.addEventListener("webkitbeginfullscreen", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
        });
        video.addEventListener("webkitendfullscreen", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
        });
        const mp4 = document.createElement("source");
        mp4.src = vidConfig.mp4;
        mp4.type = "video/mp4";
        video.appendChild(mp4);
        const webm = document.createElement("source");
        webm.src = vidConfig.webm;
        webm.type = "video/webm";
        video.appendChild(webm);
        cell.appendChild(video);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => video.classList.add("show"));
        });
        if (video.readyState >= 2) {
          video.play().catch(() => {});
        } else {
          video.addEventListener(
            "loadeddata",
            () => video.play().catch(() => {}),
            { once: true },
          );
          video.load();
        }
      }
    },
    [cols, rows],
  );

  const handleMouseLeave = useCallback(
    (e, pos) => {
      if (!expandedCellRef.current) {
        collapsePartial(gridRef.current, cols, rows, cellSize);
        e.currentTarget.style.zIndex = "";
      }
      if (expandedCellRef.current) return;
      const hv = e.currentTarget.querySelector("[data-hover-video]");
      if (hv) {
        hv.classList.add("fade-out");
        hv.pause();
        hv.currentTime = 0;
        hv._removeTimeout = setTimeout(() => {
          hv._removeTimeout = null;
          hv.remove();
        }, 400);
      }
    },
    [cols, rows, cellSize],
  );

  const handleClick = useCallback(
    (e, pos) => {
      if (!pos || expandedCellRef.current) return;
      const cell = e.currentTarget;
      let video = cell.querySelector("[data-hover-video]");
      const vidConfig = pos.project?.name && projectVideos[pos.project.name];
      if (vidConfig) {
        if (!video) {
          video = document.createElement("video");
          video.setAttribute("data-hover-video", "");
          video.className = "project-preview-video show fully-expanded";
          video.muted = true;
          video.loop = true;
          video.playsInline = true;
          video.preload = "auto";
          video.controls = false;
          video.setAttribute("playsinline", "");
          video.setAttribute("webkit-playsinline", "");
          video.addEventListener("webkitbeginfullscreen", (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
          });
          video.addEventListener("webkitendfullscreen", (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
          });
          const mp4 = document.createElement("source");
          mp4.src = vidConfig.mp4;
          mp4.type = "video/mp4";
          video.appendChild(mp4);
          const webm = document.createElement("source");
          webm.src = vidConfig.webm;
          webm.type = "video/webm";
          video.appendChild(webm);
          cell.appendChild(video);
          video.load();
          video.play().catch(() => {});
        } else {
          video.classList.add("fully-expanded");
        }
      } else if (video) {
        video.remove();
      }
      if (letterGridRef.current) letterGridRef.current.style.opacity = "0";
      expandGrid(gridRef.current, cols, rows, pos.col, pos.row, cellSize);
      cell.classList.add("expanded");
      cell.style.gridColumn = `${pos.col + 1} / span 1`;
      cell.style.gridRow = `${pos.row + 1} / span 1`;
      cell.style.zIndex = "1000";
      backArrowRef.current?.classList.add("show");
      mainRef.current?.setAttribute("data-expanded", "");
      letterOverlayRef.current?.updateProject?.(pos.project?.name);
      expandedCellRef.current = { cell, pos };
    },
    [cols, rows, cellSize],
  );

  const handleCollapse = useCallback(() => {
    const expanded = expandedCellRef.current;
    if (!expanded) return;
    const { cell, pos } = expanded;
    if (cell) {
      expandedCellRef.current = null;
      const video = cell.querySelector("[data-hover-video]");
      if (video) {
        video.classList.add("fade-out");
        setTimeout(() => video.remove(), 400);
      }
    }
    mainRef.current?.classList.add("collapsing");
    collapseGrid(gridRef.current, cols, rows, cellSize);
    justCollapsedRef.current = true;
    setTimeout(() => {
      justCollapsedRef.current = false;
    }, 50);
    setTimeout(() => {
      if (letterGridRef.current) letterGridRef.current.style.opacity = "1";
      mainRef.current?.classList.remove("collapsing");
      mainRef.current?.removeAttribute("data-expanded");
      backArrowRef.current?.classList.remove("show");
      letterOverlayRef.current?.updateProject?.(null);
      cell.classList.remove("expanded");
      cell.style.gridColumn = pos ? `${pos.col + 1}` : "";
      cell.style.gridRow = pos ? `${pos.row + 1}` : "";
      cell.style.zIndex = "";
      expandedCellRef.current = null;
    }, 700);
  }, [cols, rows, cellSize]);

  useEffect(() => {
    const handleResize = () => {
      if (expandedCellRef.current) handleCollapse();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleCollapse]);

  return (
    <main
      ref={mainRef}
      aria-label="Portfolio"
      role="main"
      data-initial-animating={isInitialAnimating || undefined}
    >
      <div ref={gridRef} className="highlight-grid">
        {Array.from({ length: totalCells }).map((_, i) => {
          const cellRow = Math.floor(i / cols);
          const cellCol = i % cols;
          const pos = projectPositions.find((p) => p.index === i);

          return (
            <div
              key={i}
              ref={(el) => {
                if (pos) projectCellRefs.current[pos.index] = el;
              }}
              className={`highlight-cell ${pos ? "project-cell" : ""}`}
              style={{
                backgroundColor: pos?.project.color,
                gridColumn: pos ? `${pos.col + 1}` : undefined,
                gridRow: pos ? `${pos.row + 1}` : undefined,
              }}
              data-row={cellRow}
              data-col={cellCol}
              data-project={pos?.project?.name}
              onMouseEnter={(e) => handleMouseEnter(e, pos)}
              onMouseLeave={(e) => handleMouseLeave(e, pos)}
              onClick={(e) => handleClick(e, pos)}
            ></div>
          );
        })}
      </div>

      <LetterOverlay
        ref={letterGridRef}
        overlayRef={letterOverlayRef}
        cols={cols}
        rows={rows}
      />

      <BackArrow ref={backArrowRef} onClick={handleCollapse} />
    </main>
  );
}
