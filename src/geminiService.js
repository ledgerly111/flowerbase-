/**
 * Gemini AI Service for Flower Base
 * Features: Translation, Description Generation, Flower Identification
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';

/**
 * Make a request to Gemini API
 */
async function callGemini(prompt, imageBase64 = null) {
    if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured');
    }

    const parts = [{ text: prompt }];

    // Add image if provided
    if (imageBase64) {
        // Remove data URL prefix if present
        const base64Data = imageBase64.includes('base64,')
            ? imageBase64.split('base64,')[1]
            : imageBase64;

        parts.unshift({
            inline_data: {
                mime_type: 'image/jpeg',
                data: base64Data
            }
        });
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: parts
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
            }
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Gemini API error');
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * Translate text to a target language
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Target language (e.g., 'Hindi', 'Malayalam')
 * @returns {Promise<string>} - Translated text
 */
export async function translateText(text, targetLanguage) {
    if (!text || targetLanguage === 'English') return text;

    const prompt = `Translate the following text to ${targetLanguage}. 
Only provide the translation, no explanations or notes.
Maintain the original formatting and structure.

Text to translate:
${text}`;

    try {
        const translation = await callGemini(prompt);
        return translation.trim();
    } catch (error) {
        console.error('Translation error:', error);
        return text; // Fallback to original
    }
}

/**
 * Translate all flower content to a target language
 * @param {object} flower - Flower object with name, type, description, etc.
 * @param {string} targetLanguage - Target language
 * @returns {Promise<object>} - Translated flower content
 */
export async function translateFlowerContent(flower, targetLanguage) {
    if (targetLanguage === 'English') {
        return null; // No translation needed
    }

    const prompt = `Translate the following flower information to ${targetLanguage}.
Return ONLY a JSON object with the translated fields. No explanations.

Flower Information:
- Name: ${flower.name || ''}
- Type: ${flower.type || ''}
- Color: ${flower.color || ''}
- Description: ${flower.description || ''}
- Blooming Season: ${flower.bloomingSeason || ''}
- Care Instructions: ${flower.careInstructions || ''}

Return JSON format:
{
  "name": "translated name",
  "type": "translated type",
  "color": "translated color",
  "description": "translated description",
  "bloomingSeason": "translated season",
  "careInstructions": "translated care"
}`;

    try {
        const result = await callGemini(prompt);
        // Extract JSON from response
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return null;
    } catch (error) {
        console.error('Translation error:', error);
        return null;
    }
}

/**
 * Generate flower description from an image
 * @param {string} imageBase64 - Base64 encoded image
 * @returns {Promise<object>} - Generated flower details
 */
export async function generateFlowerDescription(imageBase64) {
    const prompt = `Analyze this flower image and provide detailed information.
Return ONLY a JSON object with no additional text or explanation.

Required JSON format:
{
  "name": "Flower name (common name)",
  "scientificName": "Scientific/botanical name if known",
  "type": "Flower family or type",
  "color": "Primary color(s) of the flower",
  "description": "A detailed 2-3 paragraph description of the flower, its characteristics, history, and significance",
  "bloomingSeason": "When this flower typically blooms",
  "careInstructions": "Basic care tips for growing this flower"
}`;

    try {
        const result = await callGemini(prompt, imageBase64);
        // Extract JSON from response
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error('Failed to parse AI response');
    } catch (error) {
        console.error('Description generation error:', error);
        throw error;
    }
}

/**
 * Identify a flower from an image
 * @param {string} imageBase64 - Base64 encoded image
 * @returns {Promise<object>} - Identified flower info
 */
export async function identifyFlower(imageBase64) {
    const prompt = `Identify this flower in the image.
Return ONLY a JSON object with the following information:

{
  "name": "Common name of the flower",
  "scientificName": "Scientific name",
  "confidence": "high/medium/low",
  "description": "Brief 1-2 sentence description",
  "similarFlowers": ["Similar flower 1", "Similar flower 2"]
}`;

    try {
        const result = await callGemini(prompt, imageBase64);
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error('Failed to identify flower');
    } catch (error) {
        console.error('Flower identification error:', error);
        throw error;
    }
}

/**
 * Get care recommendations for a flower
 * @param {string} flowerName - Name of the flower
 * @param {string} climate - Optional climate/region
 * @returns {Promise<string>} - Care recommendations
 */
export async function getCareRecommendations(flowerName, climate = '') {
    const climateText = climate ? ` in ${climate} climate` : '';
    const prompt = `Provide practical care tips for growing ${flowerName}${climateText}.
Include:
- Watering frequency
- Sunlight requirements
- Soil type
- Best planting time
- Common problems and solutions

Keep it concise and practical.`;

    try {
        return await callGemini(prompt);
    } catch (error) {
        console.error('Care recommendations error:', error);
        throw error;
    }
}

/**
 * Get fun facts about a flower
 * @param {string} flowerName - Name of the flower
 * @returns {Promise<string[]>} - Array of fun facts
 */
export async function getFlowerFacts(flowerName) {
    const prompt = `Give me 5 interesting and unique facts about ${flowerName}.
Return ONLY a JSON array of strings, no explanations:
["fact 1", "fact 2", "fact 3", "fact 4", "fact 5"]`;

    try {
        const result = await callGemini(prompt);
        const jsonMatch = result.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return [];
    } catch (error) {
        console.error('Fun facts error:', error);
        return [];
    }
}

/**
 * Check if Gemini API is configured
 */
export function isGeminiConfigured() {
    return !!GEMINI_API_KEY;
}

/**
 * Chat with Flora - Context-aware flower assistant
 * @param {string} userMessage - User's question or message
 * @param {object} flower - Current flower context (can be null)
 * @param {array} chatHistory - Previous messages for context
 * @returns {Promise<string>} - Flora's response
 */
export async function chatWithFlora(userMessage, flower = null, chatHistory = []) {
    // Build context about the current flower
    let flowerContext = '';
    if (flower) {
        flowerContext = `
CURRENT FLOWER CONTEXT:
- Name: ${flower.name || 'Unknown'}
- Type: ${flower.type || 'Not specified'}
- Color: ${flower.color || 'Not specified'}
- Description: ${flower.description || 'No description available'}
- Blooming Season: ${flower.bloomingSeason || 'Not specified'}
- Care Instructions: ${flower.careInstructions || 'Not specified'}
- Category: ${flower.category || 'Not specified'}
`;
    }

    // Build chat history context
    let historyContext = '';
    if (chatHistory.length > 0) {
        historyContext = '\nCONVERSATION HISTORY:\n';
        chatHistory.slice(-6).forEach(msg => {
            historyContext += `${msg.role === 'user' ? 'User' : 'Flora'}: ${msg.content}\n`;
        });
    }

    const prompt = `You are Flora, a friendly and knowledgeable AI assistant for the Flower Base app. 
You are an expert on flowers, plants, gardening, and botanical topics.
Your personality is warm, helpful, and passionate about flowers.

${flowerContext}
${historyContext}

GUIDELINES:
- Be concise but informative (2-4 sentences unless more detail is requested)
- If the user asks about the current flower, use the context provided above
- Be enthusiastic about flowers and gardening
- If you don't know something, say so honestly
- You can suggest related flowers, care tips, or interesting facts
- Use flower emojis occasionally to be friendly 🌸🌺🌻

User's question: ${userMessage}

Respond as Flora:`;

    try {
        const response = await callGemini(prompt);
        return response.trim();
    } catch (error) {
        console.error('Flora chat error:', error);
        throw error;
    }
}

/**
 * Summarize or expand flower content based on length
 * @param {object} flower - Flower object with all details
 * @returns {Promise<object>} - Summarized or expanded content
 */
export async function summarizeFlowerContent(flower) {
    // Calculate content length to determine if we should summarize or expand
    const descriptionLength = (flower.description || '').length;
    const careLength = (flower.careInstructions || '').length;
    const totalLength = descriptionLength + careLength;

    const isShortContent = totalLength < 200;

    if (isShortContent) {
        // Expand short content
        const prompt = `You are Flora, a flower expert. The following flower has brief information. 
Please expand and enrich the content with more details, interesting facts, and care tips.

Current Flower Information:
- Name: ${flower.name || 'Unknown'}
- Type: ${flower.type || 'Not specified'}
- Color: ${flower.color || 'Not specified'}
- Description: ${flower.description || 'No description'}
- Blooming Season: ${flower.bloomingSeason || 'Not specified'}
- Care Instructions: ${flower.careInstructions || 'Not specified'}

Return ONLY a JSON object with enriched content:
{
  "type": "expanded",
  "keyPoints": ["3-5 key facts about this flower"],
  "description": "A detailed 2-3 paragraph description with interesting facts, history, and characteristics",
  "careInstructions": "Comprehensive care guide with watering, sunlight, soil, and seasonal tips"
}`;

        try {
            const result = await callGemini(prompt);
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Failed to parse response');
        } catch (error) {
            console.error('Expand error:', error);
            throw error;
        }
    } else {
        // Summarize long content to key points
        const prompt = `You are Flora, a flower expert. Summarize the following flower information into concise key points.

Flower Information:
- Name: ${flower.name || 'Unknown'}
- Type: ${flower.type || 'Not specified'}
- Color: ${flower.color || 'Not specified'}
- Description: ${flower.description || 'No description'}
- Blooming Season: ${flower.bloomingSeason || 'Not specified'}
- Care Instructions: ${flower.careInstructions || 'Not specified'}

Return ONLY a JSON object with summarized content:
{
  "type": "summarized",
  "keyPoints": ["5-7 most important key points about this flower, each 1 short sentence"],
  "quickCare": "One sentence care summary",
  "bestFor": "What this flower is best for (e.g., gardens, bouquets, beginners)"
}`;

        try {
            const result = await callGemini(prompt);
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Failed to parse response');
        } catch (error) {
            console.error('Summarize error:', error);
            throw error;
        }
    }
}
