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
  
  // New state for collapsible sections
  const [isScriptExpanded, setIsScriptExpanded] = useState(true);
  const [isMetadataExpanded, setIsMetadataExpanded] = useState(true);
  const [isThumbnailExpanded, setIsThumbnailExpanded] = useState(true);
  
  // New state for thumbnail generation
  const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(false);
  const [thumbnailContent, setThumbnailContent] = useState('');
  const [thumbnailError, setThumbnailError] = useState('');
  
  // New state for feedback functionality
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [feedbackScript, setFeedbackScript] = useState('');
  const [feedbackError, setFeedbackError] = useState('');
  const [isFeedbackExpanded, setIsFeedbackExpanded] = useState(true);
  const [cumulativeFeedback, setCumulativeFeedback] = useState<string[]>([]);
  
  // New state for YouTube Short functionality
  const [showYouTubeShortModal, setShowYouTubeShortModal] = useState(false);
  const [shortDescription, setShortDescription] = useState('');
  const [shortLength, setShortLength] = useState('35');
  const [shortTone, setShortTone] = useState('energetic');
  const [isGeneratingShort, setIsGeneratingShort] = useState(false);
  const [youtubeShortScript, setYoutubeShortScript] = useState('');
  const [shortError, setShortError] = useState('');
  const [isShortExpanded, setIsShortExpanded] = useState(true);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError('');
    setGeneratedContent(null);
    
    // Reset feedback and YouTube Short states for new generation
    setFeedbackScript('');
    setYoutubeShortScript('');
    setCumulativeFeedback([]);
    setIsScriptExpanded(true);

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
      
      // Auto-save to Dropbox folder after successful generation
      if (data.content && data.vesselName) {
        const { scriptSection, metadataSection } = parseGeneratedContent(data.content);
        await autoSaveToDropbox(scriptSection, metadataSection, data.vesselName);
      }
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

  // Auto-save files to Dropbox folder
  const autoSaveToDropbox = async (scriptContent: string, metadataContent: string, vesselName: string) => {
    try {
      const cleanVesselName = vesselName.replace(/\s+/g, '-');
      
      // Save script file
      const scriptFilename = `${cleanVesselName}-script.txt`;
      await saveFileToDropbox(scriptContent, scriptFilename);
      
      // Save YouTube metadata file
      const youtubeFilename = `${cleanVesselName}-youtube.txt`;
      await saveFileToDropbox(metadataContent, youtubeFilename);
      
      console.log('✅ Files auto-saved to Dropbox claude-output folder');
    } catch (error) {
      console.error('❌ Failed to auto-save to Dropbox:', error);
    }
  };

  // Save individual file to Dropbox folder
  const saveFileToDropbox = async (content: string, filename: string) => {
    const response = await fetch('/api/save-to-dropbox', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        filename,
        folder: '/Users/mintedone/Library/CloudStorage/Dropbox/Minted Yachts Marketing/claude-output'
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save ${filename}`);
    }
  };

  // New functions for research buttons
  const openYatcoPhotos = () => {
    if (manufacturer.trim() && model.trim()) {
      const url = `https://www.google.com/search?q=yatco+photos+of+${encodeURIComponent(manufacturer)}+${encodeURIComponent(model)}`;
      window.open(url, '_blank');
    }
  };

  const openGoogleSearch = () => {
    if (manufacturer.trim() && model.trim()) {
      const url = `https://www.google.com/search?q=${encodeURIComponent(manufacturer)}+${encodeURIComponent(model)}+yacht`;
      window.open(url, '_blank');
    }
  };

  const openYouTubeSearch = () => {
    if (manufacturer.trim() && model.trim()) {
      const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(manufacturer)}+${encodeURIComponent(model)}+yacht`;
      window.open(url, '_blank');
    }
  };

  // New function for thumbnail generation
  const handleGenerateThumbnails = async () => {
    if (!manufacturer.trim() || !model.trim()) {
      setThumbnailError('Please enter manufacturer and model first');
      return;
    }

    setIsGeneratingThumbnails(true);
    setThumbnailError('');
    setThumbnailContent('');

    try {
      const response = await fetch('/api/video-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          manufacturer: manufacturer.trim(),
          model: model.trim(),
          videoLength: 1, // Dummy value for thumbnails
          requestType: 'thumbnails'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate thumbnails');
      }

      const data = await response.json();
      setThumbnailContent(data.content);
    } catch (err) {
      setThumbnailError('Failed to generate thumbnails. Please try again.');
      console.error('Thumbnail generation error:', err);
    } finally {
      setIsGeneratingThumbnails(false);
    }
  };

  // New function for feedback generation
  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim() || !generatedContent) {
      setFeedbackError('Please enter your feedback');
      return;
    }

    setIsGeneratingFeedback(true);
    setFeedbackError('');
    setFeedbackScript('');

    try {
      // Use the current script (either original or previous feedback result)
      const currentScript = feedbackScript || parseGeneratedContent(generatedContent.content).scriptSection;
      
      // Add current feedback to cumulative feedback
      const newCumulativeFeedback = [...cumulativeFeedback, feedbackText.trim()];
      
      const response = await fetch('/api/video-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          manufacturer: manufacturer.trim(),
          model: model.trim(),
          videoLength: parseFloat(videoLength),
          requestType: 'feedback',
          originalScript: parseGeneratedContent(generatedContent.content).scriptSection,
          currentScript: currentScript,
          feedback: feedbackText.trim(),
          cumulativeFeedback: newCumulativeFeedback
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate feedback script');
      }

      const data = await response.json();
      setFeedbackScript(data.content);
      setCumulativeFeedback(newCumulativeFeedback);
      setShowFeedbackModal(false);
      setFeedbackText('');
      
      // Collapse original Creatify section and expand feedback section
      setIsScriptExpanded(false);
      setIsFeedbackExpanded(true);
    } catch (err) {
      setFeedbackError('Failed to generate feedback script. Please try again.');
      console.error('Feedback generation error:', err);
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  // New function for YouTube Short generation
  const handleYouTubeShortSubmit = async () => {
    if (!shortDescription.trim() || !generatedContent) {
      setShortError('Please enter a description for your YouTube Short');
      return;
    }

    setIsGeneratingShort(true);
    setShortError('');
    setYoutubeShortScript('');

    try {
      const { scriptSection } = parseGeneratedContent(generatedContent.content);
      
      const response = await fetch('/api/video-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          manufacturer: manufacturer.trim(),
          model: model.trim(),
          requestType: 'youtube-short',
          originalScript: scriptSection,
          shortDescription: shortDescription.trim(),
          shortLength: parseInt(shortLength),
          shortTone: shortTone
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate YouTube Short script');
      }

      const data = await response.json();
      setYoutubeShortScript(data.content);
      setShowYouTubeShortModal(false);
      setShortDescription('');
      
      // Expand YouTube Short section
      setIsShortExpanded(true);
    } catch (err) {
      setShortError('Failed to generate YouTube Short script. Please try again.');
      console.error('YouTube Short generation error:', err);
    } finally {
      setIsGeneratingShort(false);
    }
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

            {/* Creatify Script Section - Collapsible */}
            <div className="bg-white rounded-lg shadow-lg border border-blue-100">
              <div className="p-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-xl font-bold text-blue-900">Creatify Script</h3>
                    <button
                      onClick={() => setIsScriptExpanded(!isScriptExpanded)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <svg 
                        className={`w-5 h-5 transform transition-transform ${isScriptExpanded ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
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
                    <button
                      onClick={() => setShowFeedbackModal(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      💬 Give Feedback
                    </button>
                    <button
                      onClick={() => setShowYouTubeShortModal(true)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      🎥 YouTube Short
                    </button>
                  </div>
                </div>
              </div>
              {isScriptExpanded && (
                <div className="px-6 pb-6">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                      {scriptSection}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Feedback Script Section - Collapsible */}
            {feedbackScript && (
              <div className="bg-white rounded-lg shadow-lg border border-green-100">
                <div className="p-6 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-xl font-bold text-green-900">Revised Script (Feedback)</h3>
                      <button
                        onClick={() => setIsFeedbackExpanded(!isFeedbackExpanded)}
                        className="text-green-600 hover:text-green-800 transition-colors"
                      >
                        <svg 
                          className={`w-5 h-5 transform transition-transform ${isFeedbackExpanded ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => copyToClipboard(feedbackScript, 'Revised Script')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        📋 Copy
                      </button>
                      <button
                        onClick={() => downloadAsText(feedbackScript, `${generatedContent?.vesselName.replace(/\s+/g, '-')}-revised-script.txt`)}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        📥 Download
                      </button>
                      <button
                        onClick={() => setShowFeedbackModal(true)}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        💬 More Feedback
                      </button>
                    </div>
                  </div>
                </div>
                {isFeedbackExpanded && (
                  <div className="px-6 pb-6">
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                        {feedbackScript}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* YouTube Short Script Section - Collapsible */}
            {youtubeShortScript && (
              <div className="bg-white rounded-lg shadow-lg border border-red-100">
                <div className="p-6 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-xl font-bold text-red-900">YouTube Short Script</h3>
                      <button
                        onClick={() => setIsShortExpanded(!isShortExpanded)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <svg 
                          className={`w-5 h-5 transform transition-transform ${isShortExpanded ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => copyToClipboard(youtubeShortScript, 'YouTube Short Script')}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        📋 Copy
                      </button>
                      <button
                        onClick={() => downloadAsText(youtubeShortScript, `${generatedContent?.vesselName.replace(/\s+/g, '-')}-short-script.txt`)}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        📥 Download
                      </button>
                    </div>
                  </div>
                </div>
                {isShortExpanded && (
                  <div className="px-6 pb-6">
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                        {youtubeShortScript}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* YouTube Metadata Section - Collapsible */}
            <div className="bg-white rounded-lg shadow-lg border border-blue-100">
              <div className="p-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-xl font-bold text-blue-900">YouTube Metadata</h3>
                    <button
                      onClick={() => setIsMetadataExpanded(!isMetadataExpanded)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <svg 
                        className={`w-5 h-5 transform transition-transform ${isMetadataExpanded ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
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
              </div>
              {isMetadataExpanded && (
                <div className="px-6 pb-6">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                      {metadataSection}
                    </pre>
                  </div>
                </div>
              )}
            </div>
            
            {/* Research Tools Section */}
            <div className="bg-white rounded-lg shadow-lg p-6 border border-blue-100">
              <h3 className="text-xl font-bold text-blue-900 mb-4">Research Tools</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={openYatcoPhotos}
                  disabled={!manufacturer.trim() || !model.trim()}
                  className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  <span>📷</span>
                  <span>Yatco Photos</span>
                </button>
                <button
                  onClick={openGoogleSearch}
                  disabled={!manufacturer.trim() || !model.trim()}
                  className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  <span>🔍</span>
                  <span>Google Search</span>
                </button>
                <button
                  onClick={openYouTubeSearch}
                  disabled={!manufacturer.trim() || !model.trim()}
                  className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  <span>▶️</span>
                  <span>YouTube Search</span>
                </button>
              </div>
              {(!manufacturer.trim() || !model.trim()) && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Enter manufacturer and model to enable research tools
                </p>
              )}
            </div>

            {/* Thumbnail Generation Section */}
            <div className="bg-white rounded-lg shadow-lg p-6 border border-blue-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-blue-900">Thumbnail Generation</h3>
                <button
                  onClick={handleGenerateThumbnails}
                  disabled={isGeneratingThumbnails || !manufacturer.trim() || !model.trim()}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors min-w-[180px]"
                >
                  {isGeneratingThumbnails ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Generating...</span>
                    </div>
                  ) : (
                    'Generate 3 Thumbnails'
                  )}
                </button>
              </div>
              {thumbnailError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{thumbnailError}</p>
                </div>
              )}
            </div>

            {/* Thumbnail Designs Section - Collapsible */}
            {thumbnailContent && (
              <div className="bg-white rounded-lg shadow-lg border border-blue-100">
                <div className="p-6 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-xl font-bold text-blue-900">Thumbnail Designs</h3>
                      <button
                        onClick={() => setIsThumbnailExpanded(!isThumbnailExpanded)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <svg 
                          className={`w-5 h-5 transform transition-transform ${isThumbnailExpanded ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => copyToClipboard(thumbnailContent, 'Thumbnail Designs')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        📋 Copy
                      </button>
                      <button
                        onClick={() => downloadAsText(thumbnailContent, `${manufacturer}-${model}-thumbnails.txt`)}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        📥 Download
                      </button>
                    </div>
                  </div>
                </div>
                {isThumbnailExpanded && (
                  <div className="px-6 pb-6">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                        {thumbnailContent}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Give Feedback on Script</h3>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="e.g., Make the script 30% longer, use a more exciting tone, focus more on luxury features..."
              className="w-full h-32 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 resize-none"
            />
            {feedbackError && (
              <p className="text-red-600 text-sm mt-2">{feedbackError}</p>
            )}
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setFeedbackText('');
                  setFeedbackError('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFeedbackSubmit}
                disabled={isGeneratingFeedback || !feedbackText.trim()}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors min-w-[100px]"
              >
                {isGeneratingFeedback ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>...</span>
                  </div>
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* YouTube Short Modal */}
      {showYouTubeShortModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Create YouTube Short</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Describe what you want the YouTube Short to focus on..."
                  className="w-full h-24 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Length (seconds)
                </label>
                <select
                  value={shortLength}
                  onChange={(e) => setShortLength(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="15">15 seconds</option>
                  <option value="30">30 seconds</option>
                  <option value="35">35 seconds</option>
                  <option value="45">45 seconds</option>
                  <option value="60">60 seconds</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tone/Style
                </label>
                <select
                  value={shortTone}
                  onChange={(e) => setShortTone(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="energetic">Energetic</option>
                  <option value="educational">Educational</option>
                  <option value="dramatic">Dramatic</option>
                  <option value="luxury">Luxury</option>
                  <option value="exciting">Exciting</option>
                  <option value="professional">Professional</option>
                </select>
              </div>
            </div>

            {shortError && (
              <p className="text-red-600 text-sm mt-2">{shortError}</p>
            )}
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowYouTubeShortModal(false);
                  setShortDescription('');
                  setShortError('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleYouTubeShortSubmit}
                disabled={isGeneratingShort || !shortDescription.trim()}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors min-w-[100px]"
              >
                {isGeneratingShort ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>...</span>
                  </div>
                ) : (
                  'Create'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}