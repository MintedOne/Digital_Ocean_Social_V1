'use client';

import { useState, useEffect, useRef } from 'react';
import { initDB, saveProject, getProject, getAllProjects, saveOutro, getDefaultOutro, generateProjectId, deleteProject } from '@/lib/video-processing/storage';
import { formatFileSize, validateVideoFile } from '@/lib/video-processing/ffmpeg-utils';
import { parseYouTubeMetadata, generateOptimizedTags, extractVideoTitle, extractVideoDescription } from '@/lib/video-processing/metadata-utils';
import ContentCalendar from '@/components/ContentCalendar';

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
  const [generationStatus, setGenerationStatus] = useState(''); // Track current generation status
  
  // Original Phase 1 collapsible sections
  const [isScriptExpanded, setIsScriptExpanded] = useState(true);
  const [isMetadataExpanded, setIsMetadataExpanded] = useState(true);
  const [isThumbnailExpanded, setIsThumbnailExpanded] = useState(true);
  const [isInputFieldsCollapsed, setIsInputFieldsCollapsed] = useState(false);
  
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
  const [outroOption, setOutroOption] = useState<'default' | 'custom' | 'no-outro'>('default');
  const [customOutroFile, setCustomOutroFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('');
  const [processingFileSize, setProcessingFileSize] = useState({ current: 0, total: 0 });
  const [processedVideo, setProcessedVideo] = useState<Blob | null>(null);
  const [processError, setProcessError] = useState('');
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [defaultOutro, setDefaultOutro] = useState<File | null>(null);
  const [isPastProjectsExpanded, setIsPastProjectsExpanded] = useState(false);
  const [isPhase2UploadCollapsed, setIsPhase2UploadCollapsed] = useState(false);

  // YouTube upload states
  const [youtubeAuthStatus, setYoutubeAuthStatus] = useState<{
    authenticated: boolean;
    channelName?: string;
    channelId?: string;
  }>({ authenticated: false });
  const [isUploadingToYoutube, setIsUploadingToYoutube] = useState(false);
  const [youtubeUploadProgress, setYoutubeUploadProgress] = useState(0);
  const [youtubeUploadStep, setYoutubeUploadStep] = useState('');
  const [youtubeUploadFileSize, setYoutubeUploadFileSize] = useState({ current: 0, total: 0 });
  
  // YouTube playlists functionality
  const [availablePlaylists, setAvailablePlaylists] = useState<Array<{ id: string; title: string; itemCount: number }>>([]);
  const [selectedPlaylists, setSelectedPlaylists] = useState<string[]>(['YachtSpecsDirect.com - New Yachts Hitting the Market - Subscribe Here and Visit YachtSpecsDirect.com for Listings, Details & Buyers Guides']); // Default select full playlist name
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [isYoutubeOptionsCollapsed, setIsYoutubeOptionsCollapsed] = useState(false);
  const [youtubeUploadError, setYoutubeUploadError] = useState('');
  const [youtubeUploadResult, setYoutubeUploadResult] = useState<{
    videoId: string;
    url: string;
    title: string;
  } | null>(null);
  const [permanentVideoPath, setPermanentVideoPath] = useState<string>('');
  const [youtubeVideoUrl, setYoutubeVideoUrl] = useState<string>('');
  const [customThumbnail, setCustomThumbnail] = useState<File | null>(null);
  const [privacyStatus, setPrivacyStatus] = useState<'unlisted' | 'private' | 'public'>('unlisted');

  // Phase 3 - Social Media Distribution states
  const [isPhase3Expanded, setIsPhase3Expanded] = useState(false);
  const [socialBrands, setSocialBrands] = useState<Array<{
    label: string;
    id: number;
    userId: number;
    networks: Record<string, string>;
    timezone: string;
  }>>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState({
    twitter: true,
    instagram: true,
    facebook: true,
    tiktok: true,
    linkedin: true,
    gmb: true
  });
  const [socialUploadProgress, setSocialUploadProgress] = useState<Record<string, { percent: number; status: string }>>({});
  const [isSocialUploading, setIsSocialUploading] = useState(false);
  const [socialUploadResults, setSocialUploadResults] = useState<Record<string, any>>({});
  const [socialUploadError, setSocialUploadError] = useState('');
  const [calendarData, setCalendarData] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const outroInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initDB();
    loadProjects();
    loadDefaultOutro();
    checkYouTubeAuthStatus();
    
    // Check for auth success/error params in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth_success') === 'true') {
      checkYouTubeAuthStatus();
      // Remove the parameter from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (urlParams.get('auth_error')) {
      setYoutubeUploadError(decodeURIComponent(urlParams.get('auth_error') || ''));
      // Remove the parameter from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Load playlists when authenticated
  useEffect(() => {
    if (youtubeAuthStatus.authenticated) {
      loadUserPlaylists();
    }
  }, [youtubeAuthStatus.authenticated]);

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
    setGenerationStatus('🔍 Researching the ' + manufacturer + ' ' + model + ' yacht...');
    
    // Reset feedback and YouTube Short states for new generation
    setFeedbackScript('');
    setYoutubeShortScript('');
    setCumulativeFeedback([]);
    setIsScriptExpanded(true);

    try {
      // Simulate status updates during generation
      setTimeout(() => setGenerationStatus('✨ Analyzing yacht features and market positioning...'), 2000);
      setTimeout(() => setGenerationStatus('📝 Writing compelling marketing script...'), 4500);
      setTimeout(() => setGenerationStatus('🎯 Optimizing for YouTube SEO and engagement...'), 7000);
      setTimeout(() => setGenerationStatus('🏁 Finalizing content and metadata...'), 9500);
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
      
      // Collapse input fields after successful generation
      setIsInputFieldsCollapsed(true);
      
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
      setGenerationStatus('');
    }
  };

  // Function to refresh the page and reset to initial state
  const handleRefreshPage = () => {
    window.location.reload();
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
    
    // Clear any previous processed video first
    setProcessedVideo(null);
    
    // If no-outro is selected, set the uploaded video as the processed video immediately
    if (outroOption === 'no-outro') {
      setProcessedVideo(new Blob([file], { type: file.type }));
      
      // Auto-collapse upload sections after immediate processing
      setTimeout(() => {
        setIsPhase2UploadCollapsed(true);
      }, 1500); // Wait 1.5 seconds for no-outro case
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

    const outroFile = outroOption === 'default' ? defaultOutro : customOutroFile;
    if (!outroFile) {
      setProcessError('Please select an outro video');
      return;
    }

    setIsProcessing(true);
    setProcessError('');
    setProcessingProgress(0);
    setProcessingStep('Uploading videos to server...');
    setProcessingFileSize({ current: 0, total: uploadedVideo.size + outroFile.size });

    try {
      // Create FormData for server upload
      const formData = new FormData();
      formData.append('mainVideo', uploadedVideo);
      formData.append('outroVideo', outroFile);

      console.log('📤 Uploading videos to server for processing...');
      setProcessingProgress(10);
      setProcessingStep('Processing videos on server...');
      setProcessingFileSize(prev => ({ ...prev, current: prev.total * 0.1 }));

      // Simulate progress during upload and processing
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          const newProgress = Math.min(85, prev + 5);
          setProcessingFileSize(prevSize => ({ 
            ...prevSize, 
            current: Math.min(prevSize.total * 0.9, prevSize.total * (newProgress / 100))
          }));
          return newProgress;
        });
      }, 1000);

      // Send to server-side processing endpoint
      const response = await fetch('/api/video/merge', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown server error' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      setProcessingProgress(90);
      setProcessingStep('Downloading processed video...');
      setProcessingFileSize(prev => ({ ...prev, current: prev.total * 0.9 }));

      // Get the processed video blob
      const processedVideoBlob = await response.blob();
      
      if (processedVideoBlob.size === 0) {
        throw new Error('Server returned empty video file');
      }

      console.log('✅ Received processed video:', processedVideoBlob.size, 'bytes');
      
      setProcessedVideo(processedVideoBlob);
      setProcessingStep('Complete!');
      setProcessingProgress(100);
      setProcessingFileSize(prev => ({ ...prev, current: processedVideoBlob.size }));
      
      // Auto-collapse upload sections after video processing completes
      setTimeout(() => {
        setIsPhase2UploadCollapsed(true);
      }, 2000); // Wait 2 seconds to show completion message

      // Update project in IndexedDB
      if (currentProject) {
        const updatedProject = {
          ...currentProject,
          phase2: {
            ...currentProject.phase2,
            originalVideo: new Blob([await uploadedVideo.arrayBuffer()]),
            finalVideo: processedVideoBlob,
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
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        uploadedVideo: uploadedVideo ? { name: uploadedVideo.name, size: uploadedVideo.size, type: uploadedVideo.type } : 'No video',
        outroOption,
        outroFile: outroFile ? { name: outroFile.name, size: outroFile.size, type: outroFile.type } : 'No outro file',
        generatedContent: generatedContent ? 'Present' : 'Missing'
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setProcessError(`Server-side processing failed: ${errorMessage}`);
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

  // Function to set current outro as default
  const setAsDefaultOutro = async (file: File) => {
    try {
      const outroData = {
        id: 'default-outro',
        name: file.name,
        file: new Blob([await file.arrayBuffer()], { type: file.type }),
        isDefault: true,
        createdAt: new Date()
      };
      
      await saveOutro(outroData);
      
      // Convert blob back to File for immediate use
      const defaultFile = new File([outroData.file], outroData.name, { type: file.type });
      setDefaultOutro(defaultFile);
      
      console.log('✅ Set as default outro:', file.name);
      return true;
    } catch (error) {
      console.error('❌ Failed to set default outro:', error);
      return false;
    }
  };

  // YouTube Authentication Functions
  const checkYouTubeAuthStatus = async () => {
    try {
      const response = await fetch('/api/youtube/status');
      const data = await response.json();
      
      if (data.success) {
        setYoutubeAuthStatus({
          authenticated: data.authenticated,
          channelName: data.channelName,
          channelId: data.channelId
        });
      }
    } catch (error) {
      console.error('Failed to check YouTube auth status:', error);
      setYoutubeAuthStatus({ authenticated: false });
    }
  };

  const loadUserPlaylists = async () => {
    console.log('📋 Loading user playlists...');
    setIsLoadingPlaylists(true);
    try {
      const response = await fetch('/api/youtube/upload?action=playlists');
      const data = await response.json();
      
      if (data.success && data.playlists) {
        // Sort playlists to put the default one at the top
        const fullPlaylistName = 'YachtSpecsDirect.com - New Yachts Hitting the Market - Subscribe Here and Visit YachtSpecsDirect.com for Listings, Details & Buyers Guides';
        const sortedPlaylists = [...data.playlists].sort((a, b) => {
          // Put the full YachtSpecsDirect.com playlist at the top
          if (a.title === fullPlaylistName) return -1;
          if (b.title === fullPlaylistName) return 1;
          // Then sort alphabetically
          return a.title.localeCompare(b.title);
        });
        
        setAvailablePlaylists(sortedPlaylists);
        console.log('✅ Loaded playlists:', sortedPlaylists.length, '(default playlist moved to top)');
        
        // Auto-select the full YachtSpecsDirect.com playlist if it exists
        const yachtSpecsPlaylist = data.playlists.find((p: any) => p.title === fullPlaylistName);
        if (yachtSpecsPlaylist) {
          setSelectedPlaylists([fullPlaylistName]);
          console.log('✅ Auto-selected full YachtSpecsDirect.com playlist');
        } else {
          // Fallback to short name if full name doesn't exist
          const shortPlaylist = data.playlists.find((p: any) => p.title === 'YachtSpecsDirect.com');
          if (shortPlaylist) {
            setSelectedPlaylists(['YachtSpecsDirect.com']);
            console.log('✅ Auto-selected short YachtSpecsDirect.com playlist');
          } else {
            setSelectedPlaylists([]); // Clear selection if neither exists
            console.log('⚠️ YachtSpecsDirect.com playlist not found');
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to load playlists:', error);
      setAvailablePlaylists([]);
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  const handlePlaylistToggle = (playlistTitle: string) => {
    setSelectedPlaylists(prev => {
      if (prev.includes(playlistTitle)) {
        return prev.filter(title => title !== playlistTitle);
      } else {
        return [...prev, playlistTitle];
      }
    });
  };

  const handleYouTubeAuth = async () => {
    try {
      const response = await fetch('/api/youtube/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'authenticate' })
      });
      
      const data = await response.json();
      
      if (data.success && data.authUrl) {
        // Open OAuth URL in new window
        window.open(data.authUrl, '_blank', 'width=600,height=600');
      }
    } catch (error) {
      console.error('YouTube auth failed:', error);
      setYoutubeUploadError('Failed to start YouTube authentication');
    }
  };

  const handleYouTubeLogout = async () => {
    try {
      const response = await fetch('/api/youtube/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' })
      });
      
      if (response.ok) {
        setYoutubeAuthStatus({ authenticated: false });
        setYoutubeUploadResult(null);
        setYoutubeUploadError('');
      }
    } catch (error) {
      console.error('YouTube logout failed:', error);
    }
  };

  const handleUploadToYouTube = async () => {
    if (!processedVideo || !generatedContent) {
      setYoutubeUploadError('No processed video or metadata available');
      return;
    }

    if (!youtubeAuthStatus.authenticated) {
      setYoutubeUploadError('Please authenticate with YouTube first');
      return;
    }

    setIsUploadingToYoutube(true);
    setYoutubeUploadError('');
    setYoutubeUploadResult(null);
    setYoutubeUploadProgress(0);
    setYoutubeUploadFileSize({ current: 0, total: processedVideo.size });
    
    // Collapse the upload sections when YouTube upload starts
    setIsPhase2UploadCollapsed(true);

    try {
      // Create FormData for upload
      const formData = new FormData();
      formData.append('video', new File([processedVideo], 'yacht-video.mp4', { type: 'video/mp4' }));
      formData.append('metadata', generatedContent.content);
      formData.append('privacyStatus', privacyStatus);
      formData.append('selectedPlaylists', JSON.stringify(selectedPlaylists));

      // Add thumbnail if provided
      if (customThumbnail) {
        formData.append('thumbnail', customThumbnail);
      }

      setYoutubeUploadStep('Uploading to YouTube...');
      setYoutubeUploadProgress(10);
      setYoutubeUploadFileSize(prev => ({ ...prev, current: prev.total * 0.1 }));

      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setYoutubeUploadProgress(prev => {
          const newProgress = Math.min(90, prev + 8);
          setYoutubeUploadFileSize(prevSize => ({ 
            ...prevSize, 
            current: Math.min(prevSize.total, prevSize.total * (newProgress / 100))
          }));
          return newProgress;
        });
      }, 1500);

      const response = await fetch('/api/youtube/upload', {
        method: 'POST',
        body: formData
      });

      clearInterval(uploadInterval);

      if (!response.ok) {
        const errorData = await response.json();
        
        if (errorData.requiresAuth) {
          setYoutubeAuthStatus({ authenticated: false });
          throw new Error('Authentication required. Please re-authenticate with YouTube.');
        }
        
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      
      setYoutubeUploadProgress(100);
      setYoutubeUploadStep('Upload complete!');
      setYoutubeUploadFileSize(prev => ({ ...prev, current: prev.total }));
      setYoutubeUploadResult(result.result);
      
      // Store permanent video path and YouTube URL for Phase 3
      if (result.permanentVideoPath) {
        setPermanentVideoPath(result.permanentVideoPath);
      }
      if (result.youtubeUrl) {
        setYoutubeVideoUrl(result.youtubeUrl);
      }

      // Auto-collapse upload options after successful upload
      setTimeout(() => {
        setIsYoutubeOptionsCollapsed(true);
      }, 2500); // Wait 2.5 seconds to show success message

      console.log('✅ YouTube upload successful:', result.result);
      console.log('📁 Permanent video saved at:', result.permanentVideoPath);
      console.log('🔗 YouTube URL for Phase 3:', result.youtubeUrl);

    } catch (error) {
      console.error('❌ YouTube upload failed:', error);
      setYoutubeUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploadingToYoutube(false);
    }
  };

  // Phase 3 - Social Media Distribution Functions
  const loadSocialBrands = async () => {
    try {
      console.log('🔄 Loading Metricool brands...');
      const response = await fetch('/api/metricool/brands');
      const data = await response.json();
      
      if (data.success && data.brands) {
        setSocialBrands(data.brands);
        console.log('✅ Loaded social brands:', data.brands.length);
      } else {
        console.warn('⚠️ Failed to load brands:', data.error);
      }
    } catch (error) {
      console.error('❌ Error loading social brands:', error);
    }
  };

  const handleSocialDistribution = async () => {
    if (!permanentVideoPath || !youtubeVideoUrl || !youtubeUploadResult) {
      setSocialUploadError('Video processing and YouTube upload must be completed first');
      return;
    }

    const selectedPlatformList = Object.keys(selectedPlatforms).filter(p => selectedPlatforms[p as keyof typeof selectedPlatforms]);
    
    if (selectedPlatformList.length === 0) {
      setSocialUploadError('Please select at least one platform');
      return;
    }

    if (socialBrands.length === 0) {
      setSocialUploadError('No social media brands available');
      return;
    }

    // Smart scheduling based on calendar data
    let schedulingRequest = '';
    if (calendarData && calendarData.analysis) {
      const optimalTime = new Date(calendarData.optimalTime);
      const recommendations = calendarData.analysis.recommendations;
      
      console.log('📊 Using smart scheduling based on calendar data:', {
        totalScheduled: calendarData.analysis.totalScheduled,
        optimalTime: optimalTime.toLocaleString(),
        recommendations: recommendations
      });
      
      // Create scheduling request based on calendar insights
      schedulingRequest = `Smart scheduling based on calendar analysis: ${recommendations.join('; ')}. Suggested time: ${optimalTime.toLocaleString()}`;
    } else {
      console.log('⚠️ No calendar data available, using standard scheduling');
    }

    setIsSocialUploading(true);
    setSocialUploadError('');
    setSocialUploadResults({});
    setSocialUploadProgress({});

    try {
      const formData = new FormData();
      // Use the permanent video file path instead of the blob
      formData.append('videoPath', permanentVideoPath);
      formData.append('youtubeUrl', youtubeVideoUrl);
      formData.append('platforms', JSON.stringify(selectedPlatforms));
      formData.append('brandId', socialBrands[0].id.toString());
      formData.append('vesselName', generatedContent?.vesselName || 'Yacht');
      if (generatedContent) {
        formData.append('youtubeMetadata', generatedContent.content);
      }
      if (schedulingRequest) {
        formData.append('schedulingRequest', schedulingRequest);
      }

      // Initialize progress for each platform
      selectedPlatformList.forEach(platform => {
        setSocialUploadProgress(prev => ({
          ...prev,
          [platform]: { percent: 0, status: 'Preparing...' }
        }));
      });

      console.log('🚀 Starting social media distribution...');
      
      // Call the API
      const response = await fetch('/api/metricool/schedule', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        setSocialUploadResults(result.results);
        
        // Update progress to 100% for successful platforms
        Object.keys(result.results).forEach(platform => {
          const platformResult = result.results[platform];
          setSocialUploadProgress(prev => ({
            ...prev,
            [platform]: { 
              percent: 100, 
              status: platformResult.success ? '✅ Scheduled' : `❌ ${platformResult.error}`
            }
          }));
        });

        console.log('✅ Social distribution complete:', result.summary);
        
        // Auto-expand Phase 3 after success
        setIsPhase3Expanded(true);
        
      } else {
        setSocialUploadError(result.error || 'Distribution failed');
        
        // Set all platforms to failed
        selectedPlatformList.forEach(platform => {
          setSocialUploadProgress(prev => ({
            ...prev,
            [platform]: { percent: 0, status: '❌ Failed' }
          }));
        });
      }

    } catch (error) {
      console.error('❌ Social distribution error:', error);
      setSocialUploadError(error instanceof Error ? error.message : 'Distribution failed');
      
      // Set all platforms to failed
      selectedPlatformList.forEach(platform => {
        setSocialUploadProgress(prev => ({
          ...prev,
          [platform]: { percent: 0, status: '❌ Failed' }
        }));
      });
    } finally {
      setIsSocialUploading(false);
    }
  };

  // Load social brands when component mounts or when Phase 3 becomes available
  useEffect(() => {
    if (youtubeUploadResult && socialBrands.length === 0) {
      loadSocialBrands();
    }
  }, [youtubeUploadResult]);

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
                  {/* Input Fields Section - Collapsible after generation */}
                  {!generatedContent ? (
                    /* Show form when no content generated */
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
                    
                    {/* KITT/Cylon Larson Scanner - Shown when generating */}
                    {isGenerating && (
                      <div className="mt-6 space-y-4">
                        {/* Progress Scanner */}
                        <div className="relative h-8 bg-gray-200 rounded-lg overflow-hidden shadow-inner border border-gray-300">
                          {/* Light grey background */}
                          <div className="absolute inset-0 bg-gradient-to-b from-gray-100 via-gray-200 to-gray-100"></div>
                          
                          {/* Purple sweeping scanner beam */}
                          <div 
                            className="absolute h-full animate-larson-scan"
                            style={{ 
                              width: '16%',
                              background: 'linear-gradient(90deg, transparent, #7c3aed, #9333ea, #a855f7, #9333ea, #7c3aed, transparent)',
                              boxShadow: '0 0 20px #9333ea, 0 0 40px #7c3aed',
                              filter: 'blur(1px)'
                            }}
                          ></div>
                        </div>
                        {/* Status Message */}
                        <div className="text-center">
                          <p className="text-sm text-gray-600 animate-pulse font-medium">
                            {generationStatus || '🤖 Victoria is crafting your yacht marketing content...'}
                          </p>
                        </div>
                      </div>
                    )}
                    </form>
                  ) : (
                    /* Show collapsible input section after generation */
                    <div className="mb-8">
                      <div className="bg-white rounded-lg shadow border border-gray-200">
                        <div className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-lg font-bold text-gray-900">Input Settings</h3>
                              <button
                                onClick={() => setIsInputFieldsCollapsed(!isInputFieldsCollapsed)}
                                className="text-gray-600 hover:text-gray-800 transition-colors"
                              >
                                <svg 
                                  className={`w-4 h-4 transform transition-transform ${isInputFieldsCollapsed ? 'rotate-90' : 'rotate-180'}`}
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            </div>
                            <button
                              onClick={handleRefreshPage}
                              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200"
                            >
                              🔄 Refresh Page
                            </button>
                          </div>
                          {!isInputFieldsCollapsed && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="grid md:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="font-medium text-gray-700">Manufacturer:</span>
                                  <p className="text-gray-600">{manufacturer}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Model:</span>
                                  <p className="text-gray-600">{model}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Video Length:</span>
                                  <p className="text-gray-600">{videoLength} minutes</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

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
                    {/* Video Upload Section - Hide when YouTube upload is in progress */}
                    {!isPhase2UploadCollapsed && (
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
                    )}

                    {/* Outro Configuration - Hide when YouTube upload is in progress */}
                    {uploadedVideo && !isPhase2UploadCollapsed && (
                      <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Outro Configuration</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="outro"
                                value="default"
                                checked={outroOption === 'default'}
                                onChange={(e) => {
                                  const newOption = e.target.value as 'default' | 'custom' | 'no-outro';
                                  setOutroOption(newOption);
                                  if (newOption === 'no-outro' && uploadedVideo) {
                                    setProcessedVideo(new Blob([uploadedVideo], { type: uploadedVideo.type }));
                                  } else if (newOption !== 'no-outro') {
                                    // Clear processed video when switching away from no-outro
                                    setProcessedVideo(null);
                                  }
                                }}
                                className="mr-2"
                              />
                              <span className="text-gray-800">Use Default Outro</span>
                              {defaultOutro && (
                                <span className="ml-2 text-green-600 text-sm">({defaultOutro.name})</span>
                              )}
                            </label>
                            
                            {defaultOutro && (
                              <button
                                onClick={() => {
                                  // Clear current default and switch to custom mode for replacement
                                  setDefaultOutro(null);
                                  setOutroOption('custom');
                                  setCustomOutroFile(null);
                                }}
                                className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                                title="Replace the current default outro"
                              >
                                🔄 Replace Default
                              </button>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="outro"
                                value="custom"
                                checked={outroOption === 'custom'}
                                onChange={(e) => {
                                  const newOption = e.target.value as 'default' | 'custom' | 'no-outro';
                                  setOutroOption(newOption);
                                  if (newOption === 'no-outro' && uploadedVideo) {
                                    setProcessedVideo(new Blob([uploadedVideo], { type: uploadedVideo.type }));
                                  } else if (newOption !== 'no-outro') {
                                    // Clear processed video when switching away from no-outro
                                    setProcessedVideo(null);
                                  }
                                }}
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
                                <div className="mt-2 space-y-2">
                                  <p className="text-green-600 text-sm">
                                    Selected: {customOutroFile.name} ({formatFileSize(customOutroFile.size)})
                                  </p>
                                  <button
                                    onClick={async () => {
                                      const success = await setAsDefaultOutro(customOutroFile);
                                      if (success) {
                                        // Switch to default outro option
                                        setOutroOption('default');
                                      }
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                                  >
                                    💾 Set as Default Outro
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* No Outro Option */}
                          <div className="flex items-center space-x-4">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="outro"
                                value="no-outro"
                                checked={outroOption === 'no-outro'}
                                onChange={(e) => {
                                  const newOption = e.target.value as 'default' | 'custom' | 'no-outro';
                                  setOutroOption(newOption);
                                  if (newOption === 'no-outro' && uploadedVideo) {
                                    setProcessedVideo(new Blob([uploadedVideo], { type: uploadedVideo.type }));
                                  } else if (newOption !== 'no-outro') {
                                    // Clear processed video when switching away from no-outro
                                    setProcessedVideo(null);
                                  }
                                }}
                                className="mr-2"
                              />
                              <span className="text-gray-800">No Outro (Skip Processing)</span>
                            </label>
                          </div>
                          
                          {outroOption === 'no-outro' && uploadedVideo && (
                            <div className="mt-2 ml-6">
                              <p className="text-blue-600 text-sm">
                                ✨ Your video will be uploaded directly to YouTube without any outro processing.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Collapsed upload section indicator */}
                    {isPhase2UploadCollapsed && uploadedVideo && (
                      <div className="mb-8 bg-gray-50 rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700">Video uploaded and configured</span>
                          </div>
                          <button
                            onClick={() => setIsPhase2UploadCollapsed(false)}
                            className="text-purple-600 hover:text-purple-800 text-sm font-medium transition-colors"
                          >
                            Change settings
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Process Button - Only show if not using no-outro option and not collapsed */}
                    {uploadedVideo && !isPhase2UploadCollapsed && outroOption !== 'no-outro' && (outroOption === 'default' && defaultOutro || outroOption === 'custom' && customOutroFile) && (
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
                            '🎬 Process Video (Server-Side)'
                          )}
                        </button>

                        {isProcessing && (
                          <div className="mt-4 bg-white rounded-lg p-4 border border-purple-200">
                            <div className="bg-gray-200 rounded-full h-4 mb-3">
                              <div 
                                className="bg-gradient-to-r from-purple-500 to-purple-600 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                                style={{ width: `${processingProgress}%` }}
                              >
                                {processingProgress > 15 && (
                                  <span className="text-white text-xs font-medium">
                                    {processingProgress}%
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-center text-purple-700 font-medium">
                              {processingStep}
                            </p>
                            <p className="text-center text-gray-500 text-sm mt-1">
                              {processingFileSize.total > 0 && (
                                <span>
                                  {formatFileSize(processingFileSize.current)} / {formatFileSize(processingFileSize.total)}
                                </span>
                              )}
                              {processingFileSize.total === 0 && 'Server-side processing handles large files efficiently'}
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

                    {/* Final Video Download - Only show if not using no-outro option */}
                    {processedVideo && outroOption !== 'no-outro' && (
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

                    {/* YouTube Upload Section */}
                    {processedVideo && generatedContent && (
                      <div className="border-t border-gray-200 pt-8 mt-8">
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
                          <div className="flex items-center mb-6">
                            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center mr-4">
                              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold text-red-800">Upload to YouTube</h3>
                              <p className="text-red-600 text-sm mt-1">{outroOption === 'no-outro' ? 'Publish your video directly to YouTube' : 'Publish your final video directly to YouTube'}</p>
                            </div>
                          </div>

                          {/* Authentication Status */}
                          {!isYoutubeOptionsCollapsed && (
                            <div className="mb-6 p-4 bg-white rounded-lg border border-red-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className={`w-3 h-3 rounded-full mr-3 ${youtubeAuthStatus.authenticated ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                  <div>
                                    <p className="font-medium text-gray-800">
                                      {youtubeAuthStatus.authenticated ? 'Connected to YouTube' : 'Not connected to YouTube'}
                                    </p>
                                    {youtubeAuthStatus.channelName && (
                                      <p className="text-sm text-gray-600">Channel: {youtubeAuthStatus.channelName}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  {!youtubeAuthStatus.authenticated ? (
                                    <button
                                      onClick={handleYouTubeAuth}
                                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                                    >
                                      🔐 Connect YouTube
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => setIsYoutubeOptionsCollapsed(true)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                                      >
                                        ⬆️ Collapse
                                      </button>
                                      <button
                                        onClick={handleYouTubeLogout}
                                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                                      >
                                        🚪 Disconnect
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Upload Options */}
                          {youtubeAuthStatus.authenticated && !isYoutubeOptionsCollapsed && (
                            <div className="space-y-6">
                              {/* Privacy Settings */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Privacy Setting</label>
                                <div className="flex space-x-4">
                                  {(['unlisted', 'private', 'public'] as const).map((privacy) => (
                                    <label key={privacy} className="flex items-center">
                                      <input
                                        type="radio"
                                        name="privacy"
                                        value={privacy}
                                        checked={privacyStatus === privacy}
                                        onChange={(e) => setPrivacyStatus(e.target.value as typeof privacyStatus)}
                                        className="mr-2"
                                      />
                                      <span className="text-gray-800 capitalize">{privacy}</span>
                                      {privacy === 'unlisted' && (
                                        <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Recommended</span>
                                      )}
                                    </label>
                                  ))}
                                </div>
                              </div>

                              {/* Playlist Selection */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  YouTube Playlists
                                  {selectedPlaylists.length > 0 && (
                                    <span className="text-xs text-blue-600 ml-1">({selectedPlaylists.length} selected)</span>
                                  )}
                                </label>
                                
                                {youtubeAuthStatus.authenticated ? (
                                  <div className="space-y-2">
                                    {isLoadingPlaylists ? (
                                      <div className="flex items-center space-x-2 p-3 text-gray-600">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                        <span className="text-sm">Loading playlists...</span>
                                      </div>
                                    ) : availablePlaylists.length > 0 ? (
                                      <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-1">
                                        {availablePlaylists.map((playlist) => (
                                          <label key={playlist.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                            <input
                                              type="checkbox"
                                              checked={selectedPlaylists.includes(playlist.title)}
                                              onChange={() => handlePlaylistToggle(playlist.title)}
                                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <span className="text-sm text-gray-700 flex-1">{playlist.title}</span>
                                            <span className="text-xs text-gray-400">({playlist.itemCount} videos)</span>
                                          </label>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-sm text-gray-500 p-3 border border-gray-300 rounded-lg">
                                        No playlists found. Videos will be uploaded without playlist assignment.
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-500 p-3 border border-gray-300 rounded-lg">
                                    <span>🔐 Authenticate with YouTube to load your playlists</span>
                                  </div>
                                )}
                              </div>

                              {/* Custom Thumbnail */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Custom Thumbnail (Optional)</label>
                                <div className="flex items-center space-x-4">
                                  <button
                                    onClick={() => thumbnailInputRef.current?.click()}
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                                  >
                                    {customThumbnail ? '🖼️ Change Thumbnail' : '🖼️ Add Thumbnail'}
                                  </button>
                                  {customThumbnail && (
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm text-green-600">{customThumbnail.name}</span>
                                      <button
                                        onClick={() => setCustomThumbnail(null)}
                                        className="text-red-500 hover:text-red-700 text-sm"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <input
                                  ref={thumbnailInputRef}
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => e.target.files?.[0] && setCustomThumbnail(e.target.files[0])}
                                  className="hidden"
                                />
                                <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 2MB. Recommended: 1280x720px</p>
                              </div>

                              {/* Upload Button */}
                              <div className="pt-4">
                                <button
                                  onClick={handleUploadToYouTube}
                                  disabled={isUploadingToYoutube}
                                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                                >
                                  {isUploadingToYoutube ? (
                                    <>
                                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                      <span>{youtubeUploadStep || 'Uploading...'}</span>
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                      </svg>
                                      <span>🚀 Upload to YouTube</span>
                                    </>
                                  )}
                                </button>

                                {/* Progress Bar */}
                                {isUploadingToYoutube && (
                                  <div className="mt-4 bg-white rounded-lg p-4 border border-red-200">
                                    <div className="bg-gray-200 rounded-full h-4 mb-3">
                                      <div 
                                        className="bg-gradient-to-r from-red-500 to-red-600 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                                        style={{ width: `${youtubeUploadProgress}%` }}
                                      >
                                        {youtubeUploadProgress > 15 && (
                                          <span className="text-white text-xs font-medium">
                                            {youtubeUploadProgress}%
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <p className="text-center text-red-700 font-medium">
                                      {youtubeUploadStep}
                                    </p>
                                    <p className="text-center text-gray-500 text-sm mt-1">
                                      {youtubeUploadFileSize.total > 0 && (
                                        <span>
                                          {formatFileSize(youtubeUploadFileSize.current)} / {formatFileSize(youtubeUploadFileSize.total)}
                                        </span>
                                      )}
                                      {youtubeUploadFileSize.total === 0 && 'Uploading video with Phase 1 metadata'}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Collapsed YouTube Section - Show when options are collapsed */}
                          {youtubeAuthStatus.authenticated && isYoutubeOptionsCollapsed && (
                            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                  <div>
                                    <span className="text-sm font-medium text-gray-700">Connected to YouTube</span>
                                    {youtubeAuthStatus.channelName && (
                                      <p className="text-xs text-gray-500">Channel: {youtubeAuthStatus.channelName}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => setIsYoutubeOptionsCollapsed(false)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                                  >
                                    ⬇️ Expand Settings
                                  </button>
                                  <button
                                    onClick={handleYouTubeLogout}
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                                  >
                                    🚪 Disconnect
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Upload Error */}
                          {youtubeUploadError && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-red-700 text-sm">{youtubeUploadError}</p>
                            </div>
                          )}

                          {/* Upload Success */}
                          {youtubeUploadResult && (
                            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-semibold text-green-800">✅ Upload Successful!</h4>
                                  <p className="text-green-600 text-sm mt-1">Your video is now live on YouTube</p>
                                  <p className="text-gray-600 text-sm">Title: {youtubeUploadResult.title}</p>
                                </div>
                                <a
                                  href={youtubeUploadResult.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center space-x-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  <span>View on YouTube</span>
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Phase 3 - Social Media Distribution */}
                    {youtubeUploadResult && processedVideo && generatedContent && (
                      <div className="border-t border-purple-200 pt-8 mt-8">
                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-4">
                              <div className="bg-purple-600 text-white rounded-full p-3">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V3a1 1 0 011 1v9l-1 1H8l-1-1V4a1 1 0 011-1m0 0h8m-8 0V3a1 1 0 00-1 1v4H6m10 0V4a1 1 0 00-1-1v4h1M9 7h6m-3 4h3"/>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                              </div>
                              <div>
                                <h3 className="text-xl font-semibold text-purple-800">Phase 3 - Social Media Distribution</h3>
                                <p className="text-purple-600 text-sm mt-1">Schedule your video across social platforms via Metricool</p>
                              </div>
                            </div>
                            {!isPhase3Expanded && (
                              <button
                                onClick={() => setIsPhase3Expanded(true)}
                                className="text-purple-600 hover:text-purple-800 transition-colors"
                              >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            )}
                          </div>

                          {isPhase3Expanded ? (
                            <div>
                              {/* Brand Information */}
                              {socialBrands.length > 0 && (
                                <div className="mb-6 p-4 bg-white rounded-lg border border-purple-200">
                                  <h4 className="font-semibold text-gray-800 mb-2">Connected Brand</h4>
                                  <div className="flex items-center space-x-3">
                                    <div className="bg-purple-100 text-purple-800 rounded-full px-3 py-1 text-sm font-medium">
                                      {socialBrands[0].label}
                                    </div>
                                    <span className="text-gray-500 text-sm">ID: {socialBrands[0].id}</span>
                                  </div>
                                </div>
                              )}

                              {/* Content Calendar */}
                              <div className="mb-6">
                                <ContentCalendar onCalendarLoad={setCalendarData} />
                              </div>

                              {/* Platform Selection */}
                              <div className="mb-6">
                                <h4 className="font-semibold text-gray-800 mb-3">Select Platforms</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                  {Object.entries({
                                    twitter: { name: 'X (Twitter)', icon: '🐦', color: 'blue' },
                                    instagram: { name: 'Instagram', icon: '📷', color: 'pink' },
                                    facebook: { name: 'Facebook', icon: '👥', color: 'blue' },
                                    linkedin: { name: 'LinkedIn', icon: '💼', color: 'blue' },
                                    tiktok: { name: 'TikTok', icon: '🎵', color: 'gray' },
                                    gmb: { name: 'Google Business', icon: '🏢', color: 'green' }
                                  }).map(([platform, config]) => (
                                    <label key={platform} className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 cursor-pointer transition-colors">
                                      <input
                                        type="checkbox"
                                        checked={selectedPlatforms[platform as keyof typeof selectedPlatforms]}
                                        onChange={(e) => setSelectedPlatforms(prev => ({
                                          ...prev,
                                          [platform]: e.target.checked
                                        }))}
                                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                      />
                                      <span className="text-lg">{config.icon}</span>
                                      <span className="text-sm font-medium text-gray-700">{config.name}</span>
                                      {socialUploadProgress[platform] && (
                                        <div className="ml-auto flex items-center space-x-2">
                                          {socialUploadProgress[platform].percent === 100 && socialUploadProgress[platform].status.includes('✅') ? (
                                            <span className="text-green-600 text-sm">✅</span>
                                          ) : socialUploadProgress[platform].status.includes('❌') ? (
                                            <span className="text-red-600 text-sm">❌</span>
                                          ) : (
                                            <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                                          )}
                                          <span className="text-xs text-gray-500">{socialUploadProgress[platform].percent}%</span>
                                        </div>
                                      )}
                                    </label>
                                  ))}
                                </div>
                              </div>

                              {/* Progress Display */}
                              {Object.keys(socialUploadProgress).length > 0 && (
                                <div className="mb-6 p-4 bg-white rounded-lg border border-purple-200">
                                  <h4 className="font-semibold text-gray-800 mb-3">Upload Progress</h4>
                                  <div className="space-y-2">
                                    {Object.entries(socialUploadProgress).map(([platform, progress]) => (
                                      <div key={platform} className="flex items-center justify-between">
                                        <span className="text-sm font-medium capitalize">{platform}</span>
                                        <div className="flex items-center space-x-2">
                                          <div className="w-20 bg-gray-200 rounded-full h-2">
                                            <div 
                                              className={`h-2 rounded-full transition-all duration-300 ${
                                                progress.status.includes('✅') ? 'bg-green-500' : 
                                                progress.status.includes('❌') ? 'bg-red-500' : 'bg-purple-600'
                                              }`}
                                              style={{ width: `${progress.percent}%` }}
                                            ></div>
                                          </div>
                                          <span className="text-xs text-gray-600 w-20 text-right">{progress.status}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Results Display */}
                              {Object.keys(socialUploadResults).length > 0 && (
                                <div className="mb-6 p-4 bg-white rounded-lg border border-green-200">
                                  <h4 className="font-semibold text-green-800 mb-3">✅ Distribution Results</h4>
                                  <div className="space-y-2">
                                    {Object.entries(socialUploadResults).map(([platform, result]: [string, any]) => (
                                      <div key={platform} className="flex items-center justify-between text-sm">
                                        <span className="font-medium capitalize">{platform}</span>
                                        {result.success ? (
                                          <div className="flex items-center space-x-2">
                                            <span className="text-green-600">✅ Scheduled</span>
                                            {result.scheduledTime && (
                                              <span className="text-gray-500">
                                                {new Date(result.scheduledTime).toLocaleString()}
                                              </span>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="text-red-600">❌ {result.error}</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Error Display */}
                              {socialUploadError && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                  <h4 className="font-semibold text-red-800 mb-2">❌ Distribution Error</h4>
                                  <p className="text-red-700 text-sm">{socialUploadError}</p>
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="flex items-center justify-between">
                                <button
                                  onClick={() => setIsPhase3Expanded(false)}
                                  className="text-purple-600 hover:text-purple-800 transition-colors text-sm"
                                >
                                  ↑ Collapse Phase 3
                                </button>
                                <div className="flex space-x-3">
                                  {Object.keys(socialUploadResults).length > 0 && (
                                    <button
                                      onClick={loadSocialBrands}
                                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                                    >
                                      🔄 Refresh Brands
                                    </button>
                                  )}
                                  <button
                                    onClick={handleSocialDistribution}
                                    disabled={isSocialUploading || socialBrands.length === 0}
                                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
                                  >
                                    {isSocialUploading ? (
                                      <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Distributing...</span>
                                      </>
                                    ) : (
                                      <>
                                        <span>🚀 Distribute to Social Media</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center">
                              <p className="text-purple-700 mb-4">Ready to distribute your video to social media platforms</p>
                              <button
                                onClick={() => setIsPhase3Expanded(true)}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                              >
                                📱 Setup Social Distribution
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Past Projects Section - Collapsible */}
                    {projects.length > 0 && (
                      <div className="border-t border-gray-200 pt-8 mt-8">
                        <div className="bg-gray-50 rounded-lg border border-gray-200">
                          <button
                            onClick={() => setIsPastProjectsExpanded(!isPastProjectsExpanded)}
                            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
                          >
                            <h3 className="text-lg font-semibold text-gray-800">Past Projects ({projects.length})</h3>
                            <svg
                              className={`w-5 h-5 text-gray-600 transition-transform ${isPastProjectsExpanded ? 'transform rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          
                          {isPastProjectsExpanded && (
                            <div className="px-6 pb-6">
                              <div className="space-y-4">
                                {projects.map((project) => (
                                  <div key={project.id} className="bg-white rounded-lg p-4 border border-gray-200">
                                    <div className="flex items-center justify-between mb-3">
                                      <div>
                                        <h4 className="font-medium text-gray-800">
                                          {project.manufacturer} {project.model}
                                        </h4>
                                        <p className="text-gray-500 text-sm">
                                          {new Date(project.createdAt).toLocaleDateString()}
                                        </p>
                                      </div>
                                      <button
                                        onClick={async () => {
                                          if (confirm('Are you sure you want to delete this project and all associated files?')) {
                                            try {
                                              // First delete from IndexedDB (client-side)
                                              await deleteProject(project.id);
                                              
                                              // Then clean up server-side files
                                              const response = await fetch(`/api/projects/delete?id=${encodeURIComponent(project.id)}`, {
                                                method: 'DELETE'
                                              });
                                              
                                              if (!response.ok) {
                                                console.warn('Server cleanup failed, but project was deleted from local storage');
                                              }
                                              
                                              loadProjects(); // Refresh the list
                                              console.log('✅ Project deleted successfully');
                                            } catch (error) {
                                              console.error('Failed to delete project:', error);
                                              alert('Failed to delete project. Please try again.');
                                            }
                                          }
                                        }}
                                        className="text-red-600 hover:text-red-800 p-2"
                                        title="Delete project"
                                      >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {project.phase1?.scriptContent && (
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault();
                                            copyToClipboard(project.phase1.scriptContent!, 'Past Script');
                                          }}
                                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                                          title="Copy script to clipboard"
                                        >
                                          📋 Copy Script
                                        </button>
                                      )}
                                      {project.phase1?.youtubeContent && (
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault();
                                            copyToClipboard(project.phase1.youtubeContent!, 'Past Metadata');
                                          }}
                                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                                          title="Copy metadata to clipboard"
                                        >
                                          📋 Copy Meta
                                        </button>
                                      )}
                                      {project.phase2?.originalVideo && (
                                        <button
                                          onClick={async () => {
                                            const blob = project.phase2.originalVideo!;
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `${project.manufacturer}-${project.model}-original.mp4`;
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);
                                            URL.revokeObjectURL(url);
                                          }}
                                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                                          title="Download original video"
                                        >
                                          ⬇️ Original
                                        </button>
                                      )}
                                      {project.phase2?.mergedVideo && (
                                        <button
                                          onClick={async () => {
                                            const blob = project.phase2.mergedVideo!;
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `${project.manufacturer}-${project.model}-merged.mp4`;
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);
                                            URL.revokeObjectURL(url);
                                          }}
                                          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                                          title="Download merged video"
                                        >
                                          ⬇️ Merged
                                        </button>
                                      )}
                                      {project.phase2?.finalVideo && (
                                        <button
                                          onClick={async () => {
                                            const blob = project.phase2.finalVideo!;
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `${project.manufacturer}-${project.model}-final.mp4`;
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);
                                            URL.revokeObjectURL(url);
                                          }}
                                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                                          title="Download final video"
                                        >
                                          ⬇️ Final
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
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