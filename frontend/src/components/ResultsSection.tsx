interface ResultsSectionProps {
  score: number;
  image1: string | null;
  image2: string | null;
  explanation?: string; // ✅ added optional prop
}

export const ResultsSection = ({ score, image1, image2, explanation }: ResultsSectionProps) => {
  const getDescription = (score: number) => {
    if (score >= 90) {
      return "The images share a high degree of similarity in color palette, composition, and subject matter.";
    } else if (score >= 70) {
      return "The images show moderate similarity in their visual characteristics and composition.";
    } else if (score >= 50) {
      return "The images have some visual similarities but differ in key aspects.";
    } else {
      return "The images show minimal similarity in their visual characteristics.";
    }
  };

  return (
    <div className="w-full bg-card rounded-lg p-8 border border-border">
      <h2 className="text-2xl font-bold text-foreground mb-8">Results</h2>
      
      <div className="mb-8 text-center">
        <p className="text-foreground mb-2">Similarity Score:</p>
        <p className="text-7xl font-bold text-success">{score}%</p>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {image1 && (
          <div>
            <p className="text-foreground mb-3 font-medium">Image 1</p>
            <div className="rounded-lg overflow-hidden">
              <img 
                src={image1} 
                alt="Uploaded image 1" 
                className="w-full h-64 object-cover"
              />
            </div>
          </div>
        )}

        {image2 && (
          <div>
            <p className="text-foreground mb-3 font-medium">Image 2</p>
            <div className="rounded-lg overflow-hidden">
              <img 
                src={image2} 
                alt="Uploaded image 2" 
                className="w-full h-64 object-cover"
              />
            </div>
          </div>
        )}
      </div>

      {/* Description based on score */}
      <p className="text-muted-foreground text-sm leading-relaxed text-center mb-4">
        {getDescription(score)}
      </p>

      {/* ✅ Optional backend explanation */}
      {explanation && (
        <div className="mt-4 bg-muted/20 p-4 rounded-md">
          <p className="text-muted-foreground text-sm leading-relaxed text-center italic">
            {explanation}
          </p>
        </div>
      )}
    </div>
  );
};
