import { useRouter } from 'expo-router';
import { getAuth, signOut } from 'firebase/auth';
import { collection, doc, getDoc, getFirestore, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Dimensions, ScrollView,
  StyleSheet, Text, TouchableOpacity,
  View
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { getCurrentMonthKey, getMonthKeyFromDate } from './dateHelper';
import app from './firebase';

const screenWidth = Dimensions.get('window').width;
const auth = getAuth(app);
const db = getFirestore(app);

export default function Dashboard() {
  const router = useRouter();
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const [monthlyBudget, setMonthlyBudget] = useState(0);

  const getMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const monthName = date.toLocaleString('default', { month: 'long' });
    return `${monthName} ${year}`;
  };

  const goToPreviousMonth = () => {
    const [year, month] = selectedMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 2, 1);
    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${newYear}-${newMonth}`);
  };

  const goToNextMonth = () => {
    const [year, month] = selectedMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month), 1);
    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    const newMonthKey = `${newYear}-${newMonth}`;
    
    if (newMonthKey <= getCurrentMonthKey()) {
      setSelectedMonth(newMonthKey);
    }
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllTransactions(allData);
    });

    return unsubscribe;
  }, []);

  // Load budget for selected month
  useEffect(() => {
    loadBudget();
  }, [selectedMonth]);

  const loadBudget = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const budgetDoc = await getDoc(
        doc(db, 'budgets', `${user.uid}_${selectedMonth}`)
      );

      if (budgetDoc.exists()) {
        setMonthlyBudget(budgetDoc.data().amount);
      } else {
        setMonthlyBudget(0);
      }
    } catch (error) {
      console.log('Error loading budget:', error);
    }
  };

  useEffect(() => {
    const filteredData = allTransactions.filter((t: any) => {
      const transactionMonthKey = getMonthKeyFromDate(t.date);
      return transactionMonthKey === selectedMonth;
    });
    
    setTransactions(filteredData);

    const income = filteredData
  .filter((t: any) => t.type === 'income')
  .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
const expense = filteredData
  .filter((t: any) => t.type === 'expense')
  .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

    setTotalIncome(income);
    setTotalExpense(expense);
  }, [selectedMonth, allTransactions]);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace('/login');
  };

  const balance = totalIncome - totalExpense;
  const isCurrentMonth = selectedMonth === getCurrentMonthKey();
  
  // Budget calculations
  const budgetUsedPercent = monthlyBudget > 0 ? (totalExpense / monthlyBudget) * 100 : 0;
  const budgetRemaining = monthlyBudget - totalExpense;
  const isBudgetExceeded = totalExpense > monthlyBudget && monthlyBudget > 0;

  const pieData = [
  {
    name: 'Food',
    amount: transactions
      .filter((t: any) => t.category === 'Food' && t.type === 'expense')
      .reduce((sum: number, t: any) => sum + (t.amount || 0), 0),
    color: '#FF6384',
    legendFontColor: '#333',
    legendFontSize: 12,
  },
  {
    name: 'Transport',
    amount: transactions
      .filter((t: any) => t.category === 'Transport' && t.type === 'expense')
      .reduce((sum: number, t: any) => sum + (t.amount || 0), 0),
    color: '#36A2EB',
    legendFontColor: '#333',
    legendFontSize: 12,
  },
  {
    name: 'Shopping',
    amount: transactions
      .filter((t: any) => t.category === 'Shopping' && t.type === 'expense')
      .reduce((sum: number, t: any) => sum + (t.amount || 0), 0),
    color: '#FFCE56',
    legendFontColor: '#333',
    legendFontSize: 12,
  },
  {
    name: 'Bills',
    amount: transactions
      .filter((t: any) => t.category === 'Bills' && t.type === 'expense')
      .reduce((sum: number, t: any) => sum + (t.amount || 0), 0),
    color: '#9B59B6',
    legendFontColor: '#333',
    legendFontSize: 12,
  },
  {
    name: 'Other',
    amount: transactions
      .filter((t: any) => t.category === 'Other' && t.type === 'expense')
      .reduce((sum: number, t: any) => sum + (t.amount || 0), 0),
    color: '#E74C3C',
    legendFontColor: '#333',
    legendFontSize: 12,
  },
].filter(item => item.amount > 0);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Finance 💰</Text>
          <Text style={styles.monthText}>{getMonthLabel(selectedMonth)}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.monthSelector}>
        <TouchableOpacity 
          style={styles.arrowBtn} 
          onPress={goToPreviousMonth}
        >
          <Text style={styles.arrowText}>← Prev</Text>
        </TouchableOpacity>
        
        <Text style={styles.selectedMonthText}>
          {getMonthLabel(selectedMonth)}
        </Text>
        
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

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceAmount}>Rs. {balance.toLocaleString()}</Text>
        <View style={styles.row}>
          <View style={styles.incomeBox}>
            <Text style={styles.boxLabel}>Income ↑</Text>
            <Text style={styles.incomeAmount}>Rs. {totalIncome.toLocaleString()}</Text>
          </View>
          <View style={styles.expenseBox}>
            <Text style={styles.boxLabel}>Expense ↓</Text>
            <Text style={styles.expenseAmount}>Rs. {totalExpense.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {/* Budget Card - YE NAYA HAI */}
      {monthlyBudget > 0 ? (
        <View style={styles.budgetCard}>
          <View style={styles.budgetHeader}>
            <Text style={styles.budgetTitle}>💰 Monthly Budget</Text>
            {isCurrentMonth && (
              <TouchableOpacity onPress={() => router.push('/budget')}>
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.budgetAmount}>
            Rs. {monthlyBudget.toLocaleString()}
          </Text>
          
          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar, 
                { 
                  width: `${Math.min(budgetUsedPercent, 100)}%`,
                  backgroundColor: isBudgetExceeded ? '#FF4444' : 
                                   budgetUsedPercent >= 80 ? '#FFA500' : '#2ECC71'
                }
              ]} 
            />
          </View>
          
          <View style={styles.budgetInfoRow}>
            <Text style={styles.budgetUsedText}>
              {budgetUsedPercent.toFixed(0)}% used
            </Text>
            <Text style={[
              styles.budgetRemainingText,
              isBudgetExceeded && { color: '#FF4444' }
            ]}>
              {isBudgetExceeded 
                ? `Over by Rs. ${Math.abs(budgetRemaining).toLocaleString()}`
                : `Remaining: Rs. ${budgetRemaining.toLocaleString()}`
              }
            </Text>
          </View>

          {isBudgetExceeded && (
            <Text style={styles.exceededWarning}>
              ⚠️ Budget exceed ho gaya!
            </Text>
          )}
        </View>
      ) : (
        isCurrentMonth && (
          <TouchableOpacity 
            style={styles.setBudgetCard}
            onPress={() => router.push('/budget')}
          >
            <Text style={styles.setBudgetText}>💰 Set Monthly Budget</Text>
            <Text style={styles.setBudgetSubtext}>
              Track your spending limits
            </Text>
          </TouchableOpacity>
        )
      )}

      {pieData.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Spending Breakdown 📊</Text>
          <PieChart
            data={pieData}
            width={screenWidth - 40}
            height={200}
            chartConfig={{
              color: (opacity = 1) => `rgba(108, 99, 255, ${opacity})`,
            }}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="15"
          />
        </View>
      )}

      {isCurrentMonth && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/add-transaction')}
        >
          <Text style={styles.addButtonText}>+ Add Transaction</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.historyButton}
        onPress={() => router.push('/history')}
      >
        <Text style={styles.historyButtonText}>View History 📋</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>
        {isCurrentMonth ? 'Recent Transactions' : 'Transactions'}
      </Text>
      {transactions.length === 0 ? (
        <Text style={styles.emptyText}>
          {isCurrentMonth 
            ? 'No transactions yet. Start tracking your money! 💰'
            : 'Is month mein koi transaction nahi! 📭'
          }
        </Text>
      ) : (
        transactions.slice(0, 5).map((t: any) => (
          <View key={t.id} style={styles.transactionItem}>
            <View>
              <Text style={styles.transCategory}>{t.category}</Text>
              <Text style={styles.transNote}>{t.note || 'No note'}</Text>
            </View>
            <Text style={t.type === 'income' ? styles.incomeText : styles.expenseText}>
              {t.type === 'income' ? '+' : '-'} Rs. {t.amount}
            </Text>
          </View>
        ))
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F5F5F5' 
  },
  header: {
    backgroundColor: '#6C63FF',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { 
    color: 'white', 
    fontSize: 22, 
    fontWeight: 'bold' 
  },
  monthText: { 
    color: 'rgba(255,255,255,0.8)', 
    fontSize: 14, 
    marginTop: 4 
  },
  logout: { 
    color: 'white', 
    fontSize: 14 
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 20,
    marginBottom: 0,
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
  arrowBtnDisabled: {
    backgroundColor: '#cccccc',
  },
  arrowText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
  },
  arrowTextDisabled: {
    color: '#888888',
  },
  selectedMonthText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  balanceCard: {
    backgroundColor: '#6C63FF',
    margin: 20,
    borderRadius: 20,
    padding: 20,
  },
  balanceLabel: { 
    color: 'rgba(255,255,255,0.8)', 
    fontSize: 14 
  },
  balanceAmount: { 
    color: 'white', 
    fontSize: 36, 
    fontWeight: 'bold', 
    marginBottom: 20 
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  incomeBox: { 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    borderRadius: 12, 
    padding: 12, 
    flex: 0.48 
  },
  expenseBox: { 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    borderRadius: 12, 
    padding: 12, 
    flex: 0.48 
  },
  boxLabel: { 
    color: 'rgba(255,255,255,0.8)', 
    fontSize: 12 
  },
  incomeAmount: { 
    color: '#00FF88', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  expenseAmount: { 
    color: '#FF6584', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  budgetCard: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  editText: {
    color: '#6C63FF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  budgetAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6C63FF',
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },
  budgetInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetUsedText: {
    fontSize: 13,
    color: 'gray',
  },
  budgetRemainingText: {
    fontSize: 13,
    color: '#2ECC71',
    fontWeight: 'bold',
  },
  exceededWarning: {
    color: '#FF4444',
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  setBudgetCard: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6C63FF',
    borderStyle: 'dashed',
  },
  setBudgetText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6C63FF',
    marginBottom: 4,
  },
  setBudgetSubtext: {
    fontSize: 12,
    color: 'gray',
  },
  chartCard: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 15,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: '#6C63FF',
    margin: 20,
    marginTop: 0,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  historyButton: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#6C63FF',
  },
  historyButtonText: {
    color: '#6C63FF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginLeft: 20, 
    marginBottom: 10, 
    color: '#333' 
  },
  emptyText: { 
    textAlign: 'center', 
    color: 'gray', 
    marginTop: 20 
  },
  transactionItem: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transCategory: { 
    fontSize: 16, 
    fontWeight: '500', 
    color: '#333' 
  },
  transNote: { 
    fontSize: 12, 
    color: 'gray' 
  },
  incomeText: { 
    color: 'green', 
    fontWeight: 'bold' 
  },
  expenseText: { 
    color: 'red', 
    fontWeight: 'bold' 
  },
});