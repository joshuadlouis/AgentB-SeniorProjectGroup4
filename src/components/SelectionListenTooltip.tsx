import { useState, useEffect, useCallback, useRef } from "react";
import { Volume2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function SelectionListenTooltip() {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState("");
  const navigate = useNavigate();
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleSelectionChange = useCallback(() => {
    const sel = window.getSelection();
    const text = sel?.toString().trim() || "";
    if (text.length < 3) {
      setPos(null);
      return;
    }
    const range = sel?.getRangeAt(0);
    if (!range) return;
    const rect = range.getBoundingClientRect();
    setPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
    setSelectedText(text);
  }, []);

  useEffect(() => {
    const onMouseUp = () => setTimeout(handleSelectionChange, 10);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("selectionchange", () => {
      const sel = window.getSelection();
      if (!sel?.toString().trim()) setPos(null);
    });
    return () => {
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [handleSelectionChange]);

  const handleListen = useCallback(() => {
    window.getSelection()?.removeAllRanges();
    setPos(null);
    navigate("/read-aloud", { state: { text: selectedText } });
  }, [selectedText, navigate]);

  if (!pos) return null;

  return (
    <div
      ref={tooltipRef}
      className="fixed z-[100] animate-in fade-in-0 zoom-in-95 duration-150"
      style={{
        left: pos.x,
        top: pos.y,
        transform: "translate(-50%, -100%)",
      }}
    >
      <button
        onClick={handleListen}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-lg hover:bg-accent transition-colors"
      >
        <Volume2 className="h-3.5 w-3.5 text-primary" />
        Listen
      </button>
      <div className="mx-auto h-0 w-0 border-x-[6px] border-t-[6px] border-x-transparent border-t-border" />
    </div>
  );
}
