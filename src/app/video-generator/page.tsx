'use client';

import { useState } from 'react';

interface GeneratedContent {
  content: string;
  vesselName: string;
  characterCount: number;
}

export default function VideoGenerator() {
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [videoLength, setVideoLength] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError('');
    setGeneratedContent(null);

    try {
      const response = await fetch('/api/video-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          manufacturer: manufacturer.trim(),
          model: model.trim(),
          videoLength: parseFloat(videoLength)
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      setGeneratedContent(data);
    } catch (err) {
      setError('Failed to generate content. Please try again.');
      console.error('Generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
    console.log(`${section} copied to clipboard`);
  };

  const downloadAsText = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const parseGeneratedContent = (content: string) => {
    // Look for "PART 2: YOUTUBE METADATA GENERATION" as the separator
    const part2Index = content.indexOf('PART 2: YOUTUBE METADATA GENERATION');
    
    if (part2Index === -1) {
      // Fallback: try the equals separator
      const parts = content.split('================================================================================');
      const scriptSection = parts[0]?.trim() || '';
      const metadataSection = parts[1]?.trim() || '';
      return { scriptSection, metadataSection };
    }
    
    // Split at "PART 2"
    const scriptSection = content.substring(0, part2Index).trim();
    const metadataSection = content.substring(part2Index).trim();
    
    // Clean up the script section - remove "PART 1: CREATIFY SCRIPT GENERATION" header if present
    const cleanedScript = scriptSection.replace(/^PART 1: CREATIFY SCRIPT GENERATION\s*\n*/i, '').trim();
    
    return { 
      scriptSection: cleanedScript, 
      metadataSection 
    };
  };

  const { scriptSection, metadataSection } = generatedContent 
    ? parseGeneratedContent(generatedContent.content)
    : { scriptSection: '', metadataSection: '' };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Video Content Generator</h1>
            <p className="text-blue-200 mt-2">Generate YouTube scripts and metadata for yacht videos</p>
          </div>
          <a
            href="/"
            className="flex items-center space-x-2 bg-blue-800 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="hidden sm:inline">Back to Portal</span>
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Form Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 border border-blue-100 mb-8">
          <h2 className="text-2xl font-bold text-blue-900 mb-6">Generate Video Content</h2>
          
          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700 mb-2">
                  Manufacturer
                </label>
                <input
                  type="text"
                  id="manufacturer"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  placeholder="e.g., Ferretti"
                  className="w-full border border-blue-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  required
                />
              </div>

              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
                  Model
                </label>
                <input
                  type="text"
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g., 500"
                  className="w-full border border-blue-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  required
                />
              </div>

              <div>
                <label htmlFor="videoLength" className="block text-sm font-medium text-gray-700 mb-2">
                  Video Length (Minutes)
                </label>
                <input
                  type="number"
                  id="videoLength"
                  value={videoLength}
                  onChange={(e) => setVideoLength(e.target.value)}
                  placeholder="Minutes"
                  min="0.25"
                  max="30"
                  step="0.25"
                  className="w-full border border-blue-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  required
                />
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isGenerating || !manufacturer.trim() || !model.trim() || !videoLength}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed min-w-[200px]"
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Generating...</span>
                  </div>
                ) : (
                  'Generate Content'
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Generated Content Display */}
        {generatedContent && (
          <div className="space-y-8">
            {/* Vessel Info */}
            <div className="bg-gradient-to-r from-blue-100 to-amber-100 rounded-lg p-6 border border-blue-200">
              <h3 className="text-xl font-bold text-blue-900 mb-2">
                Generated for: {generatedContent.vesselName}
              </h3>
              <p className="text-blue-700">
                Video Length: {videoLength} minutes | Character Count: {generatedContent.characterCount.toLocaleString()}
              </p>
            </div>

            {/* Creatify Script Section */}
            <div className="bg-white rounded-lg shadow-lg p-6 border border-blue-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-blue-900">Creatify Script</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => copyToClipboard(scriptSection, 'Creatify Script')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    📋 Copy
                  </button>
                  <button
                    onClick={() => downloadAsText(scriptSection, `${generatedContent.vesselName.replace(/\s+/g, '-')}-script.txt`)}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    📥 Download
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                  {scriptSection}
                </pre>
              </div>
            </div>

            {/* YouTube Metadata Section */}
            <div className="bg-white rounded-lg shadow-lg p-6 border border-blue-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-blue-900">YouTube Metadata</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => copyToClipboard(metadataSection, 'YouTube Metadata')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    📋 Copy
                  </button>
                  <button
                    onClick={() => downloadAsText(metadataSection, `${generatedContent.vesselName.replace(/\s+/g, '-')}-metadata.txt`)}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    📥 Download
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                  {metadataSection}
                </pre>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}