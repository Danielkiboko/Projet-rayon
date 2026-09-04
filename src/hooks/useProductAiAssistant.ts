import { useState } from "react";
import imageCompression from 'browser-image-compression';

interface AiAssistantOptions {
  onAiDataParsed: (parsedData: any) => void;
  apiEndpoint?: string;
}

export function useProductAiAssistant({ onAiDataParsed, apiEndpoint = '/api/ai/product-assistant' }: AiAssistantOptions) {
  const [chatMessages, setChatMessages] = useState<{ role: string, text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const processAiResponse = (aiText: string, updatedMessages: { role: string, text: string }[]) => {
    let textToDisplay = aiText;
    const jsonMatch = textToDisplay.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.autoFill) {
          onAiDataParsed(parsed.autoFill);
        }
      } catch (e) {
        console.error("Erreur parsing JSON de l'IA", e);
      }
      textToDisplay = textToDisplay.replace(/```json\n[\s\S]*?\n```/, '').trim();
    }

    if (textToDisplay) {
      setChatMessages([...updatedMessages, { role: 'model', text: textToDisplay }]);
    } else if (jsonMatch) {
        // If there was JSON but no text, we just append a generic success message
        // Or we just don't append anything
    }
  };

  const analyzeImage = async (base64data: string, mimeType: string, prompt: string) => {
    setIsAiLoading(true);
    setChatMessages([]);
    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          imageBase64: base64data,
          imageMimeType: mimeType,
          history: []
        })
      });
      const data = await res.json();
      if (data.text) {
        processAiResponse(data.text, [{ role: 'user', text: 'Image ajoutée.' }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const newMessages = [...chatMessages, { role: 'user', text: chatInput }];
    setChatMessages(newMessages);
    setChatInput("");
    setIsAiLoading(true);

    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: chatInput,
          history: newMessages.slice(0, -1)
        })
      });
      const data = await res.json();
      if (data.text) {
        processAiResponse(data.text, newMessages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const resetChat = () => {
    setChatMessages([]);
    setChatInput("");
    setIsAiLoading(false);
  };

  return {
    chatMessages,
    chatInput,
    setChatInput,
    isAiLoading,
    analyzeImage,
    handleSendMessage,
    resetChat
  };
}

export const handleImageUploadShared = async (
  e: React.ChangeEvent<HTMLInputElement>,
  setImageFile: (file: File) => void,
  setImagePreview: (base64: string) => void,
  analyzeImage: (base64: string, type: string, prompt: string) => Promise<void>,
  prompt: string
) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: "image/webp"
    };
    
    const compressedFile = await imageCompression(file, options);
    setImageFile(compressedFile);
    
    const reader = new FileReader();
    reader.readAsDataURL(compressedFile);
    reader.onloadend = async () => {
      const base64data = reader.result as string;
      setImagePreview(base64data);
      await analyzeImage(base64data, compressedFile.type, prompt);
    };
  } catch (error) {
    console.error("Erreur de compression d'image:", error);
  }
};
