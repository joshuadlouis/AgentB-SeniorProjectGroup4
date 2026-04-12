

## F11 - Flashcard Builder: Subfeature Breakdown

The absence management code was built under F11 by mistake. Here's a proper breakdown for a **Flashcard Builder** feature, aligned with the app's existing course generation and study tools:

### Proposed Subfeatures

**11.1 — Auto-generate flashcards from course content**
Use AI (via AgentB or a new edge function) to extract key terms, definitions, and concepts from generated course lessons and create flashcard decks automatically.

**11.2 — Manual flashcard creation and editing**
Let students create custom flashcards (front/back), organize them into decks per course, and edit or delete cards.

**11.3 — Spaced repetition study engine**
Implement an SM-2 or similar spaced repetition algorithm so students review cards at optimal intervals. Track per-card difficulty and next-review date.

**11.4 — Flashcard study session UI**
Build an interactive study mode: flip animation, self-rating (Again / Hard / Good / Easy), progress bar, and session summary with stats.

**11.5 — Integration with mastery tracking**
Connect flashcard performance to the existing knowledge mastery system so card reviews contribute to topic mastery scores and appear in analytics.

### What happens to the absence management code?

Two options:
1. **Keep it** as a separate feature (rename internally, it's functional)
2. **Remove it** to reduce clutter

### Technical approach

- New DB tables: `flashcard_decks`, `flashcards`, `flashcard_reviews`
- New edge function for AI card generation from course content
- New components: `FlashcardDeck`, `FlashcardStudy`, `FlashcardEditor`
- Integration points: `CoursePage.tsx`, mastery hooks

### Implementation order

11.1 → 11.2 → 11.3 → 11.4 → 11.5 (each builds on the previous)

