import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image, // <-- Ajouté pour afficher la photo
} from 'react-native';
import * as ImagePicker from 'expo-image-picker'; // <-- Importation ES6 directe et stable
import { useAuth } from '../../context/AuthContext';
import colisService from '../../services/colisService';
import trajetService from '../../services/trajetService';
import vehicleService from '../../services/vehicleService';

export default function ChauffeurDashboard() {
  const { profile, signOut } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  
  // Vehicle form state
  const [plate, setPlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [placesDisponibles, setPlacesDisponibles] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Trajet form state
  const [pointDepart, setPointDepart] = useState('');
  const [pointDestination, setPointDestination] = useState('');
  const [heureDepart, setHeureDepart] = useState('');
  const [heureArrivee, setHeureArrivee] = useState('');
  const [prixEstime, setPrixEstime] = useState('');
  const [description, setDescription] = useState('');
  const [transportType, setTransportType] = useState<'commun' | 'prive'>('commun');
  
  const [statutTrajet, setStatutTrajet] = useState<string>('disponible');
  
  const [trajets, setTrajets] = useState<any[]>([]);
  const [loadingTrajets, setLoadingTrajets] = useState(false);
  const [showTrajetForm, setShowTrajetForm] = useState(false);
  const [editingTrajetId, setEditingTrajetId] = useState<number | null>(null);

  // Colis assignes state
  const [assignedColis, setAssignedColis] = useState<any[]>([]);
  const [loadingColis, setLoadingColis] = useState(false);
  const [colisAmount, setColisAmount] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    if (profile?.id) {
      loadTrajets();
      loadAssignedColis();
    }
  }, [profile?.id]);

  const loadTrajets = async () => {
    try {
      setLoadingTrajets(true);
      if (!profile?.id) return;
      const allTrajets = await trajetService.fetchTrajetsForDriver(profile.id);
      setTrajets(allTrajets);
    } catch (error) {
      console.log('Erreur trajets:', error);
    } finally {
      setLoadingTrajets(false);
    }
  };

  const loadAssignedColis = async () => {
    try {
      setLoadingColis(true);
      if (!profile?.id) return;
      const colis = await colisService.fetchColisForDriver(profile.id);
      setAssignedColis(colis);
    } catch (error) {
      console.log('Erreur colis:', error);
    } finally {
      setLoadingColis(false);
    }
  };

  const verifierVehicule = () => {
    if (!brand.trim()) {
      Alert.alert('Controle obligatoire', 'La marque de la voiture est obligatoire.');
      return false;
    }

    const seats = parseInt(placesDisponibles, 10);
    if (isNaN(seats) || seats <= 0) {
      Alert.alert('Controle obligatoire', 'Le nombre de places doit etre un chiffre valide superieur a 0.');
      return false;
    }

    if (seats > 7) {
      Alert.alert('Controle securite', 'Le nombre de places ne peut pas depasser 7 pour ce type de vehicule.');
      return false;
    }

    return true;
  };

  const formatTimeInput = (timeStr: string): string => {
    if (!timeStr) return '';
    timeStr = timeStr.trim();
    let hours: string;
    let minutes: string;
    
    if (timeStr.includes('h')) {
      const parts = timeStr.split('h');
      hours = parts[0].trim();
      minutes = parts[1]?.replace(/[^0-9]/g, '').trim() || '00';
    } else if (timeStr.includes(':')) {
      const parts = timeStr.split(':');
      hours = parts[0].trim();
      minutes = parts[1]?.trim() || '00';
    } else {
      return '';
    }
    
    hours = hours.padStart(2, '0');
    minutes = minutes.padStart(2, '0');
    
    const h = parseInt(hours);
    const m = parseInt(minutes);
    if (h < 0 || h > 23 || m < 0 || m > 59) return '';
    
    return `${hours}:${minutes}:00`;
  };

  const handleAddOrUpdateTrajet = async () => {
    if (!pointDepart.trim() || !pointDestination.trim() || !heureDepart.trim() || !heureArrivee.trim()) {
      Alert.alert('Champs requis', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const formattedHeureDepart = formatTimeInput(heureDepart);
    const formattedHeureArrivee = formatTimeInput(heureArrivee);
    
    if (!formattedHeureDepart || !formattedHeureArrivee) {
      Alert.alert('Format invalide', 'Utilisez le format: 8h30 ou 08:30');
      return;
    }

    if (!profile?.id) return;

    try {
      setLoadingTrajets(true);
      const parsedPrice = prixEstime && !isNaN(parseFloat(prixEstime)) ? parseFloat(prixEstime) : 0;

      if (editingTrajetId) {
        await trajetService.updateTrajet(editingTrajetId, {
          point_depart: pointDepart,
          point_destination: pointDestination,
          heure_depart: formattedHeureDepart,
          heure_arrivee: formattedHeureArrivee,
          prix_estime: parsedPrice,
          description: description || null,
          statut: statutTrajet,
        });
        Alert.alert('Succes', 'Trajet modifie.');
        setEditingTrajetId(null);
      } else {
        await trajetService.createTrajet({
          id_chauffeur: profile.id,
          point_depart: pointDepart,
          point_destination: pointDestination,
          heure_depart: formattedHeureDepart,
          heure_arrivee: formattedHeureArrivee,
          prix_estime: parsedPrice,
          description: description || null,
          statut: statutTrajet,
        });
        Alert.alert('Succes', 'Trajet cree.');
      }
      
      resetTrajetForm();
      await loadTrajets();
      setShowTrajetForm(false);
    } catch (error) {
      console.log('Erreur save trajet:', error);
    } finally {
      setLoadingTrajets(false);
    }
  };

  const handleUpdateColisAmount = async (colisId: number) => {
    const amount = colisAmount[colisId];
    if (!amount || isNaN(parseFloat(amount))) {
      Alert.alert('Erreur', 'Montant invalide.');
      return;
    }
    try {
      setLoadingColis(true);
      await colisService.updateColis(colisId, { prix_offert: parseFloat(amount) });
      Alert.alert('Succès', 'Proposition de prix mise à jour.');
      await loadAssignedColis();
    } catch (error) {
      console.log('Erreur prix colis:', error);
    } finally {
      setLoadingColis(false);
    }
  };

  const handleAcceptColis = async (colisId: number) => {
    const amount = colisAmount[colisId];
    if (!amount || isNaN(parseFloat(amount))) {
      Alert.alert('Erreur', 'Saisir un montant valide avant d\'accepter.');
      return;
    }
    try {
      setLoadingColis(true);
      await colisService.updateColis(colisId, {
        prix_offert: parseFloat(amount),
        statut: 'accepte',
      });
      Alert.alert('Succès', 'Colis accepté !');
      await loadAssignedColis();
    } catch (error) {
      console.log('Erreur accept colis:', error);
    } finally {
      setLoadingColis(false);
    }
  };

  const handleRejectColis = async (colisId: number) => {
    Alert.alert('Confirmation', 'Refuser ce colis ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Refuser',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoadingColis(true);
            await colisService.updateColis(colisId, { statut: 'en_attente', id_chauffeur: null });
            await loadAssignedColis();
          } catch (error) {
            console.log('Erreur refus:', error);
          } finally {
            setLoadingColis(false);
          }
        },
      },
    ]);
  };

  const resetTrajetForm = () => {
    setPointDepart('');
    setPointDestination('');
    setHeureDepart('');
    setHeureArrivee('');
    setPrixEstime('');
    setDescription('');
    setStatutTrajet('disponible');
    setEditingTrajetId(null);
  };

  const handleEditTrajet = (trajet: any) => {
    setEditingTrajetId(trajet.id);
    setPointDepart(trajet.point_depart);
    setPointDestination(trajet.point_destination);
    setHeureDepart(trajet.heure_depart);
    setHeureArrivee(trajet.heure_arrivee);
    setPrixEstime(trajet.prix_estime.toString());
    setDescription(trajet.description || '');
    setStatutTrajet(trajet.statut || 'disponible');
    setShowTrajetForm(true);
    setTransportType(trajet.transport_type || 'commun');
  };

  const handleDeleteTrajet = async (trajetId: number) => {
    Alert.alert('Confirmation', 'Supprimer ce trajet ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoadingTrajets(true);
            await trajetService.deleteTrajet(trajetId);
            await loadTrajets();
          } catch (error) {
            console.log('Erreur delete:', error);
          } finally {
            setLoadingTrajets(false);
          }
        },
      },
    ]);
  };

  // Sélectionner une photo depuis la galerie
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'L\'accès à la galerie est nécessaire.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.6,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Erreur sélection image:', error);
    }
  };

  // Prendre une photo avec l'appareil photo
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'L\'accès à la caméra est nécessaire.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.6,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Erreur capture image:', error);
    }
  };

  const handleAddVehicle = async () => {
    if (!plate.trim() || !brand.trim() || !model.trim() || !placesDisponibles.trim()) {
      Alert.alert('Champs requis', 'Veuillez renseigner l’immatriculation, la marque, le modele et le nbr de places.');
      return;
    }

    if (!verifierVehicule()) return;

    setUploading(true);
    try {
      const userId = profile?.id;
      if (!userId) return;

      let photoUrl: string | null = null;
      if (photoUri) {
        photoUrl = await vehicleService.uploadVehiclePhoto(userId, photoUri);
      }

      await vehicleService.addOrUpdateVehicle(userId, {
        vehicle_plate: plate,
        brand,
        vehicle_model: model,
        color,
        places_disponibles: parseInt(placesDisponibles, 10),
        vehicle_insurance_url: photoUrl ?? null,
      });

      Alert.alert('Succes', 'Vehicule enregistre avec succes.');
      setPlate('');
      setBrand('');
      setModel('');
      setColor('');
      setPlacesDisponibles('');
      setPhotoUri(null); // Reset de l'aperçu après envoi
    } catch (error) {
      console.log('Erreur ajout vehicule:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
      {/* Header Section */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.subtitle}>Chauffeur connecte,</Text>
          <Text style={styles.title}>
            {profile?.first_name || 'Chauffeur'} {profile?.last_name || ''}
          </Text>
        </View>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>Chauffeur</Text>
        </View>
      </View>

      {/* Online Status Toggle Box */}
      <View style={[styles.statusCard, isOnline ? styles.onlineStatus : styles.offlineStatus]}>
        <View style={styles.statusHeaderRow}>
          <View style={[styles.statusDot, isOnline ? styles.dotOnline : styles.dotOffline]} />
          <Text style={[styles.statusTitle, isOnline ? styles.onlineText : styles.offlineText]}>
            Vous etes {isOnline ? 'EN LIGNE' : 'HORS LIGNE'}
          </Text>
        </View>
        
        <Text style={styles.statusDescription}>
          {isOnline ? 'Visible pour les clients. Vous pouvez recevoir des demandes.' : 'Activez votre statut pour apparaitre sur la carte des clients.'}
        </Text>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setIsOnline((prev) => !prev)}
          style={[styles.statusToggleBtn, isOnline ? styles.btnOnlineActive : styles.btnOfflineActive]}
        >
          <Text style={styles.statusToggleBtnText}>
            {isOnline ? 'Passer hors ligne' : 'Passer en ligne'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Section 1: Ajout Vehicule */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ajout Vehicule</Text>
        <View style={styles.formCard}>
          <Text style={styles.label}>Immatriculation</Text>
          <TextInput value={plate} onChangeText={setPlate} placeholder="Ex: 1234 AB 56" placeholderTextColor="#6b7280" style={styles.input} />

          <Text style={styles.label}>Marque</Text>
          <TextInput value={brand} onChangeText={setBrand} placeholder="Ex: Toyota" placeholderTextColor="#6b7280" style={styles.input} />

          <Text style={styles.label}>Modele</Text>
          <TextInput value={model} onChangeText={setModel} placeholder="Ex: Corolla" placeholderTextColor="#6b7280" style={styles.input} />

          <Text style={styles.label}>Couleur</Text>
          <TextInput value={color} onChangeText={setColor} placeholder="Ex: Noir" placeholderTextColor="#6b7280" style={styles.input} />

          <Text style={styles.label}>Nombre de places disponibles</Text>
          <TextInput 
            value={placesDisponibles} 
            onChangeText={setPlacesDisponibles} 
            placeholder="Ex: 4" 
            keyboardType="numeric"
            placeholderTextColor="#6b7280" 
            style={styles.input} 
          />

          {/* Boutons d'action pour la photo */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, marginBottom: 4 }}>
            <TouchableOpacity onPress={pickImage} style={[styles.actionButton, styles.editButton, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.actionTextSecondary}>Joindre photo</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={takePhoto} style={[styles.actionButton, styles.acceptButton, { flex: 1 }]}>
              <Text style={styles.actionText}>Prendre photo</Text>
            </TouchableOpacity>
          </View>

          {/* Aperçu Visuel Dynamique */}
          {photoUri && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>📸 Aperçu du document sélectionné :</Text>
              <Image source={{ uri: photoUri }} style={styles.imagePreview} />
              <TouchableOpacity onPress={() => setPhotoUri(null)} style={styles.removeImageBtn}>
                <Text style={styles.removeImageText}>Supprimer la photo</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity 
            style={[styles.checkButton, { marginTop: 16 }]}
            onPress={() => {
              if (verifierVehicule()) {
                Alert.alert('Controle Reussi', 'La marque et le nombre de places sont conformes.');
              }
            }}
          >
            <Text style={styles.checkButtonText}>Controle de conformite vehicule</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleAddVehicle} style={styles.submitButton} disabled={uploading}>
            <Text style={styles.submitButtonText}>{uploading ? 'Enregistrement...' : 'Ajouter le vehicule'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Section 2: Mes Trajets */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes Trajets</Text>
          <TouchableOpacity onPress={() => { resetTrajetForm(); setShowTrajetForm(!showTrajetForm); }}>
            <Text style={styles.addButton}>{showTrajetForm ? 'Fermer' : '+ Ajouter'}</Text>
          </TouchableOpacity>
        </View>

        {showTrajetForm && (
          <View style={styles.formCard}>
            <Text style={styles.label}>Point de depart</Text>
            <TextInput value={pointDepart} onChangeText={setPointDepart} placeholder="Ex: Parcelles Assainies" placeholderTextColor="#6b7280" style={styles.input} />

            <Text style={styles.label}>Point de destination</Text>
            <TextInput value={pointDestination} onChangeText={setPointDestination} placeholder="Ex: Plateau" placeholderTextColor="#6b7280" style={styles.input} />

            <Text style={styles.label}>Heure de depart</Text>
            <TextInput value={heureDepart} onChangeText={setHeureDepart} placeholder="HH:MM (08:00)" placeholderTextColor="#6b7280" style={styles.input} />

            <Text style={styles.label}>Heure d'arrivee</Text>
            <TextInput value={heureArrivee} onChangeText={setHeureArrivee} placeholder="HH:MM (09:30)" placeholderTextColor="#6b7280" style={styles.input} />

            <Text style={styles.label}>Prix estime (FCFA)</Text>
            <TextInput value={prixEstime} onChangeText={setPrixEstime} placeholder="2500" placeholderTextColor="#6b7280" style={styles.input} />
            <Text style={styles.label}>Mode de transport</Text>

<View style={styles.transportTypeRow}>
  <TouchableOpacity
    style={[
      styles.transportTypeButton,
      transportType === 'commun' ? styles.transportTypeActive : null,
    ]}
    onPress={() => setTransportType('commun')}
  >
    <Text
      style={[
        styles.transportTypeText,
        transportType === 'commun' ? styles.transportTypeTextActive : null,
      ]}
    >
      Transport partagé
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[
      styles.transportTypeButton,
      transportType === 'prive' ? styles.transportTypeActive : null,
    ]}
    onPress={() => setTransportType('prive')}
  >
    <Text
      style={[
        styles.transportTypeText,
        transportType === 'prive' ? styles.transportTypeTextActive : null,
      ]}
    >
      Transport privé
    </Text>
  </TouchableOpacity>
</View>

            <Text style={styles.label}>Statut du trajet</Text>
            <View style={styles.statusToggleRow}>
              <TouchableOpacity 
                style={[styles.statusSelectTab, statutTrajet === 'disponible' && styles.tabDisp]} 
                onPress={() => setStatutTrajet('disponible')}
              >
                <Text style={[styles.statusSelectText, statutTrajet === 'disponible' && styles.textActive]}>Disponible</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.statusSelectTab, statutTrajet === 'en_cours' && styles.tabCours]} 
                onPress={() => setStatutTrajet('en_cours')}
              >
                <Text style={[styles.statusSelectText, statutTrajet === 'en_cours' && styles.textActive]}>En cours</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.statusSelectTab, statutTrajet === 'termine' && styles.tabTerm]} 
                onPress={() => setStatutTrajet('termine')}
              >
                <Text style={[styles.statusSelectText, statutTrajet === 'termine' && styles.textActive]}>Termine</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Description</Text>
            <TextInput value={description} onChangeText={setDescription} placeholder="Notes..." placeholderTextColor="#6b7280" style={[styles.input, { height: 60 }]} multiline />

            <TouchableOpacity onPress={handleAddOrUpdateTrajet} style={styles.submitButton} disabled={loadingTrajets}>
              <Text style={styles.submitButtonText}>
                {loadingTrajets ? 'Sauvegarde...' : (editingTrajetId ? 'Modifier' : 'Ajouter')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {loadingTrajets ? (
          <ActivityIndicator size="small" color="#0ea5e9" style={{ marginVertical: 12 }} />
        ) : (
          trajets.map((trajet) => (
            <View key={trajet.id} style={styles.trajetCard}>
              <View style={styles.trajetHeader}>
                <Text style={styles.trajetRoute}>{trajet.point_depart} → {trajet.point_destination}</Text>
                <Text style={styles.trajetPrice}>{trajet.prix_estime} FCFA</Text>
              </View>
              <Text style={styles.trajetTime}>⏰ {trajet.heure_depart} - {trajet.heure_arrivee} | Statut: {trajet.statut || 'disponible'}</Text>
              <Text style={styles.transportDisplay}>
  {trajet.transport_type === 'prive'
    ? 'Transport privé'
    : 'Transport commun'}
</Text>
              <View style={styles.trajetActions}>
                <TouchableOpacity onPress={() => handleEditTrajet(trajet)} style={[styles.actionButton, styles.editButton, { marginRight: 8 }]}>
                  <Text style={styles.actionTextSecondary}>Modifier</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteTrajet(trajet.id)} style={[styles.actionButton, styles.deleteButton]}>
                  <Text style={styles.actionTextSecondary}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Section 3: Demandes de Colis Assignés */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Demandes de Colis Assignés</Text>
        {loadingColis ? (
          <ActivityIndicator size="small" color="#0ea5e9" style={{ marginVertical: 12 }} />
        ) : assignedColis.length === 0 ? (
          <Text style={styles.emptyText}>Aucun colis ne vous est assigné actuellement.</Text>
        ) : (
          assignedColis.map((colis) => (
            <View key={colis.id} style={styles.colisCard}>
              <View style={styles.colisHeader}>
                <Text style={styles.colisTitle}>📦 {colis.nom_colis || 'Colis sans nom'}</Text>
                <Text style={[styles.statusBadge, colis.statut === 'accepte' ? styles.statusAccept : styles.statusPending]}>
                  {colis.statut}
                </Text>
              </View>
              
              <Text style={styles.colisDetails}><Text style={styles.boldText}>Description:</Text> {colis.description || 'Aucune'}</Text>
              <Text style={styles.colisDetails}><Text style={styles.boldText}>Prix Proposé:</Text> {colis.prix_offert || 0} FCFA</Text>
              
              <View style={styles.colisActionForm}>
                <TextInput
                  placeholder="Nouveau prix (FCFA)"
                  placeholderTextColor="#6b7280"
                  keyboardType="numeric"
                  value={colisAmount[colis.id] || ''}
                  onChangeText={(text) => setColisAmount(prev => ({ ...prev, [colis.id]: text }))}
                  style={styles.colisInput}
                />
                
                <View style={styles.colisButtonsRow}>
                  <TouchableOpacity 
                    onPress={() => handleUpdateColisAmount(colis.id)} 
                    style={[styles.actionButton, styles.editButton, { flex: 1, marginRight: 6 }]}
                  >
                    <Text style={styles.actionTextSecondary}>Proposer Prix</Text>
                  </TouchableOpacity>
                  
                  {colis.statut !== 'accepte' && (
                    <TouchableOpacity 
                      onPress={() => handleAcceptColis(colis.id)} 
                      style={[styles.actionButton, styles.acceptButton, { flex: 1, marginRight: 6 }]}
                    >
                      <Text style={styles.actionText}>Accepter</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity 
                    onPress={() => handleRejectColis(colis.id)} 
                    style={[styles.actionButton, styles.deleteButton, { flex: 1 }]}
                  >
                    <Text style={styles.actionText}>Refuser</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Bouton de deconnexion */}
      <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Se deconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#121214' },
  screenContent: { paddingHorizontal: 24, paddingVertical: 48 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  subtitle: { color: '#9ca3af', fontSize: 13 },
  title: { color: '#ffffff', fontSize: 24, fontWeight: '700' },
  roleBadge: { backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  roleBadgeText: { color: '#0ea5e9', fontSize: 12, fontWeight: '600' },
  
  statusCard: { padding: 20, borderRadius: 14, marginBottom: 24, borderWidth: 1 },
  onlineStatus: { backgroundColor: '#064e3b', borderColor: '#059669' },
  offlineStatus: { backgroundColor: '#1c1917', borderColor: '#44403c' },
  
  statusHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  dotOnline: { backgroundColor: '#34d399' },
  dotOffline: { backgroundColor: '#ef4444' },
  
  statusTitle: { fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  onlineText: { color: '#34d399' },
  offlineText: { color: '#ef4444' },
  statusDescription: { color: '#9ca3af', fontSize: 12, lineHeight: 18, marginBottom: 14 },
  
  statusToggleBtn: { paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  btnOnlineActive: { backgroundColor: '#111827', borderColor: '#374151' },
  btnOfflineActive: { backgroundColor: '#1f9d55', borderColor: '#16a34a' },
  statusToggleBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 10 },
  addButton: { color: '#0ea5e9', fontWeight: '600' },
  formCard: { backgroundColor: '#1a1a1f', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#2f2f38' },
  label: { color: '#9ca3af', fontSize: 12, marginBottom: 6, fontWeight: '500' },
  input: { backgroundColor: '#121214', borderWidth: 1, borderColor: '#2f2f38', borderRadius: 10, padding: 12, color: '#fff', fontSize: 14, marginBottom: 12 },
  actionButton: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  editButton: { backgroundColor: '#334155' },
  acceptButton: { backgroundColor: '#0ea5e9' },
  deleteButton: { backgroundColor: '#991b1b' },
  actionText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  actionTextSecondary: { color: '#cbd5e1', fontWeight: '600', fontSize: 13 },
  submitButton: { backgroundColor: '#1f9d55', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  submitButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  checkButton: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#0ea5e9', padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  checkButtonText: { color: '#0ea5e9', fontSize: 13, fontWeight: '600' },
  statusToggleRow: { flexDirection: 'row', backgroundColor: '#121214', borderRadius: 10, padding: 4, marginBottom: 12, borderWidth: 1, borderColor: '#2f2f38' },
  statusSelectTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  statusSelectText: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  tabDisp: { backgroundColor: '#1f9d55' },
  tabCours: { backgroundColor: '#d97706' },
  tabTerm: { backgroundColor: '#dc2626' },
  textActive: { color: '#fff', fontWeight: '700' },
  trajetCard: { backgroundColor: '#1a1a1f', padding: 16, borderRadius: 12, marginBottom: 12 },
  trajetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trajetRoute: { color: '#fff', fontWeight: '700', fontSize: 14 },
  trajetPrice: { color: '#0ea5e9', fontWeight: '700' },
  trajetTime: { color: '#9ca3af', fontSize: 12, marginVertical: 4 },
  trajetActions: { flexDirection: 'row', marginTop: 10 },
  colisCard: { backgroundColor: '#1a1a1f', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#2f2f38' },
  colisHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  colisTitle: { color: '#fff', fontWeight: '700', fontSize: 15 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  statusAccept: { backgroundColor: '#14532d', color: '#34d399' },
  statusPending: { backgroundColor: '#78350f', color: '#fbbf24' },
  colisDetails: { color: '#cbd5e1', fontSize: 13, marginBottom: 4 },
  boldText: { fontWeight: '600', color: '#9ca3af' },
  emptyText: { color: '#6b7280', fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginVertical: 12 },
  colisActionForm: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#2f2f38', paddingTop: 12 },
  colisInput: { backgroundColor: '#121214', borderWidth: 1, borderColor: '#2f2f38', borderRadius: 8, padding: 10, color: '#fff', fontSize: 13, marginBottom: 8 },
  colisButtonsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  logoutButton: { backgroundColor: '#27272a', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  logoutText: { color: '#f4f4f5', fontWeight: '700' },

  // STYLES AJOUTÉS POUR L'APERÇU IMAGE
  previewContainer: {
    marginVertical: 14,
    alignItems: 'center',
    backgroundColor: '#121214',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2f2f38',
  },
  previewLabel: {
    color: '#9ca3af',
    fontSize: 12,
    alignSelf: 'flex-start',
    fontWeight: '600',
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginTop: 8,
    resizeMode: 'cover',
  },
  removeImageBtn: {
    marginTop: 10,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  removeImageText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
  },
});