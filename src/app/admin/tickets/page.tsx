
"use client"

import React, { useMemo } from 'react';
import { MessageSquare, Clock, User, Mail, Search, CheckCircle2, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminTicketsPage() {
  const db = useFirestore();

  const ticketsQuery = useMemoFirebase(() => {
    return query(collection(db, 'supportTickets'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: tickets, isLoading } = useCollection(ticketsQuery);

  const handleResolve = async (id: string) => {
    try {
      await updateDoc(doc(db, 'supportTickets', id), { status: 'resolved' });
      toast.success("Ticket marked as resolved");
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this inquiry?")) return;
    try {
      await deleteDoc(doc(db, 'supportTickets', id));
      toast.success("Inquiry removed");
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div>
        <h1 className="text-4xl font-headline font-black mb-2 flex items-center gap-3 text-foreground">
          <MessageSquare className="w-10 h-10 text-primary" />
          Support Intelligence
        </h1>
        <p className="text-muted-foreground font-medium">Manage incoming customer queries and complaints.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="border shadow-sm rounded-[2rem] bg-white p-8">
          <div className="flex justify-between items-start mb-4">
            <div className="p-4 rounded-2xl bg-primary/10 text-primary">
              <MessageSquare className="w-6 h-6" />
            </div>
            <Badge className="bg-green-100 text-green-700 border-none rounded-full px-3 py-1 font-bold">LIVE</Badge>
          </div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Inquiries</p>
          <h3 className="text-4xl font-black mt-2 tracking-tight">{tickets?.length || 0}</h3>
        </Card>
        
        <Card className="border shadow-sm rounded-[2rem] bg-white p-8">
          <div className="flex justify-between items-start mb-4">
            <div className="p-4 rounded-2xl bg-orange-100 text-orange-600">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Pending Response</p>
          <h3 className="text-4xl font-black mt-2 tracking-tight">
            {tickets?.filter(t => t.status === 'open').length || 0}
          </h3>
        </Card>

        <Card className="border shadow-sm rounded-[2rem] bg-white p-8">
          <div className="flex justify-between items-start mb-4">
            <div className="p-4 rounded-2xl bg-green-100 text-green-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Resolved Today</p>
          <h3 className="text-4xl font-black mt-2 tracking-tight">
            {tickets?.filter(t => t.status === 'resolved').length || 0}
          </h3>
        </Card>
      </div>

      <Card className="border shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="font-black px-10 h-20 uppercase tracking-widest text-[10px]">Customer</TableHead>
                <TableHead className="font-black h-20 uppercase tracking-widest text-[10px]">Inquiry Details</TableHead>
                <TableHead className="font-black h-20 uppercase tracking-widest text-[10px]">Status</TableHead>
                <TableHead className="font-black h-20 uppercase tracking-widest text-[10px] text-right pr-10">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets?.map((ticket) => (
                <TableRow key={ticket.id} className="hover:bg-muted/5 transition-colors border-b last:border-none group">
                  <TableCell className="px-10 py-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-black text-foreground truncate">{ticket.name}</span>
                        <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {ticket.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground line-clamp-2">{ticket.message}</p>
                      <p className="text-[10px] text-muted-foreground font-bold italic">
                        {ticket.createdAt ? format(ticket.createdAt.toDate ? ticket.createdAt.toDate() : new Date(ticket.createdAt), 'MMM dd, p') : 'Just now'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "rounded-full px-4 py-1.5 font-black text-[10px] uppercase tracking-wider border-none",
                      ticket.status === 'resolved' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                    )}>
                      {ticket.status?.toUpperCase() || 'OPEN'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-10">
                    <div className="flex items-center justify-end gap-2">
                      {ticket.status !== 'resolved' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-xl font-bold border-green-200 text-green-600 hover:bg-green-50"
                          onClick={() => handleResolve(ticket.id)}
                        >
                          Resolve
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-xl text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(ticket.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {tickets?.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-24">
                    <div className="flex flex-col items-center opacity-30">
                      <MessageSquare className="w-20 h-20 mb-4" />
                      <p className="text-xl font-black italic">No support inquiries yet</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
