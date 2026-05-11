import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { getCurrentMonthKey } from './dateHelper';
import app from './firebase';

const auth = getAuth(app);
const db = getFirestore(app);

export default function Budget() {
  const router = useRouter();
  const [budget, setBudget] = useState('');
  const [currentBudget, setCurrentBudget] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBudget();
  }, []);

  const loadBudget = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const monthKey = getCurrentMonthKey();
      const budgetDoc = await getDoc(
        doc(db, 'budgets', `${user.uid}_${monthKey}`)
      );

      if (budgetDoc.exists()) {
        const data = budgetDoc.data();
        setCurrentBudget(data.amount);
        setBudget(data.amount.toString());
      }
    } catch (error) {
      console.log('Error loading budget:', error);
    }
  };

  const handleSaveBudget = async () => {
    if (!budget || parseFloat(budget) <= 0) {
      Alert.alert('Error', 'Please enter a valid budget amount!');
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      const monthKey = getCurrentMonthKey();
      await setDoc(doc(db, 'budgets', `${user.uid}_${monthKey}`), {
        userId: user.uid,
        monthKey: monthKey,
        amount: parseFloat(budget),
        createdAt: new Date().toISOString(),
      });

      Alert.alert('Success', 'Budget saved successfully ✅');
      router.replace('/dashboard');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Set Budget 💰</Text>
          <View />
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📌 Monthly Budget</Text>
          <Text style={styles.infoText}>
            Set your monthly budget here! We will help you to track it..
          </Text>
          {currentBudget > 0 && (
            <Text style={styles.currentBudgetText}>
              Current Budget: Rs. {currentBudget.toLocaleString()}
            </Text>
          )}
        </View>

        <Text style={styles.label}>Budget Amount (Rs.)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your budget"
          value={budget}
          onChangeText={setBudget}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Quick Suggestions</Text>
        <View style={styles.suggestionRow}>
          {[10000, 25000, 50000, 100000].map((amount) => (
            <TouchableOpacity
              key={amount}
              style={styles.suggestionBtn}
              onPress={() => setBudget(amount.toString())}
            >
              <Text style={styles.suggestionText}>
                Rs. {amount.toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
          onPress={handleSaveBudget}
          disabled={loading}
        >
          <Text style={styles.saveBtnText}>
            {loading ? 'Saving...' : 'Save Budget ✅'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  back: {
    color: 'white',
    fontSize: 16
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold'
  },
  infoCard: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6C63FF',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: 'gray',
    lineHeight: 20,
  },
  currentBudgetText: {
    fontSize: 14,
    color: '#6C63FF',
    fontWeight: 'bold',
    marginTop: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 20,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 12,
    fontSize: 18,
    borderWidth: 1.5,
    borderColor: '#6C63FF',
    fontWeight: 'bold',
  },
  suggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  suggestionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#6C63FF',
  },
  suggestionText: {
    color: '#6C63FF',
    fontWeight: '500',
  },
  saveBtn: {
    backgroundColor: '#6C63FF',
    margin: 20,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: '#cccccc',
  },
  saveBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});