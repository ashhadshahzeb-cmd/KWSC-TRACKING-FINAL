import { useState, useEffect, useCallback } from "react";
import { Bell, BellRing, Check, Trash2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuHeader,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Standard notification type
interface Notification {
  id: string;
  created_at: string;
  recipient_role: string;
  title: string;
  message: string;
  is_read: boolean;
  file_id: string;
  diary_no: string;
  from_user: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { userRole, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  // Audio for notification - using a public CDN for a pleasant ding
  const playPing = useCallback(() => {
    try {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audio.volume = 0.5;
      audio.play().catch(e => console.log("Audio play blocked by browser", e));
    } catch (err) {
      console.error("Failed to play notification sound", err);
    }
  }, []);

  const fetchNotifications = async () => {
    if (!userRole && !isAdmin) return;
    
    // If admin, they see everything? Or just for 'cfo' role?
    // Usually, admin/cfo role sees notifications marked to 'cfo'
    const roleToFetch = isAdmin ? 'cfo' : userRole;
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_role', roleToFetch)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching notifications:", error);
    } else {
      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Subscribe to real-time changes
    const roleToWatch = isAdmin ? 'cfo' : userRole;
    if (!roleToWatch) return;

    const channel = supabase
      .channel('notifications-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_role=eq.${roleToWatch}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications(prev => [newNotif, ...prev].slice(0, 20));
          setUnreadCount(prev => prev + 1);
          
          // Show toast and play sound
          toast.info(newNotif.title, {
            description: newNotif.message,
            action: {
              label: "View",
              onClick: () => {
                markAsRead(newNotif.id);
                navigate('/book-section/file-tracking?tab=tray');
              },
            },
          });
          playPing();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userRole, isAdmin, playPing]);

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (!error) {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    const roleToUpdate = isAdmin ? 'cfo' : userRole;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_role', roleToUpdate)
      .eq('is_read', false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== id));
      // Re-fetch unread count is safer if the deleted one was unread
      fetchNotifications();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-[#0ea5e9]/10 transition-colors">
          {unreadCount > 0 ? (
            <BellRing className="w-5 h-5 text-[#0ea5e9] animate-bounce" />
          ) : (
            <Bell className="w-5 h-5 text-muted-foreground" />
          )}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-lg ring-2 ring-background">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden border-none shadow-2xl rounded-2xl glass-card">
        <div className="p-4 border-b border-border/50 bg-gradient-to-r from-[#0ea5e9]/10 to-transparent flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold tracking-tight">System Alerts</h3>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Department Notifications</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-7 text-[10px] gap-1 hover:bg-[#0ea5e9]/10 text-[#0ea5e9]">
              <Check className="w-3 h-3" /> Mark All Read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[350px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 text-muted-foreground/30" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">All caught up!</p>
              <p className="text-[10px] text-muted-foreground/60 uppercase">No new alerts for your section</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    markAsRead(n.id);
                    navigate('/book-section/file-tracking?tab=tray');
                  }}
                  className={cn(
                    "p-4 cursor-pointer transition-colors hover:bg-[#0ea5e9]/5 flex gap-3 group relative",
                    !n.is_read && "bg-[#0ea5e9]/5"
                  )}
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-1.5 shrink-0 transition-transform",
                    !n.is_read ? "bg-[#0ea5e9] scale-100" : "bg-transparent scale-0"
                  )} />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-[#0ea5e9]">{n.from_user}</p>
                      <span className="text-[9px] text-muted-foreground font-mono">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <h4 className="text-xs font-black tracking-tight leading-none">{n.title}</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 italic">
                      "{n.message}"
                    </p>
                    <div className="pt-2 flex items-center gap-2">
                      <Badge variant="outline" className="text-[9px] px-1.5 h-4 bg-background/50 border-[#0ea5e9]/20 text-[#0ea5e9]">
                        {n.diary_no}
                      </Badge>
                      <div className="flex-1" />
                      <button 
                        onClick={(e) => deleteNotification(n.id, e)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-rose-500/10 rounded text-rose-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-2 border-t border-border/50 bg-muted/5">
          <Button 
            variant="ghost" 
            className="w-full h-8 text-[10px] uppercase font-bold tracking-widest text-muted-foreground hover:text-[#0ea5e9] gap-2"
            onClick={() => navigate('/book-section/file-tracking?tab=tray')}
          >
            <ExternalLink className="w-3 h-3" /> View All Tracking Records
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
