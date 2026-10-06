import { GoogleGenAI } from "@google/genai";

export async function handleGenerateMusic(req: any, res: any) {
  try {
    const { prompt, duration = 'short' } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Music prompt is required." });
    }

    const apiKey = process.env.VITE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
      return res.status(400).json({ error: "Gemini API key is not configured in settings." });
    }

    const ai = new GoogleGenAI({ apiKey });
    // Use lyria-3-clip-preview for <= 30s clips, lyria-3-pro-preview for full tracks
    const model = duration === 'full' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview';

    // Call Interactions API for music generation
    const response = await (ai as any).interactions.create({
      model,
      input: {
        prompt,
      },
    });

    res.json({
      success: true,
      model,
      data: response
    });
  } catch (error: any) {
    console.error("Lyria Music Generation Error:", error);
    res.status(500).json({
      error: error?.message || "Failed to generate music track with Lyria"
    });
  }
}

export async function handleGenerateVideo(req: any, res: any) {
  try {
    const { prompt, imageBase64, mimeType = 'image/jpeg', aspectRatio = '16:9' } = req.body;
    if (!prompt && !imageBase64) {
      return res.status(400).json({ error: "Prompt or source image is required." });
    }

    const apiKey = process.env.VITE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
      return res.status(400).json({ error: "Gemini API key is not configured in settings." });
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = 'veo-3.1-fast-generate-preview';

    const inputPayload: any = {
      aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9'
    };

    if (prompt) {
      inputPayload.prompt = prompt;
    }

    if (imageBase64) {
      let cleanData = imageBase64;
      if (cleanData.includes(',')) {
        cleanData = cleanData.split(',')[1];
      }
      inputPayload.image = {
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: cleanData.trim()
        }
      };
    }

    const response = await (ai as any).interactions.create({
      model,
      input: inputPayload
    });

    res.json({
      success: true,
      model,
      data: response
    });
  } catch (error: any) {
    console.error("Veo Video Generation Error:", error);
    res.status(500).json({
      error: error?.message || "Failed to generate video with Veo 3"
    });
  }
}

export async function handleImageGeneration(req: any, res: any) {
  try {
    const { prompt, imageBase64, mimeType = 'image/jpeg', editMode = false } = req.body;
    if (!prompt && !imageBase64) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    const apiKey = process.env.VITE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
      return res.status(400).json({ error: "Gemini API key is not configured in settings." });
    }

    const ai = new GoogleGenAI({ apiKey });
    // Use gemini-3.1-flash-image-preview for create & edit images
    const model = 'gemini-3.1-flash-image-preview';

    const parts: any[] = [];
    if (imageBase64) {
      let cleanData = imageBase64;
      if (cleanData.includes(',')) {
        cleanData = cleanData.split(',')[1];
      }
      parts.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: cleanData.trim()
        }
      });
    }

    const promptInstruction = editMode && imageBase64 
      ? `Edit and modify this image according to the instruction: ${prompt}`
      : (prompt || "Generate a high-quality visual artwork.");

    parts.push({ text: promptInstruction });

    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts }]
    });

    let generatedImageUrl: string | null = null;
    let descriptionText = response.text || '';

    // Inspect candidates for inline image data if returned
    const candidateParts = response.candidates?.[0]?.content?.parts || [];
    for (const part of candidateParts) {
      if (part.inlineData) {
        generatedImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    res.json({
      success: true,
      model,
      text: descriptionText,
      imageUrl: generatedImageUrl
    });
  } catch (error: any) {
    console.error("Gemini Image Gen/Edit Error:", error);
    res.status(500).json({
      error: error?.message || "Failed to process image creation/editing."
    });
  }
}

export async function handleAudioTranscription(req: any, res: any) {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: "Audio data is required for transcription." });
    }

    const apiKey = process.env.VITE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
      return res.status(400).json({ error: "Gemini API key is not configured in settings." });
    }

    const ai = new GoogleGenAI({ apiKey });
    // Use model gemini-3.5-transcribe
    const model = 'gemini-3.5-transcribe';

    let cleanData = audioBase64;
    if (cleanData.includes(',')) {
      cleanData = cleanData.split(',')[1];
    }

    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'audio/webm',
                data: cleanData.trim()
              }
            },
            {
              text: "Accurately transcribe all spoken words in this audio into clean text. Do not add conversational commentary, output only the transcribed speech."
            }
          ]
        }
      ]
    });

    res.json({
      success: true,
      model,
      transcript: response.text?.trim() || ""
    });
  } catch (error: any) {
    console.error("Audio Transcription Error:", error);
    res.status(500).json({
      error: error?.message || "Audio transcription failed."
    });
  }
}
