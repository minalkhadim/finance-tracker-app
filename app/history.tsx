import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { collection, deleteDoc, doc, getFirestore, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet, Text, TouchableOpacity,
  View
} from 'react-native';
import { getCurrentMonthKey, getMonthKeyFromDate } from './dateHelper';
import app from './firebase';

const auth = getAuth(app);
const db = getFirestore(app);

export default function History() {
  const router = useRouter();
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [showAllTime, setShowAllTime] = useState(false);

  const getMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleString('default', { month: 'long' }) + ' ' + year;
  };

  const goToPreviousMonth = () => {
    const [year, month] = selectedMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 2, 1);
    const newKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newKey);
  };

  const goToNextMonth = () => {
    const [year, month] = selectedMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month), 1);
    const newKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (newKey <= getCurrentMonthKey()) setSelectedMonth(newKey);
  };

  const isCurrentMonth = selectedMonth === getCurrentMonthKey();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      setAllTransactions(data);
    });

    return unsubscribe;
  }, []);

  const filteredTransactions = allTransactions
    .filter((t: any) => {
      if (showAllTime) return true;
      if (!t.date) return false;
      return getMonthKeyFromDate(t.date) === selectedMonth;
    })
    .filter((t: any) => filterType === 'all' ? true : t.type === filterType)
    .sort((a: any, b: any) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete karo?',
      'Yeh transaction delete ho jayega!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'transactions', id));
              Alert.alert('Done ✅', 'Transaction delete ho gayi!');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: any = {
      Food: '🍕', Transport: '🚗', Shopping: '🛍️',
      Bills: '📄', Salary: '💰', Other: '📦'
    };
    return emojis[category] || '📦';
  };

  const monthIncome = filteredTransactions
    .filter((t: any) => t.type === 'income')
    .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

  const monthExpense = filteredTransactions
    .filter((t: any) => t.type === 'expense')
    .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History 📋</Text>
        <View />
      </View>

      {/* All Time Toggle */}
      <TouchableOpacity
        style={[styles.allTimeBtn, showAllTime && styles.allTimeBtnActive]}
        onPress={() => setShowAllTime(!showAllTime)}
      >
        <Text style={[styles.allTimeText, showAllTime && styles.allTimeTextActive]}>
          {showAllTime ? '✅ All Time' : '🗓️ View all Records'}
        </Text>
      </TouchableOpacity>

      {/* Month Selector - sirf tab dikhay jab All Time off ho */}
      {!showAllTime && (
        <View style={styles.monthSelector}>
          <TouchableOpacity style={styles.arrowBtn} onPress={goToPreviousMonth}>
            <Text style={styles.arrowText}>← Prev</Text>
          </TouchableOpacity>
          <Text style={styles.selectedMonthText}>{getMonthLabel(selectedMonth)}</Text>
          <TouchableOpacity
            style={[styles.arrowBtn, isCurrentMonth && styles.arrowBtnDisabled]}
            onPress={goToNextMonth}
            disabled={isCurrentMonth}
          >
            <Text style={[styles.arrowText, isCurrentMonth && styles.arrowTextDisabled]}>
              Next →
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.summaryRow}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Income ↑</Text>
          <Text style={styles.summaryIncome}>Rs. {monthIncome.toLocaleString()}</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Expense ↓</Text>
          <Text style={styles.summaryExpense}>Rs. {monthExpense.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {(['all', 'income', 'expense'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filterType === f && styles.filterBtnActive]}
            onPress={() => setFilterType(f)}
          >
            <Text style={[styles.filterText, filterType === f && styles.filterTextActive]}>
              {f === 'all' ? 'All' : f === 'income' ? 'Income' : 'Expense'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>
        {filteredTransactions.length === 0 ? (
          <Text style={styles.emptyText}>Koi transaction nahi! 😊</Text>
        ) : (
          filteredTransactions.map((t: any) => (
            <View key={t.id} style={styles.item}>
              <View style={styles.itemLeft}>
                <Text style={styles.emoji}>{getCategoryEmoji(t.category)}</Text>
                <View>
                  <Text style={styles.category}>{t.category || 'Unknown'}</Text>
                  <Text style={styles.note}>{t.note || 'No note'}</Text>
                  <Text style={styles.date}>
                    {t.date ? new Date(t.date).toLocaleDateString('en-PK', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    }) : 'No date'}
                  </Text>
                </View>
              </View>
              <View style={styles.itemRight}>
                <Text style={t.type === 'income' ? styles.income : styles.expense}>
                  {t.type === 'income' ? '+' : '-'} Rs. {(t.amount || 0).toLocaleString()}
                </Text>
                <TouchableOpacity
                  onPress={() => handleDelete(t.id)}
                  style={styles.deleteBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.deleteText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    backgroundColor: '#6C63FF',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  back: { color: 'white', fontSize: 16 },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  allTimeBtn: {
    margin: 20,
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'white',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#6C63FF',
    elevation: 2,
  },
  allTimeBtnActive: {
    backgroundColor: '#6C63FF',
  },
  allTimeText: {
    color: '#6C63FF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  allTimeTextActive: {
    color: 'white',
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    elevation: 2,
  },
  arrowBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#6C63FF',
    borderRadius: 8,
  },
  arrowBtnDisabled: { backgroundColor: '#cccccc' },
  arrowText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  arrowTextDisabled: { color: '#888888' },
  selectedMonthText: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  summaryRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 10,
    gap: 10,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    elevation: 2,
    alignItems: 'center',
  },
  summaryLabel: { fontSize: 12, color: 'gray', marginBottom: 4 },
  summaryIncome: { fontSize: 16, fontWeight: 'bold', color: '#2ECC71' },
  summaryExpense: { fontSize: 16, fontWeight: 'bold', color: '#FF4444' },
  filterRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 5,
    elevation: 2,
  },
  filterBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  filterBtnActive: { backgroundColor: '#6C63FF' },
  filterText: { color: 'gray', fontWeight: '500', fontSize: 14 },
  filterTextActive: { color: 'white' },
  content: { paddingHorizontal: 20, paddingBottom: 30 },
  emptyText: { textAlign: 'center', color: 'gray', marginTop: 40, fontSize: 16 },
  item: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  emoji: { fontSize: 30 },
  category: { fontSize: 16, fontWeight: '500', color: '#333' },
  note: { fontSize: 12, color: 'gray' },
  date: { fontSize: 11, color: '#aaa', marginTop: 2 },
  itemRight: { alignItems: 'flex-end', gap: 8 },
  income: { color: 'green', fontWeight: 'bold', fontSize: 16 },
  expense: { color: 'red', fontWeight: 'bold', fontSize: 16 },
  deleteBtn: { padding: 8, backgroundColor: '#FFF0F0', borderRadius: 8 },
  deleteText: { fontSize: 20 },
});