import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { addDoc, collection, getFirestore } from 'firebase/firestore';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet, Text, TextInput,
  TouchableOpacity, View
} from 'react-native';
import app from './firebase';

const auth = getAuth(app);
const db = getFirestore(app);

const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Salary', 'Other'];

export default function AddTransaction() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('Food');

  const handleSave = async () => {
    if (!amount) {
      Alert.alert('Error', 'Please enter an amount!');
      return;
    }

    try {
      const user = auth.currentUser;
      await addDoc(collection(db, 'transactions'), {
        amount: parseFloat(amount),
        type,
        category,
        note,
        userId: user?.uid,
        date: new Date().toISOString(),
      });
      Alert.alert('Success', 'Transaction saved ✅');
      router.replace('/dashboard');
    } catch (error: any) {
      Alert.alert('Error', error.message);
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
          <Text style={styles.headerTitle}>Add Transaction</Text>
          <View />
        </View>

        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'expense' && styles.typeBtnActive]}
            onPress={() => { setType('expense'); setCategory('Food'); }}
          >
            <Text style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>
              Expense ↓
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'income' && styles.typeBtnActive]}
            onPress={() => { setType('income'); setCategory('Salary'); }}
          >
            <Text style={[styles.typeText, type === 'income' && styles.typeTextActive]}>
              Income ↑
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Amount (Rs.)</Text>
        <TextInput
          style={styles.input}
          placeholder="0"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryGrid}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catBtn, category === cat && styles.catBtnActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.catText, category === cat && styles.catTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Note (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Write a note..."
          value={note}
          onChangeText={setNote}
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Transaction ✅</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  typeRow: {
    flexDirection: 'row',
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 5,
  },
  typeBtn: {
    flex: 1, padding: 12, borderRadius: 10, alignItems: 'center',
  },
  typeBtnActive: { backgroundColor: '#6C63FF' },
  typeText: { fontSize: 16, color: 'gray', fontWeight: '500' },
  typeTextActive: { color: 'white' },
  label: { fontSize: 16, fontWeight: '500', marginLeft: 20, marginBottom: 8, color: '#333' },
  input: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: '#6C63FF',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  catBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#6C63FF',
  },
  catBtnActive: { backgroundColor: '#6C63FF' },
  catText: { color: '#6C63FF', fontWeight: '500' },
  catTextActive: { color: 'white' },
  saveBtn: {
    backgroundColor: '#6C63FF',
    margin: 20,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});