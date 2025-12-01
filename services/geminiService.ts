import { GoogleGenAI } from "@google/genai";
import { ImageAsset } from "../types";

/**
 * Sends the user image and garment image to the model to perform a virtual try-on generation.
 * @param personImage The user's photo
 * @param garmentImage The cloth photo
 * @param poseInstruction Specific instruction for the target pose (e.g. "Maintain original pose" or "Change pose to walking")
 */
export const generateTryOn = async (
  personImage: ImageAsset,
  garmentImage: ImageAsset,
  poseInstruction: string
): Promise<string> => {
  try {
    // Initialize Gemini Client with the environment API key.
    // Ensure process.env.API_KEY is configured with a key that has billing enabled 
    // to use the gemini-3-pro-image-preview model.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Upgrading to 'gemini-3-pro-image-preview' (Pro Image) as it handles complex 
    // image-to-image synthesis (like VTO) significantly better than the Flash model.
    const model = 'gemini-3-pro-image-preview';

    // Refined prompt for the Pro model with dynamic pose instructions
    const prompt = `Generate a high-quality, photorealistic fashion image of the person from the first image wearing the garment from the second image. Ensure realistic fabric drape, lighting, and fit. Maintain the person's identity. ${poseInstruction}`;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          // Inputs: Person, Garment, Prompt
          {
            inlineData: {
              mimeType: personImage.mimeType,
              data: personImage.base64,
            },
          },
          {
            inlineData: {
              mimeType: garmentImage.mimeType,
              data: garmentImage.base64,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        // gemini-3-pro-image-preview supports 'imageSize'.
        // We request a 3:4 portrait ratio which is ideal for full-body fashion.
        imageConfig: {
          aspectRatio: "3:4",
          imageSize: "1K"
        }
      }
    });

    const candidate = response.candidates?.[0];
    
    // Validate candidate existence
    if (!candidate) {
      throw new Error("The AI returned an empty response. This may be due to high traffic or complex image inputs. Please try again.");
    }

    // Check for safety refusal or other finish reasons preventing content generation
    if (candidate.finishReason && candidate.finishReason !== "STOP") {
      let reasonMessage = `Generation failed due to: ${candidate.finishReason}`;
      if (candidate.finishReason === 'SAFETY') {
        reasonMessage = "The request was blocked by safety filters. Please try a different photo.";
      } else if (candidate.finishReason === 'OTHER') {
        reasonMessage = "The AI was unable to generate the image. This can happen if the pose is too complex or the garment isn't clearly visible. Please try a different photo.";
      }
      throw new Error(reasonMessage);
    }

    // Safely check for content and parts using optional chaining
    if (!candidate.content?.parts) {
      throw new Error("The AI finished processing but returned no content parts.");
    }

    // Iterate through parts to find the image output
    for (const part of candidate.content.parts) {
      if (part.inlineData && part.inlineData.data) {
        // Construct the data URL
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    // If we iterated but found no image, check if there's text (likely a refusal or explanation)
    const textPart = candidate.content.parts.find(p => p.text);
    if (textPart && textPart.text) {
      console.warn("Model Refusal:", textPart.text);
      throw new Error(`The model responded with text instead of an image: "${textPart.text}"`);
    }

    throw new Error("The AI generation finished but no image data was returned.");

  } catch (error: any) {
    console.error("Gemini VTO Error:", error);

    // Normalize error objects from the API that aren't instances of Error
    // Example: { error: { code: 403, message: "...", status: "PERMISSION_DENIED" } }
    if (error && typeof error === 'object' && !(error instanceof Error)) {
      if (error.error?.message) {
         const status = error.error.status || '';
         const msg = error.error.message;
         throw new Error(`${status}: ${msg}`);
      }
    }

    // Preserve the original error message if it was thrown explicitly above
    throw error;
  }
};