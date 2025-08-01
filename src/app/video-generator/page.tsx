'use client';

import { useState, useEffect, useRef } from 'react';
import { initDB, saveProject, getProject, getAllProjects, saveOutro, getDefaultOutro, generateProjectId } from '@/lib/video-processing/storage';
import { mergeVideoWithOutro, applyVideoMetadata, formatFileSize, validateVideoFile } from '@/lib/video-processing/ffmpeg-utils';
import { parseYouTubeMetadata, generateOptimizedTags, extractVideoTitle, extractVideoDescription } from '@/lib/video-processing/metadata-utils';

interface GeneratedContent {
  content: string;
  vesselName: string;
  characterCount: number;
}

interface Project {
  id: string;
  manufacturer: string;
  model: string;
  createdAt: Date;
  phase1: {
    script?: Blob;
    youtube?: Blob;
    scriptContent?: string;
    youtubeContent?: string;
  };
  phase2: {
    originalVideo?: Blob;
    mergedVideo?: Blob;
    finalVideo?: Blob;
    outroUsed?: string;
    customOutro?: Blob;
    processingStatus?: 'uploaded' | 'merged' | 'final' | 'error';
  };
}

export default function VideoGenerator() {
  // Phase 1 states (restored from original)
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [videoLength, setVideoLength] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState('');
  
  // Original Phase 1 collapsible sections
  const [isScriptExpanded, setIsScriptExpanded] = useState(true);
  const [isMetadataExpanded, setIsMetadataExpanded] = useState(true);
  const [isThumbnailExpanded, setIsThumbnailExpanded] = useState(true);
  
  // Original Phase 1 thumbnail generation
  const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(false);
  const [thumbnailContent, setThumbnailContent] = useState('');
  const [thumbnailError, setThumbnailError] = useState('');
  
  // Original Phase 1 feedback functionality
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [feedbackScript, setFeedbackScript] = useState('');
  const [feedbackError, setFeedbackError] = useState('');
  const [isFeedbackExpanded, setIsFeedbackExpanded] = useState(true);
  const [cumulativeFeedback, setCumulativeFeedback] = useState<string[]>([]);
  
  // Original Phase 1 YouTube Short functionality
  const [showYouTubeShortModal, setShowYouTubeShortModal] = useState(false);
  const [shortDescription, setShortDescription] = useState('');
  const [shortLength, setShortLength] = useState('35');
  const [shortTone, setShortTone] = useState('energetic');
  const [isGeneratingShort, setIsGeneratingShort] = useState(false);
  const [youtubeShortScript, setYoutubeShortScript] = useState('');
  const [shortError, setShortError] = useState('');
  const [isShortExpanded, setIsShortExpanded] = useState(true);

  // Phase 2 states
  const [isPhase1Collapsed, setIsPhase1Collapsed] = useState(false);
  const [isPhase2Expanded, setIsPhase2Expanded] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [outroOption, setOutroOption] = useState<'default' | 'custom'>('default');
  const [customOutroFile, setCustomOutroFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('');
  const [processedVideo, setProcessedVideo] = useState<Blob | null>(null);
  const [processError, setProcessError] = useState('');
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [defaultOutro, setDefaultOutro] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const outroInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initDB();
    loadProjects();
    loadDefaultOutro();
  }, []);

  const loadProjects = async () => {
    try {
      const allProjects = await getAllProjects();
      setProjects(allProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadDefaultOutro = async () => {
    try {
      const outro = await getDefaultOutro();
      if (outro) {
        const file = new File([outro.file], outro.name, { type: 'video/mp4' });
        setDefaultOutro(file);
      }
    } catch (error) {
      console.error('Failed to load default outro:', error);
    }
  };

  // Original Phase 1 functions
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
        
        // Save to IndexedDB project
        await saveToProject(scriptSection, metadataSection);
      }
    } catch (err) {
      setError('Failed to generate content. Please try again.');
      console.error('Generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const saveToProject = async (scriptContent: string, youtubeContent: string) => {
    try {
      const projectId = generateProjectId(manufacturer, model);
      const project: Project = {
        id: projectId,
        manufacturer: manufacturer.trim(),
        model: model.trim(),
        createdAt: new Date(),
        phase1: {
          scriptContent,
          youtubeContent,
          script: new Blob([scriptContent], { type: 'text/plain' }),
          youtube: new Blob([youtubeContent], { type: 'text/plain' })
        },
        phase2: {
          processingStatus: 'uploaded'
        }
      };
      
      await saveProject(project);
      setCurrentProject(project);
      loadProjects();
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  };

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
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

  // Research button functions
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

  // Thumbnail generation
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

  // Feedback functionality
  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim() || !generatedContent) {
      setFeedbackError('Please enter your feedback');
      return;
    }

    setIsGeneratingFeedback(true);
    setFeedbackError('');
    setFeedbackScript('');

    try {
      const currentScript = feedbackScript || parseGeneratedContent(generatedContent.content).scriptSection;
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

  // YouTube Short functionality
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
      
      setIsShortExpanded(true);
    } catch (err) {
      setShortError('Failed to generate YouTube Short script. Please try again.');
      console.error('YouTube Short generation error:', err);
    } finally {
      setIsGeneratingShort(false);
    }
  };

  const parseGeneratedContent = (content: string) => {
    const part2Index = content.indexOf('PART 2: YOUTUBE METADATA GENERATION');
    
    if (part2Index === -1) {
      const parts = content.split('================================================================================');
      const scriptSection = parts[0]?.trim() || '';
      const metadataSection = parts[1]?.trim() || '';
      return { scriptSection, metadataSection };
    }
    
    const scriptSection = content.substring(0, part2Index).trim();
    const metadataSection = content.substring(part2Index).trim();
    
    const cleanedScript = scriptSection.replace(/^PART 1: CREATIFY SCRIPT GENERATION\s*\n*/i, '').trim();
    
    return { 
      scriptSection: cleanedScript, 
      metadataSection 
    };
  };

  // Phase 2 functions
  const handleVideoUpload = (file: File) => {
    const validation = validateVideoFile(file);
    if (!validation.valid) {
      setProcessError(validation.error || 'Invalid file');
      return;
    }
    
    setUploadedVideo(file);
    setProcessError('');
    
    // Expand Phase 2 after video upload
    if (!isPhase2Expanded) {
      setIsPhase2Expanded(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    const videoFile = files.find(file => file.type.startsWith('video/'));
    
    if (videoFile) {
      handleVideoUpload(videoFile);
    }
  };

  const handleProcessVideo = async () => {
    if (!uploadedVideo || !generatedContent) {
      setProcessError('Missing video file or Phase 1 content');
      return;
    }

    setIsProcessing(true);
    setProcessError('');
    setProcessingProgress(0);

    try {
      let finalVideo: Blob;
      
      // Step 1: Merge with outro if needed
      if (outroOption === 'default' && defaultOutro) {
        setProcessingStep('Merging with default outro...');
        finalVideo = await mergeVideoWithOutro(
          uploadedVideo,
          defaultOutro,
          (progress) => setProcessingProgress(progress * 0.5)
        );
      } else if (outroOption === 'custom' && customOutroFile) {
        setProcessingStep('Merging with custom outro...');
        finalVideo = await mergeVideoWithOutro(
          uploadedVideo,
          customOutroFile,
          (progress) => setProcessingProgress(progress * 0.5)
        );
      } else {
        finalVideo = new Blob([await uploadedVideo.arrayBuffer()], { type: 'video/mp4' });
        setProcessingProgress(50);
      }

      // Step 2: Apply metadata
      setProcessingStep('Applying metadata...');
      const { metadataSection } = parseGeneratedContent(generatedContent.content);
      const metadata = parseYouTubeMetadata(metadataSection);
      
      const optimizedTags = generateOptimizedTags(
        metadata.tags,
        metadata.competitors,
        500
      );

      const finalVideoWithMetadata = await applyVideoMetadata(
        new File([finalVideo], 'merged.mp4', { type: 'video/mp4' }),
        {
          title: metadata.title,
          description: metadata.description,
          tags: optimizedTags
        },
        (progress) => setProcessingProgress(50 + (progress * 0.5))
      );

      setProcessedVideo(finalVideoWithMetadata);
      setProcessingStep('Complete!');
      setProcessingProgress(100);
      
      // Update project in IndexedDB
      if (currentProject) {
        const updatedProject = {
          ...currentProject,
          phase2: {
            ...currentProject.phase2,
            originalVideo: new Blob([await uploadedVideo.arrayBuffer()]),
            finalVideo: finalVideoWithMetadata,
            outroUsed: outroOption,
            customOutro: customOutroFile ? new Blob([await customOutroFile.arrayBuffer()]) : undefined,
            processingStatus: 'final' as const
          }
        };
        await saveProject(updatedProject);
        setCurrentProject(updatedProject);
        loadProjects();
      }
    } catch (error) {
      console.error('Processing error:', error);
      setProcessError('Failed to process video. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadVideo = () => {
    if (!processedVideo) return;
    
    const vesselName = generatedContent?.vesselName.replace(/\s+/g, '-') || 'processed-video';
    const url = URL.createObjectURL(processedVideo);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${vesselName}-final.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const togglePhase1 = () => {
    setIsPhase1Collapsed(!isPhase1Collapsed);
  };

  const proceedToPhase2 = () => {
    setIsPhase1Collapsed(true);
    setIsPhase2Expanded(true);
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
            <p className="text-blue-200 mt-2">Generate scripts, metadata, and process videos for yacht marketing</p>
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
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Phase 1 - Sidebar when collapsed, full when expanded */}
          <div className={`transition-all duration-300 ${isPhase1Collapsed ? 'lg:col-span-4' : 'lg:col-span-12'}`}>
            <div className="bg-white rounded-lg shadow-lg border border-blue-100">
              <div className="p-6 border-b border-blue-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-blue-900">Phase 1: Content Generation</h2>
                  {generatedContent && (
                    <button
                      onClick={togglePhase1}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <svg 
                        className={`w-6 h-6 transform transition-transform ${isPhase1Collapsed ? 'rotate-90' : 'rotate-0'}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {!isPhase1Collapsed && (
                <div className="p-6">
                  {/* Form Section */}
                  <form onSubmit={handleGenerate} className="space-y-6 mb-8">
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
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  )}

                  {/* Generated Content Display */}
                  {generatedContent && (
                    <div className="space-y-6">
                      {/* Vessel Info */}
                      <div className="bg-gradient-to-r from-blue-100 to-amber-100 rounded-lg p-4 border border-blue-200">
                        <h3 className="text-lg font-bold text-blue-900 mb-1">
                          Generated for: {generatedContent.vesselName}
                        </h3>
                        <p className="text-blue-700 text-sm">
                          Video Length: {videoLength} minutes | Character Count: {generatedContent.characterCount.toLocaleString()}
                        </p>
                        <div className="mt-3">
                          <button
                            onClick={proceedToPhase2}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            ➡️ Proceed to Phase 2
                          </button>
                        </div>
                      </div>

                      {/* Creatify Script Section */}
                      <div className="bg-white rounded-lg shadow border border-blue-100">
                        <div className="p-4 pb-2">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-lg font-bold text-blue-900">Creatify Script</h3>
                              <button
                                onClick={() => setIsScriptExpanded(!isScriptExpanded)}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                <svg 
                                  className={`w-4 h-4 transform transition-transform ${isScriptExpanded ? 'rotate-180' : ''}`}
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              <button
                                onClick={() => copyToClipboard(scriptSection, 'Creatify Script')}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                              >
                                📋 Copy
                              </button>
                              <button
                                onClick={() => downloadAsText(scriptSection, `${generatedContent.vesselName.replace(/\s+/g, '-')}-script.txt`)}
                                className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                              >
                                📥 Download
                              </button>
                              <button
                                onClick={() => setShowFeedbackModal(true)}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                              >
                                💬 Feedback
                              </button>
                              <button
                                onClick={() => setShowYouTubeShortModal(true)}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                              >
                                🎥 Short
                              </button>
                            </div>
                          </div>
                        </div>
                        {isScriptExpanded && (
                          <div className="px-4 pb-4">
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 max-h-96 overflow-y-auto">
                              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                                {scriptSection}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Feedback Script Section */}
                      {feedbackScript && (
                        <div className="bg-white rounded-lg shadow border border-green-100">
                          <div className="p-4 pb-2">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <h3 className="text-lg font-bold text-green-900">Revised Script</h3>
                                <button
                                  onClick={() => setIsFeedbackExpanded(!isFeedbackExpanded)}
                                  className="text-green-600 hover:text-green-800 transition-colors"
                                >
                                  <svg 
                                    className={`w-4 h-4 transform transition-transform ${isFeedbackExpanded ? 'rotate-180' : ''}`}
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => copyToClipboard(feedbackScript, 'Revised Script')}
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                                >
                                  📋 Copy
                                </button>
                                <button
                                  onClick={() => downloadAsText(feedbackScript, `${generatedContent?.vesselName.replace(/\s+/g, '-')}-revised-script.txt`)}
                                  className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                                >
                                  📥 Download
                                </button>
                                <button
                                  onClick={() => setShowFeedbackModal(true)}
                                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                                >
                                  💬 More
                                </button>
                              </div>
                            </div>
                          </div>
                          {isFeedbackExpanded && (
                            <div className="px-4 pb-4">
                              <div className="bg-green-50 rounded-lg p-3 border border-green-200 max-h-96 overflow-y-auto">
                                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                                  {feedbackScript}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* YouTube Short Script Section */}
                      {youtubeShortScript && (
                        <div className="bg-white rounded-lg shadow border border-red-100">
                          <div className="p-4 pb-2">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <h3 className="text-lg font-bold text-red-900">YouTube Short Script</h3>
                                <button
                                  onClick={() => setIsShortExpanded(!isShortExpanded)}
                                  className="text-red-600 hover:text-red-800 transition-colors"
                                >
                                  <svg 
                                    className={`w-4 h-4 transform transition-transform ${isShortExpanded ? 'rotate-180' : ''}`}
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => copyToClipboard(youtubeShortScript, 'YouTube Short Script')}
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                                >
                                  📋 Copy
                                </button>
                                <button
                                  onClick={() => downloadAsText(youtubeShortScript, `${generatedContent?.vesselName.replace(/\s+/g, '-')}-short-script.txt`)}
                                  className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                                >
                                  📥 Download
                                </button>
                              </div>
                            </div>
                          </div>
                          {isShortExpanded && (
                            <div className="px-4 pb-4">
                              <div className="bg-red-50 rounded-lg p-3 border border-red-200 max-h-96 overflow-y-auto">
                                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                                  {youtubeShortScript}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* YouTube Metadata Section */}
                      <div className="bg-white rounded-lg shadow border border-blue-100">
                        <div className="p-4 pb-2">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-lg font-bold text-blue-900">YouTube Metadata</h3>
                              <button
                                onClick={() => setIsMetadataExpanded(!isMetadataExpanded)}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                <svg 
                                  className={`w-4 h-4 transform transition-transform ${isMetadataExpanded ? 'rotate-180' : ''}`}
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => copyToClipboard(metadataSection, 'YouTube Metadata')}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                              >
                                📋 Copy
                              </button>
                              <button
                                onClick={() => downloadAsText(metadataSection, `${generatedContent.vesselName.replace(/\s+/g, '-')}-metadata.txt`)}
                                className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                              >
                                📥 Download
                              </button>
                            </div>
                          </div>
                        </div>
                        {isMetadataExpanded && (
                          <div className="px-4 pb-4">
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 max-h-96 overflow-y-auto">
                              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                                {metadataSection}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Research Tools Section */}
                      <div className="bg-white rounded-lg shadow border border-blue-100 p-4">
                        <h3 className="text-lg font-bold text-blue-900 mb-3">Research Tools</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <button
                            onClick={openYatcoPhotos}
                            disabled={!manufacturer.trim() || !model.trim()}
                            className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-3 py-2 rounded font-medium transition-colors text-sm"
                          >
                            <span>📷</span>
                            <span>Yatco Photos</span>
                          </button>
                          <button
                            onClick={openGoogleSearch}
                            disabled={!manufacturer.trim() || !model.trim()}
                            className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-3 py-2 rounded font-medium transition-colors text-sm"
                          >
                            <span>🔍</span>
                            <span>Google Search</span>
                          </button>
                          <button
                            onClick={openYouTubeSearch}
                            disabled={!manufacturer.trim() || !model.trim()}
                            className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-3 py-2 rounded font-medium transition-colors text-sm"
                          >
                            <span>▶️</span>
                            <span>YouTube Search</span>
                          </button>
                        </div>
                        {(!manufacturer.trim() || !model.trim()) && (
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            Enter manufacturer and model to enable research tools
                          </p>
                        )}
                      </div>

                      {/* Thumbnail Generation Section */}
                      <div className="bg-white rounded-lg shadow border border-blue-100">
                        <div className="p-4 pb-2">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-lg font-bold text-blue-900">Thumbnail Generation</h3>
                              <button
                                onClick={() => setIsThumbnailExpanded(!isThumbnailExpanded)}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                <svg 
                                  className={`w-4 h-4 transform transition-transform ${isThumbnailExpanded ? 'rotate-180' : ''}`}
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            </div>
                            <button
                              onClick={handleGenerateThumbnails}
                              disabled={isGeneratingThumbnails || !manufacturer.trim() || !model.trim()}
                              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                            >
                              {isGeneratingThumbnails ? (
                                <div className="flex items-center space-x-1">
                                  <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                                  <span>Generating...</span>
                                </div>
                              ) : (
                                '🎨 Generate'
                              )}
                            </button>
                          </div>
                        </div>
                        {isThumbnailExpanded && (
                          <div className="px-4 pb-4">
                            {thumbnailError && (
                              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                                {thumbnailError}
                              </div>
                            )}
                            {thumbnailContent && (
                              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                                <div className="flex justify-between items-center mb-2">
                                  <h4 className="font-medium text-purple-900 text-sm">Generated Thumbnails</h4>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => copyToClipboard(thumbnailContent, 'Thumbnails')}
                                      className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                                    >
                                      📋 Copy
                                    </button>
                                    <button
                                      onClick={() => downloadAsText(thumbnailContent, `${generatedContent?.vesselName.replace(/\s+/g, '-')}-thumbnails.txt`)}
                                      className="bg-amber-600 hover:bg-amber-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                                    >
                                      📥 Download
                                    </button>
                                  </div>
                                </div>
                                <div className="max-h-48 overflow-y-auto">
                                  <pre className="whitespace-pre-wrap text-xs text-gray-800 font-mono leading-relaxed">
                                    {thumbnailContent}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Collapsed Phase 1 Summary */}
              {isPhase1Collapsed && generatedContent && (
                <div className="p-4">
                  <div className="bg-gradient-to-r from-blue-100 to-amber-100 rounded p-3 border border-blue-200">
                    <h3 className="font-bold text-blue-900 text-sm mb-1">
                      {generatedContent.vesselName}
                    </h3>
                    <p className="text-blue-700 text-xs">
                      {videoLength} min | {generatedContent.characterCount.toLocaleString()} chars
                    </p>
                    <div className="mt-2 flex gap-1">
                      <button
                        onClick={() => copyToClipboard(scriptSection, 'Script')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                      >
                        📋 Script
                      </button>
                      <button
                        onClick={() => copyToClipboard(metadataSection, 'Metadata')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                      >
                        📋 Meta
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Phase 2 - Main area when expanded, collapsed when not ready */}
          <div className={`transition-all duration-300 ${isPhase1Collapsed ? 'lg:col-span-8' : (isPhase2Expanded ? 'lg:col-span-12 mt-8' : 'lg:col-span-12 mt-8')}`}>
            {!generatedContent ? (
              <div className="bg-gray-100 rounded-lg shadow border border-gray-200 p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Phase 2: Video Processing</h3>
                <p className="text-gray-500">Complete Phase 1 to unlock video processing capabilities</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg border border-purple-100">
                <div className="p-6 border-b border-purple-100">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-purple-900">Phase 2: Video Processing</h2>
                    {!isPhase1Collapsed && isPhase2Expanded && (
                      <button
                        onClick={() => setIsPhase2Expanded(false)}
                        className="text-purple-600 hover:text-purple-800 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <p className="text-purple-600 mt-1">Upload and process your Creatify export</p>
                </div>

                {isPhase2Expanded && (
                  <div className="p-6">
                    {/* Video Upload Section */}
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Upload Video</h3>
                      <div
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {uploadedVideo ? (
                          <div className="space-y-2">
                            <div className="text-green-600">
                              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <p className="text-green-700 font-medium">{uploadedVideo.name}</p>
                            <p className="text-green-600 text-sm">{formatFileSize(uploadedVideo.size)}</p>
                            <button
                              onClick={(e) => { e.stopPropagation(); setUploadedVideo(null); }}
                              className="text-red-600 hover:text-red-700 text-sm underline"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="text-purple-400">
                              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-lg font-medium text-gray-700">Drop your Creatify export here</p>
                              <p className="text-gray-500 text-sm mt-1">or click to browse files</p>
                            </div>
                            <p className="text-gray-400 text-xs">MP4, MOV, AVI up to 500MB</p>
                          </div>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*"
                        onChange={(e) => e.target.files?.[0] && handleVideoUpload(e.target.files[0])}
                        className="hidden"
                      />
                    </div>

                    {/* Outro Configuration */}
                    {uploadedVideo && (
                      <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Outro Configuration</h3>
                        <div className="space-y-4">
                          <div className="flex items-center space-x-4">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="outro"
                                value="default"
                                checked={outroOption === 'default'}
                                onChange={(e) => setOutroOption(e.target.value as 'default' | 'custom')}
                                className="mr-2"
                              />
                              <span className="text-gray-800">Use Default Outro</span>
                              {defaultOutro && (
                                <span className="ml-2 text-green-600 text-sm">({defaultOutro.name})</span>
                              )}
                            </label>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="outro"
                                value="custom"
                                checked={outroOption === 'custom'}
                                onChange={(e) => setOutroOption(e.target.value as 'default' | 'custom')}
                                className="mr-2"
                              />
                              <span className="text-gray-800">Upload Custom Outro</span>
                            </label>
                          </div>

                          {outroOption === 'custom' && (
                            <div className="ml-6">
                              <input
                                ref={outroInputRef}
                                type="file"
                                accept="video/*"
                                onChange={(e) => setCustomOutroFile(e.target.files?.[0] || null)}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                              />
                              {customOutroFile && (
                                <p className="text-green-600 text-sm mt-2">
                                  Selected: {customOutroFile.name} ({formatFileSize(customOutroFile.size)})
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Process Button */}
                    {uploadedVideo && (outroOption === 'default' && defaultOutro || outroOption === 'custom' && customOutroFile) && (
                      <div className="mb-8">
                        <button
                          onClick={handleProcessVideo}
                          disabled={isProcessing}
                          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 rounded-lg font-semibold text-lg transition-all duration-200 disabled:cursor-not-allowed"
                        >
                          {isProcessing ? (
                            <div className="flex items-center justify-center space-x-3">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                              <span>{processingStep}</span>
                            </div>
                          ) : (
                            '🎬 Process Video'
                          )}
                        </button>

                        {isProcessing && (
                          <div className="mt-4">
                            <div className="bg-gray-200 rounded-full h-3">
                              <div 
                                className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${processingProgress}%` }}
                              ></div>
                            </div>
                            <p className="text-center text-purple-600 mt-2 font-medium">
                              {processingProgress}% - {processingStep}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Error Display */}
                    {processError && (
                      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700 text-sm">{processError}</p>
                      </div>
                    )}

                    {/* Final Video Download */}
                    {processedVideo && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-green-800">Video Processing Complete!</h3>
                            <p className="text-green-600 text-sm mt-1">Your final video is ready for download</p>
                          </div>
                          <button
                            onClick={handleDownloadVideo}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Download Final Video</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Past Projects Section */}
                    {projects.length > 0 && (
                      <div className="border-t border-gray-200 pt-8 mt-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Past Projects</h3>
                        <div className="space-y-4">
                          {projects.slice(0, 5).map((project) => (
                            <div key={project.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium text-gray-800">
                                    {project.manufacturer} {project.model}
                                  </h4>
                                  <p className="text-gray-500 text-sm">
                                    {new Date(project.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex space-x-2">
                                  {project.phase1?.scriptContent && (
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        copyToClipboard(project.phase1.scriptContent!, 'Past Script');
                                      }}
                                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                                    >
                                      📋 Script
                                    </button>
                                  )}
                                  {project.phase1?.youtubeContent && (
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        copyToClipboard(project.phase1.youtubeContent!, 'Past Metadata');
                                      }}
                                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                                    >
                                      📋 Meta
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Collapsed Phase 2 */}
                {!isPhase2Expanded && (
                  <div className="p-6 text-center">
                    <button
                      onClick={() => setIsPhase2Expanded(true)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      🎬 Start Video Processing
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        {/* Feedback Modal */}
        {showFeedbackModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-green-900">Provide Feedback</h3>
                  <button
                    onClick={() => setShowFeedbackModal(false)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What would you like to change or improve?
                    </label>
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="e.g., Make it more engaging, add more technical details, shorten the introduction..."
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 resize-none"
                      rows={5}
                    />
                  </div>

                  {cumulativeFeedback.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Previous Feedback:</h4>
                      <ul className="space-y-1">
                        {cumulativeFeedback.map((feedback, index) => (
                          <li key={index} className="text-sm text-gray-600">
                            • {feedback}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {feedbackError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 text-sm">{feedbackError}</p>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowFeedbackModal(false)}
                      disabled={isGeneratingFeedback}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleFeedbackSubmit}
                      disabled={isGeneratingFeedback || !feedbackText.trim()}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      {isGeneratingFeedback ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Generating...</span>
                        </div>
                      ) : (
                        'Generate Revised Script'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* YouTube Short Modal */}
        {showYouTubeShortModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-red-900">Create YouTube Short</h3>
                  <button
                    onClick={() => setShowYouTubeShortModal(false)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Short Description
                    </label>
                    <textarea
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                      placeholder="Describe what you want to highlight in the YouTube Short..."
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Length (seconds)
                      </label>
                      <select
                        value={shortLength}
                        onChange={(e) => setShortLength(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
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
                        Tone
                      </label>
                      <select
                        value={shortTone}
                        onChange={(e) => setShortTone(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
                      >
                        <option value="energetic">Energetic</option>
                        <option value="luxury">Luxury</option>
                        <option value="informative">Informative</option>
                        <option value="exciting">Exciting</option>
                        <option value="professional">Professional</option>
                      </select>
                    </div>
                  </div>

                  {shortError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 text-sm">{shortError}</p>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowYouTubeShortModal(false)}
                      disabled={isGeneratingShort}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleYouTubeShortSubmit}
                      disabled={isGeneratingShort || !shortDescription.trim()}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      {isGeneratingShort ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Generating...</span>
                        </div>
                      ) : (
                        'Generate Short Script'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}