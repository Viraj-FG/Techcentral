import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { PhoneCall, MessageSquare, Wrench, Activity, User, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ConversationEvent {
  id: string;
  conversation_id: string;
  user_id: string;
  agent_type: string;
  event_type: string;
  event_data: any;
  role: string | null;
  created_at: string;
}

interface ActiveConversation {
  conversation_id: string;
  user_id: string;
  agent_type: string;
  started_at: string;
  last_activity: string;
  event_count: number;
}

export const ConversationMonitor = () => {
  const [events, setEvents] = useState<ConversationEvent[]>([]);
  const [activeConversations, setActiveConversations] = useState<ActiveConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadRecentEvents();
    loadActiveConversations();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('conversation-events-monitor')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_events'
        },
        (payload) => {
          console.log('📡 New conversation event:', payload);
          const newEvent = payload.new as ConversationEvent;
          setEvents(prev => [newEvent, ...prev].slice(0, 100)); // Keep last 100 events
          
          // Update active conversations
          setActiveConversations(prev => {
            const existing = prev.find(c => c.conversation_id === newEvent.conversation_id);
            if (existing) {
              return prev.map(c => 
                c.conversation_id === newEvent.conversation_id
                  ? { ...c, last_activity: newEvent.created_at, event_count: c.event_count + 1 }
                  : c
              );
            } else if (newEvent.event_type === 'session_start') {
              return [{
                conversation_id: newEvent.conversation_id,
                user_id: newEvent.user_id,
                agent_type: newEvent.agent_type,
                started_at: newEvent.created_at,
                last_activity: newEvent.created_at,
                event_count: 1
              }, ...prev];
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new events arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [events]);

  const loadRecentEvents = async () => {
    const { data, error } = await supabase
      .from('conversation_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data && !error) {
      setEvents(data);
    }
  };

  const loadActiveConversations = async () => {
    // Get conversations from last 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('conversation_events')
      .select('conversation_id, user_id, agent_type, created_at')
      .gte('created_at', thirtyMinutesAgo)
      .order('created_at', { ascending: false });

    if (data && !error) {
      // Group by conversation_id
      const conversations = data.reduce((acc, event) => {
        if (!acc[event.conversation_id]) {
          acc[event.conversation_id] = {
            conversation_id: event.conversation_id,
            user_id: event.user_id,
            agent_type: event.agent_type,
            started_at: event.created_at,
            last_activity: event.created_at,
            event_count: 1
          };
        } else {
          acc[event.conversation_id].event_count++;
          if (event.created_at > acc[event.conversation_id].last_activity) {
            acc[event.conversation_id].last_activity = event.created_at;
          }
        }
        return acc;
      }, {} as Record<string, ActiveConversation>);

      setActiveConversations(Object.values(conversations));
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'session_start':
      case 'session_end':
        return <PhoneCall className="h-4 w-4" />;
      case 'user_transcript':
      case 'agent_transcript':
        return <MessageSquare className="h-4 w-4" />;
      case 'tool_call':
      case 'tool_response':
        return <Wrench className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'session_start':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'session_end':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'user_transcript':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'agent_transcript':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'tool_call':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'tool_response':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getRoleIcon = (role: string | null) => {
    if (role === 'user') return <User className="h-3 w-3" />;
    if (role === 'assistant') return <Bot className="h-3 w-3" />;
    return null;
  };

  const filteredEvents = selectedConversation
    ? events.filter(e => e.conversation_id === selectedConversation)
    : events;

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Active Conversations List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-kaeva-sage" />
            Active Conversations
          </CardTitle>
          <CardDescription>
            Last 30 minutes ({activeConversations.length} active)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-2">
              <AnimatePresence>
                {activeConversations.map((conv) => (
                  <motion.div
                    key={conv.conversation_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedConversation === conv.conversation_id
                        ? 'bg-kaeva-sage/10 border-kaeva-sage'
                        : 'bg-muted/50 border-border hover:bg-muted'
                    }`}
                    onClick={() => setSelectedConversation(
                      selectedConversation === conv.conversation_id ? null : conv.conversation_id
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {conv.agent_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {conv.event_count} events
                      </span>
                    </div>
                    <div className="text-xs font-mono text-muted-foreground truncate">
                      {conv.conversation_id.slice(0, 16)}...
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(conv.last_activity).toLocaleTimeString()}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {activeConversations.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-8">
                  No active conversations
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Event Stream */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-kaeva-sage" />
                Live Event Stream
              </CardTitle>
              <CardDescription>
                {selectedConversation 
                  ? `Filtered: ${selectedConversation.slice(0, 16)}...` 
                  : 'All conversations'}
              </CardDescription>
            </div>
            {selectedConversation && (
              <Badge 
                variant="outline" 
                className="cursor-pointer"
                onClick={() => setSelectedConversation(null)}
              >
                Clear Filter
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]" ref={scrollRef}>
            <div className="space-y-3">
              <AnimatePresence>
                {filteredEvents.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={`p-4 rounded-lg border ${getEventColor(event.event_type)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getEventIcon(event.event_type)}
                        <Badge variant="outline" className="text-xs">
                          {event.event_type}
                        </Badge>
                        {event.role && (
                          <div className="flex items-center gap-1">
                            {getRoleIcon(event.role)}
                            <span className="text-xs">{event.role}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.created_at).toLocaleTimeString()}
                      </span>
                    </div>

                    {/* Event Data */}
                    <div className="mt-2">
                      {event.event_type === 'user_transcript' && (
                        <div className="text-sm">
                          <span className="font-medium">User: </span>
                          {event.event_data.text || event.event_data.transcript}
                        </div>
                      )}
                      {event.event_type === 'agent_transcript' && (
                        <div className="text-sm">
                          <span className="font-medium">Assistant: </span>
                          {event.event_data.text || event.event_data.transcript}
                        </div>
                      )}
                      {event.event_type === 'tool_call' && (
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            Tool: {event.event_data.tool_name || event.event_data.name}
                          </div>
                          <pre className="text-xs bg-background/50 p-2 rounded overflow-x-auto">
                            {JSON.stringify(event.event_data.parameters || event.event_data.arguments, null, 2)}
                          </pre>
                        </div>
                      )}
                      {event.event_type === 'tool_response' && (
                        <div className="text-sm">
                          <span className="font-medium">Response: </span>
                          {event.event_data.result || event.event_data.output}
                        </div>
                      )}
                      {(event.event_type === 'session_start' || event.event_type === 'session_end') && (
                        <div className="text-sm font-medium">
                          {event.event_type === 'session_start' ? '🟢 Session Started' : '🔴 Session Ended'}
                        </div>
                      )}
                    </div>

                    {/* Conversation ID */}
                    <div className="text-xs font-mono text-muted-foreground mt-2 opacity-50">
                      {event.conversation_id}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {filteredEvents.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-12">
                  No events to display
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
