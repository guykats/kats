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

export type FamilyMember = {
    id: number;
    name: string;
    color: string;
};

export type TaskCompletion = {
    id: number;
    task_id: number;
    family_member_id: number;
    completed_at: string;
    family_member: FamilyMember;
};

export type Task = {
    id: number;
    title: string;
    completions: TaskCompletion[];
};
