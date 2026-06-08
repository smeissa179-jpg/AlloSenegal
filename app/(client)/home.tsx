import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import colisService from '../../services/colisService';
import trajetService from '../../services/trajetService';
import vehicleService from '../../services/vehicleService';

type PaymentMethod = 'especes' | 'wave' | 'orange_money';
type TransportMode = 'commun' | 'chauffeur';

export default function ClientHomeScreen() {
  const { profile, signOut } = useAuth();
  const navigation = useNavigation<any>();

  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [trajets, setTrajets] = useState<any[]>([]);
  const [loadingTrajets, setLoadingTrajets] = useState(false);
  const [isSearched, setIsSearched] = useState(false);
  const [transportMode, setTransportMode] = useState<TransportMode>('commun');
  const [coursePaymentMethod, setCoursePaymentMethod] =
  useState<PaymentMethod>('especes');

  const [activeTab, setActiveTab] = useState<'course' | 'livraison'>('course');

  const [colisPointDepart, setColisPointDepart] = useState('');
  const [colisPointDestination, setColisPointDestination] = useState('');
  const [colisDescription, setColisDescription] = useState('');
  const [colisPoids, setColisPoids] = useState('');
  const [colisPaymentMethod, setColisPaymentMethod] = useState<PaymentMethod>('especes');
  const [mesColis, setMesColis] = useState<any[]>([]);
  const [loadingColis, setLoadingColis] = useState(false);
  const [showColisForm, setShowColisForm] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const handleImageSelection = () => {
    Alert.alert("Photo du colis", "D'où souhaitez-vous importer la photo ?", [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Prendre une photo', onPress: takePhoto },
      { text: 'Choisir depuis la galerie', onPress: pickImage },
    ]);
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission refusée', "Nous avons besoin d'accéder à vos photos.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6,
      });

      if (!result.canceled && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur galerie:', error);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission refusée', "L'accès à la caméra est nécessaire.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6,
      });

      if (!result.canceled && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur caméra:', error);
    }
  };

  useEffect(() => {
    loadVehicles();
    loadTrajets();
  }, []);

  useEffect(() => {
    if (profile?.id && activeTab === 'livraison') {
      loadMesColis();
    }
  }, [profile?.id, activeTab]);

  const loadVehicles = async () => {
    try {
      setLoadingVehicles(true);
      const allVehicles = await vehicleService.fetchAllVehicles();
      setVehicles(allVehicles || []);
    } catch (error) {
      console.error('Erreur chargement véhicules:', error);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const loadTrajets = async () => {
    try {
      setLoadingTrajets(true);
      const allTrajets = await trajetService.fetchAllTrajets();
      setTrajets(allTrajets || []);
      setIsSearched(false);
    } catch (error) {
      console.error('Erreur chargement trajets:', error);
    } finally {
      setLoadingTrajets(false);
    }
  };

  const loadMesColis = async () => {
    if (!profile?.id) return;

    try {
      setLoadingColis(true);
      const allColis = await colisService.fetchColisForClient(profile.id);
      setMesColis(allColis || []);
    } catch (error) {
      console.error('Erreur chargement colis:', error);
    } finally {
      setLoadingColis(false);
    }
  };

  const getChauffeurProfile = (colis: any) => {
    const target = colis?.chauffeur_profile || colis?.profiles;

    if (Array.isArray(target)) {
      return target[0] || null;
    }

    return target || null;
  };

  const getCalculatedPrice = () => {
    const numericPoids = parseFloat(colisPoids.replace(',', '.'));

    if (isNaN(numericPoids) || numericPoids <= 0) return 0;

    const baseTarif = 1500;
    const pricePerKg = 500;

    return baseTarif + numericPoids * pricePerKg;
  };

  const redirectToPaymentApp = async (method: PaymentMethod) => {
    let url = '';
    let appName = '';

    if (method === 'wave') {
      url = 'wave://';
      appName = 'Wave';
    } else if (method === 'orange_money') {
      url = Platform.OS === 'ios' ? 'orangeflex://' : 'intent://#Intent;scheme=orangeom;package=com.orange.sn.maxit;end';
      appName = 'Orange Money (Max it)';
    } else {
      return;
    }

    try {
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else if (method === 'orange_money') {
        const ussdCode = Platform.OS === 'ios' ? 'tel:*144%23' : 'tel:*144#';
        await Linking.openURL(ussdCode);
      } else {
        Alert.alert('Application introuvable', `L'application ${appName} ne semble pas être installée sur votre téléphone.`);
      }
    } catch (error) {
      console.error('Erreur redirection paiement:', error);
    }
  };

  const handleCallDriver = async (colis: any) => {
    const profileChauffeur = getChauffeurProfile(colis);
    const phoneNumber = profileChauffeur?.phone;

    if (!phoneNumber) {
      Alert.alert('Action impossible', 'Aucun numéro de contact enregistré pour ce chauffeur.');
      return;
    }

    const cleanPhone = String(phoneNumber).trim().replace(/[^\d+]/g, '');
    const url = `tel:${cleanPhone}`;

    try {
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Erreur', "Le système ne supporte pas le lancement d'appels.");
      }
    } catch (error) {
      console.error("Erreur lors de l'ouverture du composeur:", error);
      Alert.alert('Erreur', "Impossible de lancer l'application de téléphone.");
    }
  };

  const handleOpenChat = (colis: any) => {
    const profileChauffeur = getChauffeurProfile(colis);

    if (!profileChauffeur?.id) {
      Alert.alert('Erreur', 'Canal de discussion indisponible (aucun chauffeur assigné).');
      return;
    }

    const driverName = `${profileChauffeur.first_name || ''} ${profileChauffeur.last_name || ''}`.trim();

    navigation.navigate('ChatScreen', {
      colisId: String(colis.id),
      receiverId: String(profileChauffeur.id),
      receiverName: driverName || 'Chauffeur',
    });
  };

  const handleSendColis = async () => {
    if (!colisPointDepart.trim() || !colisPointDestination.trim() || !colisDescription.trim() || !colisPoids.trim()) {
      Alert.alert('Champs requis', 'Veuillez renseigner toutes les informations.');
      return;
    }

    const parsedPoids = parseFloat(colisPoids.replace(',', '.'));

    if (isNaN(parsedPoids) || parsedPoids <= 0) {
      Alert.alert('Erreur de saisie', 'Le poids doit être un nombre supérieur à 0.');
      return;
    }

    if (!profile?.id) return;

    const finalCalculatedPrice = getCalculatedPrice();

    try {
      setLoadingColis(true);

      await colisService.createColis({
        id_client: profile.id,
        point_depart: colisPointDepart.trim(),
        point_destination: colisPointDestination.trim(),
        description: colisDescription.trim(),
        poids: parsedPoids,
        prix_offert: finalCalculatedPrice,
        mode_paiement: colisPaymentMethod,
        statut: 'en_attente',
      });

      const chosenMethod = colisPaymentMethod;

      setColisPointDepart('');
      setColisPointDestination('');
      setColisDescription('');
      setColisPoids('');
      setColisPaymentMethod('especes');
      setPhotoUri(null);
      setShowColisForm(false);

      await loadMesColis();

      if (chosenMethod === 'especes') {
        Alert.alert('Succès', 'Votre demande de livraison a bien été publiée.');
      } else {
        Alert.alert(
          'Demande publiée !',
          `Votre demande est enregistrée. Vous allez être redirigé vers ${
            chosenMethod === 'wave' ? 'Wave' : 'Orange Money'
          } pour finaliser votre transaction.`,
          [{ text: 'Ouvrir mon portefeuille', onPress: () => redirectToPaymentApp(chosenMethod) }],
        );
      }
    } catch (error) {
      Alert.alert('Erreur', "Enregistrement impossible de la demande d'envoi.");
    } finally {
      setLoadingColis(false);
    }
  };

  const handleDeleteColis = async (colisId: any) => {
    Alert.alert('Suppression', 'Voulez-vous retirer cette demande ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoadingColis(true);
            await colisService.deleteColis(colisId);
            await loadMesColis();
          } catch (error) {
            Alert.alert('Erreur', 'Action impossible.');
          } finally {
            setLoadingColis(false);
          }
        },
      },
    ]);
  };

  const handleSearch = async () => {
    if (!pickup.trim() || !destination.trim()) {
      Alert.alert('Champs requis', 'Veuillez renseigner un point de départ et une destination.');
      return;
    }

    setLoading(true);

    try {
      const searchResults = (await trajetService.searchTrajets(pickup.trim(), destination.trim())) as any[];
      setTrajets(searchResults || []);
      setIsSearched(true);
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible de récupérer les résultats de recherche.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSearch = () => {
    setPickup('');
    setDestination('');
    loadTrajets();
  };

  const handleSelectVehicle = (vehicle: any) => {
    Alert.alert(
      `${vehicle.marque || ''} ${vehicle.modele || ''}`,
      `Immatriculation : ${vehicle.immatriculation || 'N/A'}\nCouleur : ${vehicle.couleur || 'N/A'}`,
      [{ text: 'Retour' }, { text: 'Réserver', onPress: () => {} }],
    );
  };
const handleReserveTrajet = (trajet: any) => {
  Alert.alert(
    'Réservation',
    `Trajet : ${trajet.point_depart} → ${trajet.point_destination}

Tarif : ${trajet.prix_estime} FCFA

Paiement : ${getPaymentLabel(coursePaymentMethod)}`,
    [
      {
        text: 'Annuler',
        style: 'cancel',
      },
      {
        text: 'Confirmer',
        onPress: async () => {
          try {
            if (coursePaymentMethod !== 'especes') {
              await redirectToPaymentApp(coursePaymentMethod);
            }

            Alert.alert(
              'Succès',
              'Votre réservation a été enregistrée avec succès.'
            );
          } catch (error) {
            Alert.alert(
              'Erreur',
              'Impossible de lancer le paiement.'
            );
          }
        },
      },
    ]
  );
};

  const getPaymentLabel = (method: string) => {
    switch (method) {
      case 'wave':
        return 'Wave';
      case 'orange_money':
        return 'Orange Money';
      default:
        return 'Espèces';
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.subtitle}>Espace Personnel</Text>
          <Text style={styles.title}>
            {profile?.first_name || ''} {profile?.last_name || ''}
          </Text>
        </View>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>Client</Text>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity onPress={() => setActiveTab('course')} style={[styles.tab, activeTab === 'course' && styles.tabCourseActive]}>
          <Text style={[styles.tabText, activeTab === 'course' && styles.tabTextCourseActive]}>Course</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setActiveTab('livraison')} style={[styles.tab, activeTab === 'livraison' && styles.tabLivraisonActive]}>
          <Text style={[styles.tabText, activeTab === 'livraison' && styles.tabTextLivraisonActive]}>Livraison</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'course' && (
        <View>
          <View style={styles.flagRow}>
            <View style={styles.senegalGreen} />
            <View style={styles.senegalYellow} />
            <View style={styles.senegalRed} />
          </View>

          <Text style={styles.sectionTitleLarge}>Rechercher un trajet</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Lieu de prise en charge</Text>
            <TextInput value={pickup} onChangeText={setPickup} placeholder="Ex: Parcelles" placeholderTextColor="#6b7280" style={styles.input} />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Destination</Text>
            <TextInput value={destination} onChangeText={setDestination} placeholder="Ex: Plateau" placeholderTextColor="#6b7280" style={styles.input} />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Type de déplacement</Text>
            <View style={styles.fieldGroup}>
  <Text style={styles.label}>
    Sélectionnez votre moyen de paiement
  </Text>

  <View style={styles.paymentSelectorContainer}>
    {(['especes', 'wave', 'orange_money'] as PaymentMethod[]).map(
      (method) => (
        <TouchableOpacity
          key={method}
          style={[
            styles.paymentOptionButton,
            coursePaymentMethod === method &&
              styles.paymentOptionActive,
          ]}
          onPress={() =>
            setCoursePaymentMethod(method)
          }
        >
          <Text
            style={[
              styles.paymentOptionText,
              coursePaymentMethod === method &&
                styles.paymentOptionTextActive,
            ]}
          >
            {method === 'especes'
              ? 'Espèces'
              : method === 'wave'
              ? 'Wave'
              : 'Orange Money'}
          </Text>
        </TouchableOpacity>
      )
    )}
  </View>
</View>

            <View style={styles.transportModeContainer}>
              <TouchableOpacity
                onPress={() => setTransportMode('commun')}
                style={[styles.transportModeButton, transportMode === 'commun' && styles.transportModeButtonActive]}
              >
                <Text style={[styles.transportModeText, transportMode === 'commun' && styles.transportModeTextActive]}>
                  Transport en commun
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setTransportMode('chauffeur')}
                style={[styles.transportModeButton, transportMode === 'chauffeur' && styles.transportModeButtonActive]}
              >
                <Text style={[styles.transportModeText, transportMode === 'chauffeur' && styles.transportModeTextActive]}>
                  Chauffeur à la demande
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity onPress={handleSearch} activeOpacity={0.8} style={styles.primaryCourseButton}>
            {loading ? <ActivityIndicator color="#121214" /> : <Text style={styles.primaryCourseButtonText}>Rechercher</Text>}
          </TouchableOpacity>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {transportMode === 'commun' ? 'Lignes et trajets disponibles' : 'Chauffeurs disponibles'}
            </Text>

            {loadingVehicles ? (
              <View style={styles.emptyCard}>
                <ActivityIndicator color="#fdef42" />
              </View>
            ) : vehicles.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>Aucun véhicule disponible.</Text>
              </View>
            ) : (
              <View style={styles.vehiclesContainer}>
                {vehicles.map((vehicle, index) => (
                  <TouchableOpacity
                    key={vehicle.id ? `vehicle-${vehicle.id}` : `v-${index}`}
                    style={styles.vehicleCard}
                    onPress={() => handleSelectVehicle(vehicle)}
                    activeOpacity={0.7}
                  >
                    {vehicle.photo_url ? (
                      <Image source={{ uri: vehicle.photo_url }} style={styles.vehicleImage} />
                    ) : (
                      <View style={styles.vehicleImagePlaceholder}>
                        <Text style={{ color: '#9ca3af', fontSize: 12 }}>Aucun visuel</Text>
                      </View>
                    )}
                    <Text style={styles.vehicleName}>
                      {vehicle.marque || ''} {vehicle.modele || ''}
                    </Text>
                    <Text style={styles.vehicleDetail}>{vehicle.immatriculation || ''}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{isSearched ? 'Résultats de la recherche' : 'Trajets proposés'}</Text>
              {isSearched && (
                <TouchableOpacity onPress={handleResetSearch}>
                  <Text style={styles.refreshCourseButton}>Voir tout</Text>
                </TouchableOpacity>
              )}
            </View>

            {loadingTrajets ? (
              <View style={styles.emptyCard}>
                <ActivityIndicator color="#fdef42" />
              </View>
            ) : trajets.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>{isSearched ? 'Aucun trajet trouvé.' : 'Aucun itinéraire planifié actuellement.'}</Text>
              </View>
            ) : (
              <View>
                {trajets.map((trajet, index) => {
                  const isPublic = trajet.type_service === 'public';
                  const typeExact = trajet.vehicles?.vehicle_type || 'Véhicule';

                  return (
                    <TouchableOpacity
                      key={trajet.id ? `trajet-${trajet.id}` : `t-${index}`}
                      style={styles.trajetCard}
                      onPress={() => handleReserveTrajet(trajet)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.trajetHeader}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={styles.trajetRoute}>
                            {trajet.point_depart} → {trajet.point_destination}
                          </Text>
                          <View style={[styles.typeBadge, isPublic ? styles.badgePublic : styles.badgePrive]}>
                            <Text style={styles.typeBadgeText}>
                              {isPublic ? `Transport en commun • ${typeExact}` : `Chauffeur à la demande • ${typeExact}`}
                            </Text>
                          </View>
                          <Text style={styles.trajetTime}>{trajet.heure_depart || 'Horaire non précisé'}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.trajetPrice}>{trajet.prix_estime} FCFA</Text>
                          <Text style={styles.driverTarifLabel}>Tarif Chauffeur</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      )}

      {activeTab === 'livraison' && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nouvel envoi de colis</Text>
            <TouchableOpacity onPress={() => setShowColisForm(!showColisForm)} style={styles.toggleButton}>
              <Text style={styles.toggleButtonLivraisonText}>{showColisForm ? '-' : '+'}</Text>
            </TouchableOpacity>
          </View>

          {showColisForm && (
            <View style={styles.formContainer}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Origine de ramassage</Text>
                <TextInput value={colisPointDepart} onChangeText={setColisPointDepart} placeholder="Adresse de départ" placeholderTextColor="#6b7280" style={styles.input} />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Destination finale</Text>
                <TextInput value={colisPointDestination} onChangeText={setColisPointDestination} placeholder="Adresse de livraison" placeholderTextColor="#6b7280" style={styles.input} />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Description du colis</Text>
                <TextInput
                  value={colisDescription}
                  onChangeText={setColisDescription}
                  placeholder="Nature des objets, fragilité..."
                  placeholderTextColor="#6b7280"
                  style={[styles.input, styles.textArea]}
                  multiline
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Poids estimé de la marchandise</Text>
                <TextInput value={colisPoids} onChangeText={setColisPoids} placeholder="Poids (en kg)" keyboardType="decimal-pad" style={styles.input} />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Photo du colis</Text>

                <TouchableOpacity onPress={handleImageSelection} style={styles.photoButton}>
                  <Text style={styles.photoButtonText}>{photoUri ? 'Changer la photo' : 'Ajouter une photo'}</Text>
                </TouchableOpacity>

                {photoUri && (
                  <View style={styles.photoPreviewContainer}>
                    <Image source={{ uri: photoUri }} style={styles.photoPreview} />

                    <TouchableOpacity onPress={() => setPhotoUri(null)} style={styles.removePhotoButton}>
                      <Text style={styles.removePhotoText}>Supprimer la photo</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Sélectionnez votre moyen de paiement</Text>
                <View style={styles.paymentSelectorContainer}>
                  {(['especes', 'wave', 'orange_money'] as PaymentMethod[]).map((method) => (
                    <TouchableOpacity
                      key={method}
                      style={[styles.paymentOptionButton, colisPaymentMethod === method && styles.paymentOptionActive]}
                      onPress={() => setColisPaymentMethod(method)}
                    >
                      <Text style={[styles.paymentOptionText, colisPaymentMethod === method && styles.paymentOptionTextActive]}>
                        {method === 'especes' ? 'Espèces' : method === 'wave' ? 'Wave' : 'Orange'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {getCalculatedPrice() > 0 && (
                <View style={styles.priceEstimationBox}>
                  <Text style={styles.priceEstimationText}>
                    Tarif réglementaire calculé : <Text style={{ fontWeight: '700', color: '#00653f' }}>{getCalculatedPrice()} FCFA</Text>
                  </Text>
                </View>
              )}

              <TouchableOpacity onPress={handleSendColis} style={styles.primaryLivraisonButton} disabled={loadingColis}>
                {loadingColis ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonText}>Publier la demande d'envoi</Text>}
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Suivi en temps réel de mes envois</Text>
              <TouchableOpacity onPress={loadMesColis} disabled={loadingColis}>
                <Text style={styles.refreshLivraisonButton}>Actualiser</Text>
              </TouchableOpacity>
            </View>

            {loadingColis ? (
              <View style={styles.emptyCard}>
                <ActivityIndicator color="#00653f" />
              </View>
            ) : mesColis.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>Aucune expédition en cours.</Text>
              </View>
            ) : (
              <View>
                {mesColis.map((colis, idx) => {
                  const profileChauffeur = getChauffeurProfile(colis);
                  const isAssigned = !!profileChauffeur?.id;
                  const driverName = isAssigned ? `${profileChauffeur.first_name || ''} ${profileChauffeur.last_name || ''}`.trim() : 'En attente';

                  return (
                    <View key={colis.id ? `colis-${colis.id}` : `colis-idx-${idx}`} style={styles.colisCard}>
                      <View style={styles.colisHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.colisRoute}>
                            {String(colis.point_depart || '')} → {String(colis.point_destination || '')}
                          </Text>
                          <Text style={styles.colisInfo}>
                            {String(colis.poids || 0)} kg | {getPaymentLabel(colis.mode_paiement)} | Statut : {String(colis.statut || '')}
                          </Text>
                        </View>
                        <Text style={styles.colisPrice}>{String(colis.prix_offert || 0)} FCFA</Text>
                      </View>

                      {!!colis.description && <Text style={styles.colisDescription}>{String(colis.description)}</Text>}

                      <View style={styles.communicationContainer}>
                        <Text style={styles.driverAssignedText}>Coursier Assigné : {driverName}</Text>

                        {isAssigned ? (
                          <View style={styles.communicationRow}>
                            <TouchableOpacity style={styles.chatButton} onPress={() => handleOpenChat(colis)}>
                              <Text style={styles.communicationButtonText}>Message</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.callButton} onPress={() => handleCallDriver(colis)}>
                              <Text style={styles.communicationButtonText}>Appeler</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <Text style={styles.waitingNoticeText}>Les canaux de discussion et d'appel s'activeront dès qu'un chauffeur acceptera la charge.</Text>
                        )}
                      </View>

                      <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteColis(colis.id)}>
                        <Text style={styles.deleteButtonText}>Annuler la demande d'envoi</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      )}

      <View style={styles.safetyCard}>
        <View style={styles.safetyCopy}>
          <Text style={styles.safetyTitle}>Assistance & Sécurité</Text>
          <Text style={styles.safetySubtitle}>En cas d'anomalie ou d'urgence sur l'itinéraire, signalez-le immédiatement.</Text>
        </View>

        <TouchableOpacity onPress={() => Alert.alert('Urgence', 'Alerte SOS transmise aux autorités de régulation.')} style={styles.sosButton}>
          <Text style={styles.sosButtonText}>SOS</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={signOut} activeOpacity={0.8} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Déconnexion de l'application</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#121214' },
  screenContent: { paddingHorizontal: 24, paddingVertical: 48 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, marginTop: 16 },
  subtitle: { color: '#9ca3af', fontSize: 14 },
  title: { color: '#ffffff', fontSize: 28, fontWeight: '800' },
  roleBadge: { backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  roleBadgeText: { color: '#38bdf8', fontSize: 12, fontWeight: '600' },
  tabsContainer: { flexDirection: 'row', backgroundColor: '#1e1e24', borderRadius: 12, padding: 4, marginBottom: 24 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: 'transparent' },
  tabCourseActive: { backgroundColor: '#fdef42', borderColor: '#eab308' },
  tabLivraisonActive: { backgroundColor: '#00653f', borderColor: '#047857' },
  tabText: { color: '#9ca3af', fontWeight: '600', fontSize: 15 },
  tabTextCourseActive: { color: '#121214', fontWeight: '700' },
  tabTextLivraisonActive: { color: '#ffffff', fontWeight: '700' },
  flagRow: { flexDirection: 'row', height: 4, marginBottom: 16, borderRadius: 2, overflow: 'hidden' },
  senegalGreen: { flex: 1, backgroundColor: '#00653f' },
  senegalYellow: { flex: 1, backgroundColor: '#fdef42' },
  senegalRed: { flex: 1, backgroundColor: '#e31b23' },
  sectionTitleLarge: { color: '#ffffff', fontSize: 22, fontWeight: '700', marginBottom: 20 },
  section: { marginTop: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { color: '#ffffff', fontSize: 18, fontWeight: '600' },
  fieldGroup: { marginBottom: 16 },
  label: { color: '#9ca3af', fontSize: 14, marginBottom: 6, fontWeight: '500' },
  input: { backgroundColor: '#1e1e24', color: '#ffffff', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, fontSize: 15 },
  textArea: { height: 80, textAlignVertical: 'top' },
  primaryCourseButton: { backgroundColor: '#fdef42', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  primaryCourseButtonText: { color: '#121214', fontSize: 16, fontWeight: '700' },
  primaryLivraisonButton: { backgroundColor: '#00653f', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  transportModeContainer: { flexDirection: 'row', gap: 8 },
  transportModeButton: {
    flex: 1,
    backgroundColor: '#1e1e24',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  transportModeButtonActive: { backgroundColor: '#fdef42', borderColor: '#eab308' },
  transportModeText: { color: '#9ca3af', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  transportModeTextActive: { color: '#121214', fontWeight: '700' },
  emptyCard: { backgroundColor: '#1e1e24', padding: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#374151' },
  emptyText: { color: '#9ca3af', fontSize: 14, textAlign: 'center' },
  vehiclesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  vehicleCard: { backgroundColor: '#1e1e24', width: '48%', padding: 12, borderRadius: 12 },
  vehicleImage: { width: '100%', height: 90, borderRadius: 8, marginBottom: 8 },
  vehicleImagePlaceholder: { width: '100%', height: 90, borderRadius: 8, backgroundColor: '#2a2a30', marginBottom: 8, alignItems: 'center', justifyContent: 'center' },
  vehicleName: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  vehicleDetail: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  trajetCard: { backgroundColor: '#1e1e24', padding: 16, borderRadius: 12, marginBottom: 12 },
  trajetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trajetRoute: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
  trajetTime: { color: '#9ca3af', fontSize: 13, marginTop: 6 },
  trajetPrice: { color: '#22c55e', fontSize: 16, fontWeight: '700' },
  driverTarifLabel: { color: '#6b7280', fontSize: 10, marginTop: 2, fontWeight: '500' },
  toggleButton: { backgroundColor: '#1e1e24', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  toggleButtonLivraisonText: { color: '#00653f', fontSize: 20, fontWeight: '600' },
  formContainer: { backgroundColor: '#16161a', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#27272a', marginBottom: 24 },
  refreshCourseButton: { color: '#fdef42', fontSize: 14, fontWeight: '600' },
  refreshLivraisonButton: { color: '#00653f', fontSize: 14, fontWeight: '600' },
  colisCard: { backgroundColor: '#1e1e24', padding: 16, borderRadius: 12, marginBottom: 16 },
  colisHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
  colisRoute: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
  colisInfo: { color: '#9ca3af', fontSize: 12, marginTop: 4 },
  colisPrice: { color: '#38bdf8', fontSize: 15, fontWeight: '700' },
  colisDescription: { color: '#d1d5db', fontSize: 13, backgroundColor: '#16161a', padding: 10, borderRadius: 8, marginBottom: 12 },
  communicationContainer: { backgroundColor: '#16161a', padding: 12, borderRadius: 8, marginBottom: 12 },
  driverAssignedText: { color: '#ffffff', fontSize: 13, fontWeight: '500', marginBottom: 8 },
  communicationRow: { flexDirection: 'row', gap: 8 },
  chatButton: { flex: 1, backgroundColor: '#0ea5e9', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  callButton: { flex: 1, backgroundColor: '#22c55e', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  communicationButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  waitingNoticeText: { color: '#71717a', fontSize: 12, fontStyle: 'italic', marginTop: 4, lineHeight: 16 },
  deleteButton: { paddingVertical: 6, alignItems: 'center' },
  deleteButtonText: { color: '#ef4444', fontSize: 13, fontWeight: '500' },
  safetyCard: { flexDirection: 'row', backgroundColor: '#7f1d1d', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 32, marginBottom: 16 },
  safetyCopy: { flex: 1, marginRight: 8 },
  safetyTitle: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  safetySubtitle: { color: '#fca5a5', fontSize: 12, marginTop: 2 },
  sosButton: { backgroundColor: '#dc2626', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  sosButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  logoutButton: { paddingVertical: 16, alignItems: 'center', marginBottom: 24 },
  logoutText: { color: '#9ca3af', fontSize: 15, fontWeight: '500' },
  priceEstimationBox: { backgroundColor: '#1c1917', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#292524' },
  priceEstimationText: { color: '#d6d3d1', fontSize: 14, fontWeight: '500' },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 6, marginBottom: 2 },
  badgePublic: { backgroundColor: '#16161a', borderWidth: 1, borderColor: '#eab308' },
  badgePrive: { backgroundColor: '#16161a', borderWidth: 1, borderColor: '#10b981' },
  typeBadgeText: { fontSize: 11, fontWeight: '600', color: '#f3f4f6' },
  paymentSelectorContainer: { flexDirection: 'row', gap: 8, marginTop: 4 },
  paymentOptionButton: { flex: 1, backgroundColor: '#1e1e24', paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#374151' },
  paymentOptionActive: { backgroundColor: '#1e293b', borderColor: '#0ea5e9' },
  paymentOptionText: { color: '#9ca3af', fontSize: 13, fontWeight: '500' },
  paymentOptionTextActive: { color: '#0ea5e9', fontWeight: '700' },
  photoButton: { backgroundColor: '#1e1e24', paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#374151' },
  photoButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  photoPreviewContainer: { marginTop: 12 },
  photoPreview: { width: '100%', height: 180, borderRadius: 12, resizeMode: 'cover' },
  removePhotoButton: { marginTop: 8, alignItems: 'center' },
  removePhotoText: { color: '#ef4444', fontSize: 13, fontWeight: '600' },
});