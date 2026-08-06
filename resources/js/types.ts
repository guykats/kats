export type EventRecurrence = 'none' | 'weekly' | 'monthly' | 'yearly';

export type FamilyEvent = {
    id: number;
    date: string; // yyyy-MM-dd
    title: string;
    time: string | null; // HH:mm:ss
    color: string | null;
    recurrence: EventRecurrence;
    days: number;
};

export type ShoppingItem = {
    id: number;
    text: string;
    done: boolean;
};
