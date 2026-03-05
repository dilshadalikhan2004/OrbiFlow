"""
AI Task Parser – powered by Google Gemini (free tier).
Falls back to a local regex/heuristic parser if:
  • GEMINI_API_KEY is not set
  • the Gemini call fails for any reason

parse_task_prompt(prompt, today) → dict with:
    title, priority, due_date, assignee_hint, description
"""

import os, re, json, logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# Gemini-based parser
# ──────────────────────────────────────────────────────────────────────────────

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

SYSTEM_PROMPT = """You are a task-extraction assistant.
Given a natural-language prompt, extract a structured task.

Return **only** valid JSON (no markdown fences) with these keys:
{
  "title": "<short task title>",
  "description": "<1-2 sentence description, or empty string>",
  "priority": "low" | "medium" | "high" | "critical",
  "due_date": "YYYY-MM-DD" or null,
  "assignee_hint": "<person or team name mentioned, or null>"
}

Rules:
- Today's date is {today}.
- "by Friday" means the coming Friday from today.
- "tomorrow" means {tomorrow}.
- "next week" means {next_monday}.
- "urgent" / "ASAP" / "critical" → priority "critical".
- "important" / "high priority" → "high".
- "low priority" / "when you can" → "low".
- Default priority is "medium" if nothing suggests otherwise.
- "assign to X" / "for X" / "X should handle" → assignee_hint = "X".
"""


def _parse_with_gemini(prompt: str, today: datetime) -> dict | None:
    """Try Gemini; return parsed dict or None on any failure."""
    if not GEMINI_API_KEY:
        return None
    try:
        import google.generativeai as genai

        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.0-flash")

        tomorrow = today + timedelta(days=1)
        next_monday = today + timedelta(days=(7 - today.weekday()) % 7 or 7)

        system = SYSTEM_PROMPT.format(
            today=today.strftime("%Y-%m-%d"),
            tomorrow=tomorrow.strftime("%Y-%m-%d"),
            next_monday=next_monday.strftime("%Y-%m-%d"),
        )

        resp = model.generate_content(
            f"{system}\n\nUser prompt: \"{prompt}\"",
            generation_config=genai.types.GenerationConfig(
                temperature=0.1,
                max_output_tokens=300,
            ),
        )

        raw = resp.text.strip()
        # Strip markdown fences if model wraps them anyway
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)

        data = json.loads(raw)

        # Validate & normalise
        return _normalise(data)
    except Exception as e:
        logger.warning(f"Gemini parse failed, falling back to local: {e}")
        return None


# ──────────────────────────────────────────────────────────────────────────────
# Local heuristic / regex fallback
# ──────────────────────────────────────────────────────────────────────────────

_PRIORITY_MAP = {
    "critical": "critical", "urgent": "critical", "asap": "critical",
    "high":     "high",     "important": "high",
    "medium":   "medium",   "normal": "medium",
    "low":      "low",      "minor": "low",   "when you can": "low",
}

_DAY_NAMES = {
    "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
    "friday": 4, "saturday": 5, "sunday": 6,
    "mon": 0, "tue": 1, "wed": 2, "thu": 3, "fri": 4, "sat": 5, "sun": 6,
}


def _parse_local(prompt: str, today: datetime) -> dict:
    """Pure regex / keyword extraction – always succeeds."""
    text = prompt.strip()

    # ── Priority ──────────────────────────────────────────────────────────
    priority = "medium"
    for keyword, level in _PRIORITY_MAP.items():
        if re.search(rf"\b{re.escape(keyword)}\b", text, re.I):
            priority = level
            break

    # ── Due date ──────────────────────────────────────────────────────────
    due_date = None

    # "by <day name>"
    m = re.search(r"\bby\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b", text, re.I)
    if m:
        target = _DAY_NAMES[m.group(1).lower()]
        diff = (target - today.weekday()) % 7
        if diff == 0:
            diff = 7
        due_date = (today + timedelta(days=diff)).strftime("%Y-%m-%d")

    # "by tomorrow"
    if not due_date and re.search(r"\btomorrow\b", text, re.I):
        due_date = (today + timedelta(days=1)).strftime("%Y-%m-%d")

    # "by next week" / "next Monday"
    if not due_date and re.search(r"\bnext\s+week\b", text, re.I):
        diff = (7 - today.weekday()) % 7 or 7
        due_date = (today + timedelta(days=diff)).strftime("%Y-%m-%d")

    # "by <month> <day>" or "<month> <day>"
    if not due_date:
        m = re.search(
            r"\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|"
            r"jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)"
            r"\s+(\d{1,2})\b",
            text, re.I,
        )
        if m:
            from dateutil import parser as dparser
            try:
                parsed = dparser.parse(f"{m.group(1)} {m.group(2)} {today.year}")
                if parsed.date() < today.date():
                    parsed = parsed.replace(year=today.year + 1)
                due_date = parsed.strftime("%Y-%m-%d")
            except Exception:
                pass

    # "in X days"
    if not due_date:
        m = re.search(r"\bin\s+(\d+)\s+days?\b", text, re.I)
        if m:
            due_date = (today + timedelta(days=int(m.group(1)))).strftime("%Y-%m-%d")

    # ── Assignee ──────────────────────────────────────────────────────────
    assignee_hint = None
    m = re.search(
        r"(?:assign(?:ed)?\s+to|for|give\s+to|hand\s+(?:off\s+)?to)\s+([A-Za-z][A-Za-z\s]{0,30}?)(?:\s+(?:by|before|due|with|and|$))",
        text, re.I,
    )
    if m:
        assignee_hint = m.group(1).strip().rstrip(".")

    # ── Title (strip noise phrases) ───────────────────────────────────────
    title = text
    # Remove assignee clause
    title = re.sub(r"(?:assign(?:ed)?\s+to|for|give\s+to)\s+\S+", "", title, flags=re.I)
    # Remove date clause
    title = re.sub(r"\bby\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun|tomorrow|next\s+week)\b", "", title, flags=re.I)
    title = re.sub(r"\bin\s+\d+\s+days?\b", "", title, flags=re.I)
    # Remove priority words
    for kw in _PRIORITY_MAP:
        title = re.sub(rf"\b{re.escape(kw)}\b", "", title, flags=re.I)
    # Remove noise
    title = re.sub(r"\b(please|priority|with|the|and)\b", "", title, flags=re.I)
    title = re.sub(r"\s{2,}", " ", title).strip(" ,.-")
    # Capitalize
    if title:
        title = title[0].upper() + title[1:]

    return {
        "title": title or "Untitled Task",
        "description": "",
        "priority": priority,
        "due_date": due_date,
        "assignee_hint": assignee_hint,
    }


# ──────────────────────────────────────────────────────────────────────────────
# Normalise / validate
# ──────────────────────────────────────────────────────────────────────────────

_VALID_PRIORITIES = {"low", "medium", "high", "critical"}


def _normalise(data: dict) -> dict:
    """Ensure data has every required key with sane values."""
    title = str(data.get("title", "")).strip() or "Untitled Task"
    priority = str(data.get("priority", "medium")).lower()
    if priority not in _VALID_PRIORITIES:
        priority = "medium"

    due_date = data.get("due_date")
    if due_date:
        try:
            datetime.strptime(str(due_date), "%Y-%m-%d")
            due_date = str(due_date)
        except ValueError:
            due_date = None

    return {
        "title": title,
        "description": str(data.get("description", "") or ""),
        "priority": priority,
        "due_date": due_date,
        "assignee_hint": data.get("assignee_hint") or None,
    }


# ──────────────────────────────────────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────────────────────────────────────

def parse_task_prompt(prompt: str, today: datetime | None = None) -> dict:
    """
    Parse a natural-language task prompt into a structured dict.
    Uses Gemini if GEMINI_API_KEY is set, otherwise falls back to local parsing.
    """
    today = today or datetime.utcnow()

    # Try Gemini first
    result = _parse_with_gemini(prompt, today)
    if result:
        result["source"] = "gemini"
        return result

    # Local fallback
    result = _parse_local(prompt, today)
    result["source"] = "local"
    return result
