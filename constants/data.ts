/**
 * Defines the structure for a single population data record.
 */
export interface PopulationRecord {
  id: string;
  name: string;
  // age: number; // Not using for now
  gender: "Pria" | "Wanita";
  housePrefix: string;
  houseSuffix: string;
  houseId?: string; // Household Block and Number, e.g., C28/19
  street: string;
  domicile: "Gunung Sari" | "Lainnya"; // Check if the person's national id's domicile is updated to move in Gunung Sari or not
  houseStatus: "Kosong" | "Ditempati" | "Sewa"; // House status, if empty or Kosong then some data not needed to be filled (e.g., gender, kids in the occupant's house, etc)
  dateOccupied: Date; // Date when the house owner or renter occupied the house. Will make this optional.
  kidsTotal: number; // Will break it down into male and female total, but now it is the total of all kids regardless of their gender
  adultTotal: number; // Same as kids, but for now lets count adult regardless of their gender as well. Automatically count as 1 if houseStatus is Occupied / Ditempati.
  entryDate: Date;
  // Anything else will be added here base on user feedback
  // To be added soon for more accurate and detailed data per house.
  kidsMale: number;
  kidsFemale: number;
  adultMale: number;
  adultFemale: number;
}

export const STREET_OPTIONS = ["Pinus 1", "Pinus 2", "Edelweis", "Mawar"];
export const STATUS_OPTIONS = ["Ditempati", "Sewa", "Kosong"];
export const GENDER_OPTIONS = ["Pria", "Wanita"];
