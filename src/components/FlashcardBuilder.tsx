import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Layers, Plus, Trash2, Edit2, Play, Sparkles, Loader2, RotateCcw,
  ChevronRight, BookOpen, Brain, Globe, Lock, Copy, Search,
} from "lucide-react";
import { useFlashcards, Flashcard } from "@/hooks/useFlashcards";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface Props {
  className: string;
}

type Rating = "again" | "hard" | "good" | "easy";

export function FlashcardBuilder({ className }: Props) {
  const {
    decks, communityDecks, cards, activeDeckId, loading, generating,
    fetchCards, createDeck, deleteDeck, addCard, updateCard, deleteCard,
    reviewCard, getDueCards, generateFromCourse, setActiveDeckId,
    togglePublic, copyDeck,
  } = useFlashcards(className);

  const [newDeckTitle, setNewDeckTitle] = useState("");
  const [newDeckSubject, setNewDeckSubject] = useState("");
  const [addDeckOpen, setAddDeckOpen] = useState(false);
  const [showCommunity, setShowCommunity] = useState(false);
  const [communitySearch, setCommunitySearch] = useState("");
  const [addCardOpen, setAddCardOpen] = useState(false);
  const [editCard, setEditCard] = useState<Flashcard | null>(null);
  const [frontText, setFrontText] = useState("");
  const [backText, setBackText] = useState("");

  // Study session state
  const [studying, setStudying] = useState(false);
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({ total: 0, again: 0, hard: 0, good: 0, easy: 0 });

  const filteredCommunityDecks = useMemo(() => {
    if (!communitySearch.trim()) return communityDecks;
    const q = communitySearch.toLowerCase();
    return communityDecks.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        (d.subject && d.subject.toLowerCase().includes(q)) ||
        d.class_name.toLowerCase().includes(q)
    );
  }, [communityDecks, communitySearch]);

  const handleCreateDeck = async () => {
    if (!newDeckTitle.trim()) return;
    await createDeck(newDeckTitle.trim(), undefined, newDeckSubject.trim() || undefined);
    setNewDeckTitle("");
    setNewDeckSubject("");
    setAddDeckOpen(false);
  };

  const handleSaveCard = async () => {
    if (!frontText.trim() || !backText.trim() || !activeDeckId) return;
    if (editCard) {
      await updateCard(editCard.id, frontText.trim(), backText.trim());
    } else {
      await addCard(activeDeckId, frontText.trim(), backText.trim());
    }
    setFrontText("");
    setBackText("");
    setEditCard(null);
    setAddCardOpen(false);
  };

  const startStudy = () => {
    const due = getDueCards(cards);
    if (due.length === 0) {
      setStudyCards([...cards]);
    } else {
      setStudyCards(due);
    }
    setCurrentIdx(0);
    setFlipped(false);
    setSessionStats({ total: 0, again: 0, hard: 0, good: 0, easy: 0 });
    setStudying(true);
  };

  const handleRate = async (rating: Rating) => {
    const card = studyCards[currentIdx];
    await reviewCard(card, rating);
    setSessionStats((prev) => ({ ...prev, total: prev.total + 1, [rating]: prev[rating] + 1 }));

    if (currentIdx + 1 < studyCards.length) {
      setCurrentIdx(currentIdx + 1);
      setFlipped(false);
    } else {
      setStudying(false);
    }
  };

  const dueCount = activeDeckId ? getDueCards(cards).length : 0;

  if (loading) {
    return (
      <Card className="p-6 border-border">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  // Study session view
  if (studying && studyCards.length > 0) {
    const card = studyCards[currentIdx];
    const progress = ((currentIdx) / studyCards.length) * 100;

    return (
      <Card className="p-6 border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Study Session
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setStudying(false)}>End Session</Button>
        </div>
        <Progress value={progress} className="h-2 mb-6" />
        <p className="text-xs text-muted-foreground mb-4">
          Card {currentIdx + 1} of {studyCards.length}
        </p>

        <div
          className={cn(
            "min-h-[200px] rounded-xl border-2 border-border p-8 flex items-center justify-center cursor-pointer transition-all duration-300",
            flipped ? "bg-primary/5 border-primary/30" : "bg-card hover:border-primary/20"
          )}
          onClick={() => setFlipped(!flipped)}
        >
          <div className="text-center max-w-lg">
            {!flipped ? (
              <>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Question</p>
                <p className="text-lg font-medium text-foreground">{card.front_text}</p>
                <p className="text-xs text-muted-foreground mt-4">Tap to reveal answer</p>
              </>
            ) : (
              <>
                <p className="text-xs text-primary uppercase tracking-wider mb-3">Answer</p>
                <p className="text-lg text-foreground">{card.back_text}</p>
              </>
            )}
          </div>
        </div>

        {flipped && (
          <div className="flex justify-center gap-3 mt-6">
            <Button variant="destructive" size="sm" onClick={() => handleRate("again")} className="min-w-[80px]">
              <RotateCcw className="w-3 h-3 mr-1" /> Again
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleRate("hard")} className="min-w-[80px]">
              Hard
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleRate("good")} className="min-w-[80px]">
              Good
            </Button>
            <Button size="sm" onClick={() => handleRate("easy")} className="min-w-[80px] bg-green-600 hover:bg-green-700 text-white">
              Easy
            </Button>
          </div>
        )}
      </Card>
    );
  }

  // Session summary
  if (!studying && sessionStats.total > 0) {
    return (
      <Card className="p-6 border-border">
        <div className="text-center space-y-4">
          <Brain className="w-10 h-10 text-primary mx-auto" />
          <h3 className="text-lg font-semibold">Session Complete!</h3>
          <p className="text-muted-foreground">You reviewed {sessionStats.total} cards</p>
          <div className="flex justify-center gap-4">
            <Badge variant="destructive">{sessionStats.again} Again</Badge>
            <Badge variant="outline">{sessionStats.hard} Hard</Badge>
            <Badge variant="secondary">{sessionStats.good} Good</Badge>
            <Badge className="bg-green-600 text-white">{sessionStats.easy} Easy</Badge>
          </div>
          <div className="flex justify-center gap-2 pt-2">
            <Button variant="outline" onClick={() => setSessionStats({ total: 0, again: 0, hard: 0, good: 0, easy: 0 })}>
              Back to Decks
            </Button>
            <Button onClick={startStudy}>Study Again</Button>
          </div>
        </div>
      </Card>
    );
  }

  // Main deck/card management view
  return (
    <Card className="p-6 border-border shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Flashcard Builder</h3>
            <p className="text-sm text-muted-foreground">
              {decks.length} deck{decks.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={generateFromCourse} disabled={generating}>
            {generating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
            Auto-Generate
          </Button>
          <Dialog open={addDeckOpen} onOpenChange={setAddDeckOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Deck</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Flashcard Deck</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <Input placeholder="Deck title" value={newDeckTitle} onChange={(e) => setNewDeckTitle(e.target.value)} />
                <Input placeholder="Subject (e.g. Chemistry, Biology)" value={newDeckSubject} onChange={(e) => setNewDeckSubject(e.target.value)} />
                <Button className="w-full" onClick={handleCreateDeck}>Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Deck list or active deck */}
      {!activeDeckId ? (
        <div className="space-y-4">
          {/* Tab toggle: My Decks / Community */}
          <div className="flex gap-2">
            <Button variant={!showCommunity ? "default" : "outline"} size="sm" onClick={() => setShowCommunity(false)}>
              My Decks ({decks.length})
            </Button>
            <Button variant={showCommunity ? "default" : "outline"} size="sm" onClick={() => setShowCommunity(true)}>
              <Globe className="w-3 h-3 mr-1" /> Community ({communityDecks.length})
            </Button>
          </div>

          {!showCommunity ? (
            <div className="space-y-2">
              {decks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No flashcard decks yet</p>
                  <p className="text-xs">Create a deck or auto-generate from course content</p>
                </div>
              ) : (
                decks.map((deck) => (
                  <div
                    key={deck.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/20 cursor-pointer transition-colors"
                    onClick={() => fetchCards(deck.id)}
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <div>
                        <p className="font-medium text-sm">{deck.title}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">{deck.card_count} cards</p>
                          {deck.subject && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{deck.subject}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        title={deck.is_public ? "Public — click to make private" : "Private — click to share"}
                        onClick={(e) => { e.stopPropagation(); togglePublic(deck.id, !deck.is_public); }}
                      >
                        {deck.is_public ? <Globe className="w-3 h-3 text-primary" /> : <Lock className="w-3 h-3" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); deleteDeck(deck.id); }}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by deck name or subject..."
                  value={communitySearch}
                  onChange={(e) => setCommunitySearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {filteredCommunityDecks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {communitySearch ? "No decks match your search" : "No shared decks available yet"}
                  </p>
                  <p className="text-xs">Share your own decks to help others!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredCommunityDecks.map((deck) => (
                    <div
                      key={deck.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-primary" />
                        <div>
                          <p className="font-medium text-sm">{deck.title}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">{deck.card_count} cards</p>
                            {deck.subject && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{deck.subject}</Badge>
                            )}
                            <p className="text-xs text-muted-foreground">· {deck.class_name}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => copyDeck(deck.id)}>
                          <Copy className="w-3 h-3 mr-1" /> Copy
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => fetchCards(deck.id)}>
                          <Play className="w-3 h-3 mr-1" /> Preview
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => { setActiveDeckId(null); }}>
              ← Back to Decks
            </Button>
            <div className="flex gap-2">
              {dueCount > 0 && (
                <Badge variant="secondary" className="text-xs">{dueCount} due</Badge>
              )}
              <Button size="sm" onClick={startStudy} disabled={cards.length === 0}>
                <Play className="w-4 h-4 mr-1" /> Study ({cards.length})
              </Button>
              <Dialog open={addCardOpen} onOpenChange={(o) => { setAddCardOpen(o); if (!o) { setEditCard(null); setFrontText(""); setBackText(""); } }}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-1" /> Add Card</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{editCard ? "Edit Card" : "Add Flashcard"}</DialogTitle></DialogHeader>
                  <div className="space-y-3 pt-2">
                    <Textarea placeholder="Front (question/term)" value={frontText} onChange={(e) => setFrontText(e.target.value)} rows={3} />
                    <Textarea placeholder="Back (answer/definition)" value={backText} onChange={(e) => setBackText(e.target.value)} rows={3} />
                    <Button className="w-full" onClick={handleSaveCard}>{editCard ? "Update" : "Add Card"}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {cards.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">No cards in this deck yet</p>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {cards.map((card) => (
                <div key={card.id} className="p-3 rounded-lg border border-border text-sm">
                  <p className="font-medium text-foreground line-clamp-2">{card.front_text}</p>
                  <p className="text-muted-foreground mt-1 line-clamp-2">{card.back_text}</p>
                  <div className="flex gap-1 mt-2">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditCard(card); setFrontText(card.front_text); setBackText(card.back_text); setAddCardOpen(true); }}>
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteCard(card.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}