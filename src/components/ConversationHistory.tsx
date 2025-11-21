import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { MessageSquare, Trash2, Clock, User, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

interface ConversationGroup {
  conversation_id: string;
  messages: any[];
  first_message_time: string;
}

const ConversationHistory = () => {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<ConversationGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data, error } = await supabase
        .from('conversation_history')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group messages by conversation_id
      const grouped = (data || []).reduce((acc: Record<string, any[]>, msg) => {
        if (!acc[msg.conversation_id]) {
          acc[msg.conversation_id] = [];
        }
        acc[msg.conversation_id].push(msg);
        return acc;
      }, {});

      // Convert to array and sort by first message time
      const conversationGroups: ConversationGroup[] = Object.entries(grouped).map(([id, messages]) => ({
        conversation_id: id,
        messages: messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
        first_message_time: messages[0]?.created_at || new Date().toISOString()
      })).sort((a, b) => new Date(b.first_message_time).getTime() - new Date(a.first_message_time).getTime());

      setConversations(conversationGroups);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast({
        title: "Error",
        description: "Failed to load conversation history",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { error } = await supabase
        .from('conversation_history')
        .delete()
        .eq('user_id', session.user.id)
        .eq('conversation_id', conversationId);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Conversation deleted successfully"
      });

      fetchConversations();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive"
      });
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-kaeva-sage border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <Card className="p-8 text-center bg-kaeva-void/50 border-kaeva-sage/20">
        <MessageSquare className="w-12 h-12 mx-auto mb-4 text-kaeva-sage/40" />
        <p className="text-kaeva-slate-400">No conversation history yet</p>
        <p className="text-sm text-kaeva-slate-500 mt-2">
          Start a conversation with Kaeva to see your history here
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-kaeva-sage flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        Conversation History
      </h3>

      <ScrollArea className="h-[600px] pr-4">
        <div className="space-y-3">
          {conversations.map((conv) => (
            <Card
              key={conv.conversation_id}
              className="bg-kaeva-void/50 border-kaeva-sage/20 overflow-hidden"
            >
              <div
                className="p-4 cursor-pointer hover:bg-kaeva-sage/5 transition-colors"
                onClick={() => setExpandedId(expandedId === conv.conversation_id ? null : conv.conversation_id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-kaeva-sage/60" />
                    <span className="text-sm text-kaeva-slate-300">
                      {formatTime(conv.first_message_time)}
                    </span>
                    <span className="text-xs text-kaeva-slate-500">
                      {conv.messages.length} messages
                    </span>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-kaeva-void border-kaeva-sage/30">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-kaeva-sage">
                          Delete Conversation
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-kaeva-slate-400">
                          Are you sure you want to delete this conversation? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-kaeva-sage/10 border-kaeva-sage/30 text-kaeva-sage hover:bg-kaeva-sage/20">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteConversation(conv.conversation_id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {/* First message preview */}
                <div className="mt-2 text-sm text-kaeva-slate-400 line-clamp-1">
                  {conv.messages[0]?.message || ""}
                </div>
              </div>

              {/* Expanded messages */}
              <AnimatePresence>
                {expandedId === conv.conversation_id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-kaeva-sage/20"
                  >
                    <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                      {conv.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`flex gap-2 max-w-[80%] ${
                              msg.role === "user" ? "flex-row-reverse" : "flex-row"
                            }`}
                          >
                            <div
                              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                msg.role === "user"
                                  ? "bg-kaeva-sage/20"
                                  : "bg-kaeva-teal/20"
                              }`}
                            >
                              {msg.role === "user" ? (
                                <User className="w-4 h-4 text-kaeva-sage" />
                              ) : (
                                <Bot className="w-4 h-4 text-kaeva-teal" />
                              )}
                            </div>
                            <div
                              className={`rounded-lg px-4 py-2 ${
                                msg.role === "user"
                                  ? "bg-kaeva-sage/10 border border-kaeva-sage/20"
                                  : "bg-kaeva-teal/10 border border-kaeva-teal/20"
                              }`}
                            >
                              <p className="text-sm text-kaeva-slate-200">{msg.message}</p>
                              <p className="text-xs text-kaeva-slate-500 mt-1">
                                {new Date(msg.created_at).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ConversationHistory;
