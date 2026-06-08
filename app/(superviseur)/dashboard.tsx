import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';

export default function SuperviseurDashboard() {
  const { profile, signOut } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalColis: 0,
    totalCourses: 0,
    totalCoacheurs: 0,
    totalChauffeurs: 0,
    totalClients: 0,
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [recentColis, setRecentColis] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  useEffect(() => {
    loadAllData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      console.log('[SuperviseurDashboard] Loading dashboard data...');
      
      // Fetch all stats
      await Promise.all([
        loadStats(),
        loadRecentColis(),
        loadRecentUsers(),
      ]);
    } catch (error) {
      console.error('[SuperviseurDashboard] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Count total users by role
      const { data: allUsers, error: usersError } = await (supabase.from('profiles') as any)
        .select('role', { count: 'exact' });

      if (usersError) throw usersError;

      const users = allUsers || [];
      const totalUsers = users.length;
      const totalCoacheurs = users.filter((u: any) => u.role === 'coacheur').length;
      const totalChauffeurs = users.filter((u: any) => u.role === 'chauffeur').length;
      const totalClients = users.filter((u: any) => u.role === 'client').length;

      // Count total colis
      const { count: colisCount, error: colisError } = await (supabase.from('colis') as any)
        .select('id', { count: 'exact' });

      if (colisError) throw colisError;

      // Count total courses (colis with statut accepte or en_cours)
      const { data: courses, error: coursesError } = await (supabase.from('colis') as any)
        .select('id')
        .in('statut', ['accepte', 'en_cours', 'livré']);

      if (coursesError) throw coursesError;

      console.log('[SuperviseurDashboard] Stats loaded:', {
        totalUsers,
        totalColis: colisCount,
        totalCourses: courses?.length || 0,
        totalCoacheurs,
        totalChauffeurs,
        totalClients,
      });

      setStats({
        totalUsers,
        totalColis: colisCount || 0,
        totalCourses: courses?.length || 0,
        totalCoacheurs,
        totalChauffeurs,
        totalClients,
      });
    } catch (error) {
      console.error('[SuperviseurDashboard] Error loading stats:', error);
    }
  };

  const loadRecentColis = async () => {
    try {
      const { data, error } = await (supabase.from('colis') as any)
        .select(`
          id,
          point_depart,
          point_destination,
          prix_offert,
          statut,
          created_at,
          profiles:id_client(first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      console.log('[SuperviseurDashboard] Recent colis loaded:', data?.length || 0);
      setRecentColis(data || []);
    } catch (error) {
      console.error('[SuperviseurDashboard] Error loading recent colis:', error);
    }
  };

  const loadRecentUsers = async () => {
    try {
      const { data, error } = await (supabase.from('profiles') as any)
        .select('id, first_name, last_name, role, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      console.log('[SuperviseurDashboard] Recent users loaded:', data?.length || 0);
      setRecentUsers(data || []);
    } catch (error) {
      console.error('[SuperviseurDashboard] Error loading recent users:', error);
    }
  };

  const StatCard = ({ label, value }: { label: string; value: number }) => (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.subtitle}>Bienvenue, Superviseur</Text>
          <Text style={styles.title}>
            {profile?.first_name || 'Superviseur'} {profile?.last_name || ''}
          </Text>
        </View>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>Superviseur</Text>
        </View>
      </View>

      {/* Statistics Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Statistiques Globales</Text>
        
        {loading ? (
          <View style={styles.emptyCard}>
            <ActivityIndicator color="#8b5cf6" size="large" />
            <Text style={styles.emptyText}>Chargement des statistiques...</Text>
          </View>
        ) : (
          <>
            <View style={styles.statsGrid}>
              <StatCard label="Utilisateurs totaux" value={stats.totalUsers} />
              <StatCard label="Colis" value={stats.totalColis} />
              <StatCard label="Courses en cours" value={stats.totalCourses} />
            </View>

            <View style={styles.statsGrid}>
              <StatCard label="Coacheurs" value={stats.totalCoacheurs} />
              <StatCard label="Chauffeurs" value={stats.totalChauffeurs} />
              <StatCard label="Clients" value={stats.totalClients} />
            </View>
          </>
        )}
      </View>

      {/* Recent Colis */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📦 Colis Récents</Text>

        {recentColis.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Aucun colis.</Text>
          </View>
        ) : (
          <View>
            {recentColis.map((colis) => (
              <View key={colis.id} style={styles.colisCard}>
                <View style={styles.colisHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.colisRoute}>
                      {colis.point_depart} → {colis.point_destination}
                    </Text>
                    <Text style={styles.colisMeta}>
                      Client: {colis.profiles?.first_name || 'N/A'} | Statut: {colis.statut}
                    </Text>
                  </View>
                  <Text style={styles.colisPrice}>{colis.prix_offert} FCFA</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Recent Users */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👥 Utilisateurs Récents</Text>

        {recentUsers.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Aucun utilisateur.</Text>
          </View>
        ) : (
          <View>
            {recentUsers.map((user) => (
              <View key={user.id} style={styles.userCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>
                    {user.first_name} {user.last_name}
                  </Text>
                  <Text style={styles.userRole}>
                    Rôle: {user.role} | Inscrit: {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <TouchableOpacity onPress={signOut} activeOpacity={0.8} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  screenContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f3f4f6',
  },
  roleBadge: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f3f4f6',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f3f4f6',
  },
  colisCard: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  colisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  colisRoute: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f3f4f6',
  },
  colisMeta: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  colisPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8b5cf6',
  },
  userCard: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f3f4f6',
  },
  userRole: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: '#2a2a2a',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
