import { useState, useEffect } from "react";

const CELL_SIZE = 30;

export function useGridDimensions() {
  const [dimensions, setDimensions] = useState({
    cols: Math.ceil((typeof window !== "undefined" ? window.innerWidth : 800) / CELL_SIZE),
    rows: Math.ceil((typeof window !== "undefined" ? window.innerHeight : 600) / CELL_SIZE),
  });

  useEffect(() => {
    const update = () => {
      setDimensions({
        cols: Math.ceil(window.innerWidth / CELL_SIZE),
        rows: Math.ceil(window.innerHeight / CELL_SIZE),
      });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return { cols: dimensions.cols, rows: dimensions.rows, cellSize: CELL_SIZE };
}
