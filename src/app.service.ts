import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { callGeminiAPI } from './utils/gemini.api';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) { }

  async generateContent(title: string): Promise<string> {
    const prompt = `
  Viết một bài blog chi tiết (500-600 từ) xoay quanh chủ đề: "${title}".

  - Không viết phần giới thiệu như "Dưới đây là..."
  - Bắt đầu thẳng vào nội dung chính.
  - Giọng văn gần gũi, truyền cảm hứng.
  - Kể chuyện, tạo cảm giác hấp dẫn.
  `;

    const result = await callGeminiAPI(prompt);
    return result;
  }

}
