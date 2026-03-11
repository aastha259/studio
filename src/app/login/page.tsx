"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChefHat, Mail, Lock, Chrome, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/lib/contexts/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (role: 'user' | 'admin') => {
    login(email || 'user@example.com', role);
    if (role === 'admin') router.push('/admin');
    else router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="grid grid-cols-12 gap-4 h-full w-full rotate-12 scale-150">
          {Array.from({ length: 48 }).map((_, i) => (
            <ChefHat key={i} className="w-12 h-12" />
          ))}
        </div>
      </div>

      <Card className="w-full max-w-md shadow-2xl relative z-10 border-none rounded-3xl overflow-hidden">
        <CardHeader className="bg-primary text-white p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ChefHat className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-3xl font-headline font-black">Welcome Back</CardTitle>
          <p className="text-white/80 mt-2">Log in to your Bhartiya Swad account</p>
        </CardHeader>
        <CardContent className="p-8">
          <Tabs defaultValue="user" className="w-full">
            <TabsList className="grid grid-cols-2 mb-8 p-1 bg-muted rounded-xl">
              <TabsTrigger value="user" className="rounded-lg font-bold">User Login</TabsTrigger>
              <TabsTrigger value="admin" className="rounded-lg font-bold">Admin Login</TabsTrigger>
            </TabsList>
            
            <TabsContent value="user">
              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <Input 
                    placeholder="Email Address" 
                    className="pl-10 h-12 rounded-xl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <Input 
                    type="password" 
                    placeholder="Password" 
                    className="pl-10 h-12 rounded-xl"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button 
                  className="w-full h-12 bg-primary hover:bg-primary/90 rounded-xl font-bold text-lg"
                  onClick={() => handleLogin('user')}
                >
                  Sign In
                </Button>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or continue with</span></div>
                </div>
                <Button variant="outline" className="w-full h-12 rounded-xl border-2 font-bold group">
                  <Chrome className="w-5 h-5 mr-2 group-hover:text-primary transition-colors" />
                  Google
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="admin">
              <div className="space-y-4">
                <div className="bg-accent/10 border border-accent/20 p-4 rounded-xl flex items-start gap-3 mb-4">
                  <Shield className="w-5 h-5 text-accent mt-0.5" />
                  <p className="text-sm text-accent-foreground">
                    Admin access is restricted to authorized personnel only. Please enter your secure credentials.
                  </p>
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <Input 
                    placeholder="Admin Email" 
                    className="pl-10 h-12 rounded-xl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <Input 
                    type="password" 
                    placeholder="Security Token" 
                    className="pl-10 h-12 rounded-xl"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button 
                  className="w-full h-12 bg-accent hover:bg-accent/90 rounded-xl font-bold text-lg"
                  onClick={() => handleLogin('admin')}
                >
                  Admin Access
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="p-8 pt-0 text-center justify-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account? <Link href="/login" className="text-primary font-bold hover:underline">Create one</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}