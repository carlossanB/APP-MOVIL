import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { ITask } from '../../domain/models/ITask';
import { AvatarView } from './AvatarView';

interface TaskCardProps {
  task: ITask;
  onPress: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onPress }) => {
  const initials = task.title
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <TouchableOpacity
      testID={`task-card-${task.id}`}
      style={[styles.card, task.completed && styles.completed]}
      onPress={onPress}
      activeOpacity={0.75}>
      <AvatarView name={task.title} style={styles.avatar} />
      <View style={styles.content}>
        <Text style={[styles.title, task.completed && styles.titleCompleted]} numberOfLines={2}>
          {task.title}
        </Text>
        <View style={styles.badges}>
          {task.completed && (
            <View style={[styles.badge, styles.badgeDone]}>
              <Text style={styles.badgeText}>✓ Completado</Text>
            </View>
          )}
          {task.pendingSync && (
            <View style={[styles.badge, styles.badgePending]}>
              <Text style={styles.badgeText}>⏳ Pendiente</Text>
            </View>
          )}
          {!task.completed && !task.pendingSync && (
            <View style={[styles.badge, styles.badgeTodo]}>
              <Text style={styles.badgeText}>Por hacer</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B22',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#21262D',
    elevation: 2,
  },
  completed: { opacity: 0.65 },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  content: { flex: 1 },
  title: { fontSize: 15, color: '#E6EDF3', fontWeight: '600', marginBottom: 6 },
  titleCompleted: { textDecorationLine: 'line-through', color: '#8B949E' },
  badges: { flexDirection: 'row', gap: 6 },
  badge: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 },
  badgeDone: { backgroundColor: '#1A4731' },
  badgePending: { backgroundColor: '#3D2700' },
  badgeTodo: { backgroundColor: '#1C2128' },
  badgeText: { fontSize: 11, color: '#8B949E', fontWeight: '600' },
  chevron: { fontSize: 22, color: '#484F58', marginLeft: 6 },
});
