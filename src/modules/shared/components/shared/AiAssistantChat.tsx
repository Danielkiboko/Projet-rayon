import { motion } from "framer-motion";
import { Bot, Send } from "lucide-react";

interface AiAssistantChatProps {
  title?: string;
  chatMessages: { role: string; text: string }[];
  chatInput: string;
  setChatInput: (val: string) => void;
  isAiLoading: boolean;
  handleSendMessage: () => void;
  inputPlaceholder?: string;
}

export default function AiAssistantChat({
  title = "Assistant IA",
  chatMessages,
  chatInput,
  setChatInput,
  isAiLoading,
  handleSendMessage,
  inputPlaceholder = "Répondez à l'assistant..."
}: AiAssistantChatProps) {
  return (
    <div className="bg-black/20 border border-primary/30 rounded-xl p-4 space-y-4">
      <div className="flex items-center space-x-2 text-primary-light mb-2">
        <Bot size={20} />
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      
      <div className="h-40 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
        {chatMessages.length === 0 && isAiLoading ? (
          <div className="flex items-center space-x-2 text-gray-400 text-sm">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
              <Bot size={16} />
            </motion.div>
            <p>Analyse de la photo en cours...</p>
          </div>
        ) : (
          chatMessages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
               <div className={`px-4 py-2 rounded-xl text-sm max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-white/10 text-gray-200 rounded-bl-none'}`}>
                 {msg.text}
               </div>
            </div>
          ))
        )}
        {isAiLoading && chatMessages.length > 0 && (
          <div className="flex items-center space-x-2 text-gray-400 text-sm">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
              <Bot size={16} />
            </motion.div>
            <p>Écriture...</p>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2 pt-2 border-t border-white/10">
        <input 
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => {
            if(e.key === 'Enter') {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder={inputPlaceholder}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
          disabled={isAiLoading}
        />
        <button 
          type="button"
          onClick={handleSendMessage}
          disabled={isAiLoading || !chatInput.trim()}
          className="p-2 bg-primary text-white rounded-lg hover:bg-primary-light disabled:opacity-50 transition"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
