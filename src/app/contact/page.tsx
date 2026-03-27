
"use client"

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChefHat, ArrowLeft, Send, MessageSquare, Mail, User, Loader2, Clock, CheckCircle2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { useAuth } from '@/lib/contexts/auth-context';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function ContactPage() {
  const db = useFirestore();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    message: ''
  });

  // Fetch user's previous inquiries
  const ticketsQuery = useMemoFirebase(() => {
    if (!user?.uid) return null;
    return query(
      collection(db, 'supportTickets'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [db, user?.uid]);

  const { data: myTickets, isLoading: ticketsLoading } = useCollection(ticketsQuery);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);
    const contactToast = toast.loading("Sending your query...");

    try {
      await addDoc(collection(db, 'supportTickets'), {
        ...formData,
        userId: user?.uid || null,
        status: 'open',
        replies: [],
        createdAt: serverTimestamp()
      });

      toast.success("Your query has been submitted. We'll get back to you soon!", { id: contactToast });
      setFormData(prev => ({ ...prev, message: '' }));
    } catch (err: any) {
      console.error("Support submission error:", err);
      toast.error("Failed to send message. Please try again.", { id: contactToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] animate-in fade-in duration-500">
      <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-xl border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <ChefHat className="text-white w-6 h-6" />
            </div>
            <span className="font-headline text-2xl font-black text-foreground">Bhartiya Swad</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="font-bold gap-2 rounded-xl">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-16 space-y-24">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary">
            <MessageSquare className="w-10 h-10" />
          </div>
          <h1 className="text-5xl font-headline font-black tracking-tight text-foreground">Support Intelligence</h1>
          <p className="text-lg text-muted-foreground font-medium max-w-lg">
            Have a question about your order or our flavors? Send us a message and our concierge team will assist you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Submission Form */}
          <Card className="rounded-[3rem] border-none shadow-2xl overflow-hidden bg-white">
            <CardHeader className="bg-primary p-10 text-white">
              <CardTitle className="text-3xl font-headline font-black">Send a Message</CardTitle>
              <p className="text-white/70 font-bold mt-2">Expect a response within 2-4 business hours</p>
            </CardHeader>
            <CardContent className="p-10">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input 
                        id="name" 
                        placeholder="Arjun Sharma" 
                        className="pl-12 h-14 rounded-2xl bg-muted/30 border-none focus-visible:ring-primary/20 transition-all"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input 
                        id="email" 
                        type="email"
                        placeholder="arjun@example.com" 
                        className="pl-12 h-14 rounded-2xl bg-muted/30 border-none focus-visible:ring-primary/20 transition-all"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">How can we help?</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Tell us about your concern..." 
                    className="min-h-[150px] p-6 rounded-[2rem] bg-muted/30 border-none focus-visible:ring-primary/20 text-lg transition-all"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    disabled={loading}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-16 bg-primary hover:bg-primary/90 rounded-3xl font-black text-xl shadow-xl shadow-primary/20 transition-all active:scale-95 group"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin" /> <span>Sending...</span>
                    </div>
                  ) : (
                    <span className="flex items-center gap-3">
                      Submit Query <Send className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* User Inquiry History */}
          <div className="space-y-8">
            <h2 className="text-3xl font-headline font-black flex items-center gap-3">
              <Clock className="w-8 h-8 text-primary" />
              Your Inquiries
            </h2>
            
            {user ? (
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-6">
                  {myTickets && myTickets.length > 0 ? (
                    myTickets.map((ticket) => (
                      <Card key={ticket.id} className="rounded-[2rem] border shadow-sm bg-white overflow-hidden">
                        <div className="p-6 border-b bg-muted/10 flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Inquiry ID</span>
                            <span className="font-mono text-[10px] font-bold text-primary">#{ticket.id.slice(0, 12).toUpperCase()}</span>
                          </div>
                          <Badge className={cn(
                            "rounded-full px-3 py-1 font-black text-[10px] uppercase tracking-wider border-none",
                            ticket.status === 'resolved' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                          )}>
                            {ticket.status || 'OPEN'}
                          </Badge>
                        </div>
                        <div className="p-6 space-y-6">
                          <div className="bg-muted/20 p-4 rounded-2xl text-sm italic border">
                            "{ticket.message}"
                          </div>

                          {ticket.replies && ticket.replies.length > 0 && (
                            <div className="space-y-4 pt-4 border-t border-dashed">
                              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Response Log</p>
                              {ticket.replies.map((reply: any, i: number) => (
                                <div key={i} className={cn(
                                  "flex flex-col gap-1.5",
                                  reply.sender === 'admin' ? "items-start" : "items-end"
                                )}>
                                  <div className={cn(
                                    "p-4 rounded-2xl text-sm max-w-[90%] shadow-sm",
                                    reply.sender === 'admin' 
                                      ? "bg-primary text-white rounded-tl-none" 
                                      : "bg-muted rounded-tr-none border"
                                  )}>
                                    <p className={cn(
                                      "font-black text-[9px] uppercase mb-1 tracking-tighter",
                                      reply.sender === 'admin' ? "text-white/70" : "text-muted-foreground"
                                    )}>
                                      {reply.sender === 'admin' ? "Concierge Support" : "You"}
                                    </p>
                                    {reply.text}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-20 bg-muted/10 rounded-[2rem] border border-dashed flex flex-col items-center gap-4 opacity-40">
                      <MessageSquare className="w-12 h-12" />
                      <p className="font-bold italic">No inquiry history found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            ) : (
              <div className="bg-primary/5 p-10 rounded-[2rem] border border-dashed border-primary/20 text-center space-y-4">
                <p className="font-bold text-muted-foreground">Sign in to track your inquiries and view responses from our team.</p>
                <Link href="/login?callbackUrl=/contact">
                  <Button className="rounded-xl font-black bg-primary">Login to View History</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-center pt-12 border-t">
          <div className="p-8 space-y-3">
            <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto text-accent mb-4">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg">Direct Email</h3>
            <p className="text-sm text-muted-foreground">support@bhartiyaswad.com</p>
          </div>
          <div className="p-8 space-y-3">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mx-auto text-green-600 mb-4">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg">Live Chat</h3>
            <p className="text-sm text-muted-foreground">Available 9 AM - 11 PM</p>
          </div>
          <div className="p-8 space-y-3">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary mb-4">
              <ChefHat className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg">Corporate</h3>
            <p className="text-sm text-muted-foreground">Headquarters, Mumbai, Bharat</p>
          </div>
        </div>
      </main>
    </div>
  );
}
