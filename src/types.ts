export type FamilyEvent = {
  id: string;
  date: string; // yyyy-MM-dd
  title: string;
  time?: string; // HH:mm
  color?: string;
};

export type ShoppingItem = {
  id: string;
  text: string;
  done: boolean;
};
