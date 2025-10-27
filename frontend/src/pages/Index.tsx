import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageUploadZone } from "@/components/ImageUploadZone";
import { ResultsSection } from "@/components/ResultsSection";
import { toast } from "sonner";

const Index = () => {
  const [image1, setImage1] = useState<string | null>(null);
  const [image2, setImage2] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [similarityScore, setSimilarityScore] = useState(0);

  const handleImage1Select = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage1(e.target?.result as string);
      setShowResults(false);
    };
    reader.readAsDataURL(file);
  };

  const handleImage2Select = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage2(e.target?.result as string);
      setShowResults(false);
    };
    reader.readAsDataURL(file);
  };

  const handleComputeSimilarity = () => {
    if (!image1 || !image2) {
      toast.error("Please upload both images before computing similarity");
      return;
    }

    // Simulate computation with a random score
    const score = Math.floor(Math.random() * 30) + 70; // Random score between 70-100
    setSimilarityScore(score);
    setShowResults(true);
    toast.success("Similarity computed successfully!");
  };

  return (
    <div className="min-h-screen bg-background py-12 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Image Similarity Checker
          </h1>
          <p className="text-muted-foreground text-lg">
            Upload two images to compare their similarity.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <ImageUploadZone
            label="Image 1"
            onImageSelect={handleImage1Select}
            image={image1}
          />

          <ImageUploadZone
            label="Image 2"
            onImageSelect={handleImage2Select}
            image={image2}
          />
        </div>

        <Button
          onClick={handleComputeSimilarity}
          className="w-full h-14 text-lg font-semibold"
          disabled={!image1 || !image2}
        >
          Compute Similarity
        </Button>

        {showResults && (
          <div className="mt-12">
            <ResultsSection
              score={similarityScore}
              image1={image1}
              image2={image2}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
