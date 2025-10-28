import React, { useState, useCallback, useMemo } from 'react';

// Define the main App component
const App = () => {
    // State for files, previews, results, and UI status
    const [fileA, setFileA] = useState(null);
    const [fileB, setFileB] = useState(null);
    const [previewA, setPreviewA] = useState(null);
    const [previewB, setPreviewB] = useState(null);
    
    const [score, setScore] = useState(null);
    const [explanation, setExplanation] = useState(null);
    const [resultImageA, setResultImageA] = useState(null);
    const [resultImageB, setResultImageB] = useState(null);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- File Handling and Preview ---
    const handleFileChange = useCallback((e, setFile, setPreview) => {
        const file = e.target.files[0];
        if (file) {
            setFile(file);
            setPreview(URL.createObjectURL(file));
        } else {
            setFile(null);
            setPreview(null);
        }
    }, []);

    // --- API Submission ---
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        
        if (!fileA || !fileB) {
            setError('Please select both Image A and Image B.');
            return;
        }

        setError(null);
        setScore(null);
        setExplanation(null);
        setIsLoading(true);

        const formData = new FormData();
        formData.append('file1', fileA);
        formData.append('file2', fileB);

        try {
             const response = await fetch("http://127.0.0.1:8000/compare/", {

                method: 'POST',
                body: formData
            });

            // Read the response text first
            const responseText = await response.text();
            
            let data = {};
            if (responseText) {
                try {
                    // Attempt to parse JSON
                    data = JSON.parse(responseText);
                } catch (e) {
                    // Handle cases where the text exists but is not valid JSON
                    throw new Error(`API returned non-JSON data. Raw response: ${responseText}`);
                }
            }
            
            if (!response.ok) {
                // If response is not OK (e.g., 404, 500), throw error with detailed message
                throw new Error(data.detail || `API failed with status ${response.status}. Raw response: ${responseText}`);
            }

            // Success: Update results state
            setScore(data.similarity_score);
            setExplanation(data.insights.llm_explanation);
            setResultImageA(data.images.image_a_uri);
            setResultImageB(data.images.image_b_uri);

        } catch (err) {
            console.error('Fetch error:', err);
            setError(`Error processing request: ${err.message}. Please check that the FastAPI service is running and the /compare/ endpoint is correct.`);
        } finally {
            setIsLoading(false);
        }
    }, [fileA, fileB]);
    
    // --- UI Components ---
    
    const ImagePreview = ({ previewUri, label }) => (
        <div className="mt-3 image-preview">
            {previewUri ? (
                <img src={previewUri} alt={`Preview ${label}`} />
            ) : (
                <span className="text-gray-500 text-xs">{`Preview ${label}`}</span>
            )}
        </div>
    );
    
    const ResultImage = ({ uri, label }) => (
        <div className="text-center">
            <img 
                id={`sent-img-${label.toLowerCase()}`} 
                className="w-full h-auto rounded-lg border-2 border-gray-300" 
                src={uri} 
                alt={`Image ${label}`}
            />
            <p className="text-xs text-gray-500 mt-1">{`Image ${label}`}</p>
        </div>
    );

    const cardClasses = "bg-white rounded-xl shadow-lg p-6 sm:p-8";
    const buttonClasses = "w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out";
    
    // Determine if results should be visible
    const showResults = useMemo(() => score !== null, [score]);

    return (
        <div className="p-4 sm:p-8 bg-gray-50 min-h-screen font-sans">
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-indigo-700">Gemini Image Comparison</h1>
                    <p className="text-gray-600 mt-2">Upload two images to compare them, get a similarity score (ResNet50), and receive a detailed, multimodal AI analysis.</p>
                </header>

                <div id="app" className={cardClasses}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Image A Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Image A</label>
                                <input 
                                    type="file" 
                                    id="file1" 
                                    accept="image/*" 
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" 
                                    required 
                                    onChange={(e) => handleFileChange(e, setFileA, setPreviewA)}
                                />
                                <ImagePreview previewUri={previewA} label="A" />
                            </div>

                            {/* Image B Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Image B</label>
                                <input 
                                    type="file" 
                                    id="file2" 
                                    accept="image/*" 
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" 
                                    required 
                                    onChange={(e) => handleFileChange(e, setFileB, setPreviewB)}
                                />
                                <ImagePreview previewUri={previewB} label="B" />
                            </div>
                        </div>

                        <button type="submit" id="submit-btn" className={buttonClasses} disabled={isLoading || !fileA || !fileB}>
                            {isLoading ? (
                                <>
                                    <div className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                    Analyzing...
                                </>
                            ) : (
                                "Compare Images & Get Insights"
                            )}
                        </button>
                    </form>

                    {error && (
                        <div id="error-message" className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                            {error}
                        </div>
                    )}

                    {showResults && (
                        <div id="results" className="mt-8">
                            <h2 className="text-2xl font-bold text-gray-800 border-b pb-2 mb-4">Analysis Results</h2>
                            
                            <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                                <p className="text-sm font-semibold text-green-800">Similarity Score (ResNet50):</p>
                                <p id="score-output" className="text-3xl font-extrabold text-green-600 mt-1">
                                    {score !== null ? score.toFixed(4) : ''}
                                </p>
                            </div>
                            
                            <div className="mb-4">
                                <p className="text-lg font-semibold text-gray-800 mb-2">Gemini AI Explanation:</p>
                                <div id="insights-output" className="p-4 text-gray-700 text-sm bg-gray-50 rounded-lg shadow-inner" style={{whiteSpace: 'pre-wrap'}}>
                                    {explanation}
                                </div>
                            </div>

                            <div className="mt-6">
                                <p className="text-lg font-semibold text-gray-800 mb-2">Images Sent to API:</p>
                                <div className="grid grid-cols-2 gap-4">
                                    {resultImageA && <ResultImage uri={resultImageA} label="A" />}
                                    {resultImageB && <ResultImage uri={resultImageB} label="B" />}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default App;

// Custom styles equivalent to the original HTML's <style> block, adjusted for React context
// The classes are already embedded in JSX, but here are the original styles for reference
// Note: In a real environment, you'd move these to a CSS file or use styled components.
// We keep them minimal for the single-file constraint.
// The styles have been embedded in the JSX element attributes where practical, or left
// for reference.
/*
        .image-preview {
            width: 100%;
            height: 150px;
            background-color: #e2e8f0;
            border: 2px dashed #94a3b8;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            position: relative;
        }
        .image-preview img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
*/
