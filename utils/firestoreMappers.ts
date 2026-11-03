// /utils/firestoreMappers.ts

import { PopulationRecord } from "@/constants/data";
import { DocumentData } from "firebase/firestore";

/**
 * Helper function to map Firestore data (with Timestamp) to the client model (with Date).
 */
export const mapDocToRecord = (
  docData: DocumentData,
  docId: string,
): PopulationRecord => {
  // const data = docData as Omit<
  //   PopulationRecord,
  //   "id" | "entryDate" | "dateOccupied"
  // > & {
  //   entryDate: Timestamp;
  //   dateOccupied?: Timestamp; // Optional Timestamp
  // };
  const data = docData as any;

  return {
    id: docId,
    name: data.name,
    street: data.street,
    houseId: data.houseId,
    housePrefix: data.housePrefix || "",
    houseSuffix: data.houseSuffix || "",
    gender: data.gender,
    houseStatus: data.houseStatus,
    domicile: data.domicile,
    adultTotal: Number(data.adultTotal || 0),
    kidsTotal: Number(data.kidsTotal || 0),
    adultMale: Number(data.adultMale || 0),
    adultFemale: Number(data.adultFemale || 0),
    kidsMale: Number(data.kidsMale || 0),
    kidsFemale: Number(data.kidsFemale || 0),
    entryDate: data.entryDate.toDate(),
    dateOccupied: data.dateOccupied ? data.dateOccupied.toDate() : undefined,
  } as PopulationRecord;
};

/**
 * Masks sensitive fields (Name, Occupied Date, Demographics) for roles without permission (e.g., Viewer).
 */
export const maskRecord = (
  record: PopulationRecord,
  canViewSensitive: boolean,
): PopulationRecord => {
  if (canViewSensitive) return record;
  // Mask Name: e.g. "Budi Santoso" -> "B***********"
  const maskedName = record.name
    ? record.name.charAt(0) + "**********"
    : "**********";
  return {
    ...record,
    name: maskedName,
    // Mask demographics
    adultTotal: 0,
    adultMale: 0,
    adultFemale: 0,
    kidsTotal: 0,
    kidsMale: 0,
    kidsFemale: 0,
    // Mask occupied date
    dateOccupied: new Date(0), // or leave as dummy timestamp
  };
};
