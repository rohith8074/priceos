"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Shield, UserPlus, Trash2, Mail, User as UserIcon, Edit2, CheckCircle2, XCircle, Clock, UserCheck } from "lucide-react";
import { toast } from "sonner";

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [isAddMode, setIsAddMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isAdminState, setIsAdminState] = useState(false);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ fullName: "", email: "" });

    const refreshUsers = () => {
        fetch('/api/users')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setUsers(data);
                }
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        refreshUsers();
    }, []);

    const pendingUsers = users.filter(u => !u.isApproved);
    const approvedUsers = users.filter(u => u.isApproved);

    const handleApproveUser = async (userId: string) => {
        try {
            const res = await fetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, isApproved: true })
            });
            if (res.ok) {
                setUsers(users.map(u => u.userId === userId ? { ...u, isApproved: true } : u));
                toast.success("User approved successfully!");
            } else {
                toast.error("Failed to approve user");
            }
        } catch (err) {
            toast.error("An error occurred approving user");
        }
    };

    const handleRejectUser = async (userId: string) => {
        if (!confirm("Are you sure you want to reject and remove this user?")) return;
        try {
            const res = await fetch(`/api/users?userId=${userId}`, { method: 'DELETE' });
            if (res.ok) {
                setUsers(users.filter(u => u.userId !== userId));
                toast.success("User rejected and removed");
            } else {
                toast.error("Failed to reject user");
            }
        } catch (err) {
            toast.error("An error occurred rejecting user");
        }
    };

    const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const userId = formData.get('userId') as string;
        const fullName = formData.get('fullName') as string;
        const email = formData.get('email') as string;

        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, fullName, email, role: isAdminState ? 'admin' : 'user' })
            });
            const data = await res.json();
            if (data.success) {
                setIsAddMode(false);
                toast.success("User added successfully");
                refreshUsers();
            } else {
                toast.error(data.error || "Failed to add user");
            }
        } catch (err) {
            toast.error("An error occurred adding user");
        }
    };

    const handleToggleRole = async (userId: string, newRole: string) => {
        try {
            const res = await fetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role: newRole })
            });
            if (res.ok) {
                setUsers(users.map(u => u.userId === userId ? { ...u, role: newRole } : u));
                toast.success(`User role updated to ${newRole}`);
            } else {
                toast.error("Failed to update user role");
            }
        } catch (err) {
            toast.error("An error occurred updating role");
        }
    };

    const handleSaveEdit = async (userId: string) => {
        try {
            const res = await fetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, fullName: editForm.fullName, email: editForm.email })
            });
            if (res.ok) {
                setUsers(users.map(u => u.userId === userId ? { ...u, fullName: editForm.fullName, email: editForm.email } : u));
                setEditingUserId(null);
                toast.success("User details updated");
            } else {
                toast.error("Failed to update user details");
            }
        } catch (err) {
            toast.error("An error occurred updating user details");
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Are you sure you want to remove this user?")) return;
        try {
            const res = await fetch(`/api/users?userId=${userId}`, { method: 'DELETE' });
            if (res.ok) {
                setUsers(users.filter(u => u.userId !== userId));
                toast.success("User removed successfully");
            } else {
                toast.error("Failed to remove user");
            }
        } catch (err) {
            toast.error("An error occurred while removing");
        }
    };

    return (
        <div className="p-8 space-y-8 max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase italic bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                        User Management
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium">
                        Manage administrative access, user permissions, and approve new sign-ups.
                    </p>
                </div>
                <Button
                    onClick={() => {
                        setIsAddMode(!isAddMode);
                        setIsAdminState(false);
                    }}
                    className="bg-amber-500 hover:bg-amber-600 font-bold"
                >
                    {isAddMode ? "Cancel" : (
                        <>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add User
                        </>
                    )}
                </Button>
            </div>

            {isAddMode && (
                <Card className="border-amber-500/20 bg-amber-500/[0.02]">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Add New User</CardTitle>
                        <CardDescription>Grant access to new team members.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Username ID</label>
                                <Input name="userId" placeholder="e.g. jdoe" required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Full Name</label>
                                <Input name="fullName" placeholder="John Doe" required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase">Email Address</label>
                                <Input name="email" type="email" placeholder="john@example.com" required />
                            </div>
                            <div className="col-span-1 md:col-span-3 pt-2">
                                <div className="flex items-center justify-between p-4 border border-amber-500/20 rounded-lg bg-background/50">
                                    <div className="space-y-0.5">
                                        <label className="text-sm font-bold">Admin Privileges</label>
                                        <p className="text-xs text-muted-foreground">Grant full access to system settings and user management.</p>
                                    </div>
                                    <Switch
                                        checked={isAdminState}
                                        onCheckedChange={setIsAdminState}
                                        className="data-[state=checked]:bg-amber-500"
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="md:col-span-3 bg-gradient-to-r from-amber-500 to-orange-600 font-bold uppercase tracking-widest mt-2">
                                Authorize User
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* ── Pending Approval Section ── */}
            {pendingUsers.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-amber-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black tracking-tight">Pending Approval</h2>
                            <p className="text-xs text-muted-foreground">{pendingUsers.length} user{pendingUsers.length !== 1 ? 's' : ''} waiting for access</p>
                        </div>
                    </div>
                    <div className="grid gap-3">
                        {pendingUsers.map((user) => (
                            <Card key={user.id} className="border-amber-500/20 bg-amber-500/[0.02] hover:border-amber-500/40 transition-all duration-300">
                                <CardContent className="p-5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-11 w-11 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                            <UserCheck className="h-5 w-5 text-amber-500" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold">{user.fullName || user.email || 'New User'}</h3>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                    Pending
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1">
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Mail className="h-3 w-3" />
                                                    {user.email || 'No email'}
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Shield className="h-3 w-3" />
                                                    ID: {user.userId}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => handleApproveUser(user.userId)}
                                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold gap-1.5 h-9"
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                            Approve
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleRejectUser(user.userId)}
                                            className="border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-400 font-bold gap-1.5 h-9"
                                        >
                                            <XCircle className="h-4 w-4" />
                                            Reject
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Approved Users Section ── */}
            <div className="space-y-4">
                {approvedUsers.length > 0 && (
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black tracking-tight">Active Users</h2>
                            <p className="text-xs text-muted-foreground">{approvedUsers.length} approved user{approvedUsers.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                )}
                <div className="grid gap-4">
                    {approvedUsers.map((user) => (
                        <Card key={user.id} className="group hover:border-amber-500/30 transition-all duration-300">
                            <CardContent className="p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center group-hover:bg-amber-500/10 transition-colors">
                                        <UserIcon className="h-6 w-6 text-muted-foreground group-hover:text-amber-600" />
                                    </div>
                                    <div>
                                        {editingUserId === user.userId ? (
                                            <div className="flex flex-col gap-2 origin-left">
                                                <Input
                                                    value={editForm.fullName}
                                                    onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                                                    className="h-8 text-sm font-bold min-w-[200px]"
                                                    placeholder="Full Name"
                                                />
                                                <Input
                                                    value={editForm.email}
                                                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                                    className="h-8 text-xs"
                                                    placeholder="Email"
                                                />
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="default" className="h-7 text-xs bg-emerald-500 hover:bg-emerald-600" onClick={() => handleSaveEdit(user.userId)}>Save</Button>
                                                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingUserId(null)}>Cancel</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-lg">{user.fullName || user.full_name}</h3>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${user.role === 'admin'
                                                        ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                                        : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                                        }`}>
                                                        {user.role}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 mt-1">
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Mail className="h-3 w-3" />
                                                        {user.email}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Shield className="h-3 w-3" />
                                                        ID: {user.userId}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 mr-4 border-r border-border pr-4">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest hidden sm:inline">
                                            Admin
                                        </span>
                                        <Switch
                                            checked={user.role === 'admin'}
                                            onCheckedChange={(checked) => handleToggleRole(user.userId, checked ? 'admin' : 'user')}
                                            className="data-[state=checked]:bg-amber-500 scale-90"
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                                        onClick={() => {
                                            setEditingUserId(user.userId);
                                            setEditForm({ fullName: user.fullName || user.full_name || "", email: user.email || "" });
                                        }}
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    {user.role !== 'admin' && (
                                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => handleDeleteUser(user.userId)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
