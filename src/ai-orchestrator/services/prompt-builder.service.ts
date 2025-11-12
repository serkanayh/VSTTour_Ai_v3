import { Injectable } from '@nestjs/common';

@Injectable()
export class PromptBuilderService {
  buildInitialPrompt(formData: any): string {
    return `Merhaba! İş sürecinizi belgelemenize yardımcı olmak için buradayım: "${formData.processName}".

Etkili bir otomasyon planı oluşturmak için aşağıdakileri anlamam gerekiyor:
- Takip ettiğiniz tam adımlar
- Bu görevi ne sıklıkla gerçekleştiriyorsunuz
- Her adım genellikle ne kadar sürer
- Yaşadığınız sorunlar veya tekrarlayan işlemler

Hadi başlayalım: "${formData.processName}" sürecinin ilk adımını kendi kelimelerinizle açıklayabilir misiniz?`;
  }

  buildConversationMessages(
    systemPrompt: string,
    conversationHistory: any[],
    newMessage: string,
  ): any[] {
    const messages = [{ role: 'system', content: systemPrompt }];

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach((msg) => {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      });
    }

    // Add new user message
    messages.push({
      role: 'user',
      content: newMessage,
    });

    return messages;
  }

  buildSOPGenerationPrompt(process: any, formData: any): string {
    return `IMPORTANT: Tüm yanıtlarınızı TÜRKÇE olarak verin.

Aşağıdaki süreç için detaylı bir Standart İşletim Prosedürü (SOP) oluşturun:

Süreç Adı: ${process.processName}
Açıklama: ${process.description || 'Belirtilmemiş'}
Sıklık: Günde ${process.frequency || 'Belirtilmemiş'} kez
Süre: Görev başına ${process.duration || 'Belirtilmemiş'} dakika
Saat Başı Maliyet: ${process.costPerHour || 'Belirtilmemiş'} TL

Form Verisi:
${JSON.stringify(formData, null, 2)}

Lütfen yapılandırılmış bir SOP'yi aşağıdaki JSON formatında TÜRKÇE olarak oluşturun:

\`\`\`json
{
  "title": "Süreç Başlığı (TÜRKÇE)",
  "summary": "Sürecin kısa özeti (TÜRKÇE)",
  "steps": [
    {
      "order": 1,
      "action": "Yapılacak işlemin açıklaması (TÜRKÇE)",
      "estimatedTime": 60,
      "tools": ["Araç 1", "Araç 2"],
      "notes": "Önemli notlar (TÜRKÇE)"
    }
  ],
  "totalEstimatedTime": 300,
  "automationPotential": {
    "score": 8,
    "reasoning": "Neden otomasyona uygun olduğunun açıklaması (TÜRKÇE)",
    "suggestedTools": ["n8n", "Zapier"]
  },
  "riskAssessment": {
    "hasPersonalData": true,
    "kvkkCompliance": "KVKK uyumu için gerekli adımlar (TÜRKÇE)",
    "criticalSteps": [1, 3]
  }
}
\`\`\`

IMPORTANT: Çıktının geçerli JSON formatında olduğundan ve otomasyon planlaması için gerekli tüm detayları TÜRKÇE olarak içerdiğinden emin olun.`;
  }
}
