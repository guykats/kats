export type FamilyEvent = {
    id: number;
    date: string; // yyyy-MM-dd
    title: string;
    time: string | null; // HH:mm:ss
    color: string | null;
};

export type ShoppingItem = {
    id: number;
    text: string;
    done: boolean;
};
