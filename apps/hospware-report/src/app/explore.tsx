import { useState } from 'react';
import { ScrollView, StyleSheet, View, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface HousekeepingRoom {
  id: string;
  roomNumber: string;
  floor: string;
  typeName: string;
  status: 'dirty' | 'cleaning' | 'clean';
  priority: 'urgent' | 'normal';
  notes: string;
}

const INITIAL_TASKS: HousekeepingRoom[] = [
  {
    id: '1',
    roomNumber: '103',
    floor: '1',
    typeName: 'Deluxe Queen',
    status: 'dirty',
    priority: 'urgent',
    notes: 'Guest checked out 11:00 AM. Next check-in arriving 2:00 PM.',
  },
  {
    id: '2',
    roomNumber: '202',
    floor: '2',
    typeName: 'Standard Double',
    status: 'cleaning',
    priority: 'normal',
    notes: 'Linen change and minibar restock in progress.',
  },
  {
    id: '3',
    roomNumber: '303',
    floor: '3',
    typeName: 'Standard Double',
    status: 'dirty',
    priority: 'normal',
    notes: 'Routine daily cleaning requested by guest.',
  },
  {
    id: '4',
    roomNumber: '101',
    floor: '1',
    typeName: 'Standard King',
    status: 'clean',
    priority: 'normal',
    notes: 'Inspected and certified ready by supervisor.',
  },
  {
    id: '5',
    roomNumber: '204',
    floor: '2',
    typeName: 'Executive Suite',
    status: 'clean',
    priority: 'normal',
    notes: 'Ready for VIP arrival.',
  },
];

export default function HousekeepingScreen() {
  const theme = useTheme();
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [filter, setFilter] = useState<'all' | 'dirty' | 'clean'>('all');

  const handleAdvanceStatus = (roomId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === roomId) {
        if (t.status === 'dirty') {
          return { ...t, status: 'cleaning' };
        } else if (t.status === 'cleaning') {
          return { ...t, status: 'clean', notes: 'Cleaned and ready for reception' };
        }
      }
      return t;
    }));
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'dirty') return t.status === 'dirty' || t.status === 'cleaning';
    if (filter === 'clean') return t.status === 'clean';
    return true;
  });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/images/hospware-logo.png')}
              style={{ width: 105, height: 28, resizeMode: 'contain', marginBottom: 4 }}
            />
            <ThemedText type="smallBold" style={{ color: '#f59e0b' }}>
              HOUSEKEEPING & FLOOR OPS
            </ThemedText>
            <ThemedText type="title" style={styles.title}>
              Room Cleaning Tasks
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Tap room cards to update status in real-time
            </ThemedText>
          </View>

          {/* Filter Pills */}
          <View style={styles.filterRow}>
            {(['all', 'dirty', 'clean'] as const).map(f => (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                style={[
                  styles.filterPill,
                  filter === f ? styles.filterPillActive : styles.filterPillInactive
                ]}
              >
                <ThemedText 
                  type="smallBold" 
                  style={{ color: filter === f ? '#fff' : theme.textSecondary }}
                >
                  {f === 'all' ? 'All Rooms' : f === 'dirty' ? 'Needs Cleaning' : 'Clean & Ready'}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          {/* Task List */}
          <View style={styles.taskList}>
            {filteredTasks.map(room => (
              <ThemedView key={room.id} type="backgroundElement" style={styles.taskCard}>
                <View style={styles.cardTop}>
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ThemedText type="subtitle" style={{ fontSize: 18 }}>
                        Room {room.roomNumber}
                      </ThemedText>
                      {room.priority === 'urgent' && (
                        <View style={styles.urgentBadge}>
                          <ThemedText type="smallBold" style={{ color: '#ef4444', fontSize: 11 }}>
                            URGENT
                          </ThemedText>
                        </View>
                      )}
                    </View>
                    <ThemedText type="small" themeColor="textSecondary">
                      Floor {room.floor} • {room.typeName}
                    </ThemedText>
                  </View>

                  <View 
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: 
                          room.status === 'clean' ? 'rgba(16, 185, 129, 0.15)' :
                          room.status === 'cleaning' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(245, 158, 11, 0.15)'
                      }
                    ]}
                  >
                    <ThemedText 
                      type="smallBold"
                      style={{
                        color: 
                          room.status === 'clean' ? '#10b981' :
                          room.status === 'cleaning' ? '#6366f1' : '#f59e0b',
                        fontSize: 12
                      }}
                    >
                      {room.status === 'clean' ? 'READY' : room.status === 'cleaning' ? 'CLEANING' : 'DIRTY'}
                    </ThemedText>
                  </View>
                </View>

                <ThemedText type="default" style={styles.notesText}>
                  {room.notes}
                </ThemedText>

                {room.status !== 'clean' && (
                  <Pressable
                    onPress={() => handleAdvanceStatus(room.id)}
                    style={({ pressed }) => [
                      styles.actionBtn,
                      {
                        backgroundColor: room.status === 'dirty' ? '#6366f1' : '#10b981',
                        opacity: pressed ? 0.8 : 1
                      }
                    ]}
                  >
                    <ThemedText type="smallBold" style={{ color: '#fff' }}>
                      {room.status === 'dirty' ? 'Start Cleaning' : '✓ Mark Clean & Inspected'}
                    </ThemedText>
                  </Pressable>
                )}
              </ThemedView>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.five,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 2,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.four,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  filterPillActive: {
    backgroundColor: '#6366f1',
  },
  filterPillInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  taskList: {
    gap: Spacing.three,
  },
  taskCard: {
    padding: Spacing.three,
    borderRadius: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  urgentBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  notesText: {
    fontSize: 13,
    color: '#94a3b8',
    marginVertical: 8,
  },
  actionBtn: {
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
});
