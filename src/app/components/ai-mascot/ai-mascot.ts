import { Component, Input, OnInit } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-ai-mascot',
  standalone: false,
  templateUrl: './ai-mascot.html',
  styleUrls: ['./ai-mascot.scss'],
  animations: [
    trigger('popOver', [
      state('void', style({ opacity: 0, transform: 'translateY(20px) scale(0.9)' })),
      transition(':enter, :leave', [animate('200ms ease-out')])
    ])
  ]
})
export class AiMascotComponent implements OnInit {
  @Input() healthContext: any; // Pass dashboard stats here
  isOpen = false;
  messages: { text: string, isUser: boolean }[] = [];
  userInput = '';
  isThinking = false;

  // Mascot states: 'idle', 'talking', 'happy'
  mascotState = 'idle'; 

  ngOnInit() {
    // Initial greeting based on health data
    setTimeout(() => {
      this.addBotMessage("Hi! I'm FitBot. I see you've been active today. Want some tips?");
    }, 1000);
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  sendMessage() {
    if (!this.userInput.trim()) return;

    const text = this.userInput;
    this.messages.push({ text, isUser: true });
    this.userInput = '';
    this.isThinking = true;
    this.mascotState = 'talking';

    // Simulate AI response (Replace this with actual API call later)
    setTimeout(() => {
      this.isThinking = false;
      this.mascotState = 'idle';
      this.addBotMessage(this.generateMockResponse(text));
    }, 1500);
  }

  addBotMessage(text: string) {
    this.messages.push({ text, isUser: false });
  }

  generateMockResponse(input: string): string {
    const lowerInput = input.toLowerCase();
    // Simple logic for now - connect to OpenAI/Gemini API here later
    if (lowerInput.includes('step')) {
        const steps = this.healthContext?.stepsStats?.current || 0;
        return `You've taken ${steps} steps today! Keep it up!`;
    }
    if (lowerInput.includes('calor')) {
        const cals = this.healthContext?.caloriesStats?.current || 0;
        return `You've burned ${cals} kcal today!`;
    }
    if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
        return "Hello there! Ready to crush some goals?";
    }
    return "That's interesting! Tell me more about your fitness goals.";
  }
}
