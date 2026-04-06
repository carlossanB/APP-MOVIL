import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { DrawerActions } from '@react-navigation/native';
import { useTaskStore } from '../stores/useTaskStore';
import { TaskCard } from '../components/TaskCard';

type Props = NativeStackScreenProps<RootStackParamList, 'TaskList'>;

export const TaskListScreen: React.FC<Props> = ({ navigation }) => {
  const { tasks, isLoading, isSyncing, isOffline, error, filterType, loadTasks, syncTasks, clearError } =
    useTaskStore();

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTasks();
    syncTasks();
  }, []);

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    
    if (filterType === 'completed') return t.completed;
    if (filterType === 'pending') return !t.completed;
    return true;
  });

  const handleRefresh = useCallback(() => {
    syncTasks();
  }, [syncTasks]);

  const renderEmpty = () => (
    <View style={styles.center}>
      <Text style={styles.emptyText}>No hay tareas aún. ¡Desliza para actualizar o añade una!</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1117" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity 
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            style={styles.hamburgerBtn}>
            <Text style={styles.hamburgerText}>≡</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Mis Tareas</Text>
            <Text style={styles.headerSubtitle}>
              {tasks.length} {tasks.length === 1 ? 'tarea' : 'tareas'}
            </Text>
          </View>
        </View>
        {isSyncing && <ActivityIndicator color="#58A6FF" />}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar tareas..."
          placeholderTextColor="#8B949E"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Offline Banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>📡 Modo sin conexión — se sincronizará al reconectar</Text>
        </View>
      )}

      {/* Error Banner */}
      {error && (
        <TouchableOpacity style={styles.errorBanner} onPress={clearError}>
          <Text style={styles.errorText}>⚠ {error} (toca para ocultar)</Text>
        </TouchableOpacity>
      )}

      {/* Task List */}
      {isLoading && tasks.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#58A6FF" />
        </View>
      ) : (
        <FlatList
          testID="task-list"
          data={filteredTasks}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
            />
          )}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={filteredTasks.length === 0 ? styles.grow : styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isSyncing}
              onRefresh={handleRefresh}
              colors={['#58A6FF']}
              tintColor="#58A6FF"
            />
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        testID="fab-add-task"
        style={styles.fab}
        onPress={() => navigation.navigate('TaskDetail', { taskId: null })}>
        <Text style={styles.fabIcon}>＋</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hamburgerBtn: {
    marginRight: 16,
    padding: 4,
  },
  hamburgerText: {
    fontSize: 32,
    color: '#E6EDF3',
    lineHeight: 32,
  },
  headerTitle: { fontSize: 26, fontWeight: '700', color: '#E6EDF3', letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 13, color: '#8B949E', marginTop: 2 },
  searchContainer: { paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#21262D' },
  searchInput: { backgroundColor: '#161B22', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, color: '#E6EDF3', fontSize: 15 },
  offlineBanner: {
    backgroundColor: '#3D1C00',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#D4860A',
  },
  offlineText: { color: '#E3B341', fontSize: 13, fontWeight: '600' },
  errorBanner: {
    backgroundColor: '#3D0000',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  errorText: { color: '#F85149', fontSize: 13 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  grow: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingVertical: 8 },
  emptyText: { color: '#8B949E', fontSize: 15, textAlign: 'center', paddingHorizontal: 32 },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#238636',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#238636',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  fabIcon: { fontSize: 28, color: '#FFFFFF', lineHeight: 32 },
});
