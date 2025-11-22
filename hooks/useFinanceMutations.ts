import { useAuth } from "@/context/AuthProvider";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

// Collection names are now root-level, public collections
const INCOME_COLLECTION = "finance_incomes";
const SPENDING_COLLECTION = "finance_spendings";


interface IncomeEntry {
    date: Date;
    source: string;
    familyCount: number;
    amount: number;
    note?: string;
}

interface SpendingEntry {
    date: Date;
    type: string;
    quantity: number;
    amount: number;
    note?: String;
}

export const useFinanceMutations = () => {
    const { user } = useAuth();

    /**
     * Saves a new income entry to the finance_incomes collection.
     * @param data The income details
     */
    const addIncome = async (data: IncomeEntry) => {
        // Validation
        if (!data.amount || data.amount < 0) {
            throw new Error("Amount must be a positive number")
        }

        const entryData = {
            ...data,
            date: data.date.toISOString(),
            recordedByUid: user?.uid,
            recordedAt: serverTimestamp(),
        }
        try {
            // 🔑 CRITICAL FIX: Use the simple root collection name
            const docRef = await addDoc(collection(db, INCOME_COLLECTION), entryData);
            console.log("Income added to root collection with ID: ", docRef.id)
            return docRef;
        } catch (e) {
            console.error("Error adding income document: ", e)
            throw new Error("Failed to record income")
        }
    }

    /**
     * Saves a new spending entry to the finance_spendings collection
     * @param data The spending details    
     * */
    const addSpending = async (data: SpendingEntry) => {
        // Validation
        if (!data.amount || data.amount <= 0) {
            throw new Error("Amount must be a positive number")
        }

        const entryData = {
            ...data,
            date: data.date.toISOString(),
            recordedByUid: user?.uid,
            recordedAt: serverTimestamp(),
        }
        try {
            // 🔑 CRITICAL FIX: Use the simple root collection name
            const docRef = await addDoc(collection(db, SPENDING_COLLECTION), entryData);
            console.log("Spending added to root collection with ID: ", docRef.id)
            return docRef;
        } catch (e) {
            console.error("Error adding spending document: ", e);
            throw new Error("Failed to record spending")
        }
    }

    return { addIncome, addSpending }

}