import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface FlashcardDeck {
  id: string;
  class_name: string;
  title: string;
  description: string | null;
  card_count: number;
  created_at: string;
  is_public: boolean;
  user_id?: string;
}

export interface Flashcard {
  id: string;
  deck_id: string;
  front_text: string;
  back_text: string;
  easiness_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_at: string;
}

type Rating = "again" | "hard" | "good" | "easy";

// SM-2 algorithm
function sm2(card: Flashcard, rating: Rating): Partial<Flashcard> {
  const q = { again: 0, hard: 2, good: 4, easy: 5 }[rating];
  let { easiness_factor: ef, interval_days: interval, repetitions: reps } = card;

  if (q < 3) {
    reps = 0;
    interval = 0;
  } else {
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = 6;
    else interval = Math.round(interval * ef);
    reps += 1;
  }

  ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (ef < 1.3) ef = 1.3;

  const next = new Date();
  next.setDate(next.getDate() + Math.max(interval, 1));

  return {
    easiness_factor: ef,
    interval_days: interval,
    repetitions: reps,
    next_review_at: next.toISOString(),
  };
}

export function useFlashcards(className: string) {
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [communityDecks, setCommunityDecks] = useState<FlashcardDeck[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const fetchDecks = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase
      .from("flashcard_decks")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("class_name", className)
      .order("created_at", { ascending: false });
    setDecks((data as FlashcardDeck[]) || []);
    setLoading(false);
  }, [className]);

  const fetchCommunityDecks = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase
      .from("flashcard_decks")
      .select("*")
      .eq("is_public", true)
      .eq("class_name", className)
      .neq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setCommunityDecks((data as FlashcardDeck[]) || []);
  }, [className]);

  const fetchCards = useCallback(async (deckId: string) => {
    const { data } = await supabase
      .from("flashcards")
      .select("*")
      .eq("deck_id", deckId)
      .order("created_at", { ascending: true });
    setCards((data as Flashcard[]) || []);
    setActiveDeckId(deckId);
  }, []);

  useEffect(() => { fetchDecks(); fetchCommunityDecks(); }, [fetchDecks, fetchCommunityDecks]);

  const createDeck = async (title: string, description?: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    const { data, error } = await supabase
      .from("flashcard_decks")
      .insert({ user_id: session.user.id, class_name: className, title, description: description || null })
      .select()
      .single();
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return null; }
    await fetchDecks();
    return data as FlashcardDeck;
  };

  const deleteDeck = async (deckId: string) => {
    await supabase.from("flashcard_decks").delete().eq("id", deckId);
    if (activeDeckId === deckId) { setActiveDeckId(null); setCards([]); }
    await fetchDecks();
  };

  const addCard = async (deckId: string, front: string, back: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { error } = await supabase
      .from("flashcards")
      .insert({ deck_id: deckId, user_id: session.user.id, front_text: front, back_text: back });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    if (activeDeckId === deckId) await fetchCards(deckId);
    await fetchDecks();
  };

  const updateCard = async (cardId: string, front: string, back: string) => {
    await supabase.from("flashcards").update({ front_text: front, back_text: back }).eq("id", cardId);
    if (activeDeckId) await fetchCards(activeDeckId);
  };

  const deleteCard = async (cardId: string) => {
    await supabase.from("flashcards").delete().eq("id", cardId);
    if (activeDeckId) await fetchCards(activeDeckId);
    await fetchDecks();
  };

  const reviewCard = async (card: Flashcard, rating: Rating) => {
    const updates = sm2(card, rating);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await Promise.all([
      supabase.from("flashcards").update(updates).eq("id", card.id),
      supabase.from("flashcard_reviews").insert({
        flashcard_id: card.id,
        user_id: session.user.id,
        rating,
      }),
    ]);
    if (activeDeckId) await fetchCards(activeDeckId);
  };

  const getDueCards = useCallback((allCards: Flashcard[]) => {
    const now = new Date().toISOString();
    return allCards.filter((c) => c.next_review_at <= now);
  }, []);

  const generateFromCourse = async () => {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await supabase.functions.invoke("generate-flashcards", {
        body: { class_name: className },
      });
      if (res.error) throw res.error;
      if (res.data?.error) {
        toast({ title: "No course content yet", description: "Generate your course content first using the Outline Builder above, then come back to auto-generate flashcards.", variant: "destructive" });
        return;
      }
      toast({ title: "Flashcards generated!", description: `Created deck with ${res.data?.count || 0} cards from your course content.` });
      await fetchDecks();
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message || "Try again later", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const togglePublic = async (deckId: string, isPublic: boolean) => {
    await supabase.from("flashcard_decks").update({ is_public: isPublic }).eq("id", deckId);
    await fetchDecks();
    toast({ title: isPublic ? "Deck shared publicly" : "Deck set to private" });
  };

  const copyDeck = async (deckId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Fetch source deck
    const { data: srcDeck } = await supabase.from("flashcard_decks").select("*").eq("id", deckId).single();
    if (!srcDeck) return;

    // Create new deck
    const { data: newDeck, error } = await supabase
      .from("flashcard_decks")
      .insert({ user_id: session.user.id, class_name: className, title: srcDeck.title, description: srcDeck.description })
      .select()
      .single();
    if (error || !newDeck) { toast({ title: "Error", description: "Failed to copy deck", variant: "destructive" }); return; }

    // Copy cards
    const { data: srcCards } = await supabase.from("flashcards").select("front_text, back_text").eq("deck_id", deckId);
    if (srcCards && srcCards.length > 0) {
      await supabase.from("flashcards").insert(
        srcCards.map((c: any) => ({ deck_id: newDeck.id, user_id: session.user.id, front_text: c.front_text, back_text: c.back_text }))
      );
    }

    toast({ title: "Deck copied!", description: `"${srcDeck.title}" added to your decks.` });
    await fetchDecks();
  };

  return {
    decks, communityDecks, cards, activeDeckId, loading, generating,
    fetchCards, createDeck, deleteDeck, addCard, updateCard, deleteCard,
    reviewCard, getDueCards, generateFromCourse, setActiveDeckId,
    togglePublic, copyDeck,
  };
}
