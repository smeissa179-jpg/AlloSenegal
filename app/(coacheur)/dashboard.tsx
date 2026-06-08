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
import colisService from '../../services/colisService';

export default function CoacheurDashboard() {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'chauffeurs' | 'demandes' | 'courses'>('chauffeurs');
  const [myDrivers, setMyDrivers] = useState<any[]>([]);
  const [clientRequests, setClientRequests] = useState<any[]>([]);
  const [activeCourses, setActiveCourses] = useState<any[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    await Promise.all([
      loadMyDrivers(),
      loadClientRequests(),
      loadActiveCourses(),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const loadMyDrivers = async () => {
    try {
      setLoadingDrivers(true);
      
      const { data, error } = await (supabase.from('profiles') as any)
        .select('id, first_name, last_name, phone, is_active, created_at')
        .eq('role', 'chauffeur')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Error drivers:', error.message);
        return;
      }

      setMyDrivers(data || []);
    } catch (error) {
      console.log('Catch drivers:', error);
    } finally {
      setLoadingDrivers(false);
    }
  };

  const loadClientRequests = async () => {
    try {
      setLoadingRequests(true);
      
      const { data, error } = await (supabase.from('colis') as any)
        .select(`
          id,
          point_depart,
          point_destination,
          description,
          poids,
          prix_offert,
          statut,
          id_client,
          created_at,
          profiles:id_client(first_name, last_name, phone)
        `)
        .eq('statut', 'en_attente')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.log('Error requests:', error.message);
        return;
      }

      setClientRequests(data || []);
    } catch (error) {
      console.log('Catch requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const loadActiveCourses = async () => {
    try {
      setLoadingCourses(true);
      
      const { data, error } = await (supabase.from('colis') as any)
        .select(`
          id,
          point_depart,
          point_destination,
          prix_offert,
          statut,
          id_client,
          id_chauffeur,
          created_at,
          profiles:id_client(first_name, last_name, phone),
          chauffeur:id_chauffeur(first_name, last_name, phone)
        `)
        .in('statut', ['accepte', 'en_cours'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.log('Error courses:', error.message);
        return;
      }

      setActiveCourses(data || []);
    } catch (error) {
      console.log('Catch courses:', error);
    } finally {
      setLoadingCourses(false);
    }
  };

  // Filtrage des trajets correspondants pour le coacheur
  const handleAssignDriver = async (request: any) => {
    const clientName = request.profiles?.first_name || 'Client';
    
    try {
      setLoadingRequests(true);

      // On verifie si un chauffeur a prevu ce trajet
      const { data: matchingTrajets, error } = await (supabase.from('trajets') as any)
        .select(`
          id_chauffeur,
          point_depart,
          point_destination,
          profiles:id_chauffeur(id, first_name, last_name, phone)
        `)
        .ilike('point_depart', `%${request.point_depart}%`)
        .ilike('point_destination', `%${request.point_destination}%`);

      if (error) throw error;

      const compatibleDrivers: any[] = [];
      const seenIds = new Set();

      if (matchingTrajets && matchingTrajets.length > 0) {
        matchingTrajets.forEach((t: any) => {
          if (t.profiles && !seenIds.has(t.profiles.id)) {
            seenIds.add(t.profiles.id);
            compatibleDrivers.push(t.profiles);
          }
        });
      }

      // Si aucun trajet ne correspond, on liste toute l'equipe
      const hasMatches = compatibleDrivers.length > 0;
      const finalDriversList = hasMatches ? compatibleDrivers : myDrivers;

      if (finalDriversList.length === 0) {
        Alert.alert('Attention', 'Aucun chauffeur n’est disponible actuellement.');
        return;
      }

      const driverOptions = finalDriversList.map((driver) => ({
        text: `${driver.first_name} ${driver.last_name} ${hasMatches ? '(Trajet correspondant)' : ''}`,
        onPress: () => assignDriverToRequest(request.id, driver.id, `${driver.first_name} ${driver.last_name}`, clientName),
      }));

      driverOptions.push({ text: 'Annuler', onPress: () => {} } as any);

      Alert.alert(
        hasMatches ? 'Chauffeur ideal trouve' : 'Assigner un chauffeur',
        hasMatches 
          ? `Chauffeur(s) disponible(s) pour la ligne [ ${request.point_depart} -> ${request.point_destination} ] :`
          : `Pas de trajet prevu pour cette ligne. Choisir un chauffeur de la liste globale pour ${clientName} :`,
        driverOptions as any
      );

    } catch (err) {
      console.log('Match error:', err);
      Alert.alert('Erreur', 'Impossible de chercher les correspondances.');
    } finally {
      setLoadingRequests(false);
    }
  };

  const assignDriverToRequest = async (requestId: number, driverId: string, driverName: string, clientName: string) => {
    try {
      await colisService.updateColis(requestId, {
        id_chauffeur: driverId,
        statut: 'accepte',
      });

      Alert.alert('Succes', `Le chauffeur ${driverName} a ete associe.`);

      await Promise.all([
        loadClientRequests(),
        loadActiveCourses(),
      ]);
    } catch (error) {
      console.log('Assign error:', error);
      Alert.alert('Erreur', 'Impossible d’assigner ce chauffeur.');
    }
  };

  const handleCompleteDelivery = (courseId: number, driverName: string) => {
    Alert.alert(
      'Terminer la course',
      `Cloturer la course de ${driverName} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'default',
          onPress: async () => {
            try {
              await colisService.updateColis(courseId, { statut: 'livré' });
              Alert.alert('Succes', 'Course terminee.');
              await loadActiveCourses();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de modifier le statut.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1f9d55" />}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.subtitle}>Coacheur connecte,</Text>
          <Text style={styles.title}>
            {profile?.first_name || 'Coacheur'} {profile?.last_name || ''}
          </Text>
        </View>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>Coacheur</Text>
        </View>
      </View>

      {/* Onglets */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab('chauffeurs')}
          style={[styles.tab, activeTab === 'chauffeurs' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'chauffeurs' && styles.tabTextActive]}>
            Chauffeurs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('demandes')}
          style={[styles.tab, activeTab === 'demandes' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'demandes' && styles.tabTextActive]}>
            Demandes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('courses')}
          style={[styles.tab, activeTab === 'courses' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'courses' && styles.tabTextActive]}>
            Courses
          </Text>
        </TouchableOpacity>
      </View>

      {/* Liste des Chauffeurs */}
      {activeTab === 'chauffeurs' && (
        <View style={styles.section}>
          {loadingDrivers ? (
            <View style={styles.emptyCard}>
              <ActivityIndicator color="#1f9d55" size="large" />
              <Text style={styles.emptyText}>Chargement des chauffeurs...</Text>
            </View>
          ) : myDrivers.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Aucun chauffeur dans votre equipe.</Text>
            </View>
          ) : (
            <View>
              {myDrivers.map((driver) => (
                <View key={driver.id} style={styles.driverCard}>
                  <View style={styles.driverHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.driverName}>
                        {driver.first_name} {driver.last_name}
                      </Text>
                      <Text style={styles.driverPhone}>Tel: {driver.phone || 'N/A'}</Text>
                    </View>
                    <View style={styles.activeIndicator}>
                      <View style={styles.activeDot} />
                      <Text style={styles.activeText}>Actif</Text>
                    </View>
                  </View>
                  <Text style={styles.driverDetailText}>
                    Inscrit le {new Date(driver.created_at).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Liste des Demandes */}
      {activeTab === 'demandes' && (
        <View style={styles.section}>
          {loadingRequests ? (
            <View style={styles.emptyCard}>
              <ActivityIndicator color="#1f9d55" size="large" />
              <Text style={styles.emptyText}>Recherche des correspondances...</Text>
            </View>
          ) : clientRequests.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Aucune demande en attente.</Text>
            </View>
          ) : (
            <View>
              {clientRequests.map((request) => (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.requestHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.requestRoute}>
                        {request.point_depart} → {request.point_destination}
                      </Text>
                      <Text style={styles.requestClient}>
                        Client: {request.profiles?.first_name || 'N/A'}
                      </Text>
                    </View>
                    <Text style={styles.requestPrice}>{request.prix_offert} FCFA</Text>
                  </View>

                  <Text style={styles.requestDescription}>{request.description}</Text>
                  <Text style={styles.requestMeta}>
                    Poids: {request.poids} kg
                  </Text>

                  <TouchableOpacity
                    style={styles.assignButton}
                    onPress={() => handleAssignDriver(request)}
                  >
                    <Text style={styles.assignButtonText}>Trouver &amp; Assigner Chauffeur</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Liste des Courses */}
      {activeTab === 'courses' && (
        <View style={styles.section}>
          {loadingCourses ? (
            <View style={styles.emptyCard}>
              <ActivityIndicator color="#1f9d55" size="large" />
              <Text style={styles.emptyText}>Chargement des courses...</Text>
            </View>
          ) : activeCourses.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Aucune course en cours.</Text>
            </View>
          ) : (
            <View>
              {activeCourses.map((course) => (
                <View key={course.id} style={styles.courseCard}>
                  <View style={styles.courseHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.courseRoute}>
                        {course.point_depart} → {course.point_destination}
                      </Text>
                    </View>
                    <View style={styles.statusTag}>
                      <Text style={styles.statusTagText}>{course.statut}</Text>
                    </View>
                  </View>

                  <Text style={styles.courseMeta}>
                    <Text style={{ fontWeight: 'bold' }}>Chauffeur:</Text> {course.chauffeur?.first_name || 'N/A'} {course.chauffeur?.last_name || ''}
                  </Text>
                  <Text style={styles.courseMeta}>
                    <Text style={{ fontWeight: 'bold' }}>Client:</Text> {course.profiles?.first_name || 'N/A'}
                  </Text>
                  <Text style={styles.courseMeta}>
                    <Text style={{ fontWeight: 'bold' }}>Prix:</Text> {course.prix_offert} FCFA
                  </Text>

                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={() => handleCompleteDelivery(course.id, course.chauffeur?.first_name || 'Chauffeur')}
                  >
                    <Text style={styles.completeButtonText}>Terminer Course</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <TouchableOpacity onPress={signOut} activeOpacity={0.8} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Se deconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#121214',
  },
  screenContent: {
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 14,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
  },
  roleBadge: {
    backgroundColor: 'rgba(31, 157, 85, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#1f9d55',
  },
  roleBadgeText: {
    color: '#1f9d55',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 15, 18, 0.5)',
    borderRadius: 12,
    padding: 5,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(31, 157, 85, 0.2)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#1f9d55',
    shadowColor: 'rgba(31, 157, 85, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    color: '#666670',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  section: {
    marginBottom: 32,
  },
  emptyCard: {
    backgroundColor: '#1e1e24',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1f2937',
    alignItems: 'center',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  driverCard: {
    backgroundColor: '#1a1a1f',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(31, 157, 85, 0.2)',
    marginBottom: 12,
    shadowColor: 'rgba(31, 157, 85, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  driverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  driverName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  driverPhone: {
    color: '#a1a1a8',
    fontSize: 13,
    fontWeight: '500',
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 157, 85, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(31, 157, 85, 0.4)',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#1f9d55',
    marginRight: 6,
  },
  activeText: {
    color: '#1f9d55',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  driverDetailText: {
    color: '#a1a1a8',
    fontSize: 12,
    fontWeight: '500',
  },
  requestCard: {
    backgroundColor: '#1a1a1f',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(31, 157, 85, 0.2)',
    marginBottom: 16,
    shadowColor: 'rgba(31, 157, 85, 0.1)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestRoute: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  requestClient: {
    color: '#a1a1a8',
    fontSize: 12,
    fontWeight: '500',
  },
  requestPrice: {
    color: '#0ea5e9',
    fontSize: 16,
    fontWeight: '700',
  },
  requestDescription: {
    color: '#d1d5db',
    fontSize: 12,
    marginBottom: 8,
  },
  requestMeta: {
    color: '#9ca3af',
    fontSize: 11,
    marginBottom: 12,
  },
  assignButton: {
    backgroundColor: '#1f9d55',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: 'rgba(31, 157, 85, 0.3)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  assignButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  courseCard: {
    backgroundColor: '#1a1a1f',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(31, 157, 85, 0.2)',
    marginBottom: 16,
    shadowColor: 'rgba(31, 157, 85, 0.1)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  courseRoute: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  statusTag: {
    backgroundColor: 'rgba(31, 157, 85, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(31, 157, 85, 0.2)',
  },
  statusTagText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  courseMeta: {
    color: '#a1a1a8',
    fontSize: 12,
    marginBottom: 8,
  },
  completeButton: {
    backgroundColor: '#1f9d55',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: 'rgba(31, 157, 85, 0.3)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  logoutButton: {
    backgroundColor: 'rgba(31, 41, 55, 0.4)',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  logoutText: {
    color: '#d1d5db',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});