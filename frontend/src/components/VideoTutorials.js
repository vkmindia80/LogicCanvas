import React, { useState } from 'react';
import { X, Play, BookOpen, Video, Clock, CheckCircle, ExternalLink } from 'lucide-react';

const TUTORIAL_CATEGORIES = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    icon: '🚀',
    videos: [
      {
        id: 'intro',
        title: 'Introduction to LogicCanvas',
        description: 'Learn the basics of visual workflow automation',
        duration: '5:30',
        difficulty: 'Beginner',
        thumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=225&fit=crop',
        embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        topics: ['Overview', 'User Interface', 'Basic Concepts']
      },
      {
        id: 'first-workflow',
        title: 'Creating Your First Workflow',
        description: 'Step-by-step guide to building a simple approval workflow',
        duration: '8:45',
        difficulty: 'Beginner',
        thumbnail: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=225&fit=crop',
        embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        topics: ['Workflow Canvas', 'Node Types', 'Connections']
      },
      {
        id: 'forms-basics',
        title: 'Building Forms',
        description: 'Create dynamic forms with validation and conditional logic',
        duration: '6:20',
        difficulty: 'Beginner',
        thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=225&fit=crop',
        embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        topics: ['Form Builder', 'Field Types', 'Validation']
      }
    ]
  },
  {
    id: 'intermediate',
    name: 'Intermediate',
    icon: '📚',
    videos: [
      {
        id: 'decision-logic',
        title: 'Advanced Decision Logic',
        description: 'Master conditional branching and complex decision trees',
        duration: '10:15',
        difficulty: 'Intermediate',
        thumbnail: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400&h=225&fit=crop',
        embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        topics: ['Decision Nodes', 'Switch Logic', 'Conditions']
      },
      {
        id: 'loops-iteration',
        title: 'Loops and Iteration',
        description: 'Working with For Each, While, and Repeat loops',
        duration: '9:30',
        difficulty: 'Intermediate',
        thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop',
        embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        topics: ['For Each', 'While Loops', 'Data Collections']
      },
      {
        id: 'api-integration',
        title: 'API Integration',
        description: 'Connect to external services with HTTP requests',
        duration: '12:00',
        difficulty: 'Intermediate',
        thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=225&fit=crop',
        embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        topics: ['API Calls', 'Authentication', 'Data Mapping']
      }
    ]
  },
  {
    id: 'advanced',
    name: 'Advanced',
    icon: '🎓',
    videos: [
      {
        id: 'parallel-execution',
        title: 'Parallel Execution & Merge',
        description: 'Run multiple branches concurrently for better performance',
        duration: '11:20',
        difficulty: 'Advanced',
        thumbnail: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=225&fit=crop',
        embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        topics: ['Parallel Nodes', 'Merge Logic', 'Synchronization']
      },
      {
        id: 'subworkflows',
        title: 'Sub-workflows & Reusability',
        description: 'Build modular workflows with reusable components',
        duration: '13:45',
        difficulty: 'Advanced',
        thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=225&fit=crop',
        embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        topics: ['Subprocess', 'Modularity', 'Best Practices']
      },
      {
        id: 'debugging',
        title: 'Debugging & Troubleshooting',
        description: 'Use the debug console and execution logs effectively',
        duration: '10:50',
        difficulty: 'Advanced',
        thumbnail: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=400&h=225&fit=crop',
        embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        topics: ['Debug Panel', 'Logs', 'Error Handling']
      }
    ]
  },
  {
    id: 'use-cases',
    name: 'Use Cases',
    icon: '💼',
    videos: [
      {
        id: 'hr-onboarding',
        title: 'Building an HR Onboarding Workflow',
        description: 'Complete tutorial for employee onboarding automation',
        duration: '15:30',
        difficulty: 'Intermediate',
        thumbnail: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&h=225&fit=crop',
        embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        topics: ['HR', 'Onboarding', 'Multi-step Process']
      },
      {
        id: 'invoice-approval',
        title: 'Invoice Approval Process',
        description: 'Multi-level approval workflow with conditional routing',
        duration: '12:15',
        difficulty: 'Intermediate',
        thumbnail: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=225&fit=crop',
        embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        topics: ['Finance', 'Approvals', 'Routing']
      },
      {
        id: 'customer-service',
        title: 'Customer Service Ticketing',
        description: 'Automated ticket routing and SLA management',
        duration: '14:00',
        difficulty: 'Advanced',
        thumbnail: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=400&h=225&fit=crop',
        embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        topics: ['Support', 'SLA', 'Escalation']
      }
    ]
  }
];

const difficultyColors = {
  'Beginner': 'bg-green-100 text-green-800',
  'Intermediate': 'bg-yellow-100 text-yellow-800',
  'Advanced': 'bg-red-100 text-red-800'
};

const VideoTutorials = ({ isOpen, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState('getting-started');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [watchedVideos, setWatchedVideos] = useState(() => {
    const stored = localStorage.getItem('lc_watched_videos');
    return stored ? JSON.parse(stored) : [];
  });

  const markAsWatched = (videoId) => {
    if (!watchedVideos.includes(videoId)) {
      const updated = [...watchedVideos, videoId];
      setWatchedVideos(updated);
      localStorage.setItem('lc_watched_videos', JSON.stringify(updated));
    }
  };

  const currentCategory = TUTORIAL_CATEGORIES.find(cat => cat.id === selectedCategory);
  const totalVideos = TUTORIAL_CATEGORIES.reduce((sum, cat) => sum + cat.videos.length, 0);
  const watchedCount = watchedVideos.length;
  const progress = (watchedCount / totalVideos) * 100;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Video className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Video Tutorials</h2>
                <p className="text-purple-100 text-sm">Master LogicCanvas with step-by-step guides</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              data-testid="close-video-tutorials"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 space-y-1">
            <div className="flex justify-between text-xs text-purple-100">
              <span>Your Progress</span>
              <span>{watchedCount} of {totalVideos} videos watched ({Math.round(progress)}%)</span>
            </div>
            <div className="h-2 bg-purple-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Categories */}
          <div className="w-64 border-r border-gray-200 bg-gray-50 p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Categories</h3>
            <div className="space-y-1">
              {TUTORIAL_CATEGORIES.map(category => {
                const categoryWatched = category.videos.filter(v => 
                  watchedVideos.includes(v.id)
                ).length;

                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-purple-100 text-purple-900 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    data-testid={`category-${category.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{category.icon}</span>
                        <span className="text-sm">{category.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {categoryWatched}/{category.videos.length}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Stats */}
            <div className="mt-6 p-3 bg-white rounded-lg border border-gray-200">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Your Stats</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Videos:</span>
                  <span className="font-medium text-gray-900">{totalVideos}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Watched:</span>
                  <span className="font-medium text-green-600">{watchedCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Remaining:</span>
                  <span className="font-medium text-purple-600">{totalVideos - watchedCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Video Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <span>{currentCategory?.icon}</span>
                <span>{currentCategory?.name}</span>
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {currentCategory?.videos.length} tutorials available
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentCategory?.videos.map(video => {
                const isWatched = watchedVideos.includes(video.id);

                return (
                  <div
                    key={video.id}
                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 bg-white group"
                    data-testid={`video-${video.id}`}
                  >
                    {/* Thumbnail */}
                    <div className="relative">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                        <button
                          onClick={() => {
                            setSelectedVideo(video);
                            markAsWatched(video.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-purple-600 rounded-full p-4 hover:scale-110 transform"
                          data-testid={`play-${video.id}`}
                        >
                          <Play className="w-8 h-8 fill-current" />
                        </button>
                      </div>
                      {isWatched && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{video.duration}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="mb-2">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[video.difficulty]}`}>
                          {video.difficulty}
                        </span>
                      </div>

                      <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">{video.title}</h4>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{video.description}</p>

                      {/* Topics */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {video.topics.slice(0, 3).map((topic, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {topic}
                          </span>
                        ))}
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => {
                          setSelectedVideo(video);
                          markAsWatched(video.id);
                        }}
                        className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2 text-sm font-medium"
                      >
                        <Play className="w-4 h-4" />
                        <span>{isWatched ? 'Watch Again' : 'Watch Now'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Video Player Modal */}
        {selectedVideo && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 flex items-center justify-between">
                <h3 className="text-lg font-bold">{selectedVideo.title}</h3>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Video Player */}
              <div className="relative pt-[56.25%] bg-black">
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={selectedVideo.embedUrl}
                  title={selectedVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>

              {/* Video Info */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${difficultyColors[selectedVideo.difficulty]}`}>
                    {selectedVideo.difficulty}
                  </span>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{selectedVideo.duration}</span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 mb-4">{selectedVideo.description}</p>

                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Topics Covered:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedVideo.topics.map((topic, idx) => (
                      <span key={idx} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      markAsWatched(selectedVideo.id);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Mark as Watched</span>
                  </button>
                  <a
                    href={selectedVideo.embedUrl.replace('/embed/', '/watch?v=')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open in YouTube</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoTutorials;
