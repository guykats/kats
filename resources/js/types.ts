export type EventRecurrence = 'none' | 'weekly' | 'monthly' | 'yearly';

export type Device = {
    id: number;
    name: string;
    color: string;
};

export type FamilyEvent = {
    id: number;
    date: string; // yyyy-MM-dd
    title: string;
    time: string | null; // HH:mm:ss
    color: string | null;
    recurrence: EventRecurrence;
    days: number;
    created_by: Device | null;
};

export type ShoppingItem = {
    id: number;
    text: string;
    done: boolean;
};

export type Task = {
    id: number;
    title: string;
    done: boolean;
};

export type CurrentDevice = {
    name: string;
    color: string;
    isAdmin: boolean;
};

export type PendingDevice = {
    id: number;
    created_at: string;
};

export type ApprovedDevice = {
    id: number;
    name: string;
    color: string;
    is_admin: boolean;
    approved_at: string;
};
