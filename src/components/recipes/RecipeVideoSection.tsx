import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Video, Play, Clock, Eye, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface VideoResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  duration: string;
  viewCount: string;
  publishedAt: string;
}

interface RecipeVideoSectionProps {
  recipeName: string;
}

export const RecipeVideoSection: React.FC<RecipeVideoSectionProps> = ({ recipeName }) => {
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  const fetchVideos = async () => {
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('search-recipe-videos', {
        body: { recipeName, maxResults: 3 }
      });

      if (error) throw error;

      if (data?.videos) {
        setVideos(data.videos);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast({
        title: "Failed to load videos",
        description: "Unable to fetch video tutorials",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openVideo = (videoId: string) => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
  };

  if (!hasSearched && !isLoading) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <Video className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Video Tutorials</h3>
              <p className="text-xs text-muted-foreground">Watch step-by-step guides</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchVideos}
            className="gap-2"
          >
            <Play className="w-4 h-4" />
            Find Videos
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 overflow-hidden">
        <div className="flex items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Searching for video tutorials...</span>
        </div>
      </div>
    );
  }

  if (videos.length === 0 && hasSearched) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 overflow-hidden">
        <div className="text-center">
          <Video className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">No video tutorials found</p>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={fetchVideos}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-destructive" />
          <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase">
            Video Tutorials
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchVideos}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Refresh
        </Button>
      </div>

      <div className="space-y-3">
        {videos.map((video, index) => (
          <motion.div
            key={video.videoId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => openVideo(video.videoId)}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 overflow-hidden cursor-pointer hover:bg-white/10 transition-all group"
          >
            <div className="flex gap-3">
              {/* Thumbnail */}
              <div className="relative flex-shrink-0 w-32 h-20 rounded-lg overflow-hidden bg-background/50">
                <img 
                  src={video.thumbnail} 
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-8 h-8 text-white" fill="white" />
                </div>
                {/* Duration badge */}
                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                  {video.duration}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground mb-1 line-clamp-2 group-hover:text-destructive transition-colors">
                  {video.title}
                </h4>
                <p className="text-xs text-muted-foreground mb-2 truncate">
                  {video.channelTitle}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>{video.viewCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{video.duration}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};