import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import campusMap from "@/assets/Campus_Map.png";

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
      <main className="flex-1 container mx-auto px-4 py-6">
        <img
          src={campusMap}
          alt="Howard University Main Campus Map"
          className="w-full h-auto rounded-lg border border-border shadow-md"
        />
      </main>
    </div>
  );
};

export default CampusMapPage;
