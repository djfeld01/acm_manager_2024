export type Breakdown = "type" | "size";

export const breakdownNoun = (by: Breakdown) => (by === "size" ? "size" : "unit type");
export const breakdownTitle = (by: Breakdown) => (by === "size" ? "Size" : "Unit type");
