export const networkCheck = {
  /**
   * Vérifie si l'appareil a une connexion Internet active
   */
  async isConnected(): Promise<boolean> {
    try {
      const response = await fetch('https://www.google.com', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      return response.ok || response.type === 'opaque';
    } catch (error) {
      console.error('Erreur lors de la vérification de la connexion :', error);
      return false;
    }
  },

  /**
   * Teste la connexion à Supabase
   */
  async testSupabaseConnection(): Promise<boolean> {
    try {
      const response = await fetch('https://acgvuiqtqfxkiwiyhmtn.supabase.co/rest/v1/', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });
      return response.ok || response.status === 401; // 401 = auth missing, but server is reachable
    } catch (error) {
      console.error('Erreur de connexion à Supabase :', error);
      return false;
    }
  },

  /**
   * Affiche les détails de la connexion réseau
   */
  async getNetworkInfo() {
    try {
      const connected = await this.isConnected();
      const info = { isConnected: connected };
      console.log('État du réseau :', info);
      return info;
    } catch (error) {
      console.error('Erreur lors de la récupération des infos réseau :', error);
      return null;
    }
  },
};
