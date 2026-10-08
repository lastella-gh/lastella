import { useEffect, useRef, useState } from "react";

// MyMemory accepts at most 500 UTF-8 bytes per request.
function translationChunks(source: string) {
  const encoder = new TextEncoder();
  const chunks: string[] = [];
  let remaining = source;

  while (encoder.encode(remaining).length > 500) {
    let length = 0;
    let bytes = 0;
    let boundary = 0;
    for (const character of remaining) {
      bytes += encoder.encode(character).length;
      if (bytes > 500) break;
      length += character.length;
      if (/\s/.test(character)) boundary = length;
    }
    const end = boundary || length;
    chunks.push(remaining.slice(0, end));
    remaining = remaining.slice(end);
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

export async function translateToArabic(sourceText: string, signal?: AbortSignal) {
  const translatedChunks: string[] = [];
  for (const chunk of translationChunks(sourceText.trim())) {
    if (!chunk.trim()) {
      translatedChunks.push(chunk);
      continue;
    }
    const params = new URLSearchParams({ q: chunk.trim(), langpair: "en|ar" });
    const response = await fetch(`https://api.mymemory.translated.net/get?${params}`, {
      signal,
    });
    if (!response.ok) throw new Error("Translation request failed");
    const result = (await response.json()) as {
      responseData?: { translatedText?: string };
      responseStatus?: number | string;
    };
    if (Number(result.responseStatus ?? 200) >= 400) {
      throw new Error("Translation request failed");
    }
    const translated = result.responseData?.translatedText?.trim();
    if (!translated) throw new Error("Translation was empty");
    translatedChunks.push(translated + (chunk.match(/\s+$/)?.[0] ?? ""));
  }
  return translatedChunks.join("");
}

export function useArabicTranslation(initialEnglish = "", initialArabic = "") {
  const [english, setEnglish] = useState(initialEnglish);
  const [arabic, setArabic] = useState(initialArabic);
  const [status, setStatus] = useState<"idle" | "translating" | "failed">("idle");
  const englishRef = useRef(english);
  const arabicEditedRef = useRef(Boolean(initialArabic.trim()));
  const translatedSourceRef = useRef(initialArabic ? initialEnglish.trim() : "");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  function updateEnglish(value: string) {
    abortRef.current?.abort();
    englishRef.current = value;
    setEnglish(value);
    setStatus("idle");
  }

  function updateArabic(value: string) {
    abortRef.current?.abort();
    arabicEditedRef.current = true;
    setArabic(value);
    setStatus("idle");
  }

  async function translate() {
    const source = englishRef.current.trim();
    if (!source || source === translatedSourceRef.current || arabicEditedRef.current) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("translating");

    try {
      const translated = await translateToArabic(source, controller.signal);
      if (controller.signal.aborted || abortRef.current !== controller) return;
      if (englishRef.current.trim() !== source || arabicEditedRef.current) {
        setStatus("idle");
        return;
      }

      translatedSourceRef.current = source;
      setArabic(translated);
      setStatus("idle");
    } catch {
      if (controller.signal.aborted) return;
      if (abortRef.current === controller) setStatus("failed");
    }
  }

  return { english, arabic, status, updateEnglish, updateArabic, translate };
}
