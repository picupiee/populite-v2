import { endOfMonth, format, startOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import { collection, onSnapshot, query, Timestamp, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';

// 🔑 GLOBAL VARIABLES: These must be declared for environment access
declare const __initial_auth_token: string | undefined;
declare const __app_id: string | undefined;

// 🔑 CORRECTION: Import Firebase services from your centralized file
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';

// --- TYPE DEFINITIONS ---

// Base interface for all finance records
export interface FinanceRecord {
    id: string;
    amount: number;
    date: Date; // Converted from Firestore Timestamp
    note: string;
    createdAt: Date;
    quantity: number;
}

// Specific types for incomes and spendings
export interface IncomeRecord extends FinanceRecord {
    source: string;
    type: 'income';
    // 🔑 ADDED: Include familyCount
    familyCount: number;
}

export interface SpendingRecord extends FinanceRecord {
    type: string; // The specific spending type ID
    category: 'spending';
}

// Structure for a single day's aggregated data
export interface DailySummary {
    date: string; // YYYY-MM-DD
    displayDate: string; // e.g., 25 Nov
    totalIncome: number;
    totalSpending: number;
    dailyNet: number;
    runningBalance: number; // Cumulative balance up to this day
    transactions: Array<IncomeRecord | SpendingRecord>;
}

// Structure for the entire monthly report
export interface MonthlyReport {
    monthYear: string; // e.g., "November 2025"
    totalIncome: number;
    totalSpending: number;
    netBalance: number;
    dailySummaries: DailySummary[]; // Sorted by date ASC
    lastUpdated: Date;
    // 🔑 ADDED: Categorical Breakdowns
    incomeBySource: { [source: string]: number };
    spendingByType: { [type: string]: number };
}

interface UseMonthlyFinanceReport {
    report: MonthlyReport | null;
    loading: boolean;
    error: Error | null;
    currentDate: Date;
    setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
}

// --- UTILITY FUNCTIONS ---

/**
 * Ensures a number is always treated as a positive value for display/calculation.
 * @param num - The number to process.
 * @returns The absolute value of the number.
 */
const safeNumber = (num: number | undefined): number => Math.abs(num || 0);

/**
 * Combines, groups, and calculates the running balance for the report.
 * @param allRecords - Array of all Income and Spending records.
 * @param dateForMonth - A Date object representing the month being reported.
 * @returns A structured MonthlyReport.
 */
const aggregateAndCalculate = (
    allRecords: Array<IncomeRecord | SpendingRecord>,
    dateForMonth: Date
): MonthlyReport => {
    // 1. Group records by date (YYYY-MM-DD)
    const dailyMap = new Map<string, DailySummary>();
    const incomeBySource: { [source: string]: number } = {};
    const spendingByType: { [type: string]: number } = {};

    // Sort records by date for accurate chronological cumulative calculation
    allRecords.sort((a, b) => a.date.getTime() - b.date.getTime());

    // 2. Aggregate Incomes and Spendings per day
    allRecords.forEach(record => {
        const dateKey = format(record.date, 'yyyy-MM-dd');

        let daily = dailyMap.get(dateKey) || {
            date: dateKey,
            displayDate: format(record.date, 'dd MMM', { locale: id }),
            totalIncome: 0,
            totalSpending: 0,
            dailyNet: 0,
            runningBalance: 0,
            transactions: [],
        };

        const amount = safeNumber(record.amount);

        // Income logic
        if ('source' in record) {
            daily.totalIncome += amount;
            // 🔑 ADDED: Cast and include familyCount
            daily.transactions.push({ ...record, type: 'income', familyCount: (record as IncomeRecord).familyCount || 0 });

            // Aggregate by Source
            const source = (record as IncomeRecord).source || 'Lainnya';
            incomeBySource[source] = (incomeBySource[source] || 0) + amount;
        }
        // Spending logic
        else if ('category' in record) {
            daily.totalSpending += amount;
            daily.transactions.push({ ...record, category: 'spending' });

            // Aggregate by Type
            const type = (record as SpendingRecord).type || 'Lainnya';
            spendingByType[type] = (spendingByType[type] || 0) + amount;
        }

        dailyMap.set(dateKey, daily);
    });

    // 3. Convert Map to Array and Calculate Running Balance
    const dailySummaries = Array.from(dailyMap.values());
    let cumulativeBalance = 0;
    let totalIncome = 0;
    let totalSpending = 0;

    dailySummaries.forEach(day => {
        day.dailyNet = day.totalIncome - day.totalSpending;

        cumulativeBalance += day.dailyNet;
        day.runningBalance = cumulativeBalance;

        totalIncome += day.totalIncome;
        totalSpending += day.totalSpending;

        // Sort transactions within the day by time (optional, but good for chronological view)
        day.transactions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    });

    // 4. Construct Final Report
    return {
        monthYear: format(dateForMonth, 'MMMM yyyy', { locale: id }),
        totalIncome,
        totalSpending,
        netBalance: totalIncome - totalSpending,
        dailySummaries,
        lastUpdated: new Date(),
        incomeBySource,
        spendingByType,
    };
};


// --- HOOK IMPLEMENTATION ---

export const useMonthlyFinanceReport = (): UseMonthlyFinanceReport => {
    const [report, setReport] = useState<MonthlyReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [userId, setUserId] = useState<string | null>(null);
    const [isAuthReady, setIsAuthReady] = useState(false); // New state to track auth readiness

    // --- EFFECT 1: Handle Firebase Authentication ---
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                if (typeof __initial_auth_token !== 'undefined') {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (e) {
                console.error("Firebase Auth failed during hook startup:", e);
                setError(new Error("Authentication failed. Cannot load data."));
            }
        };

        // Set up the state listener (crucial for getting the UID)
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUserId(user ? user.uid : null);
            setIsAuthReady(true);
            setLoading(false);
        });

        // Start initialization if not already authenticated
        if (!auth.currentUser) {
            initializeAuth();
        }

        return () => unsubscribe();
    }, []);

    // --- EFFECT 2: Fetch Data once Auth is Ready and Date Changes ---
    useEffect(() => {
        // Guard clause: Do not attempt to query Firestore until we know the user ID
        if (!isAuthReady || !userId) {
            // If auth is ready but no userId (e.g., failed to sign in), we stop.
            if (isAuthReady) {
                setLoading(false);
                setReport(null);
            }
            return;
        }

        setLoading(true);
        setError(null);
        setReport(null);

        // 🔑 CRITICAL FIX: CORRECT PATH CONSTRUCTION
        // Ensure we are querying the required private path: /artifacts/{appId}/users/{userId}/...
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        // const incomeCollectionPath = `artifacts/${appId}/users/${userId}/finance_incomes`;
        // const spendingCollectionPath = `artifacts/${appId}/users/${userId}/finance_spendings`;

        const startMonth = startOfMonth(currentDate);
        const endMonth = endOfMonth(currentDate);

        // 1. Setup Firestore Listeners using the imported 'db' instance
        // 🔑 FIX: Convert Dates to ISO Strings for query because data is stored as ISO strings
        const incomeQuery = query(
            collection(db, "finance_incomes"),
            where('date', '>=', startMonth.toISOString()),
            where('date', '<=', endMonth.toISOString())
        );

        const spendingQuery = query(
            collection(db, "finance_spendings"),
            where('date', '>=', startMonth.toISOString()),
            where('date', '<=', endMonth.toISOString())
        );

        let incomes: IncomeRecord[] = [];
        let spendings: SpendingRecord[] = [];
        let subscriptionsCompleted = 0;
        const expectedSubscriptions = 2;

        // Function to run aggregation when both subscriptions have fetched data
        const checkAndAggregate = () => {
            if (subscriptionsCompleted === expectedSubscriptions) {
                const allRecords: Array<IncomeRecord | SpendingRecord> = [
                    ...incomes,
                    ...spendings
                ];

                const monthlyReport = aggregateAndCalculate(allRecords, currentDate);
                setReport(monthlyReport);
                setLoading(false);
            }
        };

        // --- Income Listener ---
        const unsubscribeIncomes = onSnapshot(incomeQuery, (snapshot) => {
            incomes = snapshot.docs.map(doc => {
                const data = doc.data();
                // 🔑 FIX: Handle Date parsing from String (ISO) or Timestamp
                let parsedDate = new Date();
                if (typeof data.date === 'string') {
                    parsedDate = new Date(data.date);
                } else if (data.date?.toDate) {
                    parsedDate = data.date.toDate();
                }

                return {
                    id: doc.id,
                    amount: safeNumber(data.amount),
                    date: parsedDate,
                    note: data.note || '',
                    source: data.source || '',
                    quantity: safeNumber(data.quantity),
                    // 🔑 MAPPED: Include familyCount from Firestore data
                    familyCount: safeNumber(data.familyCount),
                    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
                    type: 'income',
                } as IncomeRecord;
            });
            subscriptionsCompleted = Math.max(subscriptionsCompleted, 1);
            checkAndAggregate();
        }, (err) => {
            console.error("Error fetching incomes:", err);
            // Check the console for a Firebase "Permission Denied" error if data is missing.
            setError(new Error("Failed to retrieve income data. (Check console for permission errors)"));
            setLoading(false);
        });

        // --- Spending Listener ---
        const unsubscribeSpendings = onSnapshot(spendingQuery, (snapshot) => {
            spendings = snapshot.docs.map(doc => {
                const data = doc.data();
                // 🔑 FIX: Handle Date parsing from String (ISO) or Timestamp
                let parsedDate = new Date();
                if (typeof data.date === 'string') {
                    parsedDate = new Date(data.date);
                } else if (data.date?.toDate) {
                    parsedDate = data.date.toDate();
                }

                return {
                    id: doc.id,
                    amount: safeNumber(data.amount),
                    date: parsedDate,
                    note: data.note || '',
                    type: data.type || '',
                    quantity: safeNumber(data.quantity),
                    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
                    category: 'spending',
                } as SpendingRecord;
            });
            subscriptionsCompleted = Math.max(subscriptionsCompleted, 2);
            checkAndAggregate();
        }, (err) => {
            console.error("Error fetching spendings:", err);
            setError(new Error("Failed to retrieve spending data. (Check console for permission errors)"));
            setLoading(false);
        });


        // Cleanup function for listeners
        return () => {
            unsubscribeIncomes();
            unsubscribeSpendings();
        };


    }, [currentDate, isAuthReady, userId]); // Dependency list ensures data refetches on month change or auth state change

    return { report, loading, error, currentDate, setCurrentDate };
};