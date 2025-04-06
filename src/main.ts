// src/main.ts
import './style.css';
import md5 from 'md5';

// 百度翻译API配置
const BAIDU_APP_ID = '20250405002324939';
const BAIDU_SECRET_KEY = 'vOonL9w2KOR3yxGwX3v0';
const API_ENDPOINT = '/baidu-api/translate';

// DOM元素类型声明
type TranslatorElements = {
  app: HTMLDivElement;
  wordInput: HTMLInputElement;
  searchButton: HTMLButtonElement;
  result: HTMLParagraphElement;
};

class DictionaryApp {
  private elements: TranslatorElements;

  constructor() {
    this.elements = this.initializeDOM();
    this.bindEvents();
  }

  // 初始化DOM元素
  private initializeDOM(): TranslatorElements {
    const appContainer = document.querySelector<HTMLDivElement>('#app')!;
    
    appContainer.innerHTML = `
      <div>
        <h1>简易词典</h1>
        <input type="text" id="word-input" placeholder="输入要查询的单词">
        <button id="search-button">查询</button>
        <p id="result"></p>
      </div>
    `;

    return {
      app: appContainer,
      wordInput: document.querySelector('#word-input')!,
      searchButton: document.querySelector('#search-button')!,
      result: document.querySelector('#result')!
    };
  }

  // 绑定事件监听
  private bindEvents(): void {
    this.elements.searchButton.addEventListener('click', () => this.handleSearch());
    this.elements.wordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleSearch();
    });
  }

  // 处理查询逻辑
  private async handleSearch(): Promise<void> {
    const word = this.elements.wordInput.value.trim();
    this.clearResult();

    if (!word) {
      this.showMessage("请输入要查询的单词", 'error');
      return;
    }

    try {
      this.showLoading();
      const translation = await this.fetchTranslation(word);
      this.showResult(word, translation);
    } catch (error) {
      this.handleError(error);
    }
  }

  // 获取翻译结果
  private async fetchTranslation(word: string): Promise<string> {
    const salt = Date.now().toString() + Math.random().toString().slice(2, 6); // 增强唯一性
    const signRaw = `${BAIDU_APP_ID}${word}${salt}${BAIDU_SECRET_KEY}`;
    const sign = md5(signRaw);
    const params = new URLSearchParams({
      q: encodeURIComponent(word),
      from: 'en',
      to: 'zh',
      appid: BAIDU_APP_ID,
      salt: salt,
      sign: sign
    });

    const response = await fetch(`${API_ENDPOINT}?${params}`);
    const rawText = await response.text();

    // 检测HTML响应
    if (/<html/i.test(rawText)) {
      throw new Error('代理配置异常，请检查vite.config.ts');
    }

    const data = JSON.parse(rawText);

    if (data.error_code) {
      throw new Error(`[${data.error_code}] ${data.error_msg}`);
    }

    return data.trans_result?.[0]?.dst || '未找到翻译结果';
  }

  // 显示结果
  private showResult(word: string, translation: string): void {
    this.elements.result.innerHTML = `
      <strong>${word}</strong>: ${translation}
      <button class="voice-button">🔊</button>
    `;
    this.addVoiceButtonListener(word);
  }

  // 添加发音功能
  private addVoiceButtonListener(word: string): void {
    const voiceButton = this.elements.result.querySelector('.voice-button')!;
    voiceButton.addEventListener('click', () => {
      new Audio(`https://fanyi.baidu.com/gettts?lan=en&text=${encodeURIComponent(word)}&spd=3&source=web`).play();
    });
  }

  // 错误处理
  private handleError(error: unknown): void {
    const message = error instanceof Error ? error.message : '未知错误';
    console.error('API请求失败:', error);
    this.showMessage(`查询失败: ${message}`, 'error');
  }

  // 界面状态控制
  private showMessage(text: string, type: 'info' | 'error' = 'info'): void {
    this.elements.result.textContent = text;
    this.elements.result.className = type;
  }

  private clearResult(): void {
    this.elements.result.textContent = '';
    this.elements.result.className = '';
  }

  private showLoading(): void {
    this.elements.result.textContent = '查询中...';
    this.elements.result.className = 'loading';
  }
}

// 初始化应用
new DictionaryApp();