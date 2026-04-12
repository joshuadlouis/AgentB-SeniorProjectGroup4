
-- Add is_public flag to flashcard_decks
ALTER TABLE public.flashcard_decks ADD COLUMN is_public boolean NOT NULL DEFAULT false;

-- Allow authenticated users to view public decks from others
CREATE POLICY "Anyone can view public decks"
ON public.flashcard_decks
FOR SELECT
TO authenticated
USING (is_public = true);

-- Allow authenticated users to view flashcards in public decks
CREATE POLICY "Anyone can view flashcards in public decks"
ON public.flashcards
FOR SELECT
TO authenticated
USING (deck_id IN (SELECT id FROM public.flashcard_decks WHERE is_public = true));
