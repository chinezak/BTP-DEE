
import { EvidenceFile, AnalysisResult } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

// This file now uses the real @google/genai SDK.

// Initialize the Google GenAI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // result is "data:mime/type;base64,the-real-base64-string"
            // we want to remove the prefix
            const result = (reader.result as string).split(',')[1];
            resolve(result);
        };
        reader.onerror = error => reject(error);
    });
};

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: 'A detailed summary of the file content, focusing on elements relevant to a police investigation.' },
        objects: {
            type: Type.ARRAY,
            description: 'List of objects detected in the image or video.',
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: 'Name of the object.' },
                    confidence: { type: Type.NUMBER, description: 'Confidence score from 0 to 1.' },
                    timestamp: { type: Type.STRING, description: 'Timestamp in video where object appears (if applicable).' },
                },
                required: ['name', 'confidence']
            }
        },
        entities: {
            type: Type.ARRAY,
            description: 'Key entities (like people, locations, organizations) found in the document.',
            items: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, description: 'Type of entity (e.g., PERSON, LOCATION).' },
                    value: { type: Type.STRING, description: 'The entity itself.' },
                    confidence: { type: Type.NUMBER, description: 'Confidence score.' },
                    location: { type: Type.STRING, description: 'Location in the document (e.g., Page 2, Paragraph 5).' },
                },
                required: ['type', 'value', 'confidence']
            }
        },
        ocrText: { type: Type.STRING, description: 'All text extracted from the image or document using Optical Character Recognition (OCR).' },
        transcription: { type: Type.STRING, description: 'A word-for-word transcription of any speech in the audio or video file.' },
    },
    required: ['summary']
};


// Uses the real Gemini API for multimodal analysis
export const analyzeFiles = async (files: EvidenceFile[]): Promise<Array<{ fileId: string; result: AnalysisResult | null, error?: string }>> => {
    console.log('Starting real Gemini analysis for', files.map(f => f.name));

    const analysisPromises = files.map(async (file) => {
        if (!file.file) {
             return { fileId: file.id, result: null, error: 'File data is missing.' };
        }

        try {
            const base64Data = await fileToBase64(file.file);
            const filePart = {
                inlineData: {
                    mimeType: file.type,
                    data: base64Data
                }
            };

            const systemInstruction = "You are an expert AI assistant for the British Transport Police. Analyze the attached file, which is a piece of digital evidence. Provide a concise summary. Identify key objects, entities, and any text visible. If it's a video with audio, provide a transcription. Structure your response in JSON format according to the provided schema. Focus on details relevant to a police investigation, such as people, actions, objects, locations, and text.";

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [filePart] },
                config: {
                    systemInstruction: systemInstruction,
                    responseMimeType: 'application/json',
                    responseSchema: analysisSchema,
                }
            });

            const jsonString = response.text.trim();
            const analysisResultData = JSON.parse(jsonString);

            return {
                fileId: file.id,
                result: {
                    fileId: file.id,
                    ...analysisResultData
                } as AnalysisResult
            };

        } catch (error) {
            console.error(`Error analyzing file ${file.name}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during analysis.';
            return { fileId: file.id, result: null, error: errorMessage };
        }
    });

    return Promise.all(analysisPromises);
};

const searchQuerySchema = {
    type: Type.OBJECT,
    properties: {
        keywords: {
            type: Type.ARRAY,
            description: "An array of critical keywords from the user's search query.",
            items: {
                type: Type.STRING
            }
        }
    },
    required: ['keywords']
};


// Uses Gemini to translate natural language to a structured query
export const translateSearchQuery = async (query: string): Promise<{ keywords: string[] }> => {
    console.log(`Using Gemini to translate query: "${query}"`);
    if (!query.trim()) {
        return { keywords: [] };
    }
    try {
        const systemInstruction = "You are a search query optimizer for police investigators. Extract the most important keywords from the user's query. Return a JSON object with a 'keywords' array. Example: for 'person with a black hoodie', return `{\"keywords\": [\"person\", \"black hoodie\"]}`.";
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: query,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: searchQuerySchema
            }
        });

        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);
        console.log("Gemini extracted keywords:", result.keywords);
        return result;

    } catch (error) {
        console.error("Error translating search query with Gemini, falling back to basic split:", error);
        // Fallback to simple keyword search on non-stop words
        const stopWords = new Set(['a', 'an', 'the', 'is', 'in', 'at', 'on', 'of', 'for', 'with', 'show', 'me', 'anyone', 'person', 'wearing']);
        const keywords = query.toLowerCase().replace(/[.,?]/g, '').split(/\s+/).filter(word => word && !stopWords.has(word));
        return { keywords };
    }
};
