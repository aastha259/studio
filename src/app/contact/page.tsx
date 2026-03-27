
"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { ChefHat, ArrowLeft, Send, MessageSquare, Mail, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const db = useFirestore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

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
        status: 'open',
        createdAt: serverTimestamp()
      });

      toast.success("Your query has been submitted. We'll get back to you soon!", { id: contactToast });
      setFormData({ name: '', email: '', message: '' });
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

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="flex flex-col items-center text-center space-y-6 mb-12">
          <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary">
            <MessageSquare className="w-10 h-10" />
          </div>
          <h1 className="text-5xl font-headline font-black tracking-tight text-foreground">Contact Support</h1>
          <p className="text-lg text-muted-foreground font-medium max-w-lg">
            Have a question about your order or our flavors? Send us a message and our concierge team will assist you.
          </p>
        </div>

        <Card className="rounded-[3rem] border-none shadow-2xl overflow-hidden bg-white">
          <CardHeader className="bg-primary p-10 text-white text-center">
            <CardTitle className="text-3xl font-headline font-black">Send a Message</CardTitle>
            <p className="text-white/70 font-bold mt-2">Expect a response within 2-4 business hours</p>
          </CardHeader>
          <CardContent className="p-10 md:p-16">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                  className="min-h-[200px] p-6 rounded-[2rem] bg-muted/30 border-none focus-visible:ring-primary/20 text-lg transition-all"
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

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
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
