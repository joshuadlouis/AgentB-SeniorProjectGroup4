
ALTER TABLE public.flashcard_decks ADD COLUMN subject text;

-- Backfill existing decks with their class_name as subject
UPDATE public.flashcard_decks SET subject = class_name WHERE subject IS NULL;
