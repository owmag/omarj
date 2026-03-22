// PROJECT letter config: [{ char, left }, ...] for ids p, r, o, j, e, c, t, space1, lparen, c2, l, i, c3, k, e2, d, rparen
const LETTER_SPACING = 30;
const LETTER_OFFSET = 15;

function getStartCol(baseOffset, breakpoint = 0) {
  const letterCols = Math.ceil(window.innerWidth / 30);
  const endCol = letterCols - 2;
  const cellsToMoveRight = breakpoint && window.innerWidth < breakpoint
    ? Math.floor((breakpoint - window.innerWidth) / 30)
    : 0;
  return endCol - baseOffset + cellsToMoveRight;
}

export function getProjectLetterConfig(projectName) {
  const configs = Array(17).fill(null).map(() => ({ char: "", left: 0 }));
  const set = (i, char, col, extraOffset = 0) => {
    if (i < 17) configs[i] = { char, left: col * 30 + LETTER_OFFSET + i * LETTER_SPACING + extraOffset };
  };

  const letterCols = Math.ceil(window.innerWidth / 30);
  const endCol = letterCols - 2;

  if (projectName === "Pomodoro Timer") {
    const startCol = getStartCol(13, 480);
    const chars = ["P", "o", "m", "o", "d", "o", "r", "o", " ", "T", "i", "m", "e", "r"];
    chars.forEach((c, i) => configs[i] = { char: c, left: startCol * 30 + LETTER_OFFSET + i * LETTER_SPACING });
  } else if (projectName === "QUOMMUNE") {
    const startCol = endCol - 7;
    const chars = ["Q", "U", "O", "M", "M", "U", "N", "E"];
    chars.forEach((c, i) => configs[i] = { char: c, left: startCol * 30 + LETTER_OFFSET + i * LETTER_SPACING });
  } else if (projectName === "TEMPUS Katoomba") {
    const startCol = getStartCol(14, 510);
    const chars = ["T", "E", "M", "P", "U", "S", " ", "K", "a", "t", "o", "o", "m", "b", "a"];
    chars.forEach((c, i) => configs[i] = { char: c, left: startCol * 30 + LETTER_OFFSET + i * LETTER_SPACING });
  } else if (projectName === "welcome.audio") {
    const startCol = getStartCol(12, 450);
    const chars = ["w", "e", "l", "c", "o", "m", "e", ".", "a", "u", "d", "i", "o"];
    chars.forEach((c, i) => configs[i] = { char: c, left: startCol * 30 + LETTER_OFFSET + i * LETTER_SPACING });
  } else if (projectName === "B'WIG'D") {
    const startCol = endCol - 7;
    const chars = ["B", "'", "W", "I", "G", "'", "D"];
    chars.forEach((c, i) => configs[i] = { char: c, left: startCol * 30 + LETTER_OFFSET + (i + 1) * LETTER_SPACING }); // +1 offset for B
  } else if (projectName === "2nd Model") {
    const startCol = endCol - 8;
    const chars = ["2", "n", "d", " ", "M", "o", "d", "e", "l"];
    chars.forEach((c, i) => configs[i] = { char: c, left: startCol * 30 + LETTER_OFFSET + i * LETTER_SPACING });
  }

  return configs;
}
