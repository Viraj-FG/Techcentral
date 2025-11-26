import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Clock, Sun, Moon, ExternalLink, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MakeupLook {
  name: string;
  vibe: 'natural' | 'glam' | 'professional' | 'bold';
  steps: string[];
  productsUsed: string[];
  occasion: string;
}

interface SkincareRoutine {
  name: string;
  timeOfDay: 'morning' | 'evening' | 'both';
  steps: string[];
  productsUsed: string[];
  benefits: string[];
}

interface YouTubeVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  url: string;
}

interface BeautyInspirationData {
  makeupLooks: MakeupLook[];
  skincareRoutines: SkincareRoutine[];
  tips: string[];
  youtubeVideos: YouTubeVideo[];
}

interface BeautyInspirationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  inspiration: BeautyInspirationData | null;
}

const vibeColors = {
  natural: 'bg-secondary/20 text-secondary border-secondary/30',
  glam: 'bg-accent/20 text-accent border-accent/30',
  professional: 'bg-primary/20 text-primary border-primary/30',
  bold: 'bg-destructive/20 text-destructive border-destructive/30',
};

export const BeautyInspirationSheet = ({ isOpen, onClose, inspiration }: BeautyInspirationSheetProps) => {
  if (!inspiration) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/50">
          <SheetTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-primary" />
            Beauty Inspiration
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(90vh-80px)]">
          <div className="p-6 space-y-8">
            {/* Makeup Looks */}
            {inspiration.makeupLooks && inspiration.makeupLooks.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Makeup Looks
                </h3>
                <div className="space-y-4">
                  {inspiration.makeupLooks.map((look, index) => (
                    <div key={index} className="glass-card p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold text-foreground">{look.name}</h4>
                        <Badge variant="outline" className={vibeColors[look.vibe]}>
                          {look.vibe}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">{look.occasion}</p>

                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Steps</p>
                        <ol className="space-y-1">
                          {look.steps.map((step, i) => (
                            <li key={i} className="text-sm text-foreground flex gap-2">
                              <span className="text-primary font-medium">{i + 1}.</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {look.productsUsed.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {look.productsUsed.map((product, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {product}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Skincare Routines */}
            {inspiration.skincareRoutines && inspiration.skincareRoutines.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-secondary" />
                  Skincare Routines
                </h3>
                <div className="space-y-4">
                  {inspiration.skincareRoutines.map((routine, index) => (
                    <div key={index} className="glass-card p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold text-foreground">{routine.name}</h4>
                        <Badge variant="outline" className="bg-accent/20 text-accent border-accent/30">
                          {routine.timeOfDay === 'morning' && <Sun className="w-3 h-3 mr-1" />}
                          {routine.timeOfDay === 'evening' && <Moon className="w-3 h-3 mr-1" />}
                          {routine.timeOfDay}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Steps</p>
                        <ol className="space-y-1">
                          {routine.steps.map((step, i) => (
                            <li key={i} className="text-sm text-foreground flex gap-2">
                              <span className="text-secondary font-medium">{i + 1}.</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {routine.benefits.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Benefits</p>
                          <ul className="space-y-0.5">
                            {routine.benefits.map((benefit, i) => (
                              <li key={i} className="text-sm text-foreground flex gap-2">
                                <span className="text-secondary">•</span>
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {routine.productsUsed.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {routine.productsUsed.map((product, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {product}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Expert Tips */}
            {inspiration.tips && inspiration.tips.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  Expert Tips
                </h3>
                <div className="space-y-2">
                  {inspiration.tips.map((tip, index) => (
                    <div key={index} className="glass-card p-3 flex gap-3">
                      <span className="text-primary text-lg">•</span>
                      <p className="text-sm text-foreground">{tip}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* YouTube Tutorials */}
            {inspiration.youtubeVideos && inspiration.youtubeVideos.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-accent" />
                  Video Tutorials
                </h3>
                <div className="space-y-3">
                  {inspiration.youtubeVideos.map((video, index) => (
                    <a
                      key={index}
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-card p-3 flex gap-3 hover:bg-accent/5 transition-colors"
                    >
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-32 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-foreground line-clamp-2 mb-1">
                          {video.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">{video.channelTitle}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-accent flex-shrink-0 mt-1" />
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
