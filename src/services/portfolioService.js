import { db } from '../firebase';
import { ref, push, update, onValue, get } from "firebase/database";

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
 * 👤 GET USER INFO (Used for Verification Checks)
 * Fetches the specific userInfo node for a user
 */
export const getUserInfoFromDB = async (userId) => {
    try {
        const userInfoRef = ref(db, `users/${userId}/userInfo`);
        const snapshot = await get(userInfoRef);
        if (snapshot.exists()) {
            return snapshot.val();
        }
        return null;
    } catch (error) {
        console.error("Error fetching user info:", error);
        throw error;
    }
};

/**
 * 👤 UPDATE USER INFO (Email & Password History)
 */
export const updateUserInfoInDB = async (userId, data) => {
    const userInfoRef = ref(db, `users/${userId}/userInfo`);
    await update(userInfoRef, {
        ...data,
        lastModified: new Date().toISOString()
    });
};

/**
 * 🚀 UPDATE PORTFOLIO (User-node only)
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
    const holdingPath = `users/${userId}/holdings/${symbol}`;

    // Update holdings: remove if units are 0
    updates[holdingPath] = newUnits <= 0 ? null : {
        symbol,
        companyName,
        units: newUnits,
        wacc: Number(newWacc.toFixed(2)),
        lastUpdated: new Date().toISOString()
    };

    // Add transaction history
    const newTxKey = push(ref(db, `users/${userId}/transactions`)).key;
    updates[`users/${userId}/transactions/${newTxKey}`] = {
        symbol,
        companyName,
        type: tx.type,
        units: txUnits,
        price: txPrice,
        timestamp: Date.now()
    };

    await update(ref(db), updates);
    return pruneTransactions(userId);
};

/**
 * 🧹 PRUNE TRANSACTIONS (Keeps DB clean)
 */
const pruneTransactions = async (userId) => {
    const txRef = ref(db, `users/${userId}/transactions`);
    const snapshot = await get(txRef);
    if (!snapshot.exists()) return;

    const allTx = [];
    snapshot.forEach((child) => {
        allTx.push({ key: child.key, ...child.val() });
    });

    // Sort by newest first
    allTx.sort((a, b) => b.timestamp - a.timestamp);

    const cleanupUpdates = {};
    const countMap = {};
    const kept = [];

    allTx.forEach((tx) => {
        countMap[tx.symbol] = (countMap[tx.symbol] || 0) + 1;
        // Keep only top 20 total transactions, and max 2 per specific symbol
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