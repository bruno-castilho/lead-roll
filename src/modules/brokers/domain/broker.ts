/** Corretor (perfil `broker`) e se ele está na fila de distribuição agora. */
export interface Broker {
  id: string;
  name: string;
  email: string;
  isPresent: boolean;
}
