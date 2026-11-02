import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Pressable, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ActivityItem {
  id: string;
  type: 'payment' | 'check_in' | 'clean' | 'alert';
  title: string;
  desc: string;
  time: string;
  amount?: string;
}

const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: '1',
    type: 'payment',
    title: 'Payment Received',
    desc: 'Kwesi Appiah paid GH₵ 770.00 for Room 102 (MTN MoMo)',
    time: '2 mins ago',
    amount: '+GH₵ 770.00',
  },
  {
    id: '2',
    type: 'check_in',
    title: 'Guest Check-In',
    desc: 'Akosua Mensah checked into Executive Suite 201 (2 nights)',
    time: '14 mins ago',
  },
  {
    id: '3',
    type: 'clean',
    title: 'Room Cleaned & Ready',
    desc: 'Room 104 inspected and approved by Floor Supervisor',
    time: '28 mins ago',
  },
  {
    id: '4',
    type: 'payment',
    title: 'Deposit Recorded',
    desc: 'Yaw Boateng paid GH₵ 1,900.00 for Penthouse 302 (Card)',
    time: '45 mins ago',
    amount: '+GH₵ 1,900.00',
  },
  {
    id: '5',
    type: 'alert',
    title: 'Maintenance Logged',
    desc: 'Room 203: Air conditioning service scheduled',
    time: '1 hour ago',
  },
];

export default function OwnerReportScreen() {
  const theme = useTheme();
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  };

  const handleSimulateNewNotification = () => {
    const newItems: ActivityItem[] = [
      {
        id: Date.now().toString(),
        type: 'payment',
        title: 'New Folio Payment',
        desc: `Room 104: Payment of GH₵ 495.00 logged by Reception`,
        time: 'Just now',
        amount: '+GH₵ 495.00',
      },
      {
        id: (Date.now() + 1).toString(),
        type: 'clean',
        title: 'Housekeeping Update',
        desc: 'Room 303 marked Clean by Floor Team',
        time: 'Just now',
      },
    ];

    setActivities(prev => [newItems[Math.floor(Math.random() * newItems.length)], ...prev]);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Image
                source={require('../../assets/images/hospware-logo.png')}
                style={{ width: 115, height: 32, resizeMode: 'contain', marginBottom: 4 }}
              />
              <ThemedText type="smallBold" style={{ color: '#10b981' }}>
                ● SUPABASE CLOUD LIVE
              </ThemedText>
              <ThemedText type="title" style={styles.hotelTitle}>
                Grand Azure Resort
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Executive Owner Dashboard & Activity Feed
              </ThemedText>
            </View>

            <Pressable 
              onPress={handleSimulateNewNotification}
              style={({ pressed }) => [
                styles.simulateButton,
                { opacity: pressed ? 0.7 : 1 }
              ]}
            >
              <ThemedText type="smallBold" style={{ color: '#6366f1' }}>
                + Test Alert
              </ThemedText>
            </Pressable>
          </View>

          {/* KPI Summary Cards */}
          <View style={styles.kpiRow}>
            <ThemedView type="backgroundElement" style={styles.kpiCard}>
              <ThemedText type="small" themeColor="textSecondary">TODAY&apos;S REVENUE</ThemedText>
              <ThemedText type="title" style={{ color: '#10b981', fontSize: 22, marginTop: 4 }}>
                GH₵ 3,850.00
              </ThemedText>
              <ThemedText type="small" style={{ color: '#10b981', marginTop: 2 }}>
                ▲ +14% vs yesterday
              </ThemedText>
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.kpiCard}>
              <ThemedText type="small" themeColor="textSecondary">OCCUPANCY</ThemedText>
              <ThemedText type="title" style={{ fontSize: 22, marginTop: 4 }}>
                78%
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 2 }}>
                35 / 45 Rooms
              </ThemedText>
            </ThemedView>
          </View>

          <View style={styles.kpiRow}>
            <ThemedView type="backgroundElement" style={styles.kpiCard}>
              <ThemedText type="small" themeColor="textSecondary">CHECK-INS TODAY</ThemedText>
              <ThemedText type="title" style={{ fontSize: 20, marginTop: 4, color: '#6366f1' }}>
                12 In • 4 Pending
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 2 }}>
                8 Expected Check-Outs
              </ThemedText>
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.kpiCard}>
              <ThemedText type="small" themeColor="textSecondary">ROOM READINESS</ThemedText>
              <ThemedText type="title" style={{ fontSize: 20, marginTop: 4, color: '#f59e0b' }}>
                32 Clean • 6 Dirty
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 2 }}>
                2 in Maintenance
              </ThemedText>
            </ThemedView>
          </View>

          {/* Activity Section Header */}
          <View style={styles.sectionHeaderRow}>
            <ThemedText type="subtitle" style={{ fontSize: 18 }}>
              Live Operational Stream
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Realtime Push
            </ThemedText>
          </View>

          {/* Feed List */}
          <View style={styles.feedContainer}>
            {activities.map((item) => (
              <ThemedView key={item.id} type="backgroundElement" style={styles.feedItem}>
                <View style={styles.feedTopRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View 
                      style={[
                        styles.badgeDot, 
                        { 
                          backgroundColor: 
                            item.type === 'payment' ? '#10b981' : 
                            item.type === 'check_in' ? '#6366f1' : 
                            item.type === 'clean' ? '#f59e0b' : '#ef4444' 
                        }
                      ]} 
                    />
                    <ThemedText type="smallBold">{item.title}</ThemedText>
                  </View>
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.time}
                  </ThemedText>
                </View>

                <ThemedText type="default" style={{ marginTop: 4, fontSize: 14 }}>
                  {item.desc}
                </ThemedText>

                {item.amount && (
                  <ThemedText type="smallBold" style={{ color: '#10b981', marginTop: 4 }}>
                    {item.amount}
                  </ThemedText>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.four,
    paddingBottom: Spacing.two,
  },
  hotelTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 2,
  },
  simulateButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  kpiCard: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.three,
    marginBottom: Spacing.three,
  },
  feedContainer: {
    gap: Spacing.three,
  },
  feedItem: {
    padding: Spacing.three,
    borderRadius: 12,
  },
  feedTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
