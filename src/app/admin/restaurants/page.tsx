
"use client"

import React, { useState, useMemo } from 'react';
import { 
  Store, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Utensils, 
  Star, 
  Phone, 
  MapPin, 
  Loader2,
  AlertCircle,
  Building2,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardDescription
} from '@/components/ui/card';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useAuth } from '@/lib/contexts/auth-context';
import { collection, doc, addDoc, updateDoc, deleteDoc, query, where, getDocs, serverTimestamp, arrayRemove } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function AdminPartnersPage() {
  const db = useFirestore();
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingPartner, setEditingPartner] = useState<any>(null);
  const [viewingMenu, setViewingMenu] = useState<any>(null);

  const isAuthorized = user?.isAdmin && user.email === 'pqr@admin.com';

  const partnersQuery = useMemoFirebase(() => {
    if (!isAuthorized) return null;
    return collection(db, 'partners');
  }, [db, isAuthorized]);
  const { data: partners, isLoading, error: partnersError } = useCollection(partnersQuery);

  const dishesQuery = useMemoFirebase(() => {
    if (!isAuthorized) return null;
    return collection(db, 'dishes');
  }, [db, isAuthorized]);
  const { data: allDishes } = useCollection(dishesQuery);

  const filteredPartners = useMemo(() => {
    const queryStr = search.toLowerCase().trim();
    return partners?.filter(p => 
      p.name?.toLowerCase().includes(queryStr) ||
      p.restaurantName?.toLowerCase().includes(queryStr) ||
      p.city?.toLowerCase().includes(queryStr)
    ) || [];
  }, [partners, search]);

  const handleSavePartner = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    
    const partnerData = {
      name: formData.get('name') as string,
      restaurantName: formData.get('restaurantName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      status: formData.get('status') as string,
      image: formData.get('image') as string || `https://picsum.photos/seed/partner-${Date.now()}/600/400`,
      updatedAt: serverTimestamp()
    };

    try {
      if (editingPartner) {
        await updateDoc(doc(db, 'partners', editingPartner.id), partnerData);
        toast({ title: "Partner Updated", description: "The partner record has been successfully refreshed." });
        setEditingPartner(null);
      } else {
        await addDoc(collection(db, 'partners'), {
          ...partnerData,
          createdAt: serverTimestamp()
        });
        toast({ title: "Partner Onboarded", description: "New location added to the network." });
        setIsAddOpen(false);
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Action Failed", description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePartner = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently remove "${name}"? This will also unbind them from all linked dishes.`)) return;
    
    const loadingToast = toast({ title: "Processing Removal", description: "Cleaning up dish associations..." });
    
    try {
      // 1. Find all dishes linked to this partner
      const q = query(collection(db, 'dishes'), where('partnerIds', 'array-contains', id));
      const dishSnap = await getDocs(q);
      
      const updatePromises = dishSnap.docs.map(dishDoc => {
        const dishData = dishDoc.data();
        const updatedPartnerNames = (dishData.partnerNames || []).filter((n: string, i: number) => {
           return dishData.partnerIds[i] !== id;
        });

        return updateDoc(doc(db, 'dishes', dishDoc.id), {
          partnerIds: arrayRemove(id),
          partnerNames: updatedPartnerNames
        });
      });

      await Promise.all(updatePromises);
      
      // 2. Delete the partner record
      await deleteDoc(doc(db, 'partners', id));
      
      toast({ title: "Partner Removed", description: "Network record and all associations cleared." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Cleanup Error", description: err.message });
    }
  };

  if (!isAuthorized) return <div className="p-20 text-center font-black opacity-20">UNAUTHORIZED ACCESS</div>;

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-headline font-black mb-2 flex items-center gap-3">
            <Store className="w-10 h-10 text-primary" />
            Partner Network
          </h1>
          <p className="text-muted-foreground font-medium">Manage and audit your restaurant partner locations.</p>
        </div>
        
        <Dialog open={isAddOpen || !!editingPartner} onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false);
            setEditingPartner(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddOpen(true)} className="h-14 px-8 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 gap-2 text-lg">
              <Plus className="w-6 h-6" />
              Onboard Partner
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] rounded-[2rem]">
            <DialogHeader>
              <DialogTitle className="text-3xl font-headline font-black text-primary">
                {editingPartner ? 'Edit Partner Records' : 'New Restaurant Partner'}
              </DialogTitle>
              <DialogDescription>
                Fill in the restaurant details to onboard or update a partner location in the network.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSavePartner} className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="restaurantName" className="font-bold">Restaurant Name</Label>
                  <Input id="restaurantName" name="restaurantName" defaultValue={editingPartner?.restaurantName} required placeholder="e.g. Royal Punjab" className="rounded-xl h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-bold">Manager Name</Label>
                  <Input id="name" name="name" defaultValue={editingPartner?.name} required placeholder="Arjun Sharma" className="rounded-xl h-12" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-bold">Business Email</Label>
                  <Input id="email" name="email" type="email" defaultValue={editingPartner?.email} required placeholder="contact@royalpunjab.com" className="rounded-xl h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-bold">Phone Number</Label>
                  <Input id="phone" name="phone" defaultValue={editingPartner?.phone} required placeholder="+91 ..." className="rounded-xl h-12" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="font-bold">City</Label>
                  <Input id="city" name="city" defaultValue={editingPartner?.city} required placeholder="Mumbai" className="rounded-xl h-12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="font-bold">Operational Status</Label>
                  <select name="status" defaultValue={editingPartner?.status || 'active'} className="w-full h-12 px-3 border rounded-xl bg-white text-sm focus:ring-primary/20">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="font-bold">Full Address</Label>
                <Input id="address" name="address" defaultValue={editingPartner?.address} required placeholder="Unit 42, Bharat Plaza..." className="rounded-xl h-12" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image" className="font-bold">Logo/Image URL</Label>
                <Input id="image" name="image" defaultValue={editingPartner?.image} placeholder="https://..." className="rounded-xl h-12" />
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isSaving} className="w-full h-14 rounded-2xl font-black bg-primary text-lg shadow-lg">
                  {isSaving ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : null}
                  {editingPartner ? 'Save Changes' : 'Finalize Onboarding'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {partnersError && (
        <div className="bg-destructive/10 text-destructive p-6 rounded-3xl flex items-center gap-4 border border-destructive/20">
          <AlertCircle className="w-6 h-6" />
          <p className="font-bold">Error syncing partner network: {partnersError.message}</p>
        </div>
      )}

      <div className="relative w-full max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input 
          placeholder="Search by restaurant or city..." 
          className="pl-12 h-14 bg-white rounded-2xl shadow-sm border-none ring-1 ring-primary/10 focus-visible:ring-primary transition-all text-lg"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="font-black px-10 h-20 uppercase tracking-widest text-[10px]">Restaurant Partner</TableHead>
                <TableHead className="font-black h-20 uppercase tracking-widest text-[10px]">Location</TableHead>
                <TableHead className="font-black h-20 uppercase tracking-widest text-[10px] text-center">Status</TableHead>
                <TableHead className="font-black h-20 uppercase tracking-widest text-[10px] text-right pr-10">Management</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPartners.map((res) => {
                const restaurantMenu = allDishes?.filter(f => f.partnerIds?.includes(res.id)) || [];
                
                return (
                  <TableRow key={res.id} className="hover:bg-muted/5 transition-colors border-b last:border-none group">
                    <TableCell className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl border-2 border-primary/10 shadow-md overflow-hidden bg-muted">
                          <img src={res.image} className="object-cover w-full h-full" alt={res.name} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-lg text-foreground leading-tight">{res.restaurantName}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 font-bold">
                            <Building2 className="w-3 h-3" /> MGR: {res.name}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 max-w-[200px]">
                        <span className="text-sm font-black text-foreground">{res.city}</span>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                          <MapPin className="w-3 h-3 text-primary shrink-0" />
                          <span className="truncate">{res.address}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(
                        "rounded-full font-black px-3 py-1 gap-1 border-none",
                        res.status === 'active' ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                      )}>
                        {res.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {res.status?.toUpperCase() || 'UNKNOWN'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-10">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-xl font-bold border-primary/20 text-primary hover:bg-primary hover:text-white"
                          onClick={() => setViewingMenu(res)}
                        >
                          <Utensils className="w-4 h-4 mr-2" />
                          Linked Dishes ({restaurantMenu.length})
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-xl text-muted-foreground hover:text-primary transition-all active:scale-90"
                          onClick={() => setEditingPartner(res)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-xl text-muted-foreground hover:text-destructive transition-all active:scale-90"
                          onClick={() => handleDeletePartner(res.id, res.restaurantName)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredPartners.length === 0 && !isLoading && !partnersError && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-24">
                    <div className="flex flex-col items-center opacity-30">
                      <Store className="w-20 h-20 mb-4" />
                      <p className="text-xl font-black italic">No partners found matching "{search}"</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-24">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={!!viewingMenu} onOpenChange={() => setViewingMenu(null)}>
        <DialogContent className="sm:max-w-[800px] rounded-[2.5rem] p-0 overflow-hidden border-none max-h-[85vh] flex flex-col">
          <div className="bg-primary p-10 text-white relative">
            <div className="flex items-center gap-6">
              <div className="h-24 w-24 rounded-3xl border-4 border-white/20 shadow-2xl overflow-hidden bg-white/10">
                <img src={viewingMenu?.image} className="object-cover w-full h-full" alt={viewingMenu?.restaurantName} />
              </div>
              <div>
                <DialogTitle className="text-4xl font-headline font-black leading-tight">{viewingMenu?.restaurantName}</DialogTitle>
                <DialogDescription className="text-white/70 font-bold flex items-center gap-2 mt-1 uppercase tracking-widest text-xs">
                  <MapPin className="w-4 h-4" /> {viewingMenu?.city}, Bharat
                </DialogDescription>
              </div>
            </div>
          </div>
          
          <div className="flex-1 p-10 overflow-y-auto bg-offwhite/50">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="text-xl font-headline font-black text-foreground">Fulfillment Catalog</h3>
                <Badge variant="outline" className="rounded-full px-4 py-1 font-black">
                  {allDishes?.filter(f => f.partnerIds?.includes(viewingMenu?.id)).length || 0} ITEMS ACTIVE
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allDishes?.filter(f => f.partnerIds?.includes(viewingMenu?.id)).map((food) => (
                  <div key={food.id} className="bg-white border p-4 rounded-2xl flex items-center justify-between group hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted border shadow-sm">
                        <img src={food.image} alt={food.name} className="object-cover w-full h-full" />
                      </div>
                      <div>
                        <p className="font-black text-foreground leading-none">{food.name}</p>
                        <p className="text-xs text-muted-foreground mt-1 font-bold">₹{food.price}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
