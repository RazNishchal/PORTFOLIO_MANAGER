import { db } from '../firebase';
import { ref, push, update, onValue, get } from "firebase/database";

/**
 * 🕒 PRIVATE HELPER: Get Kathmandu Local Time
 * Specifically handles the +5:45 offset for Nepal.
 * Format: "MM/DD/YYYY, HH:MM:SS AM/PM"
 */
const getKTMTime = () => {
    return new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kathmandu",
        hour12: true,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

/**
 * ⚡ REAL-TIME MARKET LISTENER
 */
export const listenToMarketData = (callback) => {
    const marketRef = ref(db, 'market');
    return onValue(marketRef, (snapshot) => {
        callback(snapshot.val() || {});
    });
};

/**
 * 📈 REAL-TIME PORTFOLIO LISTENER
 */
export const listenToPortfolio = (userId, callback) => {
    if (!userId) return;
    const holdingsRef = ref(db, `users/${userId}/holdings`);
    return onValue(holdingsRef, (snapshot) => {
        callback(snapshot.val() || {});
    });
};

/**
 * 👤 GET USER INFO
 */
export const getUserInfoFromDB = async (userId) => {
    try {
        const userInfoRef = ref(db, `users/${userId}/userInfo`);
        const snapshot = await get(userInfoRef);
        return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
        console.error("Error fetching user info:", error);
        throw error;
    }
};

/**
 * 👤 UPDATE USER INFO
 * Ensures 'createdAt', 'lastActive', and 'lastModified' all use KTM format.
 */
export const updateUserInfoInDB = async (userId, data) => {
    if (!userId) return;
    try {
        const userInfoRef = ref(db, `users/${userId}/userInfo`);
        const ktmNow = getKTMTime();
        
        const snapshot = await get(userInfoRef);
        const currentData = snapshot.val() || {};

        const updates = {
            ...data,
            lastActive: ktmNow,    
            lastModified: ktmNow,  
            serverTimestamp: Date.now()
        };

        // 🟢 FIX: Force createdAt to use the KTM formatted string if it's a new entry
        if (!currentData.createdAt) {
            updates.createdAt = ktmNow; 
        }

        await update(userInfoRef, updates);
    } catch (error) {
        console.error("Error updating user info in DB:", error);
    }
};

/**
 * 🚀 UPDATE PORTFOLIO
 * Ensures holdings and history nodes use KTM format.
 */
export const updatePortfolioInDB = async (userId, tx, currentHoldings = {}, marketData = {}) => {
    const symbol = tx.symbol.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const txUnits = parseInt(tx.units);
    const txPrice = parseFloat(tx.price);

    const mData = marketData[symbol] || {};
    const companyName = tx.companyName || mData.name || currentHoldings[symbol]?.companyName || symbol;
    const current = currentHoldings[symbol] || { units: 0, wacc: 0 };

    let newUnits, newWacc;

    if (tx.type === 'BUY') {
        newUnits = current.units + txUnits;
        const totalCost = (current.units * (current.wacc || 0)) + (txUnits * txPrice);
        newWacc = totalCost / (newUnits || 1);
    } else {
        if (current.units < txUnits) throw new Error("Insufficient Units");
        newUnits = current.units - txUnits;
        newWacc = current.wacc;
    }

    const updates = {};
    const ktmNow = getKTMTime();

    // 1. Update Holdings Node
    const holdingPath = `users/${userId}/holdings/${symbol}`;
    updates[holdingPath] = newUnits <= 0 ? null : {
        symbol,
        companyName,
        units: newUnits,
        wacc: Number(newWacc.toFixed(2)),
        lastUpdated: ktmNow // KTM format
    };

    // 2. Add Transaction History entry
    const newTxKey = push(ref(db, `users/${userId}/transactions`)).key;
    updates[`users/${userId}/transactions/${newTxKey}`] = {
        symbol,
        companyName,
        type: tx.type,
        units: txUnits,
        price: txPrice,
        timestamp: Date.now(),
        dateKTM: ktmNow // KTM format for history records
    };

    // 3. Update User Metadata node
    updates[`users/${userId}/userInfo/lastTransactionAt`] = ktmNow;
    updates[`users/${userId}/userInfo/lastActive`] = ktmNow;

    await update(ref(db), updates);
    return pruneTransactions(userId);
};

/**
 * 🧹 PRUNE TRANSACTIONS
 */
const pruneTransactions = async (userId) => {
    const txRef = ref(db, `users/${userId}/transactions`);
    const snapshot = await get(txRef);
    if (!snapshot.exists()) return;

    const allTx = [];
    snapshot.forEach((child) => {
        allTx.push({ key: child.key, ...child.val() });
    });

    allTx.sort((a, b) => b.timestamp - a.timestamp);

    const cleanupUpdates = {};
    const countMap = {};
    const kept = [];

    allTx.forEach((tx) => {
        countMap[tx.symbol] = (countMap[tx.symbol] || 0) + 1;
        if (kept.length < 20 && (countMap[tx.symbol] || 0) <= 2) {
            kept.push(tx.key);
        } else {
            cleanupUpdates[`users/${userId}/transactions/${tx.key}`] = null;
        }
    });

    if (Object.keys(cleanupUpdates).length > 0) {
        return update(ref(db), cleanupUpdates);
    }
};
