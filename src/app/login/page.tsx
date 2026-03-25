
"use client"

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChefHat, Mail, Lock, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth as useFirebaseService, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

import { 
  Tabs as TabsUI, 
  TabsList as TabsListUI, 
  TabsTrigger as TabsTriggerUI, 
  TabsContent as TabsContentUI 
} from '@/components/ui/tabs';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useFirebaseService();
  const db = useFirestore();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const handleLogin = async (role: 'user' | 'admin') => {
    if (!email || !email.trim()) {
      toast({ variant: "destructive", title: "Email Required", description: "Please enter your email address." });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({ variant: "destructive", title: "Invalid Email", description: "Please enter a valid email address." });
      return;
    }

    if (!password || password.length < 6) {
      toast({ variant: "destructive", title: "Password Required", description: "Please enter your password (min 6 chars)." });
      return;
    }

    setLoading(true);
    try {
      if (role === 'admin') {
        if (email === 'xyz@admin.com' && password === 'admin@123') {
          let userCredential;
          try {
            userCredential = await signInWithEmailAndPassword(auth, email, password);
          } catch (err: any) {
            if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
              userCredential = await createUserWithEmailAndPassword(auth, email, password);
            } else {
              throw err;
            }
          }

          if (typeof window !== 'undefined') localStorage.setItem('bhartiya_swad_admin', 'true');

          await setDoc(doc(db, 'admin_roles', userCredential.user.uid), {
            email: userCredential.user.email,
            role: 'admin',
            updatedAt: new Date().toISOString()
          }, { merge: true });

          await setDoc(doc(db, 'users', userCredential.user.uid), {
            id: userCredential.user.uid,
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            name: 'System Administrator',
            displayName: 'System Administrator',
            role: 'admin',
            totalOrders: 0,
            totalSpent: 0,
            lastLogin: serverTimestamp()
          }, { merge: true });
          
          toast({ title: "Admin Access Granted", description: "Welcome to the management console." });
          router.push('/admin/dashboard');
        } else {
          toast({ variant: "destructive", title: "Access Denied", description: "Invalid admin email or password." });
        }
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userRef = doc(db, 'users', userCredential.user.uid);
        
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
          await setDoc(userRef, {
            id: userCredential.user.uid,
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            name: userCredential.user.displayName || email.split('@')[0],
            displayName: userCredential.user.displayName || email.split('@')[0],
            role: 'user',
            totalOrders: 0,
            totalSpent: 0,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp()
          });
        } else {
          await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
        }

        toast({ title: "Login Successful", description: "Welcome back to Bhartiya Swad." });
        router.push(callbackUrl);
      }
    } catch (error: any) {
      console.error(error);
      let message = "An unexpected error occurred.";
      if (error.code === 'auth/operation-not-allowed') {
        message = "Login provider not enabled. Please enable Email/Password in Firebase Console.";
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = "Invalid email or password.";
      }
      toast({ variant: "destructive", title: "Login Failed", description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl relative z-10 border-none rounded-[2.5rem] overflow-hidden bg-white">
      <CardHeader className="bg-primary text-white p-10 text-center">
        <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl backdrop-blur-md">
          <ChefHat className="w-12 h-12 text-white" />
        </div>
        <CardTitle className="text-4xl font-headline font-black tracking-tight">Welcome Back</CardTitle>
        <p className="text-white/80 mt-2 font-medium">Log in to savor authentic flavors</p>
      </CardHeader>
      <CardContent className="p-10">
        <TabsUI defaultValue="user" className="w-full">
          <TabsListUI className="grid grid-cols-2 mb-8 p-1 bg-muted rounded-2xl h-12">
            <TabsTriggerUI value="user" className="rounded-xl font-bold transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm">User</TabsTriggerUI>
            <TabsTriggerUI value="admin" className="rounded-xl font-bold transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm">Admin</TabsTriggerUI>
          </TabsListUI>
          
          <TabsContentUI value="user" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input 
                    placeholder="name@example.com" 
                    className="pl-12 h-14 rounded-2xl bg-muted/30 border-none focus-visible:ring-primary/20"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-12 h-14 rounded-2xl bg-muted/30 border-none focus-visible:ring-primary/20"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                className="w-full h-14 bg-primary hover:bg-primary/90 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 transition-all active:scale-95 group"
                onClick={() => handleLogin('user')}
                disabled={loading}
              >
                {loading ? "Verifying..." : (
                  <span className="flex items-center gap-2">
                    Sign In <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </div>
          </TabsContentUI>

          <TabsContentUI value="admin" className="space-y-6">
            <div className="bg-foreground border border-accent/30 p-5 rounded-2xl flex items-start gap-4 mb-2 shadow-sm">
              <Shield className="w-6 h-6 text-accent mt-0.5" />
              <p className="text-xs text-white font-black leading-relaxed">
                Management console is restricted. Please use your authorized system credentials to proceed.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Admin Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input 
                    placeholder="admin@bhartiyaswad.com" 
                    className="pl-12 h-14 rounded-2xl bg-muted/30 border-none focus-visible:ring-primary/20"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Admin Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-12 h-14 rounded-2xl bg-muted/30 border-none focus-visible:ring-primary/20"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                className="w-full h-14 bg-accent hover:bg-accent/90 rounded-2xl font-black text-lg shadow-xl shadow-accent/20 transition-all active:scale-95"
                onClick={() => handleLogin('admin')}
                disabled={loading}
              >
                {loading ? "Authenticating..." : "System Login"}
              </Button>
            </div>
          </TabsContentUI>
        </TabsUI>
      </CardContent>
      <CardFooter className="p-10 pt-0 text-center justify-center border-t border-dashed mt-4">
        <p className="text-sm text-muted-foreground font-medium mt-6">
          New to the taste? <Link href="/signup" className="text-primary font-black hover:underline underline-offset-4">Create an Account</Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden" suppressHydrationWarning>
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="grid grid-cols-12 gap-4 h-full w-full rotate-12 scale-150">
          {Array.from({ length: 48 }).map((_, i) => (
            <ChefHat key={i} className="w-12 h-12" />
          ))}
        </div>
      </div>

      <Suspense fallback={<div className="text-primary font-black text-2xl animate-pulse font-headline">Bhartiya Swad...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
