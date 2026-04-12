import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CampusMapPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Campus Map</h1>
        </div>
      </header>
      <main className="flex-1">
        <iframe
          src="/Campus_Map.pdf"
          title="Campus Map"
          className="w-full h-[calc(100vh-73px)] border-0"
        />
      </main>
    </div>
  );
};

export default CampusMapPage;
