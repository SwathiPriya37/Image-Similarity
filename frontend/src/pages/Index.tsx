import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageUploadZone } from "@/components/ImageUploadZone";
import { ResultsSection } from "@/components/ResultsSection";
import { toast } from "sonner";

const Index = () => {
  const [image1, setImage1] = useState<File | null>(null);
  const [image2, setImage2] = useState<File | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [similarityScore, setSimilarityScore] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<string>("");

  // Handles file selection for both uploads
  const handleImageSelect = (
    file: File,
    setImage: React.Dispatch<React.SetStateAction<File | null>>
  ) => {
    setImage(file);
    setShowResults(false);
  };

  // Main similarity computation
  const handleComputeSimilarity = async () => {
    if (!image1 || !image2) {
      toast.error("Please upload both images before computing similarity");
      return;
    }

    const formData = new FormData();
    formData.append("image1", image1);
    formData.append("image2", image2);

    try {
      const toastId = toast.loading("Comparing images using Gemini AI...");

      const response = await fetch("http://127.0.0.1:8000/compare/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Server error");

      const data = await response.json();

      // Expecting: { similarity: 87.5, explanation: "Both images contain cats in similar poses" }
      setSimilarityScore(data.similarity);
      setExplanation(data.explanation || "No explanation provided.");
      setShowResults(true);

      toast.success("Similarity computed successfully!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Error computing similarity. Please check your backend.", {
        duration: 4000,
      });
    } finally {
      toast.dismiss();
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Image Similarity Checker
          </h1>
          <p className="text-muted-foreground text-lg">
            Upload two images to compare their similarity using Gemini AI.
          </p>
        </div>

        {/* Upload Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <ImageUploadZone
            label="Image 1"
            onImageSelect={(file) => handleImageSelect(file, setImage1)}
            image={image1 ? URL.createObjectURL(image1) : null}
          />

          <ImageUploadZone
            label="Image 2"
            onImageSelect={(file) => handleImageSelect(file, setImage2)}
            image={image2 ? URL.createObjectURL(image2) : null}
          />
        </div>

        {/* Action Button */}
        <Button
          onClick={handleComputeSimilarity}
          className="w-full h-14 text-lg font-semibold"
          disabled={!image1 || !image2}
        >
          Compute Similarity
        </Button>

        {/* Results Section */}
        {showResults && similarityScore !== null && (
          <div className="mt-12">
            <ResultsSection
              score={similarityScore}
              image1={image1 ? URL.createObjectURL(image1) : ""}
              image2={image2 ? URL.createObjectURL(image2) : ""}
              explanation={explanation}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
