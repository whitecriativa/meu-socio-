import axios, { type AxiosInstance } from 'axios'
import type {
  SendTextParams,
  SendTextResponse,
  DownloadMediaResponse,
} from './types.js'

export class EvolutionApiClient {
  private readonly http: AxiosInstance

  constructor() {
    const url = process.env['EVOLUTION_API_URL']
    const key = process.env['EVOLUTION_API_KEY']

    if (!url || !key) {
      throw new Error(
        'Variaveis ausentes: EVOLUTION_API_URL e EVOLUTION_API_KEY',
      )
    }

    this.http = axios.create({
      baseURL: url,
      headers: {
        apikey: key,
        'Content-Type': 'application/json',
      },
    })
  }

  // Envia mensagem de texto com simulacao de digitacao
  async sendText(params: SendTextParams): Promise<SendTextResponse> {
    const { data } = await this.http.post<SendTextResponse>(
      `/message/sendText/${params.instanceName}`,
      {
        number: params.to,
        options: {
          delay: 1200,          // simula tempo de digitacao (ms)
          presence: 'composing', // mostra "digitando..."
        },
        textMessage: { text: params.text },
      },
    )
    return data
  }

  // Baixa midia (audio) em base64 para enviar ao Whisper
  async downloadMedia(
    instanceName: string,
    messageId: string,
  ): Promise<DownloadMediaResponse> {
    const { data } = await this.http.post<DownloadMediaResponse>(
      `/chat/getBase64FromMediaMessage/${instanceName}`,
      {
        message: { key: { id: messageId } },
        convertToMp4: false,
      },
    )
    return data
  }

  // Verifica status da instancia
  async getInstanceStatus(
    instanceName: string,
  ): Promise<{ state: 'open' | 'close' | 'connecting' }> {
    const { data } = await this.http.get<{
      instance: { state: 'open' | 'close' | 'connecting' }
    }>(`/instance/connectionState/${instanceName}`)
    return { state: data.instance.state }
  }
}
